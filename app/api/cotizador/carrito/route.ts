import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getQuoterPricing } from '@/lib/quoter-config';
import { buildQuoterCartItem } from '@/lib/quoter-cart-item';
import { quoteVerifiedModel } from '@/lib/quoter-verify';
import { PATRON_COTIZACION } from '@/lib/asistente/codigos';
import { estadoAsistente, getAsistenteConfig } from '@/lib/asistente/config';
import { etiquetaConfiguracion } from '@/lib/asistente/etiquetas';
import type { ItemVigente } from '@/lib/asistente/item-vigente';
import { limitar, respuestaLimite } from '@/lib/asistente/limite';
import { leerCotizacion, PATRON_ID_SESION } from '@/lib/asistente/sesion';

const cuerpo = z.object({
  id: z.string().regex(PATRON_ID_SESION),
  codigo: z.string().regex(PATRON_COTIZACION).optional(),
  productoId: z.string().min(1).max(64).optional(),
  cantidad: z.number().int().min(1).max(1000),
  /** Solo productos: el precio que mostró buscar_productos, para avisar si cambió. */
  precioMostrado: z.number().optional(),
});

const responder = (r: ItemVigente, status = 200) => Response.json(r, { status });

/**
 * Ítem vigente para la tarjeta de confirmación (propuesta §10.1). Lo que muestra
 * la tarjeta sale de aquí, nunca del texto del modelo: una cotización se
 * retarifa con las tarifas actuales y un producto se lee de la BD.
 */
export async function POST(req: Request) {
  if (!estadoAsistente(await getAsistenteConfig()).disponible) {
    return responder({ estado: 'no-disponible', detalle: 'El asistente está apagado.' }, 503);
  }
  const limite = limitar('carrito', req);
  if (!limite.ok) return respuestaLimite(limite.reintentarEnS);

  const body = cuerpo.safeParse(await req.json().catch(() => null));
  if (!body.success) return responder({ estado: 'no-disponible', detalle: 'Petición inválida.' }, 400);
  const { id, codigo, productoId, cantidad } = body.data;

  if (codigo) {
    const cot = await leerCotizacion(id, codigo);
    if (!cot) return responder({ estado: 'no-disponible', detalle: `No hay una cotización ${codigo} en esta conversación.` }, 404);
    if (cot.tipo !== 'archivo') {
      return responder({ estado: 'no-disponible', detalle: 'Una estimación sin archivo no se puede pagar.' }, 422);
    }
    const { eleccion, stl, archivo, modelUrl, preciosMostrados } = cot.datos;
    const pricing = await getQuoterPricing();
    const q = quoteVerifiedModel({ ...eleccion, factorEscalado: 1 }, stl, pricing, cantidad);
    if (!q.ok) return responder({ estado: 'no-disponible', detalle: `No se puede cotizar: ${q.reason}.` }, 422);

    const { item } = buildQuoterCartItem({
      idCotizacion: cot.id,
      nombreArchivo: archivo,
      stl,
      config: {
        printingTech: eleccion.tech,
        materialType: eleccion.materialId,
        layerHeight: eleccion.layerHeight,
        infillDensity: eleccion.infillDensity,
        printColor: eleccion.colorId,
        quantity: cantidad,
        postProcessing: eleccion.postProcessing,
        factorEscalado: 1,
      },
      modelUrl,
      pricing,
    });
    const mostrado = preciosMostrados[cantidad] ?? null;
    return responder({
      estado: mostrado != null && mostrado !== q.cost.billableUnit ? 'precio-cambiado' : 'ok',
      item,
      cantidad,
      precioUnitario: q.cost.billableUnit,
      total: q.cost.total,
      precioMostrado: mostrado,
      titulo: `Impresión 3D · ${archivo}`,
      detalle: etiquetaConfiguracion(eleccion, pricing),
      pie: `Datos de la cotización ${codigo}. El precio se vuelve a verificar al pagar.`,
      reemplazaCantidad: true,
    });
  }

  if (!productoId) return responder({ estado: 'no-disponible', detalle: 'Falta el producto.' }, 400);
  const p = await prisma.product.findUnique({
    where: { id: productoId },
    select: { id: true, name: true, slug: true, price: true, salePrice: true, img: true, alt: true, category: true, stock: true },
  });
  if (!p) return responder({ estado: 'no-disponible', detalle: 'Ese producto ya no está en la tienda.' }, 404);
  if (p.stock < cantidad) return responder({ estado: 'sin-stock', titulo: p.name, disponible: p.stock });

  // Lo mismo que cobra /api/checkout.
  const precio = p.salePrice ?? p.price;
  const mostrado = body.data.precioMostrado ?? null;
  return responder({
    estado: mostrado != null && mostrado !== precio ? 'precio-cambiado' : 'ok',
    item: { id: p.id, slug: p.slug, name: p.name, price: precio, img: p.img, alt: p.alt, category: p.category },
    cantidad,
    precioUnitario: precio,
    total: precio * cantidad,
    precioMostrado: mostrado,
    titulo: p.name,
    detalle: p.category,
    pie: 'El precio y el stock se vuelven a verificar al pagar.',
    reemplazaCantidad: false,
  });
}
