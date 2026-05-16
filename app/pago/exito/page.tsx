import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function PagoExitoPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="bg-green-50 rounded-full p-6">
        <CheckCircle2 size={56} className="text-green-500" />
      </div>
      <div className="space-y-2">
        <h1 className="font-headline font-bold text-2xl text-inverse-surface">
          ¡Pago aprobado!
        </h1>
        <p className="text-slate-500 max-w-sm">
          Tu pedido fue confirmado. Te enviaremos los detalles por correo electrónico.
        </p>
      </div>
      <Link
        href="/tienda"
        className="px-8 py-3 bg-inverse-surface text-white rounded-xl font-headline font-bold text-sm hover:bg-primary-container hover:text-inverse-surface transition-all"
      >
        Seguir comprando
      </Link>
    </main>
  );
}
