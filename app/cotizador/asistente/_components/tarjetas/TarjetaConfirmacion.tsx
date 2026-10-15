'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/app/components/CartContext';
import type { MensajeChat, SalidaTool } from '@/lib/asistente/esquemas';
import { useItemVigente } from '../../_hooks/useItemVigente';
import { useAccionesChat } from '../AccionesChat';
import VistaConfirmacion, { type EstadoConfirmacion } from './VistaConfirmacion';

type ParteCarrito = Extract<MensajeChat['parts'][number], { type: 'tool-agregar_al_carrito' }>;

/**
 * La única tarjeta que usa la red y la única que le devuelve un resultado al
 * agente (propuesta §10.1). Pide el ítem vigente al servidor y solo agrega al
 * carrito si el cliente pulsa "Confirmar y agregar".
 */
export default function TarjetaConfirmacion({ parte, interactiva }: {
  parte: ParteCarrito;
  /** Es la propuesta del último mensaje y no hay una respuesta en curso. */
  interactiva: boolean;
}) {
  const { idConversacion, responderConfirmacion, evento, precioMostradoProducto } = useAccionesChat();
  const { items, addItem, updateQty, openCart } = useCart();
  const pendiente = parte.state === 'input-available';
  const entrada = parte.state === 'input-streaming' ? undefined : parte.input;

  const { vigente, fallo } = useItemVigente({
    idConversacion,
    entrada,
    precioMostrado: entrada?.productoId ? precioMostradoProducto(entrada.productoId) : undefined,
    activo: pendiente && interactiva,
  });

  // Sin stock o sin ítem no hay nada que confirmar: se le cuenta al agente para
  // que siga la conversación. Una sola vez por tarjeta.
  const respondido = useRef(false);
  useEffect(() => {
    if (!pendiente || !interactiva || respondido.current) return;
    let salida: SalidaTool<'agregar_al_carrito'> | null = null;
    if (vigente?.estado === 'sin-stock') salida = { resultado: 'sin-stock', detalle: `Quedan ${vigente.disponible}` };
    else if (vigente?.estado === 'no-disponible') salida = { resultado: 'no-disponible', detalle: vigente.detalle.slice(0, 200) };
    else if (fallo) salida = { resultado: 'no-disponible', detalle: 'No se pudo consultar el ítem' };
    if (salida) {
      respondido.current = true;
      responderConfirmacion(parte.toolCallId, salida);
    }
  }, [pendiente, interactiva, vigente, fallo, parte.toolCallId, responderConfirmacion]);

  if (parte.state === 'input-streaming') return null;

  let e: EstadoConfirmacion;
  if (parte.state === 'output-available') {
    const o = parte.output;
    const datos = o.detalle && o.cantidad && o.total ? { titulo: o.detalle, cantidad: o.cantidad, total: o.total } : undefined;
    if (o.resultado === 'confirmado' && datos) e = { estado: 'confirmado', datos };
    else if (o.resultado === 'rechazado') e = { estado: 'rechazado', datos };
    else if (o.resultado === 'sin-stock') e = { estado: 'sin-stock', titulo: 'Ese producto', disponible: 0 };
    else e = { estado: 'no-disponible', detalle: o.detalle ?? 'No se pudo agregar.' };
  } else if (parte.state !== 'input-available') {
    e = { estado: 'no-disponible', detalle: 'No se pudo preparar la confirmación.' };
  } else if (!interactiva) {
    e = { estado: 'sin-confirmar' };
  } else if (!vigente) {
    e = { estado: 'cargando' };
  } else if (vigente.estado === 'sin-stock' || vigente.estado === 'no-disponible') {
    e = vigente;
  } else {
    e = {
      estado: 'pendiente',
      datos: {
        titulo: vigente.titulo,
        detalle: vigente.detalle,
        cantidad: vigente.cantidad,
        precioUnitario: vigente.precioUnitario,
        total: vigente.total,
        pie: vigente.pie,
      },
      precioAnterior: vigente.estado === 'precio-cambiado' ? vigente.precioMostrado ?? undefined : undefined,
    };
  }

  const confirmar = () => {
    if (!vigente || (vigente.estado !== 'ok' && vigente.estado !== 'precio-cambiado') || respondido.current) return;
    respondido.current = true;
    if (vigente.reemplazaCantidad && items.some((i) => i.id === vigente.item.id)) updateQty(vigente.item.id, vigente.cantidad);
    else addItem({ ...vigente.item, chatSessionId: idConversacion }, vigente.cantidad);
    evento('carrito');
    responderConfirmacion(parte.toolCallId, {
      resultado: 'confirmado',
      cantidad: vigente.cantidad,
      total: vigente.total,
      detalle: vigente.titulo.slice(0, 200),
    });
  };

  const rechazar = () => {
    if (respondido.current) return;
    respondido.current = true;
    const d = vigente && 'titulo' in vigente && 'total' in vigente ? vigente : null;
    responderConfirmacion(parte.toolCallId, {
      resultado: 'rechazado',
      ...(d && { cantidad: d.cantidad, total: d.total, detalle: d.titulo.slice(0, 200) }),
    });
  };

  return <VistaConfirmacion e={e} onConfirmar={confirmar} onRechazar={rechazar} onVerCarrito={openCart} />;
}
