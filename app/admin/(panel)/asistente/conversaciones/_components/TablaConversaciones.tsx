import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RESULTADOS, TAMANO_PAGINA, type FilaConversacion, type Filtros } from '@/lib/asistente/metricas';
import { numero } from '@/lib/formato';
import { cn } from '@/lib/utils';
import { Card } from '../../../_ui';
import { CHIP_RESULTADO, fechaCorta, ordenCorta, usd } from './formato';
import { urlConversaciones } from './url';

export default function TablaConversaciones({ filas, total, filtros, idActivo, filtrosUi }: {
  filas: FilaConversacion[];
  total: number;
  filtros: Filtros;
  idActivo?: string;
  filtrosUi: React.ReactNode;
}) {
  const desde = total ? (filtros.pagina - 1) * TAMANO_PAGINA + 1 : 0;
  const hasta = Math.min(filtros.pagina * TAMANO_PAGINA, total);
  const hayAnterior = filtros.pagina > 1;
  const haySiguiente = hasta < total;

  return (
    <Card title="Conversaciones" aside={filtrosUi}>
      {filas.length === 0 ? (
        <p className="text-sm text-slate-400">No hay conversaciones con estos filtros.</p>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-3xl text-sm tabular-nums">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  {['Conversación', 'Inicio', 'Modelo', 'Turnos', 'Tokens ent. / sal.', 'Costo', 'Resultado', 'Orden'].map((h) => (
                    <th key={h} className="py-2 pr-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id} className={cn('border-t border-slate-100', f.id === idActivo && 'bg-slate-50')}>
                    <td className="py-2.5 pr-3">
                      <Link href={urlConversaciones(filtros, { detalle: f.id })} className="font-mono text-xs font-semibold text-primary hover:underline">
                        {f.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-slate-600">{fechaCorta(f.inicio)}</td>
                    <td className="py-2.5 pr-3">
                      {f.modelo ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-slate-900">{f.modelo.modelo.split('/').pop()}</span>
                          {f.modelo.respaldo && <span className="text-xs text-amber-800">respaldo</span>}
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-2.5 pr-3">{f.turnos}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-slate-600">{numero(f.tokensEntrada)} / {numero(f.tokensSalida)}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">{usd(f.costoUsd)}</td>
                    <td className="py-2.5 pr-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', CHIP_RESULTADO[f.resultado])}>{RESULTADOS[f.resultado]}</span>
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      {f.orden ? (
                        f.orden.pagada
                          ? <Link href={`/admin/orders/${f.orden.id}`} className="text-primary font-semibold hover:underline">{ordenCorta(f.orden.id)} · pagada</Link>
                          : <Link href={`/admin/orders/${f.orden.id}`} className="text-slate-500 hover:underline">Sin pagar</Link>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{numero(desde)}–{numero(hasta)} de {numero(total)}</span>
            <div className="flex gap-1">
              <PasoPagina href={hayAnterior ? urlConversaciones(filtros, { pagina: filtros.pagina - 1 }) : null} etiqueta="Página anterior">
                <ChevronLeft size={16} />
              </PasoPagina>
              <PasoPagina href={haySiguiente ? urlConversaciones(filtros, { pagina: filtros.pagina + 1 }) : null} etiqueta="Página siguiente">
                <ChevronRight size={16} />
              </PasoPagina>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function PasoPagina({ href, etiqueta, children }: { href: string | null; etiqueta: string; children: React.ReactNode }) {
  const cls = 'flex size-8 items-center justify-center rounded-lg border border-slate-200';
  return href
    ? <Link href={href} aria-label={etiqueta} className={cn(cls, 'hover:bg-slate-50 text-slate-600')}>{children}</Link>
    : <span aria-label={etiqueta} aria-disabled="true" className={cn(cls, 'text-slate-300')}>{children}</span>;
}
