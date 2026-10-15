import { Check, X } from 'lucide-react';
import { REGLAS, type Validaciones } from '@/lib/asistente/validaciones';
import { Card } from '../../_ui';

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

/** Tabla regla × modelo de npm run verify:agente (vista 6, decisión 6). */
export default function TablaValidacion({ validaciones: v }: { validaciones: Validaciones }) {
  const modelos = Object.entries(v.modelos);

  // Una regla aprueba si aprobaron todas sus situaciones.
  const aprueba = (modelo: string, regla: string) => {
    const situaciones = v.situaciones.filter((s) => s.regla === regla);
    return situaciones.every((s) => v.modelos[modelo].resultados[s.id] !== false);
  };

  return (
    <Card
      title="Validación por modelo"
      aside={<code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">npm run verify:agente</code>}
    >
      {modelos.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no se ha corrido verify:agente con ningún modelo.</p>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="py-2 pr-3 font-semibold">Situación</th>
                  {modelos.map(([id]) => (
                    <th key={id} className="px-2 py-2 font-mono font-semibold text-center">{id.split('/').pop()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGLAS.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2.5 pr-3 text-slate-700">{r.titulo}</td>
                    {modelos.map(([id]) => (
                      <td key={id} className="px-2 py-2.5 text-center">
                        {aprueba(id, r.id) ? (
                          <span aria-label="Aprobado" className="inline-flex text-primary"><Check size={16} /></span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800"><X size={14} />Falló</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-slate-500">
            <span>
              {v.situaciones.length} situaciones
              {v.ultimaEjecucion && ` · última ejecución ${fecha(v.ultimaEjecucion)}`}
            </span>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-primary">Ver reporte completo</summary>
            <ul className="mt-2 space-y-2">
              {modelos.map(([id, r]) => (
                <li key={id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-mono text-xs text-slate-900">{id}</span>{' '}
                  <span className="text-xs text-slate-500">· {r.aprobadas}/{r.total} · {fecha(r.fecha)}</span>
                  {r.fallos.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-xs text-amber-800">
                      {r.fallos.map((f) => <li key={f.situacion}>{f.situacion}: {f.motivo}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </Card>
  );
}
