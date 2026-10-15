import { FileBox, ShoppingCart } from 'lucide-react';
import type { MensajeChat } from '@/lib/asistente/esquemas';
import { tamanoArchivo } from '@/lib/formato';

/** Burbuja del cliente, a la derecha, con sus adjuntos como fichas (vista 3). */
export default function MensajeCliente({ mensaje }: { mensaje: MensajeChat }) {
  return (
    <div className="flex max-w-lg flex-col items-end gap-2 self-end">
      {mensaje.parts.map((p, i) => {
        if (p.type === 'data-archivo') {
          return (
            <div key={i} className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5">
              <FileBox size={20} className="shrink-0 text-ia-tinta" aria-hidden="true" />
              <div className="flex min-w-0 flex-col">
                <strong className="truncate text-sm">{p.data.nombre}</strong>
                <span className="text-xs text-slate-500">{tamanoArchivo(p.data.bytes)} · subido</span>
              </div>
            </div>
          );
        }
        if (p.type === 'data-agregados') {
          return (
            <span key={i} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <ShoppingCart size={13} aria-hidden="true" />
              Agregaste: {p.data.productos.map((x) => `${x.nombre} × ${x.cantidad}`).join(', ')}
            </span>
          );
        }
        if (p.type === 'text' && p.text.trim()) {
          return (
            <div key={i} className="whitespace-pre-line rounded-2xl rounded-br-sm bg-inverse-surface px-4 py-3 text-base leading-relaxed text-white">
              {p.text}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
