'use client';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useCart } from './CartContext';

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  img: string;
  alt: string | null;
  category: string;
};

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem, openCart } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: product.id, slug: product.slug, name: product.name, price: product.price, img: product.img, alt: product.alt, category: product.category });
    openCart();
  };

  if (compact) {
    return (
      <Link
        href={`/tienda/${product.slug}`}
        className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-xl transition-all duration-300 flex flex-col"
      >
        <div className="aspect-square bg-[#f8fafc] rounded-xl mb-4 overflow-hidden flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.img} alt={product.alt || product.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="grow space-y-1 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{product.category}</span>
          <h3 className="font-headline font-bold text-inverse-surface text-sm leading-tight line-clamp-2">{product.name}</h3>
          <span className="text-base font-bold text-inverse-surface block">$ {product.price.toLocaleString('es-CO')}</span>
        </div>
        <button
          onClick={handleAdd}
          className="w-full py-2.5 bg-inverse-surface text-white rounded-lg font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary-container hover:text-inverse-surface transition-all"
        >
          Añadir al carrito
        </button>
      </Link>
    );
  }

  return (
    <Link
      href={`/tienda/${product.slug}`}
      className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="aspect-square bg-[#f8fafc] rounded-xl mb-4 overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={product.alt || product.name} className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500" src={product.img} />
      </div>
      <div className="space-y-1 mb-4 grow">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{product.category}</span>
        <h3 className="font-headline font-bold text-inverse-surface leading-tight line-clamp-2 text-sm">{product.name}</h3>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-lg font-bold text-inverse-surface">$ {product.price.toLocaleString('es-CO')}</span>
          <span className="text-[10px] text-slate-400">IVA incluido</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-auto">
        <button
          onClick={handleAdd}
          className="w-full py-3 bg-inverse-surface text-white rounded-lg font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary-container hover:text-inverse-surface transition-all"
        >
          Añadir al carrito
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="flex items-center justify-center gap-2 text-slate-400 hover:text-red-500 text-xs font-bold transition-colors"
        >
          <Heart size={14} /> Me gusta
        </button>
      </div>
    </Link>
  );
}
