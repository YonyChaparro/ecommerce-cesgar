'use client';

import { useEffect, useState } from 'react';
import type { EntradaTool } from '@/lib/asistente/esquemas';
import type { ItemVigente } from '@/lib/asistente/item-vigente';

/**
 * Pide al servidor el ítem vigente para la tarjeta de confirmación (§10.1). Lo
 * que la tarjeta muestra sale de aquí, nunca del texto del modelo.
 */
export function useItemVigente({ idConversacion, entrada, precioMostrado, activo }: {
  idConversacion: string;
  entrada: EntradaTool<'agregar_al_carrito'> | undefined;
  precioMostrado?: number;
  activo: boolean;
}) {
  const [vigente, setVigente] = useState<ItemVigente | null>(null);
  const [fallo, setFallo] = useState(false);
  const clave = entrada ? `${entrada.codigo ?? ''}|${entrada.productoId ?? ''}|${entrada.cantidad}` : '';

  useEffect(() => {
    if (!activo || !entrada) return;
    let cancelado = false;
    setFallo(false);
    fetch('/api/cotizador/carrito', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idConversacion, ...entrada, precioMostrado }),
    })
      .then(async (r) => {
        const datos = (await r.json().catch(() => null)) as ItemVigente | null;
        if (cancelado) return;
        if (datos && 'estado' in datos) setVigente(datos);
        else setFallo(true);
      })
      .catch(() => { if (!cancelado) setFallo(true); });
    return () => { cancelado = true; };
    // `clave` resume la entrada: no se vuelve a pedir en cada render del stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, clave, idConversacion, precioMostrado]);

  return { vigente, fallo };
}
