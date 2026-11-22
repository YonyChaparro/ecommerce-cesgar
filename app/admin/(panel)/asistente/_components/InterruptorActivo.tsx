import { cn } from '@/lib/utils';

export default function InterruptorActivo({ activo, onCambio }: { activo: boolean; onCambio: (v: boolean) => void }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 flex-wrap">
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label="Asistente activo"
        onClick={() => onCambio(!activo)}
        className={cn(
          'relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors',
          activo ? 'justify-end bg-primary' : 'justify-start bg-slate-300',
        )}
      >
        <span className="size-5 rounded-full bg-white shadow" />
      </button>
      <div className="flex-1 min-w-48">
        <strong className="block text-sm text-inverse-surface">Asistente activo</strong>
        <span className="text-xs text-slate-500">
          Si lo apagas, la tarjeta «No tengo modelo» lleva a la cotización personalizada.
        </span>
      </div>
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold',
          activo ? 'bg-primary-container/15 text-primary' : 'bg-slate-100 text-slate-600',
        )}
      >
        <span className={cn('size-2 rounded-full', activo ? 'bg-primary' : 'bg-slate-400')} />
        {activo ? 'Visible en /cotizador' : 'Apagado'}
      </span>
    </section>
  );
}
