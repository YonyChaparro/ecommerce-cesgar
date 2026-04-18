import Navbar from '../components/Navbar';
import Link from 'next/link';
import { prisma } from '../../lib/prisma';
import {
  Search, ChevronDown, ArrowRight, Heart, ShieldCheck,
} from 'lucide-react';

export default async function TiendaPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <>
      <Navbar />
      {/* pt-16 navbar + pt-10 breadcrumb */}
      <main className="pt-26 min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 py-12">

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-headline font-bold text-[#16234d] mb-4">Tienda</h1>
            <p className="text-slate-500 max-w-2xl text-lg border-l-4 border-[#4dbdcc] pl-6">
              Insumos industriales y electrónicos especializados. Repuestos de alta precisión para maximizar tu productividad.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="bg-[#f8fafc] p-2 rounded-2xl flex flex-col md:flex-row gap-2 mb-16 border border-slate-100">
            <div className="flex-grow relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full pl-12 pr-4 py-4 bg-transparent text-[#16234d] placeholder-slate-400 font-headline outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-8 py-4 bg-[#4dbdcc] text-[#16234d] rounded-xl font-headline font-bold flex items-center gap-3 hover:bg-cyan-400 transition-colors">
                Categorías
                <ChevronDown size={16} />
              </button>
              <button className="px-8 py-4 bg-[#16234d] text-white rounded-xl font-headline font-bold hover:bg-slate-800 transition-colors">
                Todos los productos
              </button>
            </div>
          </div>

          {/* Section label */}
          <div className="mb-8 flex justify-between items-end">
             <h2 className="text-2xl font-headline font-bold text-[#16234d]">Todos los productos</h2>
             <span className="text-slate-400 text-sm">{products.length} resultados</span>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {products.map((p) => {
              return (
                <Link href={`/tienda/${p.slug}`} key={p.id} className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-xl transition-all duration-300 flex flex-col">
                  <div className="aspect-square bg-[#f8fafc] rounded-xl mb-6 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={p.alt || p.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      src={p.img}
                    />
                  </div>
                  <div className="space-y-1 mb-6 flex-grow">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{p.category}</span>
                    <h3 className="font-headline font-bold text-[#16234d] leading-tight h-10 overflow-hidden">{p.name}</h3>
                    <div className="flex items-center gap-1 mt-2">
                       <span className="text-lg font-bold text-[#16234d]">$ {p.price.toLocaleString('es-CO')}</span>
                       <span className="text-[10px] text-slate-400">IVA incluido</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-auto">
                    <button className="w-full py-3 bg-[#16234d] text-white rounded-lg font-headline font-bold text-xs uppercase tracking-widest hover:bg-[#4dbdcc] hover:text-[#16234d] transition-all">
                      Añadir al carrito
                    </button>
                    <button className="flex items-center justify-center gap-2 text-slate-400 hover:text-red-500 text-xs font-bold transition-colors">
                      <Heart size={14} /> Me gusta
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Trust banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 max-w-4xl mx-auto shadow-sm mb-8">
            <div className="w-16 h-16 rounded-full bg-[#4dbdcc]/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={40} className="text-[#4dbdcc]" />
            </div>
            <div>
              <h3 className="text-xl font-headline font-bold text-[#16234d] mb-1">Compra garantizada</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Paga de manera segura con nuestra pasarela de pago certificada. Múltiples medios de pago disponibles incluyendo contra entrega en Bogotá y Medellín.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Link href="/" className="inline-flex items-center gap-2 text-[#4dbdcc] font-bold hover:underline">
              <ArrowRight size={16} className="rotate-180" /> Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
