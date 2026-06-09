export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Tienda',
  description: 'Repuestos, insumos y componentes especializados para impresión 3D e industria. Filamentos, resinas, piezas técnicas y más con envío a todo Colombia.',
  openGraph: {
    title: 'Tienda | Cesgar',
    description: 'Repuestos, insumos y componentes especializados para impresión 3D e industria.',
    url: 'https://cesgar.com.co/tienda',
  },
};
import { Suspense } from 'react';
import { prisma } from '../../lib/prisma';
import { ShieldCheck } from 'lucide-react';
import StoreFilters from './StoreFilters';
import StoreSearch from './StoreSearch';
import ProductCard from '../components/ProductCard';
import AnimateIn from '../components/AnimateIn';

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; precioMin?: string; precioMax?: string; q?: string }>;
}) {
  const { categoria, precioMin, precioMax, q } = await searchParams;

  const minPrice = precioMin ? parseInt(precioMin, 10) : undefined;
  const maxPrice = precioMax ? parseInt(precioMax, 10) : undefined;

  const [products, categoryRows, priceAgg] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(categoria ? { category: categoria } : {}),
        ...(q ? {
          OR: [
            { name: { contains: q } },
            { category: { contains: q } },
            { shortDescription: { contains: q } },
          ],
        } : {}),
        ...((minPrice !== undefined || maxPrice !== undefined) ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
    prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  const categories = categoryRows.map((r) => r.category);
  const globalMin = priceAgg._min.price ?? 0;
  const globalMax = priceAgg._max.price ?? 999999;

  return (
    <>
      <Navbar />
      <main className="pt-26 min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 py-12">

          {/* Header */}
          <AnimateIn variant="fadeUp" className="mb-10">
            <h1 className="text-5xl font-headline font-bold text-inverse-surface mb-4">Tienda</h1>
            <p className="text-slate-500 max-w-2xl text-lg border-l-4 border-primary-container pl-6">
              Insumos industriales y electrónicos especializados. Repuestos de alta precisión para maximizar tu productividad.
            </p>
          </AnimateIn>

          {/* Search bar */}
          <Suspense fallback={null}>
            <StoreSearch className="mb-8" />
          </Suspense>

          {/* Layout: sidebar + grid */}
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Sidebar filters */}
            <Suspense fallback={null}>
              <StoreFilters
                categories={categories}
                priceMin={globalMin}
                priceMax={globalMax}
              />
            </Suspense>

            {/* Products area */}
            <div className="flex-1 min-w-0">

              {/* Section label */}
              <div className="mb-6 flex justify-between items-end">
                <h2 className="text-xl font-headline font-bold text-inverse-surface">
                  {q
                    ? <>Resultados para <span className="text-primary-container">&ldquo;{q}&rdquo;</span></>
                    : (categoria ?? 'Todos los productos')
                  }
                </h2>
                <span className="text-slate-400 text-sm">
                  {products.length} resultado{products.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Product Grid */}
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
                  {products.map((p, i) => (
                    <AnimateIn key={p.id} variant="fadeUp" delay={Math.min(i * 0.07, 0.35)}>
                      <ProductCard product={p} />
                    </AnimateIn>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 text-slate-400">
                  <p className="text-lg font-headline">No hay productos con estos filtros.</p>
                </div>
              )}

            </div>
          </div>

          {/* Trust banner */}
          <AnimateIn variant="scaleUp" className="my-12">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 max-w-4xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
              <ShieldCheck size={40} className="text-primary-container" />
            </div>
            <div>
              <h3 className="text-xl font-headline font-bold text-inverse-surface mb-1">Compra garantizada</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Paga de manera segura con nuestra pasarela de pago certificada. Múltiples medios de pago disponibles incluyendo contra entrega en Bogotá y Medellín.
              </p>
            </div>
          </div>
          </AnimateIn>

        </div>
      </main>
    </>
  );
}
