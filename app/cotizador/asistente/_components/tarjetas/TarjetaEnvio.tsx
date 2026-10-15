import { Truck } from 'lucide-react';
import type { SalidaTool } from '@/lib/asistente/esquemas';
import { numero, pesos } from '@/lib/formato';
import Aviso from '../Aviso';

/** Tarjeta de estimar_envio (fase 2): costo puesto en la ciudad del cliente. */
export default function TarjetaEnvio({ salida }: { salida: SalidaTool<'estimar_envio'> }) {
  if (salida.tipo === 'a-confirmar') {
    return (
      <Aviso
        tono="info"
        titulo={`Envío a ${salida.destino}`}
        texto="El costo del envío se confirma al finalizar la compra, con tu dirección."
      />
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <Truck size={17} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col">
          <strong className="text-base">Envío a {salida.destino}</strong>
          <span className="text-xs text-slate-500">{salida.etiqueta}</span>
        </div>
      </div>
      <dl className="flex flex-col gap-1.5 border-t border-slate-200 pt-3 text-sm tabular-nums">
        {salida.lineas.map((l, i) => (
          <div key={i} className="flex justify-between gap-3 text-slate-600">
            <dt className="truncate">{l.descripcion} × {numero(l.cantidad)}</dt>
            <dd>{pesos(l.total)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 text-slate-600">
          <dt>Envío</dt>
          <dd>{salida.gratisPorMonto || salida.costoEnvio === 0 ? 'Gratis' : pesos(salida.costoEnvio)}</dd>
        </div>
        {salida.lineas.length > 0 && (
          <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-bold">{pesos(salida.total)}</dd>
          </div>
        )}
      </dl>
      {salida.recogida && <p className="text-xs text-slate-500">También puedes recoger: {salida.recogida}.</p>}
      <p className="text-xs text-slate-500">El envío se vuelve a calcular al pagar, con tu dirección.</p>
    </div>
  );
}
