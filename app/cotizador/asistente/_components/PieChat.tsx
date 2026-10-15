'use client';

import Link from 'next/link';
import { FileUp, MessageCircle, ShieldCheck } from 'lucide-react';
import { useAccionesChat } from './AccionesChat';

/** "Hablar con una persona" y el aviso de datos (§11). En el inicio suma el atajo al cotizador. */
export default function PieChat({ variante }: { variante: 'inicio' | 'conversacion' }) {
  const { abrirWhatsApp } = useAccionesChat();
  const inicio = variante === 'inicio';
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-slate-500">
      {inicio && (
        <Link href="/cotizador/modelo" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:underline">
          <FileUp size={16} aria-hidden="true" />
          ¿Ya tienes el STL? Ir al cotizador
        </Link>
      )}
      <button
        type="button"
        onClick={() => abrirWhatsApp()}
        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:underline"
      >
        <MessageCircle size={16} aria-hidden="true" />
        Hablar con una persona
      </button>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck size={16} aria-hidden="true" />
        {inicio ? 'No compartas datos personales en el chat' : 'No compartas datos personales; solo se piden al pagar.'}
      </span>
    </div>
  );
}
