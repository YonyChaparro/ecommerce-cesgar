import type { Metadata } from 'next';
import Navbar from './components/Navbar';
import NotFoundClient from './components/NotFoundClient';

export const metadata: Metadata = {
  title: '404 — Página no encontrada | Cesgar',
  description: 'La página que buscas no existe.',
};

export default function NotFound() {
  return (
    <>
      <Navbar />
      <NotFoundClient />
    </>
  );
}
