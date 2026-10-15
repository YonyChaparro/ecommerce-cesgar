import type { SalidaTool } from '@/lib/asistente/esquemas';
import { cn } from '@/lib/utils';

/** Tarjetas de material (mostrar_materiales, vista 3): uno marcado como recomendado. */
export default function TarjetasMaterial({ salida }: { salida: SalidaTool<'mostrar_materiales'> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {salida.materiales.map((m) => (
        <div
          key={`${m.tecnologia}-${m.id}`}
          className={cn(
            'flex flex-col gap-2 rounded-2xl border bg-white p-4.5',
            m.recomendado ? 'border-primary-container' : 'border-slate-200',
          )}
        >
          <div className="flex items-center gap-2">
            <strong className="text-lg">{m.nombre}</strong>
            {m.recomendado && (
              <span className="rounded-full bg-primary-container/15 px-2 py-0.5 text-xs font-bold text-primary">Recomendado</span>
            )}
            <span className="ml-auto text-xs text-slate-500">{m.tecnologia === 'fdm' ? 'FDM' : 'Resina'}</span>
          </div>
          <span className="text-sm text-slate-600">{m.descripcion}</span>
          {(m.ventajas.length > 0 || m.limites.length > 0) && (
            <span className="text-sm text-slate-700">
              {[...m.ventajas.map((v) => `✓ ${v}`), ...m.limites].join(' · ')}
            </span>
          )}
          <span className="text-xs text-slate-500">{m.colores.join(', ')}</span>
        </div>
      ))}
    </div>
  );
}
