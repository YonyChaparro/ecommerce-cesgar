import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function PagoFalloPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="bg-red-50 rounded-full p-6">
        <XCircle size={56} className="text-red-500" />
      </div>
      <div className="space-y-2">
        <h1 className="font-headline font-bold text-2xl text-inverse-surface">
          Pago rechazado
        </h1>
        <p className="text-slate-500 max-w-sm">
          No pudimos procesar tu pago. Puedes intentarlo de nuevo con otro método de pago.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/carrito"
          className="px-8 py-3 bg-inverse-surface text-white rounded-xl font-headline font-bold text-sm hover:bg-primary-container hover:text-inverse-surface transition-all"
        >
          Volver al carrito
        </Link>
        <Link
          href="/tienda"
          className="px-8 py-3 border border-slate-200 text-slate-600 rounded-xl font-headline font-bold text-sm hover:bg-slate-50 transition-all"
        >
          Ir a la tienda
        </Link>
      </div>
    </main>
  );
}
