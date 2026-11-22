import { ShieldCheck } from 'lucide-react';
import Aura from '@/components/ia/Aura';
import IconoIA from '@/components/ia/IconoIA';
import TarjetaCamino from './TarjetaCamino';

/** "Asistente con IA": la tarjeta lleva borde degradado y aura (regla del aura, §5.1). */
export default function TarjetaAsistente() {
  return (
    <Aura className="flex">
      <TarjetaCamino
        variante="asistente"
        href="/cotizador/asistente"
        className="flex-1"
        encabezado={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="degradado-ia inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              <IconoIA size={14} />
              Asistente con IA
            </span>
            <span className="rounded-full bg-inverse-surface px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
              Nuevo
            </span>
          </div>
        }
        ilustracion={
          <div aria-hidden="true" className="flex h-46 flex-col justify-center gap-2.5 overflow-hidden rounded-2xl border border-ia-violeta/25 bg-white/75 p-4.5">
            <div className="max-w-[78%] self-end rounded-xl rounded-br-sm bg-inverse-surface px-3 py-2 text-sm leading-snug text-white">
              Necesito soportes para una repisa de baño
            </div>
            <div className="flex max-w-[92%] items-end gap-2">
              <span className="degradado-ia flex size-7 shrink-0 items-center justify-center rounded-full text-white">
                <IconoIA size={13} />
              </span>
              <div className="rounded-xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-sm leading-snug text-slate-700">
                Te recomiendo PETG: aguanta la humedad. ¿Quieres que te lo cotice?
              </div>
            </div>
          </div>
        }
        titulo={<h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">¿Solo tienes una idea? Cuéntasela al asistente</h2>}
        texto="Describe para qué es la pieza. Te recomienda material y tecnología, te da precios reales del cotizador y, si estás de acuerdo, lo agrega a tu carrito."
        ventajas={[
          'No necesitas archivo ni saber de materiales',
          'Precios del mismo sistema de cotización',
          'Si tu pieza lo requiere, te pasa con un asesor',
        ]}
        boton="Hablar con el asistente"
        botonIcono={<IconoIA size={18} />}
        pie={
          <span className="inline-flex items-center justify-center gap-1.5 text-sm text-slate-500">
            <ShieldCheck size={15} aria-hidden="true" />
            No te pedimos datos personales en el chat
          </span>
        }
      />
    </Aura>
  );
}
