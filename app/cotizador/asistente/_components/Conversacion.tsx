'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Info, RotateCcw, XCircle } from 'lucide-react';
import type { MensajeChat } from '@/lib/asistente/esquemas';
import type { ErrorChat } from '../_hooks/useAsistente';
import { useSeguirConversacion } from '../_hooks/useSeguirConversacion';
import Aviso from './Aviso';
import Escribiendo from './Escribiendo';
import MensajeAsistente from './MensajeAsistente';
import MensajeCliente from './MensajeCliente';
import PieChat from './PieChat';

const tieneContenido = (m: MensajeChat) =>
  m.parts.some((p) => (p.type === 'text' && p.text.trim()) || p.type.startsWith('tool-'));

/** Mensajes, avisos de tope y caja de texto fija abajo (vistas 3 a 5). */
export default function Conversacion({ mensajes, estado, error, turnosRestantes, bloqueado, caja, onReintentar, onNueva, onAsesor }: {
  mensajes: MensajeChat[];
  estado: 'submitted' | 'streaming' | 'ready' | 'error';
  error: ErrorChat | null;
  turnosRestantes: number;
  bloqueado: boolean;
  caja: React.ReactNode;
  onReintentar: () => void;
  onNueva: () => void;
  onAsesor: () => void;
}) {
  const lista = useRef<HTMLDivElement>(null);
  const final = useRef<HTMLDivElement>(null);
  const respondiendo = estado === 'submitted' || estado === 'streaming';
  const ultimo = mensajes.at(-1);
  const escribiendo = respondiendo && (ultimo?.role === 'user' || (ultimo && !tieneContenido(ultimo)));

  useSeguirConversacion(lista, final, mensajes.filter((m) => m.role === 'user').length);

  return (
    <>
      <div ref={lista} aria-live="polite" className="flex flex-col gap-8 py-8">
        {mensajes.map((m, i) => {
          if (m.role === 'user') return <MensajeCliente key={m.id} mensaje={m} />;
          if (!tieneContenido(m)) return null;
          const esUltimo = i === mensajes.length - 1;
          return (
            <MensajeAsistente
              key={m.id}
              mensaje={m}
              respondiendo={respondiendo && esUltimo}
              interactivo={esUltimo && !respondiendo}
            />
          );
        })}
        {escribiendo && <Escribiendo />}
        {error && <AvisoError error={error} onReintentar={onReintentar} />}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-3 bg-white/95 px-4 pb-4 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
        {!bloqueado && turnosRestantes <= 3 && (
          <p className="inline-flex items-center gap-1.5 self-center text-sm text-slate-600">
            <Info size={15} aria-hidden="true" />
            {turnosRestantes === 1 ? 'Te queda 1 mensaje en esta conversación.' : `Te quedan ${turnosRestantes} mensajes en esta conversación.`}
          </p>
        )}
        {bloqueado || error === 'tope' ? <TopeAlcanzado onNueva={onNueva} onAsesor={onAsesor} /> : caja}
        <PieChat variante="conversacion" />
      </div>
      {/* El final de la zona del chat: lo que se lleva al borde inferior de la ventana. */}
      <div ref={final} aria-hidden="true" />
    </>
  );
}

export function AvisoError({ error, onReintentar }: { error: ErrorChat; onReintentar: () => void }) {
  const reintentar = (
    <button type="button" onClick={onReintentar} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
      <RotateCcw size={14} aria-hidden="true" /> Reintentar
    </button>
  );
  if (error === 'tope') return null;
  if (error === 'limite') {
    return <Aviso tono="advertencia" titulo="Un momento" texto="Estás enviando mensajes muy rápido. Espera un momento e inténtalo de nuevo." accion={reintentar} />;
  }
  if (error === 'largo') return <Aviso tono="advertencia" titulo="Acorta tu mensaje para enviarlo." />;
  if (error === 'apagado') {
    return (
      <Aviso
        tono="info"
        titulo="El asistente no está disponible ahora"
        texto="Puedes cotizar con tu archivo o pedir una cotización personalizada."
        accion={<Link href="/cotizador" className="text-sm font-bold text-primary hover:underline">Ir al cotizador</Link>}
      />
    );
  }
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
      <XCircle size={18} className="text-red-700" aria-hidden="true" />
      <span className="text-slate-700">No pude responder esta vez.</span>
      <span className="ml-auto">{reintentar}</span>
    </div>
  );
}

export function TopeAlcanzado({ onNueva, onAsesor }: { onNueva: () => void; onAsesor: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <strong>Llegaste al máximo de mensajes de esta conversación</strong>
      <span className="text-sm text-slate-600">Tus cotizaciones siguen disponibles arriba. Puedes empezar otra o seguir con un asesor.</span>
      <div className="mt-1.5 flex flex-wrap gap-2.5">
        <button type="button" onClick={onAsesor} className="boton-ia inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold text-white">
          Hablar con un asesor
        </button>
        <button type="button" onClick={onNueva} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Empezar otra
        </button>
      </div>
    </div>
  );
}
