'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/app/components/CartContext';
import { numero, pesos } from '@/lib/formato';
import { cn } from '@/lib/utils';

/** "Carrito vacío" o "Carrito · 1 ítem · $43.932". Abre el CartDrawer. */
export default function PildoraCarrito() {
  const { totalItems, totalPrice, openCart } = useCart();
  const lleno = totalItems > 0;
  return (
    <button
      type="button"
      onClick={openCart}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold tabular-nums transition-colors',
        lleno ? 'border-inverse-surface bg-inverse-surface text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      )}
    >
      <ShoppingCart size={16} aria-hidden="true" />
      {lleno
        ? `Carrito · ${numero(totalItems)} ${totalItems === 1 ? 'ítem' : 'ítems'} · ${pesos(totalPrice)}`
        : 'Carrito vacío'}
    </button>
  );
}
