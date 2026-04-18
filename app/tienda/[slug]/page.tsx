import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Heart, ShieldCheck, Truck, Star, Plus, Minus, ShoppingCart } from 'lucide-react';
import { prisma } from '../../../lib/prisma';
import { notFound } from 'next/navigation';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const product = await prisma.product.findUnique({
    where: { slug }
  });

  if (!product) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="pt-26 min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8 font-medium">
            <Link href="/tienda" className="hover:text-[#4dbdcc] transition-colors">Tienda</Link>
            <span>/</span>
            <span className="text-slate-400">{product.category}</span>
            <span>/</span>
            <span className="text-[#16234d] truncate max-w-[200px] md:max-w-none">{product.name}</span>
          </nav>

          <Link href="/tienda" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#4dbdcc] transition-colors font-bold mb-8">
            <ArrowLeft size={16} /> Volver a la tienda
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Product Image */}
            <div className="bg-[#f8fafc] rounded-3xl p-8 border border-slate-100 flex items-center justify-center relative group">
              <button className="absolute top-6 right-6 p-4 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm hover:shadow-md transition-all z-10">
                <Heart size={24} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={product.img} 
                alt={product.alt || product.name} 
                  className="w-full max-w-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest self-start mb-4">
                {product.category}
              </span>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star size={18} className="fill-current" />
                  <Star size={18} className="fill-current" />
                  <Star size={18} className="fill-current" />
                  <Star size={18} className="fill-current" />
                  <Star size={18} className="fill-current" />
                </div>
                <span className="text-slate-500 text-sm">(24 reseñas)</span>
              </div>

              <div className="mb-8">
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-5xl font-headline font-bold text-[#16234d]">$ {product.price.toLocaleString('es-CO')}</span>
                </div>
                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <span>Impuestos incluidos.</span>
                  {product.stock > 0 ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-bold">En stock</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-bold">Agotado</span>
                  )}
                </div>
              </div>

              <p className="text-slate-500 mb-8 leading-relaxed text-lg">
                Este producto original de alta calidad ha sido testeado para garantizar el mejor rendimiento en entornos industriales. Perfecto para optimizar la fiabilidad y precisión en tus proyectos diarios.
              </p>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <div className="flex items-center justify-between border-2 border-slate-200 rounded-xl px-4 py-3 bg-white w-full sm:w-32">
                  <button className="text-slate-400 hover:text-[#16234d] transition-colors"><Minus size={20} /></button>
                  <span className="font-bold text-[#16234d] text-lg">1</span>
                  <button className="text-slate-400 hover:text-[#16234d] transition-colors"><Plus size={20} /></button>
                </div>
                
                <button className="flex-1 bg-[#4dbdcc] text-[#16234d] hover:bg-cyan-400 hover:shadow-lg transition-all py-4 rounded-xl font-headline font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                  <ShoppingCart size={20} />
                  Añadir al carrito
                </button>
              </div>

              {/* Features / Guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-slate-100">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#16234d]/5 flex items-center justify-center flex-shrink-0">
                    <Truck size={20} className="text-[#16234d]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#16234d] text-sm mb-1">Envío a todo el país</h4>
                    <p className="text-slate-500 text-xs">Despachos diarios garantizados.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#16234d]/5 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={20} className="text-[#16234d]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#16234d] text-sm mb-1">Garantía de calidad</h4>
                    <p className="text-slate-500 text-xs">Soporte directo especializado.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </>
  );
}