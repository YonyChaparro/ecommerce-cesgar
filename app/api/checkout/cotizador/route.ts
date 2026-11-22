import { NextResponse } from 'next/server';
import { getPreference } from '@/lib/mercadopago';
import { prisma } from '@/lib/prisma';
import { getQuoterPricing } from '@/lib/quoter-config';
import { verifyQuoterItems } from '@/lib/quoter-verify';
import type { RawPrintChoices } from '@/lib/quoter-rules';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';

interface QuoterItemInput {
  name: string;
  note: string;
  /** Solo para registrar intentos de manipulación; el precio lo pone el servidor. */
  unitPrice: number;
  quantity: number;
  modelUrl?: string;
  printConfig?: RawPrintChoices;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: QuoterItemInput[] = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Sin ítems' }, { status: 400 });
    }

    for (const item of items) {
      if (!item.name || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: 'Ítem inválido' }, { status: 400 });
      }
    }

    // Cargar precios configurados por el admin desde la DB
    const pricing = await getQuoterPricing();

    // Ni el precio ni la geometría del cliente se aceptan: se descarga cada STL
    // subido, se vuelve a medir y se retarifa contra la tabla del admin.
    const verified = await verifyQuoterItems(
      items.map((i) => ({ modelUrl: i.modelUrl, printConfig: i.printConfig, quantity: i.quantity })),
      pricing,
    );

    const failedAt = verified.findIndex((v) => !v.ok);
    if (failedAt !== -1) {
      const reason = (verified[failedAt] as { ok: false; reason: string }).reason;
      console.warn('[checkout/cotizador] ítem rechazado', {
        name: items[failedAt].name,
        clientUnitPrice: items[failedAt].unitPrice,
        reason,
      });
      return NextResponse.json(
        { error: `No pudimos verificar "${items[failedAt].name}": ${reason}. Vuelve a cotizarlo.` },
        { status: 422 },
      );
    }

    const unitPrices = verified.map((v) => (v as { ok: true; unitPrice: number }).unitPrice);
    const total = items.reduce((s, i, idx) => s + unitPrices[idx] * i.quantity, 0);

    const order = await prisma.order.create({
      data: {
        status: 'pending',
        type: 'cotizador',
        total,
        items: {
          create: items.map((i, idx) => ({
            itemType: 'cotizador',
            name: i.name,
            price: unitPrices[idx],
            quantity: i.quantity,
            note: i.note,
            modelUrl: i.modelUrl,
          })),
        },
      },
    });

    const mpItems = items.map((i, idx) => ({
      id: `cotizador-${order.id}`,
      title: i.name,
      description: i.note,
      quantity: i.quantity,
      unit_price: unitPrices[idx],
      currency_id: 'COP',
    }));

    const result = await getPreference().create({
      body: {
        items: mpItems,
        back_urls: {
          success: `${APP_URL}/pago/exito`,
          failure: `${APP_URL}/pago/fallo`,
          pending: `${APP_URL}/pago/pendiente`,
        },
        ...(isProduction && { auto_return: 'approved' }),
        notification_url: `${APP_URL}/api/webhooks/mercadopago`,
        binary_mode: false,
        statement_descriptor: 'CESGAR',
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
    console.error('[checkout/cotizador]', err);
    return NextResponse.json({ error: 'Error al procesar el pago' }, { status: 500 });
  }
}
