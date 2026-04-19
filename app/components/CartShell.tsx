'use client';
import { CartProvider } from './CartContext';
import CartDrawer from './CartDrawer';

export default function CartShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
