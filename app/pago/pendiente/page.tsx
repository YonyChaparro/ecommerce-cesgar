import Link from 'next/link';
import { Clock } from 'lucide-react';

export default function PagoPendientePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="bg-yellow-50 rounded-full p-6">
        <Clock size={56} className="text-yellow-500" />
      </div>
      <div className="space-y-2">
        <h1 className="font-headline font-bold text-2xl text-inverse-surface">
          Pago en proceso
        </h1>
        <p className="text-slate-500 max-w-sm">
          Tu pago está siendo procesado. Te notificaremos cuando sea confirmado. Esto puede tardar hasta 2 días hábiles.
        </p>
      </div>
      <Link
        href="/tienda"
        className="px-8 py-3 bg-inverse-surface text-white rounded-xl font-headline font-bold text-sm hover:bg-primary-container hover:text-inverse-surface transition-all"
      >
        Volver a la tienda
      </Link>
    </main>
  );
}
