'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, LockKeyhole } from 'lucide-react';
import { useCart } from '@/app/components/CartContext';

export default function CarritoPage() {
  const { items, removeItem, updateQty, clearCart, totalPrice } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al procesar el pago');
        return;
      }

      clearCart();
      router.push(data.url);
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <ShoppingBag size={56} className="text-slate-200" />
        <p className="font-headline font-bold text-slate-400 text-lg">Tu carrito está vacío</p>
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 px-6 py-3 bg-inverse-surface text-white rounded-xl font-headline font-bold text-sm hover:bg-primary-container hover:text-inverse-surface transition-all"
        >
          <ArrowLeft size={16} />
          Ir a la tienda
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <Link href="/tienda" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-headline font-bold text-2xl text-inverse-surface">
            Carrito ({items.length} {items.length === 1 ? 'producto' : 'productos'})
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-slate-100"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-xl overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.img}
                    alt={item.alt || item.name}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    {item.category}
                  </span>
                  <h3 className="font-headline font-bold text-inverse-surface text-sm leading-tight line-clamp-2 mb-3">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-3 text-sm font-bold text-inverse-surface">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-inverse-surface">
                        $ {(item.price * item.quantity).toLocaleString('es-CO')}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-6">
              <h2 className="font-headline font-bold text-inverse-surface text-lg mb-4">
                Resumen
              </h2>

              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-slate-500">
                    <span className="truncate mr-2">{item.name} x{item.quantity}</span>
                    <span className="shrink-0">$ {(item.price * item.quantity).toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-headline font-bold text-slate-500">Total</span>
                  <span className="font-headline font-bold text-xl text-inverse-surface">
                    $ {totalPrice.toLocaleString('es-CO')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Envío calculado al finalizar.</p>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-4 bg-[#009ee3] hover:bg-[#007eb5] disabled:opacity-60 text-white rounded-xl font-headline font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">Procesando...</span>
                ) : (
                  <>
                    <LockKeyhole size={16} />
                    Pagar con MercadoPago
                  </>
                )}
              </button>

              <button
                onClick={clearCart}
                className="w-full text-center text-slate-400 text-sm hover:text-slate-600 transition-colors mt-3"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
