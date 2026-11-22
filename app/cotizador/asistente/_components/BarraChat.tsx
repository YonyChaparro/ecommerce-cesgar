import Link from 'next/link';
import { ArrowLeft, SquarePen } from 'lucide-react';
import PildoraCarrito from './PildoraCarrito';

/** "← Cotizador", píldora del carrito (con conversación) y "Nueva conversación". */
export default function BarraChat({ conCarrito, onNueva }: { conCarrito: boolean; onNueva: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 pt-5 sm:px-8">
      <Link href="/cotizador" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-inverse-surface">
        <ArrowLeft size={16} aria-hidden="true" />
        Cotizador
      </Link>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {conCarrito && <PildoraCarrito />}
        <button
          type="button"
          onClick={onNueva}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-inverse-surface"
        >
          <SquarePen size={16} aria-hidden="true" />
          Nueva conversación
        </button>
      </div>
    </div>
  );
}
