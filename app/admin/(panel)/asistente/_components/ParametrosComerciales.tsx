'use client';
import { useState, useTransition } from 'react';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';
import type { ParametrosComerciales as Parametros } from '@/lib/asistente/parametros-tipos';
import { cn } from '@/lib/utils';
import { Campo, Card, inputCls } from '../../_ui';
import { saveParametrosAction } from '../actions';

type Monto = 'MODEL_HOURLY_RATE_COP' | 'MODEL_MIN_PRICE_COP' | 'SCAN_SMALL_FROM_COP' | 'SCAN_MEDIUM_FROM_COP'
  | 'SCAN_LARGE_FROM_COP' | 'MESH_CLEANUP_FROM_COP' | 'CAD_RECONSTRUCTION_FROM_COP';

const MODELADO: [Monto, string, string][] = [
  ['MODEL_HOURLY_RATE_COP', 'Tarifa por hora', 'COP por hora de diseño'],
  ['MODEL_MIN_PRICE_COP', 'Precio mínimo', 'COP por encargo'],
];
const ESCANEO: [Monto, string][] = [
  ['SCAN_SMALL_FROM_COP', 'Escaneo pequeño, desde'],
  ['SCAN_MEDIUM_FROM_COP', 'Escaneo mediano, desde'],
  ['SCAN_LARGE_FROM_COP', 'Escaneo grande, desde'],
  ['MESH_CLEANUP_FROM_COP', 'Limpieza de malla, desde'],
  ['CAD_RECONSTRUCTION_FROM_COP', 'Reconstrucción CAD, desde'],
];
const UMBRALES: ['Q_EVALUAR' | 'Q_VOLUMEN_MIN' | 'Q_INDUSTRIAL_PRIORITY', string, string][] = [
  ['Q_EVALUAR', 'Evaluar', 'Ofrece WhatsApp para una propuesta de suministro.'],
  ['Q_VOLUMEN_MIN', 'Volumen', 'WhatsApp obligatorio: sin precio ni carrito en el chat.'],
  ['Q_INDUSTRIAL_PRIORITY', 'Prioridad industrial', 'Por pedido inicial o consumo mensual.'],
];
const CINCO = ['C1', 'C2', 'C3', 'C4', 'C5'] as const;

const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * Tarjeta «Parámetros comerciales» (requirements R1, design §6.3). Se guarda
 * aparte de la configuración del modelo: el servidor valida y registra quién y
 * cuándo. Un monto vacío significa «falta» y el agente deriva (R1.2).
 */
