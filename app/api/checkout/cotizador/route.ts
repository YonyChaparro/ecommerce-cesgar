import { NextResponse } from 'next/server';
import { preference } from '@/lib/mercadopago';
import { prisma } from '@/lib/prisma';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';

interface QuoterItemInput {
  name: string;
  note: string;
  unitPrice: number;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: QuoterItemInput[] = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Sin ítems' }, { status: 400 });
    }

    for (const item of items) {
      if (!item.name || !Number.isInteger(item.quantity) || item.quantity < 1 || item.unitPrice <= 0) {
        return NextResponse.json({ error: 'Ítem inválido' }, { status: 400 });
      }
    }

    const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    const order = await prisma.order.create({
      data: {
        status: 'pending',
        type: 'cotizador',
        total,
        items: {
          create: items.map((i) => ({
            itemType: 'cotizador',
            name: i.name,
            price: i.unitPrice,
            quantity: i.quantity,
            note: i.note,
          })),
        },
      },
    });

    const mpItems = items.map((i) => ({
      id: `cotizador-${order.id}`,
      title: i.name,
      description: i.note,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      currency_id: 'COP',
    }));

    const result = await preference.create({
      body: {
        items: mpItems,
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
    console.error('[checkout/cotizador]', err);
    return NextResponse.json({ error: 'Error al procesar el pago' }, { status: 500 });
  }
}
