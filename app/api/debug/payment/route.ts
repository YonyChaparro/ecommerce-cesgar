import { NextResponse } from 'next/server';
import { getPayment } from '@/lib/mercadopago';
import { prisma } from '@/lib/prisma';

// Solo disponible en desarrollo — GET /api/debug/payment?id=PAYMENT_ID
//                               — GET /api/debug/payment?order=ORDER_ID
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('id');
  const orderId   = searchParams.get('order');

  // ── Buscar por order ID: BD local + búsqueda en MP por external_reference ──
  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: `Orden ${orderId} no encontrada` }, { status: 404 });
    }

    // Si ya tenemos paymentId en la BD, lo buscamos directamente
    let mpPayment: unknown = null;
    if (order.paymentId) {
      try {
        mpPayment = await getPayment().get({ id: order.paymentId });
      } catch (e) {
        mpPayment = { error: String(e) };
      }
    }

    // Siempre buscamos en MP por external_reference para detectar pagos
    // que llegaron al webhook de producción pero no a este servidor local
    let mpSearch: unknown = null;
    try {
      const results = await getPayment().search({
        options: { external_reference: orderId, sort: 'date_created', criteria: 'desc', limit: 5 },
      });
      mpSearch = (results.results ?? []).map((p) => ({
        paymentId:    p.id,
        status:       p.status,
        statusDetail: p.status_detail,
        amount:       p.transaction_amount,
        method:       p.payment_method_id,
        payer:        p.payer?.email,
        dateCreated:  p.date_created,
        dateApproved: p.date_approved,
      }));
    } catch (e) {
      mpSearch = { error: String(e) };
    }

    return NextResponse.json({ order, mpPayment, mpSearch });
  }

  // ── Buscar por payment ID directo en MP ──────────────────────────────────
  if (paymentId) {
    try {
      const payment = await getPayment().get({ id: paymentId });
      return NextResponse.json({
        paymentId:     payment.id,
        status:        payment.status,
        statusDetail:  payment.status_detail,
        externalRef:   payment.external_reference,
        amount:        payment.transaction_amount,
        payer:         payment.payer?.email,
        dateApproved:  payment.date_approved,
        dateCreated:   payment.date_created,
        paymentMethod: payment.payment_method_id,
        raw:           payment,
      });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: 'Usa ?id=PAYMENT_ID o ?order=ORDER_ID' },
    { status: 400 },
  );
}
