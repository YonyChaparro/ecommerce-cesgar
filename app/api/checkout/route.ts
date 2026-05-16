import { NextResponse } from 'next/server';
import { preference } from '@/lib/mercadopago';
import { prisma } from '@/lib/prisma';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';

interface CartItemInput {
  id: string;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: CartItemInput[] = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });
    }

    // Validate quantities
    const invalidQty = items.find((i) => !Number.isInteger(i.quantity) || i.quantity < 1);
    if (invalidQty) {
      return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
    }

    // Fetch and validate prices from DB — never trust client-sent prices
    const productIds = items.map((i) => i.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, img: true, stock: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const validatedItems = items.map((item) => {
      const product = productMap.get(item.id)!;
      return {
        id: product.id,
        title: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        picture_url: product.img,
        currency_id: 'COP',
      };
    });

    const total = validatedItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);

    // Create order in DB first — its ID becomes the external_reference in MP
    const order = await prisma.order.create({
      data: {
        status: 'pending',
        total,
        items: {
          create: validatedItems.map((i) => ({
            productId: i.id,
            name: i.title,
            price: i.unit_price,
            quantity: i.quantity,
          })),
        },
      },
    });

    // Create MercadoPago preference
    // auto_return y notification_url requieren URLs HTTPS públicas — solo en producción
    const result = await preference.create({
      body: {
        items: validatedItems,
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

    // Store preference ID on the order
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
