'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { MAX_RESPALDOS } from '@/lib/asistente/tipos';
import { Card, inputCls } from '../../_ui';
import type { FilaModelo } from './tipos';

/** Lista ordenada, solo con modelos aprobados (vista 6). */
export default function ListaRespaldos({ respaldos, principal, aprobados, onCambio }: {
  respaldos: string[];
  principal: string;
  aprobados: FilaModelo[];
  onCambio: (respaldos: string[]) => void;
}) {
  const [agregando, setAgregando] = useState(false);
  const disponibles = aprobados.filter((m) => m.id !== principal && !respaldos.includes(m.id));

  return (
    <Card title="Respaldos">
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          Si el principal falla (caída, límite de peticiones o contexto), OpenRouter prueba estos en orden. Se cobra el
          modelo que respondió.
        </p>
        {respaldos.map((id, i) => (
          <div key={id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{i + 1}</span>
            <span className="flex-1 truncate font-mono text-sm text-slate-900">{id}</span>
            <span className="rounded-full bg-primary-container/15 px-2.5 py-0.5 text-xs font-bold text-primary">Aprobado</span>
            <button
              type="button"
              aria-label={`Quitar respaldo ${id}`}
              onClick={() => onCambio(respaldos.filter((r) => r !== id))}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {respaldos.length === 0 && <p className="text-sm text-slate-400">Sin respaldos.</p>}

        {agregando ? (
          <select
            autoFocus
            className={inputCls}
            defaultValue=""
            onChange={(e) => { if (e.target.value) onCambio([...respaldos, e.target.value]); setAgregando(false); }}
            onBlur={() => setAgregando(false)}
          >
            <option value="" disabled>Elige un modelo aprobado…</option>
            {disponibles.map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
          </select>
        ) : (
          <button
            type="button"
            onClick={() => setAgregando(true)}
            disabled={respaldos.length >= MAX_RESPALDOS || disponibles.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus size={14} /> Agregar respaldo
          </button>
        )}
        {respaldos.length >= MAX_RESPALDOS && (
          <p className="text-xs text-slate-400">Hasta {MAX_RESPALDOS} respaldos detrás del principal.</p>
        )}
      </div>
    </Card>
  );
}
