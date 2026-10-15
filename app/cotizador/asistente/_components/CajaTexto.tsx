'use client';

import { useRef } from 'react';
import { ArrowUp, Paperclip } from 'lucide-react';
import Aura from '@/components/ia/Aura';
import { numero } from '@/lib/formato';
import { cn } from '@/lib/utils';

/**
 * Caja de texto del chat, en dos tamaños: la grande del inicio (vista 2) y la
 * compacta de la conversación (vista 3). Lleva borde degradado y aura suave.
 */
export default function CajaTexto({
  tamano,
  valor,
  onCambio,
  onEnviar,
  onAdjuntar,
  maxCaracteres,
  puedeEnviar,
  deshabilitada = false,
  adjunto,
  placeholder,
}: {
  tamano: 'grande' | 'compacta';
  valor: string;
  onCambio: (v: string) => void;
  onEnviar: () => void;
  onAdjuntar: () => void;
  maxCaracteres: number;
  /** Hay algo que mandar (texto o archivo listo) y nada en curso. */
  puedeEnviar: boolean;
  deshabilitada?: boolean;
  adjunto?: React.ReactNode;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const largo = valor.length;
  const excedido = largo > maxCaracteres;
  const grande = tamano === 'grande';
  // En la compacta el contador aparece al acercarse al tope, para no distraer.
  const mostrarContador = grande || largo > maxCaracteres * 0.8;
  const habilitado = puedeEnviar && !excedido && !deshabilitada;

  const enviar = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (habilitado) onEnviar();
  };

  return (
    <form onSubmit={enviar} className="w-full">
      <Aura variante={grande ? 'tarjeta' : 'suave'} activa={!deshabilitada} className="group">
        <div className={cn('borde-ia flex rounded-3xl', grande ? 'flex-col gap-2.5 p-4 pb-3.5' : 'flex-col gap-2 py-3 pl-4 pr-3')}>
          {adjunto}
          <label htmlFor="mensaje" className="sr-only">Escribe tu mensaje</label>
          <div className={cn('flex gap-2.5', grande ? 'flex-col' : 'items-end')}>
            <textarea
              ref={ref}
              id="mensaje"
              rows={grande ? 3 : 1}
              value={valor}
              disabled={deshabilitada}
              placeholder={placeholder}
              onChange={(e) => {
                onCambio(e.target.value);
                if (!grande && ref.current) {
                  ref.current.style.height = 'auto';
                  ref.current.style.height = `${Math.min(ref.current.scrollHeight, 160)}px`;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) enviar(e);
              }}
              className={cn(
                'w-full min-w-0 resize-none border-0 bg-transparent text-base leading-normal text-inverse-surface placeholder:text-slate-500 focus:outline-none disabled:opacity-60',
                grande ? 'px-1.5 py-1' : 'flex-1 py-2.5',
              )}
            />
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onAdjuntar}
                disabled={deshabilitada}
                aria-label={grande ? undefined : 'Adjuntar STL'}
                className={cn(
                  'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50',
                  grande ? 'px-3.5' : 'size-11',
                )}
              >
                <Paperclip size={17} aria-hidden="true" />
                {grande && 'Adjuntar STL'}
              </button>
              {mostrarContador && (
                <span className={cn('ml-auto text-xs tabular-nums', excedido ? 'font-bold text-red-700' : 'text-slate-500')}>
                  {numero(largo)} / {numero(maxCaracteres)}
                </span>
              )}
              <button
                type="submit"
                aria-label="Enviar mensaje"
                disabled={!habilitado}
                className={cn(
                  'boton-ia flex size-11 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40',
                  !mostrarContador && 'ml-auto',
                )}
              >
                <ArrowUp size={19} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </Aura>
      {excedido && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          Acorta tu mensaje para enviarlo. <strong className="tabular-nums">{numero(largo)} / {numero(maxCaracteres)}</strong>
        </p>
      )}
    </form>
  );
}
