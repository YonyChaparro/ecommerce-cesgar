import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';
import { RESULTADOS, type DetalleConversacion as Datos } from '@/lib/asistente/metricas';
import { recorrido, transcripcion } from '@/lib/asistente/resumen';
import { numero, pesos } from '@/lib/formato';
import { cn } from '@/lib/utils';
import { CHIP_RESULTADO, fechaCorta, ordenCorta, usd } from './formato';

/** Se abre con ?id=. Recorrido: mensajes del cliente y tools con su resumen. */
export default function DetalleConversacion({ d, maxTurnos, cerrar }: { d: Datos; maxTurnos: number; cerrar: string }) {
  const pasos = recorrido(d.mensajes);
  const lineas = transcripcion(d.mensajes);
  const datos: [string, React.ReactNode][] = [
    ['Inicio', fechaCorta(d.inicio)],
    ['Modelo', d.modelos.length
      ? d.modelos.map((m) => `${m.modelo.split('/').pop()}${m.respaldo ? ' (respaldo)' : ''}`).join(', ')
      : '—'],
    ['Turnos', `${d.turnos} de ${maxTurnos}`],
    ['Tokens', `${numero(d.tokensEntrada)} / ${numero(d.tokensSalida)}`],
    ['Costo', usd(d.costoUsd)],
    ['Resultado', <span key="r" className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', CHIP_RESULTADO[d.resultado])}>{RESULTADOS[d.resultado]}</span>],
    ['Orden', d.orden
      ? <Link key="o" href={`/admin/orders/${d.orden.id}`} className="text-primary font-semibold hover:underline">
          {ordenCorta(d.orden.id)} · {pesos(d.orden.total)}{d.orden.pagada ? '' : ' · sin pagar'}
        </Link>
      : '—'],
  ];

  return (
    <aside aria-label="Detalle de la conversación" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden self-start xl:sticky xl:top-4">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-inverse-surface">
          Conversación <span className="font-mono text-xs text-slate-500">{d.id.slice(0, 8)}</span>
        </h2>
        <Link href={cerrar} aria-label="Cerrar detalle" className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600">
          <X size={16} />
        </Link>
      </div>
      <div className="p-5 space-y-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {datos.map(([dt, dd]) => (
            <div key={dt} className="contents">
              <dt className="text-slate-400">{dt}</dt>
              <dd className="text-slate-800 min-w-0 break-words">{dd}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Recorrido</span>
          {pasos.length === 0 && <p className="text-sm text-slate-400">Sin mensajes.</p>}
          <ol className="space-y-1.5">
            {pasos.map((p, i) => (
              <li key={i} className="flex flex-col rounded-lg bg-slate-50 px-3 py-2">
                <span className={cn('text-xs font-bold', p.quien === 'cliente' ? 'text-inverse-surface uppercase tracking-wider' : 'font-mono text-ia-tinta')}>
                  {p.quien}
                </span>
                <span className="text-sm text-slate-700">{p.texto}</span>
              </li>
            ))}
          </ol>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-primary">Ver transcripción completa</summary>
          <div className="mt-2 space-y-2">
            {lineas.map((l, i) => (
              <p key={i} className={cn('whitespace-pre-line rounded-lg px-3 py-2', l.rol === 'cliente' ? 'bg-inverse-surface text-white' : 'bg-slate-50 text-slate-700')}>
                {l.texto}
              </p>
            ))}
          </div>
        </details>

        <p className="flex items-start gap-2 text-xs text-slate-500">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Conversación anónima, sin datos personales. Se borra automáticamente a los 90 días.
        </p>
      </div>
    </aside>
  );
}
