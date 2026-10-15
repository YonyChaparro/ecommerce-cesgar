'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, generateId, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import type {
  AgregadosPorCliente,
  ArchivoAdjunto,
  MensajeChat,
  ParteMensaje,
  SalidaTool,
} from '@/lib/asistente/esquemas';
import { enlaceAsesor, lineasDesdeConversacion } from '@/lib/asistente/mensaje-asesor';

const CLAVE_ID = 'cesgar-asistente-id';
const PATRON_ID = /^[A-Za-z0-9_-]{12,64}$/;

const nuevoId = () => `${generateId()}${generateId()}`.slice(0, 24);

function guardarId(id: string) {
  try { localStorage.setItem(CLAVE_ID, id); } catch {}
}

/**
 * La conversación en curso: el navegador guarda solo su id y, al recargar, pide
 * los mensajes a ChatSession (propuesta §8). "Nueva conversación" empieza otra.
 */
export function useSesionGuardada() {
  const [sesion, setSesion] = useState<{ id: string; iniciales: MensajeChat[] } | null>(null);

  useEffect(() => {
    let id: string | null = null;
    try { id = localStorage.getItem(CLAVE_ID); } catch {}
    const esNueva = !id || !PATRON_ID.test(id);
    const sesionId = esNueva ? nuevoId() : id!;
    if (esNueva) guardarId(sesionId);

    let cancelado = false;
    const cargar: Promise<{ mensajes?: MensajeChat[] }> = esNueva
      ? Promise.resolve({ mensajes: [] })
      : fetch(`/api/cotizador/chat?id=${encodeURIComponent(sesionId)}`)
          .then((r) => (r.ok ? r.json() : { mensajes: [] }))
          .catch(() => ({ mensajes: [] }));
    cargar.then((d) => {
      if (!cancelado) setSesion({ id: sesionId, iniciales: d.mensajes ?? [] });
    });
    return () => { cancelado = true; };
  }, []);

  const nueva = useCallback(() => {
    const id = nuevoId();
    guardarId(id);
    setSesion({ id, iniciales: [] });
  }, []);

  return { sesion, nueva };
}

export type ErrorChat = 'limite' | 'tope' | 'largo' | 'apagado' | 'fallo';

// El transporte entrega el cuerpo de la respuesta de error como `message`; los
// endpoints responden { codigo } (app/api/cotizador/chat/route.ts).
function clasificarError(error: Error | undefined): ErrorChat | null {
  if (!error) return null;
  try {
    const { codigo } = JSON.parse(error.message) as { codigo?: string };
    if (codigo === 'limite') return 'limite';
    if (codigo === 'tope-turnos') return 'tope';
    if (codigo === 'mensaje-largo') return 'largo';
    if (codigo === 'apagado') return 'apagado';
  } catch {}
  return 'fallo';
}

type Evento = 'carrito' | 'derivado';

export function useAsistente({ id, iniciales, maxTurnos }: {
  id: string;
  iniciales: MensajeChat[];
  maxTurnos: number;
}) {
  // Productos agregados con el "+": viajan en el siguiente mensaje del cliente.
  const agregados = useRef<AgregadosPorCliente['productos']>([]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<MensajeChat>({
        api: '/api/cotizador/chat',
        // La conversación vive en el servidor: solo viaja el último mensaje.
        prepareSendMessagesRequest: ({ id: chatId, messages }) => ({
          body: { id: chatId, mensaje: messages.at(-1) },
        }),
      }),
    [],
  );

  const chat = useChat<MensajeChat>({
    id,
    messages: iniciales,
    transport,
    // Cuando el cliente responde la tarjeta de confirmación, el agente sigue solo.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });
  const { messages, sendMessage, regenerate, addToolOutput, status, error, clearError } = chat;

  const turnosUsados = messages.filter((m) => m.role === 'user').length;
  const turnosRestantes = Math.max(0, maxTurnos - turnosUsados);

  const evento = useCallback((tipo: Evento) => {
    const body = JSON.stringify({ id, tipo });
    // keepalive: el aviso llega aunque el cliente se vaya a WhatsApp.
    fetch('/api/cotizador/eventos', { method: 'POST', body, keepalive: true }).catch(() => {});
  }, [id]);

  const enviar = useCallback((texto: string, adjunto?: ArchivoAdjunto) => {
    const partes: ParteMensaje[] = [];
    if (agregados.current.length > 0) {
      partes.push({ type: 'data-agregados', data: { productos: agregados.current } });
      agregados.current = [];
    }
    if (adjunto) partes.push({ type: 'data-archivo', data: adjunto });
    if (texto.trim()) partes.push({ type: 'text', text: texto.trim() });
    if (partes.length === 0) return;
    clearError();
    void sendMessage({ parts: partes });
  }, [sendMessage, clearError]);

  const reintentar = useCallback(() => {
    clearError();
    void regenerate();
  }, [regenerate, clearError]);

  const responderConfirmacion = useCallback(
    (toolCallId: string, salida: SalidaTool<'agregar_al_carrito'>) => {
      void addToolOutput({ tool: 'agregar_al_carrito', toolCallId, output: salida });
    },
    [addToolOutput],
  );

  const anotarAgregado = useCallback((nombre: string) => {
    const previo = agregados.current.find((p) => p.nombre === nombre);
    if (previo) previo.cantidad++;
    else agregados.current.push({ nombre, cantidad: 1 });
  }, []);

  /** "Hablar con una persona": WhatsApp directo, sin pasar por el modelo (§10.3). */
  const abrirWhatsApp = useCallback((enlace?: string) => {
    const destino = enlace ?? enlaceAsesor(lineasDesdeConversacion(messages)).enlace;
    window.open(destino, '_blank', 'noopener,noreferrer');
    evento('derivado');
  }, [messages, evento]);

  return {
    mensajes: messages,
    estado: status,
    error: clasificarError(error),
    turnosRestantes,
    bloqueado: turnosRestantes === 0,
    enviar,
    reintentar,
    responderConfirmacion,
    anotarAgregado,
    abrirWhatsApp,
    evento,
  };
}
