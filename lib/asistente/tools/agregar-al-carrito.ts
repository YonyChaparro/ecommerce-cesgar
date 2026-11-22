import { tool } from 'ai';
import { esquemas } from '../esquemas';

/**
 * Sin `execute`: corre en el navegador. La tarjeta de confirmación pide el
 * ítem vigente al servidor y solo agrega si el cliente pulsa "Confirmar y
 * agregar" (propuesta §10.1). El resultado vuelve al agente en el siguiente paso.
 */
export function agregarAlCarrito() {
  return tool({
    description:
      'Propone agregar al carrito una cotización de archivo (código Q-) o un producto de la tienda (productoId), con una cantidad. ' +
      'El cliente ve una tarjeta y decide; nunca digas que algo quedó en el carrito antes de recibir el resultado "confirmado". ' +
      'Las estimaciones (E-) no se pueden agregar.',
    inputSchema: esquemas.agregar_al_carrito.entrada,
    outputSchema: esquemas.agregar_al_carrito.salida,
  });
}
