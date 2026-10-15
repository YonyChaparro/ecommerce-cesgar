'use client';

import { useState } from 'react';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import Aura from '@/components/ia/Aura';
import type { SalidaTool } from '@/lib/asistente/esquemas';
import { useAccionesChat } from '../AccionesChat';

/**
 * Tarjeta de derivar_a_asesor (vista 4): WhatsApp con el mensaje ya escrito; el
 * cliente decide si lo envía. Lleva aura mientras espera su decisión.
 */
export default function TarjetaAsesor({ salida }: { salida: SalidaTool<'derivar_a_asesor'> }) {
  const { abrirWhatsApp } = useAccionesChat();
  const [decidido, setDecidido] = useState(false);

  return (
    <Aura activa={!decidido} className="max-w-2xl">
      <div className="flex flex-col gap-4 rounded-3xl border-2 border-ia-violeta bg-white p-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ia-tinta">Habla con un asesor</span>
          <span className="text-sm text-slate-600">Te abrimos WhatsApp con este mensaje. Tú decides si lo envías.</span>
        </div>
        <div className="whitespace-pre-line rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
          {salida.mensaje}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => { setDecidido(true); abrirWhatsApp(salida.enlace); }}
            className="boton-ia inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-base font-bold text-white"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Continuar en WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setDecidido(true)}
            className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-5.5 text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            Seguir en el chat
          </button>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck size={14} aria-hidden="true" />
          No te pedimos ningún dato para continuar.
        </p>
      </div>
    </Aura>
  );
}
