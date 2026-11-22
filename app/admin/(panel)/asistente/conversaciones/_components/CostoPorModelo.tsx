import type { CostoModelo } from '@/lib/asistente/metricas';
import { numero } from '@/lib/formato';
import { Card } from '../../../_ui';
import { usd } from './formato';

export default function CostoPorModelo({ costos }: { costos: CostoModelo[] }) {
  return (
    <Card title="Costo por modelo">
      {costos.length === 0 ? (
        <p className="text-sm text-slate-400">Sin conversaciones con respuesta en este periodo.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                {['Modelo que respondió', 'Conversaciones', 'Costo total', 'Por conversación', 'Llegaron al carrito'].map((h) => (
                  <th key={h} className="py-2 pr-3 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {costos.map((c) => (
                <tr key={`${c.modelo}-${c.respaldo}`} className="border-t border-slate-100">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-900">{c.modelo}</span>
                      <span className={c.respaldo ? 'text-xs font-bold text-amber-800' : 'text-xs font-bold text-primary'}>
                        {c.respaldo ? 'Respaldo' : 'Principal'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">{numero(c.conversaciones)}</td>
                  <td className="py-2.5 pr-3">{usd(c.costoUsd)}</td>
                  <td className="py-2.5 pr-3">{usd(c.conversaciones ? c.costoUsd / c.conversaciones : 0)}</td>
                  <td className="py-2.5">{numero(c.pctCarrito, 1)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
