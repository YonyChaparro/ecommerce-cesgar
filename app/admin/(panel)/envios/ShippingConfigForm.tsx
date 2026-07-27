'use client';
import { useState, useTransition } from 'react';
import { Save, RotateCcw, CheckCircle, AlertCircle, Plus, Trash2, Truck } from 'lucide-react';
import type { ShippingConfig, ZonaEnvio } from '@/lib/shipping-types';
import { DEFAULT_SHIPPING_CONFIG } from '@/lib/shipping-types';
import { COLOMBIA } from '@/app/data/colombia';
import { saveShippingConfigAction } from './actions';

const inputCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4dbdcc] focus:border-transparent transition-shadow';

function Card({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-[#f8fafc] flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h2>
        {aside}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Campo({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function ShippingConfigForm({ initial }: { initial: ShippingConfig }) {
  const [config, setConfig] = useState<ShippingConfig>(initial);
  const [guardando, startTransition] = useTransition();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const set = <K extends keyof ShippingConfig>(k: K, v: ShippingConfig[K]) =>
    setConfig((c) => ({ ...c, [k]: v }));

  const setZona = (i: number, cambio: Partial<ZonaEnvio>) =>
    setConfig((c) => ({ ...c, zonas: c.zonas.map((z, j) => (j === i ? { ...z, ...cambio } : z)) }));

  const addZona = () =>
    setConfig((c) => ({
      ...c,
      zonas: [...c.zonas, {
        id: `zona-${Date.now()}`, nombre: 'Nueva zona', costo: 0, departamentos: [], diasEntrega: '',
      }],
    }));

  const delZona = (i: number) =>
    setConfig((c) => ({ ...c, zonas: c.zonas.filter((_, j) => j !== i) }));

  // Departamentos que ya están en otra zona: se marcan para que no se repitan,
  // porque la primera coincidencia gana y la segunda quedaría muerta.
  const asignados = new Map<string, string>();
  config.zonas.forEach((z) => z.departamentos.forEach((d) => {
    if (!asignados.has(d)) asignados.set(d, z.nombre);
  }));

  function guardar() {
    setAviso(null);
    startTransition(async () => {
      const r = await saveShippingConfigAction(config);
      setAviso(r.ok
        ? { ok: true, texto: 'Tarifas guardadas' }
        : { ok: false, texto: r.error ?? 'No se pudo guardar' });
    });
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline font-bold text-2xl text-inverse-surface flex items-center gap-2">
            <Truck size={20} /> Envíos
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Lo que el cliente paga por envío en el checkout, según su destino.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setConfig(DEFAULT_SHIPPING_CONFIG)}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={14} /> Restablecer
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="px-5 py-2 rounded-lg bg-[#16234d] text-white text-sm font-bold hover:bg-[#1e2f63] disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            <Save size={14} /> {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      {aviso && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
          aviso.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
        }`}>
          {aviso.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {aviso.texto}
        </div>
      )}

      <Card
        title="Estado"
        aside={
          <button
            onClick={() => set('habilitado', !config.habilitado)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              config.habilitado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {config.habilitado ? 'Cobrando envío' : 'Apagado'}
          </button>
        }
      >
        <p className="text-sm text-slate-500">
          {config.habilitado
            ? 'El checkout calcula y cobra el envío según las zonas de abajo.'
            : 'El checkout muestra “A confirmar” y no cobra envío. Revisa las tarifas antes de encender.'}
        </p>
      </Card>

      <Card title="Zonas y tarifas">
        <div className="space-y-4">
          {config.zonas.map((z, i) => (
            <div key={z.id} className="border border-slate-100 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Campo label="Nombre">
                  <input className={inputCls} value={z.nombre}
                    onChange={(e) => setZona(i, { nombre: e.target.value })} />
                </Campo>
                <Campo label="Costo (COP)">
                  <input type="number" min={0} className={inputCls} value={z.costo}
                    onChange={(e) => setZona(i, { costo: parseInt(e.target.value) || 0 })} />
                </Campo>
                <Campo label="Días de entrega">
                  <input className={inputCls} value={z.diasEntrega ?? ''} placeholder="2–4 días hábiles"
                    onChange={(e) => setZona(i, { diasEntrega: e.target.value })} />
                </Campo>
              </div>

              <Campo label="Departamentos" hint="Marca los que cubre esta zona. Un departamento en dos zonas se cobra con la primera.">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 max-h-56 overflow-y-auto border border-slate-100 rounded-lg p-3">
                  {COLOMBIA.map((d) => {
                    const puesto = z.departamentos.includes(d.name);
                    const enOtra = !puesto && asignados.has(d.name);
                    return (
                      <label key={d.name} className={`flex items-center gap-2 text-sm ${enOtra ? 'text-slate-300' : 'text-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={puesto}
                          onChange={(e) => setZona(i, {
                            departamentos: e.target.checked
                              ? [...z.departamentos, d.name]
                              : z.departamentos.filter((x) => x !== d.name),
                          })}
                        />
                        <span className="truncate" title={enOtra ? `Ya está en ${asignados.get(d.name)}` : d.name}>
                          {d.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Campo>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{z.departamentos.length} departamentos</span>
                <button onClick={() => delZona(i)}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                  <Trash2 size={12} /> Eliminar zona
                </button>
              </div>
            </div>
          ))}

          <button onClick={addZona}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            <Plus size={14} /> Añadir zona
          </button>
        </div>
      </Card>

      <Card title="Reglas generales">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Campo label="Resto del país" hint="Destinos que no caen en ninguna zona.">
            <input type="number" min={0} className={inputCls} value={config.costoPorDefecto}
              onChange={(e) => set('costoPorDefecto', parseInt(e.target.value) || 0)} />
          </Campo>
          <Campo label="Envío gratis desde" hint="0 = nunca. Se compara con el subtotal.">
            <input type="number" min={0} className={inputCls} value={config.envioGratisDesde}
              onChange={(e) => set('envioGratisDesde', parseInt(e.target.value) || 0)} />
          </Campo>
          <Campo label="Costo máximo" hint="Tope de seguridad; ningún envío cobra más.">
            <input type="number" min={0} className={inputCls} value={config.costoMaximo}
              onChange={(e) => set('costoMaximo', parseInt(e.target.value) || 0)} />
          </Campo>
        </div>
      </Card>

      <Card
        title="Recoger en punto"
        aside={
          <button
            onClick={() => set('recogida', { ...config.recogida, habilitada: !config.recogida.habilitada })}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              config.recogida.habilitada ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {config.recogida.habilitada ? 'Disponible' : 'No disponible'}
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Etiqueta">
            <input className={inputCls} value={config.recogida.etiqueta}
              onChange={(e) => set('recogida', { ...config.recogida, etiqueta: e.target.value })} />
          </Campo>
          <Campo label="Dirección del punto" hint="Se le muestra al cliente al elegir recogida.">
            <input className={inputCls} value={config.recogida.direccion} placeholder="Calle 00 # 00-00, Bogotá"
              onChange={(e) => set('recogida', { ...config.recogida, direccion: e.target.value })} />
          </Campo>
        </div>
      </Card>

      <Card title="Cómo viaja a MercadoPago">
        <div className="flex flex-col sm:flex-row gap-3">
          {([
            { v: 'shipments' as const, t: 'Campo de envío (recomendado)', d: 'MP lo muestra aparte de los productos' },
            { v: 'item' as const,      t: 'Como un producto más',          d: 'Aparece como una línea en el carrito de MP' },
          ]).map((op) => (
            <button key={op.v} onClick={() => set('modoPasarela', op.v)}
              className={`flex-1 text-left px-4 py-3 rounded-xl border transition-all ${
                config.modoPasarela === op.v
                  ? 'border-[#4dbdcc] bg-[#4dbdcc]/5 ring-2 ring-[#4dbdcc]/30'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
              <span className="block text-sm font-bold text-inverse-surface">{op.t}</span>
              <span className="block text-xs text-slate-400 mt-0.5">{op.d}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          El monto cobrado es el mismo en los dos casos. Cambia solo cómo se ve en la pantalla de pago.
        </p>
      </Card>
    </div>
  );
}
