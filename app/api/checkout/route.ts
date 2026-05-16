import { NextResponse } from 'next/server';
import { preference } from '@/lib/mercadopago';
import { prisma } from '@/lib/prisma';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';

interface CartItemInput {
  id: string;
  quantity: number;
  // Cotizador-only (id starts with 'cotizador-')
  name?: string;
  price?: number;
  note?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: CartItemInput[] = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });
    }

    const invalidQty = items.find((i) => !Number.isInteger(i.quantity) || i.quantity < 1);
    if (invalidQty) {
      return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
    }

    const regularItems = items.filter((i) => !i.id.startsWith('cotizador-'));
    const cotizadorItems = items.filter((i) => i.id.startsWith('cotizador-'));

    // Validate DB products
    let dbValidated: { id: string; title: string; quantity: number; unit_price: number; picture_url: string; currency_id: string; slug: string; category: string }[] = [];
    if (regularItems.length > 0) {
      const productIds = regularItems.map((i) => i.id);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, img: true, slug: true, category: true },
      });

      if (products.length !== productIds.length) {
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      dbValidated = regularItems.map((item) => {
        const p = productMap.get(item.id)!;
        return { id: p.id, title: p.name, quantity: item.quantity, unit_price: p.price, picture_url: p.img, currency_id: 'COP', slug: p.slug, category: p.category };
      });
    }

    // Accept cotizador items at client price (custom service — no DB backing)
    const cotizadorValidated = cotizadorItems.map((item) => ({
      id: item.id,
      title: item.name ?? item.id,
      quantity: item.quantity,
      unit_price: item.price ?? 0,
      picture_url: `${APP_URL}/3d-print.svg`,
      currency_id: 'COP',
    }));

    if (cotizadorValidated.some((i) => i.unit_price <= 0)) {
      return NextResponse.json({ error: 'Precio de ítem cotizador inválido' }, { status: 400 });
    }

    const allValidated = [...dbValidated, ...cotizadorValidated];
    const total = allValidated.reduce((s, i) => s + i.unit_price * i.quantity, 0);

    const orderType =
      dbValidated.length > 0 && cotizadorItems.length > 0 ? 'mixed' :
      cotizadorItems.length > 0 ? 'cotizador' : 'product';

    const order = await prisma.order.create({
      data: {
        status: 'pending',
        type: orderType,
        total,
        items: {
          create: [
            ...dbValidated.map((i) => ({
              itemType: 'product',
              productId: i.id,
              slug: i.slug,
              category: i.category,
              name: i.title,
              price: i.unit_price,
              quantity: i.quantity,
            })),
            ...cotizadorItems.map((i) => ({
              itemType: 'cotizador',
              name: i.name ?? i.id,
              price: i.price ?? 0,
              quantity: i.quantity,
              note: i.note,
            })),
          ],
        },
      },
    });

    const result = await preference.create({
      body: {
        items: allValidated,
        back_urls: {
          success: `${APP_URL}/pago/exito`,
          failure: `${APP_URL}/pago/fallo`,
          pending: `${APP_URL}/pago/pendiente`,
        },
        ...(isProduction && { auto_return: 'approved' }),
        ...(isProduction && { notification_url: `${APP_URL}/api/webhooks/mercadopago` }),
        external_reference: order.id,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { preferenceId: result.id },
    });

    const checkoutUrl = isProduction ? result.init_point : result.sandbox_init_point;
    return NextResponse.json({ url: checkoutUrl, order_id: order.id });
  } catch (err) {
    console.error('[checkout]', err);
    return NextResponse.json({ error: 'Error al procesar el pago' }, { status: 500 });
  }
}
