import { NextResponse } from 'next/server';
import { getShippingConfig } from '@/lib/shipping-config';

// Tarifas de envío para que el checkout muestre el costo antes de pagar. No
// expone nada que el cliente no vaya a ver de todos modos en el resumen, y el
// cobro nunca sale de aquí: /api/checkout recalcula con su propia lectura.
// Mismo criterio que /api/quoter-pricing.
export async function GET() {
  return NextResponse.json(await getShippingConfig());
}
