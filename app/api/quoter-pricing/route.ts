import { NextResponse } from 'next/server';
import { getQuoterPricing } from '@/lib/quoter-config';

// La tabla de tarifas ya viaja al navegador como props de /cotizador, así que aquí
// no se expone nada nuevo. Existe para que el carrito pueda volver a tarifar un
// ítem cuando cambia la cantidad y no enseñe un precio que el checkout no cobrará.
export async function GET() {
  return NextResponse.json(await getQuoterPricing());
}
