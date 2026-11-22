'use client';

import { CircleAlert, FileCheck2, PencilRuler } from 'lucide-react';
import type { SalidaTool } from '@/lib/asistente/esquemas';
import { numero, pesos } from '@/lib/formato';
import Aviso from '../Aviso';
import { useAccionesChat } from '../AccionesChat';
import { BotonWhatsApp } from './TarjetaCotizacion';

type Salida = SalidaTool<'estimar_modelado'>;

const horas = (min: number, max: number | null) =>
  max == null ? `desde ${numero(min, 2)} h` : min === max ? `${numero(min, 2)} h` : `${numero(min, 2)}–${numero(max, 2)} h`;
const clase = (min: string, max: string) => (min === max ? min : `${min}–${max}`);

const MOTIVO: Record<Extract<Salida, { tipo: 'revision' }>['motivo'], string> = {
  critica: 'Es una pieza de uso crítico o de seguridad: la revisa un asesor técnico.',
  c6: 'Es un desarrollo especial (C6): se cotiza de forma personalizada.',
  tolerancia: 'Necesita tolerancias críticas: se valida antes de dar precio.',
  'sin-tarifa': 'El precio de diseño lo confirma un asesor.',
  'no-publicado': 'El precio de diseño lo confirma un asesor.',
};

/**
 * Tarjeta de estimar_modelado (design §5.2): clase C1–C6, horas y rango de
 * precio, siempre como «Estimado preliminar · por texto» (R5.10). Nunca se paga.
 */
export default function TarjetaModelado({ salida }: { salida: Salida }) {
  const { abrirWhatsApp } = useAccionesChat();

  if (salida.tipo === 'no-requiere') {
    return (
      <Aviso
        tono="info"
        icono={<FileCheck2 size={16} />}
        titulo="Tu archivo está listo: no hace falta diseño"
        texto="Con el STL podemos cotizar la impresión directamente, sin costo de modelado."
      />
    );
  }

  const cabecera = (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ia-niebla px-3 py-1 text-sm font-bold text-ia-tinta">
        <PencilRuler size={14} aria-hidden="true" />
        {clase(salida.claseMin, salida.claseMax)}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
        <CircleAlert size={14} aria-hidden="true" />
        Estimado preliminar · por texto
      </span>
      <span className="text-xs text-slate-500 sm:ml-auto">Diseño 3D · {salida.codigo}</span>
    </div>
  );

  return (
    <div className="flex max-w-2xl flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white px-5.5 py-5">
      {cabecera}
      <strong className="text-base">{salida.descripcion}</strong>

      <div className="grid grid-cols-2 gap-4 tabular-nums">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-500">Horas de diseño</span>
          <strong className="text-base">{horas(salida.horasMin, salida.horasMax)}</strong>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-500">Confianza</span>
          <strong className="text-base capitalize">{salida.confianza}</strong>
        </div>
      </div>

      {salida.tipo === 'estimado' && (
        <div className="flex flex-col gap-1">
          <strong className="text-2xl tabular-nums">
            {salida.min === salida.max ? pesos(salida.min) : `Entre ${pesos(salida.min)} y ${pesos(salida.max)}`}
          </strong>
          {salida.revisionRecomendada && (
            <span className="text-sm text-amber-800">Revisión técnica recomendada antes de confirmar precio y plazo.</span>
          )}
        </div>
      )}

      {salida.tipo === 'revision' && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <span className="flex-1 text-sm text-slate-700">
            <strong className="block text-inverse-surface">Lo cotiza un asesor</strong>
            {MOTIVO[salida.motivo]}
          </span>
          <BotonWhatsApp
            onClick={() => abrirWhatsApp(undefined, salida.motivo === 'critica' ? 'CRITICAL' : 'MODELING_REVIEW')}
            texto="Continuar en WhatsApp"
          />
        </div>
      )}

      {salida.tipo === 'en-propuesta' && (
        <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-700">{salida.mensaje}</span>
          <BotonWhatsApp onClick={() => abrirWhatsApp(undefined, 'VOLUME')} texto="Pedir la propuesta por WhatsApp" />
        </div>
      )}

      {salida.tipo !== 'en-propuesta' && salida.operaciones.length > 0 && (
        <span className="text-sm text-slate-600">Trabajo probable: {salida.operaciones.join(', ')}.</span>
      )}
      {salida.tipo !== 'en-propuesta' && salida.podriaCambiar.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-slate-200 pt-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-700">Puede cambiar si…</span>
          <ul className="list-disc space-y-0.5 pl-5">
            {salida.podriaCambiar.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      )}
      <p className="text-xs text-slate-500">
        {salida.tipo === 'en-propuesta' ? 'El diseño entra en la propuesta de producción.' : salida.noIncluye} No se paga en línea.
      </p>
    </div>
  );
}
