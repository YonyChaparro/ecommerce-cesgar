import { NextResponse } from 'next/server';
import { getPreference } from '@/lib/mercadopago';
import { prisma } from '@/lib/prisma';
import { getQuoterPricing } from '@/lib/quoter-config';
import { verifyQuoterItems } from '@/lib/quoter-verify';
import type { RawPrintChoices } from '@/lib/quoter-rules';
import { getShippingConfig } from '@/lib/shipping-config';
import { calcShipping, type MetodoEntrega } from '@/lib/shipping-calc';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';
// Cada modelo implica descargar y medir su STL, así que el límite general de 100
// ítems es demasiado holgado para estos.
const MAX_COTIZADOR_ITEMS = 20;

function truncate(s: string, max = 250): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function mpCategoryId(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('resina') || c.includes('material') || c.includes('filamento')) return 'others';
  if (c.includes('impresora') || c.includes('cnc') || c.includes('repuesto') || c.includes('electr')) return 'electronics';
  return 'others';
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  return {
    firstName: parts[0],
    lastName:  parts.length > 1 ? parts.slice(1).join(' ') : parts[0],
  };
}

interface CartItemInput {
  id: string;
  quantity: number;
  // Cotizador-only fields
  name?: string;
  /** Lo que el navegador cree que vale. Solo se usa para registrar intentos de manipulación. */
  price?: number;
  note?: string;
  modelUrl?: string;
  printConfig?: RawPrintChoices;
}

interface ShippingInput {
  name: string;
  email: string;
  docType: string;
  docNumber: string;
  phone: string;
  address: string;
  neighborhood?: string;
  addressExtra?: string;
  department: string;
  city: string;
  postalCode?: string;
  instructions?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: CartItemInput[] = body?.items;
    const shipping: ShippingInput | undefined = body?.shipping;
    const deliveryMethod: MetodoEntrega = body?.deliveryMethod === 'recogida' ? 'recogida' : 'domicilio';
    /** Lo que el checkout tenía en pantalla. Solo se usa para detectar desfases. */
    const shippingCostShown: number | undefined =
      typeof body?.shippingCostShown === 'number' ? body.shippingCostShown : undefined;

