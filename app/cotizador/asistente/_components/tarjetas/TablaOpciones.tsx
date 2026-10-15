import type { SalidaTool } from '@/lib/asistente/esquemas';
import { numero, pesos } from '@/lib/formato';
import { cn } from '@/lib/utils';

/** Tabla de comparar_opciones. Va dentro de la tarjeta de cotización o en una propia (§5.4). */
export default function TablaOpciones({ salida }: { salida: SalidaTool<'comparar_opciones'> }) {
  const elegida = salida.filas.find((f) => f.elegida);
  return (
    <>
      <div className="overflow-x-auto px-2 pt-2">
        <table className="w-full min-w-md border-collapse text-sm tabular-nums">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="px-3.5 py-2.5 font-semibold">Opción</th>
              <th className="px-3.5 py-2.5 text-right font-semibold">Unidades</th>
              <th className="px-3.5 py-2.5 text-right font-semibold">Precio c/u</th>
              <th className="px-3.5 py-2.5 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {salida.filas.map((f, i) => (
              <tr key={i} className={f.elegida ? 'bg-ia-niebla text-inverse-surface' : 'border-t border-slate-200 text-slate-700'}>
                <td className="rounded-l-xl px-3.5 py-3">
                  {f.elegida ? <strong>{f.opcion}</strong> : f.opcion}
                  {f.elegida && <span className="ml-1.5 text-xs font-bold uppercase text-ia-tinta">Tu elección</span>}
                </td>
                <td className="px-3.5 py-3 text-right">{numero(f.cantidad)}</td>
                <td className="px-3.5 py-3 text-right">
                  {pesos(f.precioUnitario)}
                  {f.descuentoPct > 0 && (
                    <span className={cn('ml-1 text-xs', f.descuentoPct > (elegida?.descuentoPct ?? 0) ? 'text-amber-800' : 'text-slate-500')}>
                      −{f.descuentoPct} %
                    </span>
                  )}
                </td>
                <td className="rounded-r-xl px-3.5 py-3 text-right">{f.elegida ? <strong>{pesos(f.total)}</strong> : pesos(f.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-5 pb-4 pt-2.5 text-xs text-slate-500">El descuento por cantidad ya está aplicado. No incluye envío.</p>
    </>
  );
}
