'use client';

import { ScanLine } from 'lucide-react';
import type { SalidaTool } from '@/lib/asistente/esquemas';
import { pesos } from '@/lib/formato';
import Aviso from '../Aviso';
import { useAccionesChat } from '../AccionesChat';
import { BotonWhatsApp } from './TarjetaCotizacion';

/** Tarjeta de consultar_escaneo (design §5.3): tarifas «desde», nunca un precio. */
export default function TarjetaEscaneo({ salida }: { salida: SalidaTool<'consultar_escaneo'> }) {
  const { abrirWhatsApp } = useAccionesChat();

  if (salida.tipo === 'no-disponible') {
    return (
      <Aviso
        tono="info"
        icono={<ScanLine size={16} />}
        titulo="El escaneo lo cotiza un asesor"
        texto={`Depende del tamaño, la superficie y el acceso al objeto. ${salida.aclaracion}`}
        accion={<BotonWhatsApp onClick={() => abrirWhatsApp(undefined, 'SCAN')} texto="Continuar en WhatsApp" />}
      />
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white px-5.5 py-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ia-niebla px-3 py-1 text-sm font-bold text-ia-tinta">
          <ScanLine size={14} aria-hidden="true" />
          Escaneo 3D
        </span>
        <span className="text-xs font-bold text-amber-800">Tarifas de referencia · confirmar con un asesor</span>
      </div>
      <ul className="divide-y divide-slate-200">
        {salida.filas.map((f) => (
          <li key={f.servicio} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
            <span className="flex min-w-0 flex-1 basis-52 flex-col">
              <strong className="text-sm">{f.servicio}</strong>
              <span className="text-xs text-slate-500">{f.condicion}</span>
            </span>
            <span className="text-sm tabular-nums">desde <strong className="text-base">{pesos(f.desde)}</strong></span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">{salida.aclaracion} Las tarifas «desde» no son un precio fijo. No incluye impuestos.</p>
    </div>
  );
}
