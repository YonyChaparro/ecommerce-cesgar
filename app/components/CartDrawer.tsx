'use client';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCart } from './CartContext';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, clearCart, totalPrice, totalItems } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog static open={isOpen} onClose={closeCart} className="relative z-50">

          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden flex justify-end">

              {/* Panel */}
              <motion.div
                className="w-full max-w-md flex flex-col bg-white shadow-2xl h-full"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              >

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={20} className="text-inverse-surface" />
                    <h2 className="font-headline font-bold text-inverse-surface text-lg">
                      Carrito ({totalItems})
                    </h2>
                  </div>
                  <button
                    onClick={closeCart}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                  {items.length === 0 ? (
                    <motion.div
                      className="flex flex-col items-center justify-center h-full text-center gap-4 py-16"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <ShoppingBag size={48} className="text-slate-200" />
                      <p className="text-slate-400 font-headline font-bold">Tu carrito está vacío</p>
                      <Link
                        href="/tienda"
                        onClick={closeCart}
                        className="text-primary-container font-bold text-sm hover:underline"
                      >
                        Explorar tienda →
                      </Link>
                    </motion.div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                          className="flex gap-4 py-4 border-b border-slate-50 last:border-0 overflow-hidden"
                        >
                          <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
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
                            <h4 className="font-headline font-bold text-inverse-surface text-sm leading-tight line-clamp-2 mb-2">
                              {item.name}
                            </h4>
                            <span className="font-bold text-inverse-surface text-sm">
                              $ {(item.price * item.quantity).toLocaleString('es-CO')}
                            </span>
                            <div className="flex items-center justify-between mt-2">
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
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-slate-300 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>

                {/* Footer */}
                <AnimatePresence>
                  {items.length > 0 && (
                    <motion.div
                      className="border-t border-slate-100 px-6 py-6 space-y-4"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 16 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-headline font-bold text-slate-500 text-sm">Subtotal</span>
                        <motion.span
                          key={totalPrice}
                          initial={{ scale: 1.15, color: '#4dbdcc' }}
                          animate={{ scale: 1, color: '#16234d' }}
                          transition={{ duration: 0.3 }}
                          className="font-headline font-bold text-xl"
                        >
                          $ {totalPrice.toLocaleString('es-CO')}
                        </motion.span>
                      </div>
                      <p className="text-xs text-slate-400">Envío calculado al finalizar compra.</p>
                      <Link
                        href="/carrito"
                        onClick={closeCart}
                        className="block w-full py-4 bg-inverse-surface text-white text-center rounded-xl font-headline font-bold uppercase tracking-widest text-sm hover:bg-primary-container hover:text-inverse-surface transition-all"
                      >
                        Finalizar compra
                      </Link>
                      <button
                        onClick={clearCart}
                        className="block w-full text-center text-slate-400 text-sm hover:text-slate-600 transition-colors"
                      >
                        Vaciar carrito
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