    // ── Basic input validation ────────────────────────────────────────────────
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });
    }
    if (items.length > 100) {
      return NextResponse.json({ error: 'Demasiados ítems en el carrito' }, { status: 400 });
    }
    const invalidQty = items.find(
      (i) => !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 9999,
    );
    if (invalidQty) {
      return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
    }

    const regularItems   = items.filter((i) => !i.id.startsWith('cotizador-'));
    const cotizadorItems = items.filter((i) =>  i.id.startsWith('cotizador-'));

    // ── Validate regular (DB) products ───────────────────────────────────────
    type MPItem = {
      id: string; title: string; quantity: number; unit_price: number;
      picture_url: string; currency_id: string;
      slug: string; category: string;
    };
    let dbValidated: MPItem[] = [];

    if (regularItems.length > 0) {
      const productIds = regularItems.map((i) => i.id);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, salePrice: true, img: true, slug: true, category: true, stock: true },
      });

      if (products.length !== productIds.length) {
        return NextResponse.json({ error: 'Uno o más productos no fueron encontrados' }, { status: 404 });
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      // Stock check
      for (const item of regularItems) {
        const p = productMap.get(item.id)!;
        if (p.stock < item.quantity) {
          return NextResponse.json({
            error: `Stock insuficiente para "${p.name}". Disponible: ${p.stock} unidad${p.stock !== 1 ? 'es' : ''}.`,
          }, { status: 409 });
        }
      }

      dbValidated = regularItems.map((item) => {
        const p = productMap.get(item.id)!;
        const effectivePrice = p.salePrice ?? p.price;
        return {
          id: p.id,
          title: truncate(p.name),
          quantity: item.quantity,
          unit_price: effectivePrice,
          picture_url: p.img,
          currency_id: 'COP',
          slug: p.slug,
          category: p.category,
        };
      });
    }

    // ── Validate cotizador items ──────────────────────────────────────────────
    // El precio de una impresión cuelga entero del volumen de la malla, y ese dato
    // lo medía el navegador. Se descarga el STL que se subió, se mide de nuevo y se
    // retarifa con los precios guardados por el admin: lo que mande el cliente como
    // precio o como geometría se descarta.
    const cotizadorValidated: MPItem[] = [];

    if (cotizadorItems.length > 0) {
      if (cotizadorItems.length > MAX_COTIZADOR_ITEMS) {
        return NextResponse.json(
          { error: `Máximo ${MAX_COTIZADOR_ITEMS} modelos 3D por pedido` },
          { status: 400 },
        );
      }
      if (cotizadorItems.some((i) => !i.name?.trim())) {
        return NextResponse.json({ error: 'Ítem de cotizador sin nombre' }, { status: 400 });
      }

      const pricing = await getQuoterPricing();
      const verified = await verifyQuoterItems(
        cotizadorItems.map((i) => ({
          modelUrl: i.modelUrl,
          printConfig: i.printConfig,
          quantity: i.quantity,
        })),
        pricing,
      );

      const failedAt = verified.findIndex((v) => !v.ok);
      if (failedAt !== -1) {
        const failed = cotizadorItems[failedAt];
        const reason = (verified[failedAt] as { ok: false; reason: string }).reason;
        console.warn('[checkout] ítem de cotizador rechazado', {
          name: failed.name, clientPrice: failed.price, reason,
        });
        return NextResponse.json(
          { error: `No pudimos verificar "${failed.name}": ${reason}. Vuelve a cotizarlo.` },
          { status: 422 },
        );
      }

      cotizadorItems.forEach((item, i) => {
        // unitPrice ya trae el descuento por cantidad: MP cobra unit_price × quantity.
        const { unitPrice } = verified[i] as { ok: true; unitPrice: number };
        if (item.price !== undefined && Math.abs(item.price - unitPrice) > 1) {
          console.warn('[checkout] precio del cotizador corregido', {
            name: item.name, clientPrice: item.price, serverPrice: unitPrice,
          });
        }
        cotizadorValidated.push({
          id: item.id,
          title: truncate(item.name!),
          quantity: item.quantity,
          unit_price: unitPrice,
          picture_url: `${APP_URL}/3d-print.svg`,
          currency_id: 'COP',
          // Internal fields — not sent to MP
          slug: 'cotizador',
          category: 'Impresión 3D',
        });
      });
    }

    const allMPItems = [
      ...dbValidated.map(({ id, title, quantity, unit_price, picture_url, currency_id, category }) => ({
        id,
        title,
        description: truncate(title, 250),
        category_id: mpCategoryId(category),
        quantity,
        unit_price,
        picture_url,
        currency_id,
      })),
      ...cotizadorValidated.map(({ id, title, quantity, unit_price, picture_url, currency_id }) => ({
        id,
        title,
        description: 'Servicio de impresión 3D personalizado',
        category_id: 'services',
        quantity,
        unit_price,
        picture_url,
        currency_id,
      })),
    ];

    const subtotal = allMPItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);

    if (subtotal <= 0) {
      return NextResponse.json({ error: 'El total del pedido es inválido' }, { status: 400 });
    }

    // ── Envío ─────────────────────────────────────────────────────────────────
    // El costo lo calcula el servidor con su propia configuración. Lo que el
    // navegador dice que mostró (shippingCostShown) jamás se usa para cobrar.
    const shippingConfig = await getShippingConfig();

    // Recoger en punto solo vale si el admin la tiene habilitada; si no, se
    // exige dirección como en cualquier domicilio.
    const metodo: MetodoEntrega =
      deliveryMethod === 'recogida' && shippingConfig.recogida.habilitada ? 'recogida' : 'domicilio';

    if (deliveryMethod === 'recogida' && metodo !== 'recogida') {
      return NextResponse.json(
        { error: 'La recogida en punto no está disponible en este momento' },
        { status: 400 },
      );
    }

    // Sin dirección no hay a dónde enviar ni con qué tarifar.
    if (metodo === 'domicilio' && shippingConfig.habilitado && (!shipping?.department || !shipping?.city)) {
      return NextResponse.json(
        { error: 'Faltan el departamento y la ciudad de entrega' },
        { status: 400 },
      );
    }

    const envio = calcShipping(
      { metodo, departamento: shipping?.department, ciudad: shipping?.city },
      subtotal,
      shippingConfig,
    );

    // El cliente vio una cifra y el servidor calcula otra: pasa si un
    // administrador cambia las tarifas mientras alguien llena el formulario.
    // Cobrar de más sin avisar sería peor que pedir que confirme el nuevo total.
    if (shippingCostShown !== undefined && shippingCostShown !== envio.costo) {
      console.warn('[checkout] costo de envío desfasado', {
        mostrado: shippingCostShown, calculado: envio.costo, destino: shipping?.city,
      });
      return NextResponse.json(
        {
          error: 'El costo de envío cambió. Revisa el nuevo total antes de continuar.',
          breakdown: { subtotal, shippingCost: envio.costo, total: subtotal + envio.costo, label: envio.etiqueta },
        },
        { status: 409 },
      );
    }

    const total = subtotal + envio.costo;

    const orderType =
      dbValidated.length > 0 && cotizadorItems.length > 0 ? 'mixed'      :
      cotizadorItems.length > 0                            ? 'cotizador'  : 'product';

    // ── Create order in DB ────────────────────────────────────────────────────
    const order = await prisma.order.create({
      data: {
        status: 'pending',
        type: orderType,
        subtotal,
        shippingCost: envio.costo,
        shippingMethod: metodo,
        total,
        ...(shipping && {
          shippingName:         shipping.name,
          shippingEmail:        shipping.email,
          shippingDocType:      shipping.docType,
          shippingDocNumber:    shipping.docNumber,
          shippingPhone:        shipping.phone,
          shippingAddress:      shipping.address,
          shippingNeighborhood: shipping.neighborhood,
          shippingAddressExtra: shipping.addressExtra,
          shippingDepartment:   shipping.department,
          shippingCity:         shipping.city,
          shippingPostalCode:   shipping.postalCode,
          shippingInstructions: shipping.instructions,
        }),
        items: {
          create: [
            ...dbValidated.map((i) => ({
              itemType:  'product',
              productId: i.id,
              slug:      i.slug,
              category:  i.category,
              name:      i.title,
              price:     i.unit_price,
              quantity:  i.quantity,
            })),
            ...cotizadorItems.map((i, idx) => ({
              itemType: 'cotizador',
              name:     i.name!,
              price:    cotizadorValidated[idx].unit_price,
              quantity: i.quantity,
              note:     i.note,
              modelUrl: i.modelUrl,
            })),
          ],
        },
      },
    });

    // ── Create MercadoPago preference ─────────────────────────────────────────
    // If MP fails here, the order is orphaned → delete it and return 502.
    let result;
    try {
      // El envío puede viajar de dos formas, según `modoPasarela`:
      //  · 'shipments' (por defecto) → campo nativo de MP. `items` sigue
      //    cuadrando uno a uno con los OrderItem, que es lo que conviene si
      //    algún día hay que conciliar.
      //  · 'item' → una línea más en el carrito de MP, para cuando la
      //    facturación necesita el envío como producto.
      // En los dos casos el monto cobrado es subtotal + envío.
      const comoItem = shippingConfig.modoPasarela === 'item' && envio.costo > 0;
      const itemsParaMP = comoItem
        ? [...allMPItems, {
            id: 'envio',
            title: `Envío — ${envio.etiqueta}`,
            description: 'Costo de envío',
            category_id: 'services',
            quantity: 1,
            unit_price: envio.costo,
            picture_url: `${APP_URL}/3d-print.svg`,
            currency_id: 'COP',
          }]
        : allMPItems;

      result = await getPreference().create({
        body: {
          items: itemsParaMP,
          ...(!comoItem && envio.costo > 0 && {
            shipments: {
              mode: 'not_specified',
              cost: envio.costo,
              ...(shipping && {
                receiver_address: {
                  zip_code:    shipping.postalCode ?? '',
                  street_name: [shipping.address, shipping.neighborhood].filter(Boolean).join(', '),
                },
              }),
            },
          }),
          back_urls: {
            success: `${APP_URL}/pago/exito`,
            failure: `${APP_URL}/pago/fallo`,
            pending: `${APP_URL}/pago/pendiente`,
          },
          ...(isProduction && { auto_return: 'approved' }),
          notification_url: `${APP_URL}/api/webhooks/mercadopago`,
          binary_mode: false,
          external_reference: order.id,
          statement_descriptor: 'CESGAR',
          ...(shipping && (() => {
            const { firstName, lastName } = splitName(shipping.name);
            return {
              payer: {
                name:     firstName,
                surname:  lastName,
                email:    shipping.email,
                phone: {
                  area_code: '57',
                  number:    shipping.phone.replace(/\D/g, ''),
                },
                identification: {
                  type:   shipping.docType,
                  number: shipping.docNumber,
                },
                address: {
                  street_name: [shipping.address, shipping.neighborhood, shipping.addressExtra]
                    .filter(Boolean).join(', '),
                  zip_code: shipping.postalCode ?? '',
                },
              },
            };
          })()),
        },
      });
    } catch (mpErr) {
      await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
      console.error('[checkout] MP preference failed:', mpErr);
      return NextResponse.json(
        { error: 'No se pudo iniciar el pago. Inténtalo de nuevo en unos segundos.' },
        { status: 502 },
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data:  { preferenceId: result.id },
    });

    const checkoutUrl = isProduction ? result.init_point : result.sandbox_init_point;

    console.log('[checkout] preferencia creada →', {
      orderId:         order.id,
      preferenceId:    result.id,
      checkoutUrl,
      subtotal,
      envio:           envio.costo,
      metodo,
      total,
      back_success:    `${APP_URL}/pago/exito`,
      back_failure:    `${APP_URL}/pago/fallo`,
      notification_url:`${APP_URL}/api/webhooks/mercadopago`,
    });

    return NextResponse.json({
      url: checkoutUrl,
      order_id: order.id,
      breakdown: { subtotal, shippingCost: envio.costo, total, label: envio.etiqueta },
    });
  } catch (err) {
    console.error('[checkout]', err);
    return NextResponse.json({ error: 'Error al procesar el pago' }, { status: 500 });
  }
}
