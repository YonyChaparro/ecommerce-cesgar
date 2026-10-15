'use client';
import { useState, useTransition } from 'react';
import { AlertCircle, CheckCircle, RotateCcw, Save } from 'lucide-react';
import type { AsistenteConfig } from '@/lib/asistente/tipos';
import type { Validaciones } from '@/lib/asistente/validaciones';
import { saveAsistenteConfigAction } from './actions';
import CabeceraAsistente from './_components/CabeceraAsistente';
import InterruptorActivo from './_components/InterruptorActivo';
import ListaRespaldos from './_components/ListaRespaldos';
import SelectorModelo from './_components/SelectorModelo';
import TablaValidacion from './_components/TablaValidacion';
import TopesConversacion from './_components/TopesConversacion';
import type { FilaModelo } from './_components/tipos';

export default function AsistenteConfigForm({ initial, modelos, validaciones, sinListaOpenRouter, hayKey }: {
  initial: AsistenteConfig;
  modelos: FilaModelo[];
  validaciones: Validaciones;
  sinListaOpenRouter: boolean;
  hayKey: boolean;
}) {
  const [config, setConfig] = useState<AsistenteConfig>(initial);
  const [guardando, startTransition] = useTransition();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const set = <K extends keyof AsistenteConfig>(k: K, v: AsistenteConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));
  const cambios = JSON.stringify(config) !== JSON.stringify(initial);
  const aprobados = modelos.filter((m) => m.validacion.estado === 'aprobado');

  function guardar() {
    setAviso(null);
    startTransition(async () => {
      const r = await saveAsistenteConfigAction(config);
      setAviso(r.ok ? { ok: true, texto: 'Configuración guardada' } : { ok: false, texto: r.error ?? 'No se pudo guardar' });
    });
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl space-y-5">
        <CabeceraAsistente
          pestana="configuracion"
          descripcion="Chat de /cotizador/asistente: modelo, respaldos y topes de uso."
          acciones={
            <>
              <button
                type="button"
                onClick={() => { setConfig(initial); setAviso(null); }}
                disabled={!cambios}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-white disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <RotateCcw size={14} /> Descartar
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={guardando || !cambios}
                className="px-5 py-2 rounded-lg bg-inverse-surface text-white text-sm font-bold hover:bg-[#1e2f63] disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                <Save size={14} /> {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </>
          }
        />

        {aviso && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${aviso.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {aviso.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {aviso.texto}
          </div>
        )}
        {!hayKey && (
          <Advertencia>
            Falta <code className="font-mono">OPENROUTER_API_KEY</code> en las variables del servidor: el asistente no se
            puede activar hasta que exista.
          </Advertencia>
        )}
        {aprobados.length === 0 && (
          <Advertencia>
            Ningún modelo aprobó <code className="font-mono">verify:agente</code> todavía. Corre{' '}
            <code className="font-mono">npm run verify:agente -- &lt;id de OpenRouter&gt;</code>, haz commit de{' '}
            <code className="font-mono">lib/asistente/validaciones.json</code> y despliega.
          </Advertencia>
        )}

        <InterruptorActivo activo={config.activo} onCambio={(v) => set('activo', v)} />

        <div className="grid gap-5 lg:grid-cols-2 items-start">
          <div className="space-y-5 min-w-0">
            <SelectorModelo
              modelos={modelos}
              seleccionado={config.modelo}
              sinLista={sinListaOpenRouter}
              onElegir={(id) => setConfig((c) => ({ ...c, modelo: id, respaldos: c.respaldos.filter((r) => r !== id) }))}
            />
            <ListaRespaldos
              respaldos={config.respaldos}
              principal={config.modelo}
              aprobados={aprobados}
              onCambio={(r) => set('respaldos', r)}
            />
          </div>
          <div className="space-y-5 min-w-0">
            <TopesConversacion
              maxTurnos={config.maxTurnos}
              maxCaracteres={config.maxCaracteresMensaje}
              onTurnos={(v) => set('maxTurnos', v)}
              onCaracteres={(v) => set('maxCaracteresMensaje', v)}
            />
            <TablaValidacion validaciones={validaciones} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Advertencia({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm bg-amber-50 text-amber-800">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
