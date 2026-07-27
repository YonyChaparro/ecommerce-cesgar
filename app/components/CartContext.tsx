'use client';
import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { calcCost, type PrintConfig } from '@/lib/quoter-calc';
import type { QuoterPricing } from '@/lib/quoter-types';

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  img: string;
  alt: string | null;
  category: string;
  quantity: number;
  note?: string;
  modelUrl?: string;
  printConfig?: PrintConfig;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'HYDRATE'; items: CartItem[] }
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'>; qty: number }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_QTY'; id: string; quantity: number; pricing: QuoterPricing | null }
  | { type: 'CLEAR_CART' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, items: action.items };
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id ? { ...i, quantity: i.quantity + action.qty } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: action.qty }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'UPDATE_QTY': {
      if (action.quantity <= 0)
        return { ...state, items: state.items.filter(i => i.id !== action.id) };
      return {
        ...state,
        items: state.items.map(i => {
          if (i.id !== action.id) return i;
          const quantity = action.quantity;
          // Un ítem del cotizador cambia de tramo de descuento al mover la cantidad.
          // Su `price` es el precio unitario ya rebajado, así que si no se recalcula
          // el carrito enseña un total y /api/checkout cobra otro.
          if (!i.printConfig || !action.pricing) return { ...i, quantity };
          const { billableUnit } = calcCost({ ...i.printConfig, quantity }, action.pricing);
          return { ...i, quantity, price: billableUnit };
        }),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });
  const [pricing, setPricing] = useState<QuoterPricing | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cesgar-cart');
      if (stored) dispatch({ type: 'HYDRATE', items: JSON.parse(stored) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cesgar-cart', JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  // Solo hace falta si hay impresiones en el carrito: son las únicas que se
  // re-tarifan al cambiar la cantidad. Las páginas sin cotizador no piden nada.
  const needsPricing = !pricing && state.items.some(i => i.printConfig);
  useEffect(() => {
    if (!needsPricing) return;
    let cancelled = false;
    fetch('/api/quoter-pricing')
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (!cancelled && data) setPricing(data as QuoterPricing); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [needsPricing]);

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = state.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      isOpen: state.isOpen,
      totalItems,
      totalPrice,
      addItem: (item, qty = 1) => dispatch({ type: 'ADD_ITEM', payload: item, qty }),
      removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', id }),
      updateQty: (id, quantity) => dispatch({ type: 'UPDATE_QTY', id, quantity, pricing }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      openCart: () => dispatch({ type: 'OPEN' }),
      closeCart: () => dispatch({ type: 'CLOSE' }),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
