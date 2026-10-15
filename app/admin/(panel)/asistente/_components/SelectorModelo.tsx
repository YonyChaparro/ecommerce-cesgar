'use client';
import { useState } from 'react';
import { Search, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, inputCls } from '../../_ui';
import type { FilaModelo } from './tipos';

const MAX_FILAS = 40;

const CHIP = {
  aprobado: 'bg-primary-container/15 text-primary',
  fallo: 'bg-amber-50 text-amber-800',
  'sin-validar': 'bg-slate-100 text-slate-600',
} as const;

const contexto = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));

/**
 * Buscador sobre los modelos de OpenRouter que soportan tools. Los que no
 * aprobaron verify:agente se ven, pero no se pueden elegir (vista 6).
 */
export default function SelectorModelo({ modelos, seleccionado, sinLista, onElegir }: {
  modelos: FilaModelo[];
  seleccionado: string;
  sinLista: boolean;
  onElegir: (id: string) => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const q = busqueda.trim().toLowerCase();
  const filtrados = modelos.filter((m) => !q || m.id.toLowerCase().includes(q) || m.proveedor.toLowerCase().includes(q));
  const visibles = filtrados.slice(0, MAX_FILAS);

  return (
    <Card title="Modelo principal">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Solo aparecen modelos de OpenRouter que soportan tools. Un modelo que no aprobó{' '}
          <code className="font-mono text-xs">verify:agente</code> no se puede elegir.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="buscar-modelo" className="sr-only">Buscar modelo</label>
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="buscar-modelo"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar en OpenRouter…"
              className={cn(inputCls, 'pl-9')}
            />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <Wrench size={12} aria-hidden="true" /> Soporta tools
          </span>
        </div>
        {sinLista && (
          <p className="text-xs text-amber-800">No se pudo consultar la lista de OpenRouter; solo se muestran los modelos ya validados.</p>
        )}

        <div role="radiogroup" aria-label="Modelo principal" className="space-y-2 max-h-112 overflow-y-auto pr-1">
          {visibles.map((m) => {
            const elegible = m.validacion.estado === 'aprobado';
            const elegido = m.id === seleccionado;
            return (
              <label
                key={m.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-3',
                  elegido ? 'border-2 border-inverse-surface bg-slate-50' : 'border border-slate-200 bg-white',
                  elegible ? 'cursor-pointer' : 'cursor-not-allowed',
                )}
              >
                <input
                  type="radio"
                  name="modelo"
                  checked={elegido}
                  disabled={!elegible}
                  onChange={() => onElegir(m.id)}
                  className="accent-inverse-surface"
                />
                <div className="min-w-0 flex-1">
                  <span className={cn('block truncate font-mono text-sm', elegible ? 'text-slate-900' : 'text-slate-500')}>{m.id}</span>
                  <span className="text-xs text-slate-500">
                    {m.proveedor}{m.contexto > 0 && ` · contexto ${contexto(m.contexto)}`}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', CHIP[m.validacion.estado])}>{m.validacion.texto}</span>
                  <span className="max-w-48 text-xs text-slate-500">{m.validacion.nota}</span>
                </div>
              </label>
            );
          })}
          {filtrados.length > MAX_FILAS && (
            <p className="text-xs text-slate-400 text-center py-1">
              {filtrados.length - MAX_FILAS} modelos más: afina la búsqueda.
            </p>
          )}
          {filtrados.length === 0 && <p className="text-sm text-slate-400 py-2">Ningún modelo coincide.</p>}
        </div>
      </div>
    </Card>
  );
}
