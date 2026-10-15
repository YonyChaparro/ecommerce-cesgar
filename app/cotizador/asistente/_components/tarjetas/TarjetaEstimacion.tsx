'use client';

import { CircleAlert, Upload } from 'lucide-react';
import type { SalidaTool } from '@/lib/asistente/esquemas';
import { numero, pesos } from '@/lib/formato';
import Aviso from '../Aviso';
import { useAccionesChat } from '../AccionesChat';

/** Tarjeta de estimar_rango (vista 4): orientativa, sin botón de carrito. */
export default function TarjetaEstimacion({ salida }: { salida: SalidaTool<'estimar_rango'> }) {
  const { adjuntar, abrirWhatsApp } = useAccionesChat();

  if (salida.tipo === 'grande') {
    return (
      <Aviso
        tono="advertencia"
        titulo="Mide más de 30 cm"
        texto={`${salida.descripcion}: su lado más largo mide ${numero(salida.ladoMayorCm, 1)} cm. Un asesor puede revisar si se imprime por partes.`}
        accion={<button type="button" onClick={() => abrirWhatsApp()} className="text-sm font-bold text-primary hover:underline">Hablar con un asesor</button>}
      />
    );
  }

  const m = salida.medidasCm;
  return (
    <div className="flex max-w-2xl flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white px-5.5 py-5">
      <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
        <CircleAlert size={14} aria-hidden="true" />
        Estimación · no se puede pagar
      </span>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <strong className="text-2xl tabular-nums">Entre {pesos(salida.min)} y {pesos(salida.max)}</strong>
        <span className="text-sm text-slate-600">por unidad, en {salida.material}</span>
      </div>
      <span className="text-sm leading-relaxed text-slate-600">
        Caja de {numero(m.x, 1)} × {numero(m.y, 1)} × {numero(m.z, 1)} cm ({numero(salida.cajaCm3, 1)} cm³) · {salida.tecnologia} ·{' '}
        {salida.material} · capa {salida.capa} · relleno {salida.relleno}. Supone que la pieza ocupa entre el{' '}
        {numero(salida.ocupacionMinPct)} % y el {numero(salida.ocupacionMaxPct)} % de esa caja.
      </span>
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3.5">
        <span className="flex-1 text-sm text-slate-700">Para el precio exacto y poder comprar, necesitamos el archivo STL.</span>
        <button
          type="button"
          onClick={adjuntar}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Upload size={16} aria-hidden="true" />
          Subir STL
        </button>
      </div>
    </div>
  );
}
