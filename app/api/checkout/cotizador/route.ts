import { NextResponse } from 'next/server';
import { getPreference } from '@/lib/mercadopago';
import { prisma } from '@/lib/prisma';
import { getQuoterPricing } from '@/lib/quoter-config';
import { calcCost, type PrintConfig } from '@/lib/quoter-calc';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';
const PRICE_TOLERANCE = 0.05; // 5% — margen para diferencias de redondeo

interface QuoterItemInput {
  name: string;
  note: string;
  unitPrice: number;
  quantity: number;
  printConfig?: PrintConfig;
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

    // Recalcular precio server-side para cada ítem con printConfig
    const verifiedItems = items.map((item) => {
      if (!item.printConfig) {
        // Item sin config (caso legacy): rechazar directamente
        return { ...item, verifiedUnitPrice: null };
      }

      const { total, unitPrice } = calcCost(item.printConfig, pricing);
      const serverTotal = total;
      const clientTotal = item.unitPrice * item.quantity;

      const diff = Math.abs(serverTotal - clientTotal) / Math.max(serverTotal, 1);
      if (diff > PRICE_TOLERANCE) {
        return { ...item, verifiedUnitPrice: null, priceMismatch: true, serverTotal, clientTotal };
      }

      // Usar siempre el precio calculado por el servidor
      return { ...item, verifiedUnitPrice: unitPrice };
    });

    const mismatch = verifiedItems.find((i) => (i as any).priceMismatch);
    if (mismatch) {
      console.warn('[checkout/cotizador] precio manipulado', {
        name: mismatch.name,
        clientTotal: (mismatch as any).clientTotal,
        serverTotal: (mismatch as any).serverTotal,
      });
      return NextResponse.json(
        { error: 'El precio del ítem no coincide con la cotización. Recarga la página y vuelve a intentarlo.' },
        { status: 422 },
      );
    }

    const missingConfig = verifiedItems.find((i) => i.verifiedUnitPrice === null);
    if (missingConfig) {
      return NextResponse.json({ error: 'Configuración incompleta del modelo. Vuelve a cotizar.' }, { status: 400 });
    }

    const total = verifiedItems.reduce((s, i) => s + i.verifiedUnitPrice! * i.quantity, 0);

    const order = await prisma.order.create({
      data: {
        status: 'pending',
        type: 'cotizador',
        total,
        items: {
          create: verifiedItems.map((i) => ({
            itemType: 'cotizador',
            name: i.name,
            price: i.verifiedUnitPrice!,
            quantity: i.quantity,
            note: i.note,
          })),
        },
      },
    });

    const mpItems = verifiedItems.map((i) => ({
      id: `cotizador-${order.id}`,
      title: i.name,
      description: i.note,
      quantity: i.quantity,
      unit_price: i.verifiedUnitPrice!,
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
