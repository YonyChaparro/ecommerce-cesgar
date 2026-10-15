// Respuesta de /api/cotizador/carrito: lo que la tarjeta de confirmación
// muestra y lo que se agrega al carrito si el cliente confirma.

import type { CartItem } from '@/app/components/CartContext';

export type ItemVigente =
  | {
      estado: 'ok' | 'precio-cambiado';
      item: Omit<CartItem, 'quantity'>;
      cantidad: number;
      precioUnitario: number;
      total: number;
      /** El precio unitario que se le mostró al cliente para esa cantidad, si se conoce. */
      precioMostrado: number | null;
      titulo: string;
      detalle: string;
      pie: string;
      /**
       * Una impresión que ya está en el carrito cambia de cantidad con updateQty,
       * que vuelve a tarifar: addItem sumaría sin mover el tramo de descuento.
       */
      reemplazaCantidad: boolean;
    }
  | { estado: 'sin-stock'; titulo: string; disponible: number }
  | { estado: 'no-disponible'; detalle: string };
