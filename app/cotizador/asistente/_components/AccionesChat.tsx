'use client';

import { createContext, useContext } from 'react';
import type { SalidaTool } from '@/lib/asistente/esquemas';
import type { MotivoDerivacion } from '@/lib/asistente/resumen-asesor';

/**
 * Lo que las tarjetas disparan en el chat: la de estimación abre el selector de
 * archivos, la de asesor abre WhatsApp, la de confirmación responde al agente.
 * Van por contexto en vez de bajar callbacks por cuatro niveles de props.
 */
export interface AccionesChatValor {
  idConversacion: string;
  adjuntar: () => void;
  enviar: (texto: string) => void;
  /** Sin enlace, arma el resumen con la ficha y ese motivo (de fábrica, CUSTOMER_ASKED). */
  abrirWhatsApp: (enlace?: string, motivo?: MotivoDerivacion) => void;
  responderConfirmacion: (toolCallId: string, salida: SalidaTool<'agregar_al_carrito'>) => void;
  /** "+" de la lista de productos (§10.2): sin confirmación, es una acción del cliente. */
  anotarAgregado: (nombre: string) => void;
  evento: (tipo: 'carrito' | 'derivado') => void;
  /** Precio que mostró buscar_productos para ese producto, para avisar si cambió. */
  precioMostradoProducto: (productoId: string) => number | undefined;
}

const Contexto = createContext<AccionesChatValor | null>(null);

export function AccionesChatProvider({ valor, children }: { valor: AccionesChatValor; children: React.ReactNode }) {
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAccionesChat(): AccionesChatValor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useAccionesChat va dentro de <Chat>');
  return v;
}
