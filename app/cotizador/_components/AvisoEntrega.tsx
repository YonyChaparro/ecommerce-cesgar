import { Zap } from 'lucide-react';

/** Franja de tiempos de entrega, sobre las tarjetas del selector (vista 1). */
export default function AvisoEntrega() {
  return (
    <p className="mb-8 flex flex-col items-center justify-center gap-x-4 gap-y-2.5 rounded-3xl bg-inverse-surface px-5 py-4 text-center text-base text-white shadow-xl shadow-inverse-surface/25 sm:mb-10 md:flex-row md:rounded-full md:px-8 lg:text-lg">
      <span className="relative flex size-10 shrink-0 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-1 animate-ping rounded-full bg-tertiary-container opacity-40 motion-reduce:hidden" />
        <span className="relative flex size-10 items-center justify-center rounded-full bg-tertiary-container text-inverse-surface">
          <Zap size={20} fill="currentColor" />
        </span>
      </span>
      <strong className="font-extrabold">Impresión inmediata</strong>
      <span className="hidden text-white/40 md:inline" aria-hidden="true">|</span>
      <span>
        Entregas en <strong className="font-extrabold text-tertiary-fixed-dim">1 día (Bogotá)</strong> y{' '}
        <strong className="font-extrabold text-tertiary-fixed-dim">3 días (Nacional)</strong>.
      </span>
    </p>
  );
}
