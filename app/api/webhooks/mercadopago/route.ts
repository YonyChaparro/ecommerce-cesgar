import { NextResponse } from 'next/server';
import { payment } from '@/lib/mercadopago';
import { prisma } from '@/lib/prisma';

// MP sends: POST body { type: "payment", data: { id: "PAYMENT_ID" } }
// and also as query params: ?topic=payment&id=PAYMENT_ID (IPN legacy)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const { searchParams } = new URL(req.url);

    const topic = body?.type ?? searchParams.get('topic');
    const paymentId = body?.data?.id ?? searchParams.get('id');

    // Only handle payment notifications
    if (topic !== 'payment' || !paymentId) {
      return NextResponse.json({ received: true });
    }

    // Fetch payment from MP to verify it actually exists (basic security)
    const paymentData = await payment.get({ id: String(paymentId) });

    const status = paymentData.status;
    const externalRef = paymentData.external_reference; // our order.id

    if (!externalRef || !status) {
      return NextResponse.json({ received: true });
    }

    await prisma.order.update({
      where: { id: externalRef },
      data: {
        status,
        paymentId: String(paymentId),
      },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook/mercadopago]', err);
    // Always return 200 to MP so it stops retrying on our internal errors
    return NextResponse.json({ received: true });
  }
}
