import { NextResponse } from 'next/server';
import { getPayment } from '@/lib/mercadopago';
import { prisma } from '@/lib/prisma';

// Maps every known MP payment status to our Order.status set
const MP_TO_ORDER_STATUS: Record<string, string> = {
  approved:     'approved',
  pending:      'pending',
  in_process:   'in_process',
  authorized:   'in_process',  // authorized but not yet captured
  rejected:     'rejected',
  cancelled:    'cancelled',
  refunded:     'rejected',    // treat refunds as rejected for order tracking
  charged_back: 'rejected',    // same for chargebacks
};

// MP sends: POST body { type: "payment", data: { id: "PAYMENT_ID" } }
// Legacy IPN also uses query params: ?topic=payment&id=PAYMENT_ID
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const { searchParams } = new URL(req.url);

    const topic     = body?.type          ?? searchParams.get('topic');
    const paymentId = body?.data?.id      ?? searchParams.get('id');

    if (topic !== 'payment' || !paymentId) {
      return NextResponse.json({ received: true });
    }

    // Verify with MP API — this prevents spoofed webhooks from updating orders
    const paymentData = await getPayment().get({ id: String(paymentId) });

    const rawStatus  = paymentData.status;
    const externalRef = paymentData.external_reference;

    if (!externalRef || !rawStatus) {
      return NextResponse.json({ received: true });
    }

    const status = MP_TO_ORDER_STATUS[rawStatus] ?? 'pending';

    // updateMany avoids P2025 if the order was already deleted or never existed
    await prisma.order.updateMany({
      where: { id: externalRef },
      data:  { status, paymentId: String(paymentId) },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook/mercadopago]', err);
    // Always return 200 so MP stops retrying on our internal errors
    return NextResponse.json({ received: true });
  }
}
