'use client';
import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { useCart, type CartItem } from './CartContext';

type Props = {
  product: Omit<CartItem, 'quantity'>;
  showQty?: boolean;
};

export default function AddToCartButton({ product, showQty = true }: Props) {
  const { addItem, openCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product, qty);
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className={`flex gap-4 ${showQty ? 'flex-col sm:flex-row' : ''} mb-10`}>
      {showQty && (
        <div className="flex items-center justify-between border-2 border-slate-200 rounded-xl px-4 py-3 bg-white w-full sm:w-32">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="text-slate-400 hover:text-inverse-surface transition-colors"
          >
            <Minus size={20} />
          </button>
          <span className="font-bold text-inverse-surface text-lg">{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="text-slate-400 hover:text-inverse-surface transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      <button
        onClick={handleAdd}
        className={`flex-1 py-4 rounded-xl font-headline font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${
          added
            ? 'bg-green-500 text-white'
            : 'bg-primary-container text-inverse-surface hover:bg-cyan-400 hover:shadow-lg'
        }`}
      >
        {added ? <Check size={20} /> : <ShoppingCart size={20} />}
        {added ? '¡Añadido!' : 'Añadir al carrito'}
      </button>
    </div>
  );
}