export default function ParametrosComerciales({ initial }: { initial: Parametros }) {
  const [p, setP] = useState<Parametros>(initial);
  const [base, setBase] = useState<Parametros>(initial);
  const [guardando, startTransition] = useTransition();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const cambios = JSON.stringify(p) !== JSON.stringify(base);

  const set = <K extends keyof Parametros>(k: K, v: Parametros[K]) => setP((x) => ({ ...x, [k]: v }));
  const setHora = (c: (typeof CINCO)[number] | 'C6', lado: 'min' | 'max', v: number) =>
    setP((x) => ({ ...x, horasPorClase: { ...x.horasPorClase, [c]: { ...x.horasPorClase[c], [lado]: v } } }));

  function guardar() {
    setAviso(null);
    startTransition(async () => {
      const r = await saveParametrosAction(p);
      if (r.ok) {
        setP(r.guardado);
        setBase(r.guardado);
        setAviso({ ok: true, texto: 'Parámetros guardados' });
      } else {
        setAviso({ ok: false, texto: r.error });
      }
    });
  }

  const montoInput = (k: Monto, id: string) => (
    <input
      id={id}
      type="number"
      min={0}
      step={1000}
      inputMode="numeric"
      placeholder="Vacío = derivar"
      value={p[k] ?? ''}
      onChange={(e) => set(k, e.target.value === '' ? null : Math.round(Number(e.target.value)))}
      className={inputCls}
    />
  );

  return (
    <Card
      id="parametros"
      title="Parámetros comerciales"
      desc="Tarifas de referencia y umbrales del agente (spec v5.1 §16.5). Se copian en cada estimado."
      aside={
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || !cambios}
          className="px-4 py-1.5 rounded-lg bg-inverse-surface text-white text-xs font-bold hover:bg-[#1e2f63] disabled:opacity-60 transition-colors flex items-center gap-1.5"
        >
          <Save size={13} /> {guardando ? 'Guardando…' : 'Guardar parámetros'}
        </button>
      }
    >
      <div className="space-y-5">
        {aviso && (
          <div className={cn('flex items-start gap-2 px-3.5 py-2.5 rounded-xl text-sm', aviso.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
            {aviso.ok ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
            {aviso.texto}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Versión de la lista de precios" htmlFor="price-list-version" hint="Obligatoria. Queda guardada en cada cotización.">
            <input
              id="price-list-version"
              value={p.PRICE_LIST_VERSION}
              maxLength={40}
              onChange={(e) => set('PRICE_LIST_VERSION', e.target.value)}
              className={inputCls}
            />
          </Campo>
          <div className="text-xs text-slate-500 self-end pb-2">
            {base.aprobadoPor && base.aprobadoEn
              ? <>Aprobado por <strong className="text-slate-700">{base.aprobadoPor}</strong> el {fecha(base.aprobadoEn)}</>
              : 'Valores de fábrica: nadie los ha aprobado todavía.'}
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-inverse-surface">Modelado 3D</legend>
          <Interruptor
            id="publicar-modelado"
            activo={p.publicarPrecioModelado}
            onCambio={(v) => set('publicarPrecioModelado', v)}
            titulo="Mostrar precio de modelado al cliente"
            nota="Apagado, el agente da la clase y las horas, y deriva a un asesor (D2)."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {MODELADO.map(([k, label, hint]) => (
              <Campo key={k} label={label} htmlFor={k} hint={hint}>{montoInput(k, k)}</Campo>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-sm text-sm">
              <caption className="text-left text-xs font-bold uppercase tracking-widest text-slate-400 pb-1.5">Horas guía por clase</caption>
              <thead>
                <tr className="text-xs text-slate-500 text-left">
                  <th className="py-1 pr-3 font-semibold">Clase</th>
                  <th className="py-1 pr-3 font-semibold">Mínimo (h)</th>
                  <th className="py-1 font-semibold">Máximo (h)</th>
                </tr>
              </thead>
              <tbody>
                {CINCO.map((c) => (
                  <tr key={c}>
                    <th scope="row" className="py-1 pr-3 text-left font-mono text-xs text-slate-600">{c}</th>
                    {(['min', 'max'] as const).map((lado) => (
                      <td key={lado} className="py-1 pr-3">
                        <label htmlFor={`horas-${c}-${lado}`} className="sr-only">{`${c} ${lado === 'min' ? 'mínimo' : 'máximo'}`}</label>
                        <input
                          id={`horas-${c}-${lado}`}
                          type="number"
                          min={0.05}
                          step={0.05}
                          value={p.horasPorClase[c][lado]}
                          onChange={(e) => setHora(c, lado, Number(e.target.value))}
                          className={inputCls}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="py-1 pr-3 text-left font-mono text-xs text-slate-600">C6</th>
                  <td className="py-1 pr-3">
                    <label htmlFor="horas-C6-min" className="sr-only">C6 mínimo</label>
                    <input
                      id="horas-C6-min"
                      type="number"
                      min={0.05}
                      step={0.5}
                      value={p.horasPorClase.C6.min}
                      onChange={(e) => setHora('C6', 'min', Number(e.target.value))}
                      className={inputCls}
                    />
                  </td>
                  <td className="py-1 text-xs text-slate-500">Sin máximo: revisión obligatoria</td>
                </tr>
              </tbody>
            </table>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-inverse-surface">Escaneo 3D</legend>
          <Interruptor
            id="publicar-escaneo"
            activo={p.publicarTarifasEscaneo}
            onCambio={(v) => set('publicarTarifasEscaneo', v)}
            titulo="Mostrar tarifas de escaneo al cliente"
            nota="Apagado, el agente no da cifras de escaneo y deriva (D3)."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {ESCANEO.map(([k, label]) => (
              <Campo key={k} label={label} htmlFor={k}>{montoInput(k, k)}</Campo>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-inverse-surface">Umbrales por referencia (unidades)</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {UMBRALES.map(([k, label, hint]) => (
              <Campo key={k} label={label} htmlFor={k} hint={hint}>
                <input
                  id={k}
                  type="number"
                  min={2}
                  step={1}
                  value={p[k]}
                  onChange={(e) => set(k, parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
              </Campo>
            ))}
          </div>
          <p className="text-xs text-slate-500">Deben cumplir Evaluar &lt; Volumen ≤ Prioridad industrial. No son descuentos.</p>
        </fieldset>
      </div>
    </Card>
  );
}

function Interruptor({ id, activo, onCambio, titulo, nota }: {
  id: string;
  activo: boolean;
  onCambio: (v: boolean) => void;
  titulo: string;
  nota: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={titulo}
        onClick={() => onCambio(!activo)}
        className={cn(
          'relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
          activo ? 'justify-end bg-primary' : 'justify-start bg-slate-300',
        )}
      >
        <span className="size-5 rounded-full bg-white shadow" />
      </button>
      <div className="min-w-0">
        <strong className="block text-sm text-inverse-surface">{titulo}</strong>
        <span className="text-xs text-slate-500">{nota}</span>
      </div>
    </div>
  );
}
