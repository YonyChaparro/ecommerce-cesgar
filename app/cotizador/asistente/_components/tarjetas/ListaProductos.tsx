'use client';

import { useState } from 'react';
import { Check, ImageOff, Plus } from 'lucide-react';
import { useCart } from '@/app/components/CartContext';
import type { SalidaTool } from '@/lib/asistente/esquemas';
import { pesos } from '@/lib/formato';
import { useAccionesChat } from '../AccionesChat';

type Producto = SalidaTool<'buscar_productos'>['productos'][number];

/**
 * Lista de buscar_productos (vista 4). El "+" es una acción del propio cliente,
 * como AddToCartButton: agrega una unidad sin tarjeta de confirmación (§10.2).
 */
export default function ListaProductos({ salida }: { salida: SalidaTool<'buscar_productos'> }) {
  if (salida.productos.length === 0) {
    return <p className="text-sm text-slate-500">No encontré productos en stock con esa búsqueda.</p>;
  }
  return (
    <ul className="flex max-w-2xl flex-col gap-2.5">
      {salida.productos.map((p) => <FilaProducto key={p.id} producto={p} />)}
    </ul>
  );
}

function FilaProducto({ producto: p }: { producto: Producto }) {
  const { addItem } = useCart();
  const { anotarAgregado, evento, idConversacion } = useAccionesChat();
  const [agregado, setAgregado] = useState(false);

  const agregar = () => {
    addItem({ id: p.id, slug: p.slug, name: p.nombre, price: p.precio, img: p.imagen, alt: null, category: p.categoria, chatSessionId: idConversacion }, 1);
    anotarAgregado(p.nombre);
    evento('carrito');
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  };

  return (
    <li className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50" aria-label="Foto del producto">
        {p.imagen
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={p.imagen} alt="" className="size-full object-contain p-1" />
          : <ImageOff size={20} className="text-slate-300" aria-hidden="true" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <a href={`/tienda/${p.slug}`} target="_blank" rel="noopener" className="line-clamp-2 text-sm font-bold text-inverse-surface hover:underline">
          {p.nombre}
        </a>
        <div className="flex items-center gap-2.5 text-sm">
          <strong className="tabular-nums">{pesos(p.precio)}</strong>
          <span className="text-xs font-semibold text-primary">En stock</span>
        </div>
      </div>
      <button
        type="button"
        onClick={agregar}
        aria-label={`Agregar ${p.nombre} al carrito`}
        className="boton-ia flex size-11 shrink-0 items-center justify-center rounded-full text-white"
      >
        {agregado ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
      </button>
    </li>
  );
}
