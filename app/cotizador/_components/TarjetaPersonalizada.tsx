import { MessageSquarePlus } from 'lucide-react';
import TarjetaCamino from './TarjetaCamino';

/** "No tengo modelo": reemplaza al asistente cuando está apagado. Sin aura. */
export default function TarjetaPersonalizada() {
  return (
    <TarjetaCamino
      variante="personalizada"
      href="/cotizador/modelo#cotizacion-personalizada"
      ilustracion={
        <div className="flex h-46 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-primary">
          <MessageSquarePlus size={48} aria-hidden="true" />
        </div>
      }
      titulo={
        <>
          <span className="text-sm font-bold uppercase tracking-widest text-primary">No tengo modelo</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">Te ayudamos con una cotización personalizada</h2>
        </>
      }
      texto="Cuéntanos qué necesitas y adjunta fotos o referencias. Te respondemos con una propuesta a tu medida."
      boton="Solicitar cotización"
    />
  );
}
