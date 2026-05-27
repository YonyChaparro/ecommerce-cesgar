'use client';
import { useState, useTransition } from 'react';
import { Save, RotateCcw, CheckCircle, AlertCircle, Ban } from 'lucide-react';
import type { QuoterPricing } from '@/lib/quoter-types';
import { DEFAULT_QUOTER_PRICING } from '@/lib/quoter-types';
import { saveQuoterPricingAction } from './actions';

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4dbdcc] focus:border-transparent transition-shadow';

function Num({
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <input
      type="number"
      step={step}
      min={min}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={inputCls}
    />
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-[#f8fafc]">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Table helpers ────────────────────────────────────────────────────────────

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 bg-[#f8fafc]">
      {children}
    </th>
  );
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function QuoterConfigForm({ initial }: { initial: QuoterPricing }) {
  const [pricing, setPricing] = useState<QuoterPricing>(initial);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  // ── helpers ──────────────────────────────────────────────────────────────────

  const setTarifa = (key: 'costoSetup' | 'precioHora' | 'postProcesado' | 'costoEscalado', val: number) =>
    setPricing((p) => ({ ...p, tarifas: { ...p.tarifas, [key]: val } }));

  const setMaterial = (
    tech: 'fdm' | 'resina',
    idx: number,
    field: 'precioGramo' | 'densidad',
    val: number,
  ) =>
    setPricing((p) => ({
      ...p,
      materiales: {
        ...p.materiales,
        [tech]: p.materiales[tech].map((m, i) =>
          i === idx ? { ...m, [field]: val } : m,
        ),
      },
    }));

  const toggleMaterialDisabled = (tech: 'fdm' | 'resina', idx: number) =>
    setPricing((p) => ({
      ...p,
      materiales: {
        ...p.materiales,
        [tech]: p.materiales[tech].map((m, i) =>
          i === idx ? { ...m, disabled: !m.disabled } : m,
        ),
      },
    }));

  const setCalidad = (tech: 'fdm' | 'resina', key: string, val: number) =>
    setPricing((p) => ({
      ...p,
      tarifas: {
        ...p.tarifas,
        multiplicadorCalidad: {
          ...p.tarifas.multiplicadorCalidad,
          [tech]: { ...p.tarifas.multiplicadorCalidad[tech], [key]: val },
        },
      },
    }));

  const setRelleno = (key: string, val: number) =>
    setPricing((p) => ({
      ...p,
      tarifas: {
        ...p.tarifas,
        multiplicadorRelleno: { ...p.tarifas.multiplicadorRelleno, [key]: val },
      },
    }));

  const setCantidad = (idx: number, field: 'mult', val: number) =>
    setPricing((p) => ({
      ...p,
      tarifas: {
        ...p.tarifas,
        multiplicadorCantidad: p.tarifas.multiplicadorCantidad.map((row, i) =>
          i === idx ? { ...row, [field]: val } : row,
        ),
      },
    }));

  // ── submit ────────────────────────────────────────────────────────────────────

  const handleSave = () => {
    setStatus('idle');
    startTransition(async () => {
      const result = await saveQuoterPricingAction(pricing);
      setStatus(result.ok ? 'ok' : 'error');
      if (result.ok) setTimeout(() => setStatus('idle'), 3000);
    });
  };

  const handleReset = () => {
    if (!confirm('¿Restaurar todos los valores a los predeterminados?')) return;
    setPricing(DEFAULT_QUOTER_PRICING);
    setStatus('idle');
  };

  // ── FDM quality labels ────────────────────────────────────────────────────────

  const fdmQualityLabels: Record<string, string> = {
    '0.3': '0.3 mm — Borrador',
    '0.2': '0.2 mm — Estándar',
    '0.15': '0.15 mm — Detallado',
    '0.1': '0.1 mm — Alta calidad',
    '0.05': '0.05 mm — Ultra fino',
  };
  const resinQualityLabels: Record<string, string> = {
    '0.1': '100 µm — Rápido',
    '0.05': '50 µm — Estándar',
    '0.02': '20 µm — Ultra detalle',
  };
  const rellenoLabels: Record<string, string> = {
    '15': '15% — Ligero',
    '20': '20% — Estándar',
    '40': '40% — Resistente',
    '60': '60% — Fuerte',
    '80': '80% — Muy fuerte',
    '100': '100% — Sólido',
  };

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-headline font-bold text-inverse-surface">
            Cotizador · Precios
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Modifica materiales, tarifas y multiplicadores del cotizador 3D
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RotateCcw size={15} />
            Restaurar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 bg-[#16234d] hover:bg-[#4dbdcc] text-white hover:text-[#16234d] font-headline font-bold px-5 py-2.5 rounded-xl transition-all text-sm disabled:opacity-60"
          >
            <Save size={15} />
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {status === 'ok' && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle size={16} /> Cambios guardados correctamente. Los precios del cotizador ya están actualizados.
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} /> Error al guardar. Intenta de nuevo.
        </div>
      )}

      {/* ── Tarifas Base ──────────────────────────────────────────────────────── */}
      <Card title="Tarifas Base ($ COP)">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            [
              ['costoSetup',    'Costo de Setup',     'Por orden — preparación de archivo y máquina'],
              ['precioHora',    'Precio por Hora',    'Costo de tiempo de impresión ($/h)'],
              ['postProcesado', 'Post-Procesado',     'Costo adicional de limpieza y lijado'],
              ['costoEscalado', 'Costo por Escalado', 'Cargo extra por pieza cuando el factor ≠ 1.0'],
            ] as const
          ).map(([key, label, hint]) => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {label}
              </label>
              <Num
                value={pricing.tarifas[key]}
                onChange={(v) => setTarifa(key, v)}
              />
              <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Materiales FDM ────────────────────────────────────────────────────── */}
      <Card title="Materiales FDM (Filamento)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-130">
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Material</Th>
                <Th>Precio / gramo ($)</Th>
                <Th>Densidad (g/cm³)</Th>
                <Th>Descripción</Th>
                <Th>Bloqueado</Th>
              </tr>
            </thead>
            <tbody>
              {pricing.materiales.fdm.map((mat, idx) => (
                <tr key={mat.id} className={`border-b border-slate-50 ${mat.disabled ? 'opacity-50' : ''}`}>
                  <Td>
                    <span className="font-medium text-slate-700">{mat.nombre}</span>
                    {mat.disabled && (
                      <span className="ml-2 text-[10px] font-bold uppercase text-red-400 bg-red-50 px-1.5 py-0.5 rounded">Sin stock</span>
                    )}
                  </Td>
                  <Td className="w-36">
                    <Num
                      value={mat.precioGramo}
                      onChange={(v) => setMaterial('fdm', idx, 'precioGramo', v)}
                    />
                  </Td>
                  <Td className="w-36">
                    <Num
                      value={mat.densidad}
                      step={0.01}
                      onChange={(v) => setMaterial('fdm', idx, 'densidad', v)}
                    />
                  </Td>
                  <Td className="text-slate-400 text-xs">{mat.desc}</Td>
                  <Td className="w-20 text-center">
                    <button
                      type="button"
                      onClick={() => toggleMaterialDisabled('fdm', idx)}
                      title={mat.disabled ? 'Habilitar material' : 'Bloquear material'}
                      className={`p-1.5 rounded-lg transition-colors ${mat.disabled ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      <Ban size={14} />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Materiales Resina ─────────────────────────────────────────────────── */}
      <Card title="Materiales Resina (SLA)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-130">
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Material</Th>
                <Th>Precio / gramo ($)</Th>
                <Th>Densidad (g/cm³)</Th>
                <Th>Descripción</Th>
                <Th>Bloqueado</Th>
              </tr>
            </thead>
            <tbody>
              {pricing.materiales.resina.map((mat, idx) => (
                <tr key={mat.id} className={`border-b border-slate-50 ${mat.disabled ? 'opacity-50' : ''}`}>
                  <Td>
                    <span className="font-medium text-slate-700">{mat.nombre}</span>
                    {mat.disabled && (
                      <span className="ml-2 text-[10px] font-bold uppercase text-red-400 bg-red-50 px-1.5 py-0.5 rounded">Sin stock</span>
                    )}
                  </Td>
                  <Td className="w-36">
                    <Num
                      value={mat.precioGramo}
                      onChange={(v) => setMaterial('resina', idx, 'precioGramo', v)}
                    />
                  </Td>
                  <Td className="w-36">
                    <Num
                      value={mat.densidad}
                      step={0.01}
                      onChange={(v) => setMaterial('resina', idx, 'densidad', v)}
                    />
                  </Td>
                  <Td className="text-slate-400 text-xs">{mat.desc}</Td>
                  <Td className="w-20 text-center">
                    <button
                      type="button"
                      onClick={() => toggleMaterialDisabled('resina', idx)}
                      title={mat.disabled ? 'Habilitar material' : 'Bloquear material'}
                      className={`p-1.5 rounded-lg transition-colors ${mat.disabled ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      <Ban size={14} />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Multiplicadores de Calidad ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Calidad FDM — Multiplicadores">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Capa</Th>
                <Th>Multiplicador</Th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pricing.tarifas.multiplicadorCalidad.fdm).map(([key, val]) => (
                <tr key={key} className="border-b border-slate-50">
                  <Td>
                    <span className="font-medium text-slate-700">
                      {fdmQualityLabels[key] ?? key}
                    </span>
                  </Td>
                  <Td className="w-32">
                    <Num value={val} step={0.01} onChange={(v) => setCalidad('fdm', key, v)} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Calidad Resina — Multiplicadores">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Capa</Th>
                <Th>Multiplicador</Th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pricing.tarifas.multiplicadorCalidad.resina).map(([key, val]) => (
                <tr key={key} className="border-b border-slate-50">
                  <Td>
                    <span className="font-medium text-slate-700">
                      {resinQualityLabels[key] ?? key}
                    </span>
                  </Td>
                  <Td className="w-32">
                    <Num value={val} step={0.01} onChange={(v) => setCalidad('resina', key, v)} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* ── Multiplicador de Relleno ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Relleno FDM — Multiplicadores">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Relleno</Th>
                <Th>Multiplicador</Th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pricing.tarifas.multiplicadorRelleno).map(([key, val]) => (
                <tr key={key} className="border-b border-slate-50">
                  <Td>
                    <span className="font-medium text-slate-700">
                      {rellenoLabels[key] ?? `${key}%`}
                    </span>
                  </Td>
                  <Td className="w-32">
                    <Num value={val} step={0.01} onChange={(v) => setRelleno(key, v)} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* ── Descuentos por Cantidad ────────────────────────────────────────── */}
        <Card title="Descuentos por Cantidad">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Desde (piezas)</Th>
                <Th>Multiplicador</Th>
              </tr>
            </thead>
            <tbody>
              {pricing.tarifas.multiplicadorCantidad.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-50">
                  <Td>
                    <span className="font-medium text-slate-700">≥ {row.min} pz</span>
                  </Td>
                  <Td className="w-32">
                    <Num
                      value={row.mult}
                      step={0.01}
                      min={0}
                      onChange={(v) => setCantidad(idx, 'mult', v)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-400 mt-3">
            Valores &lt; 1.0 aplican descuento; 1.0 = sin descuento.
          </p>
        </Card>
      </div>

      {/* Save bottom */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 bg-[#16234d] hover:bg-[#4dbdcc] text-white hover:text-[#16234d] font-headline font-bold px-5 py-2.5 rounded-xl transition-all text-sm disabled:opacity-60"
        >
          <Save size={15} />
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
