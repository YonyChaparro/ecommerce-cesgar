import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import ProductImageCarousel from '../../components/ProductImageCarousel';
import AddToCartButton from '../../components/AddToCartButton';
import ProductCard from '../../components/ProductCard';
import { ArrowLeft, ShieldCheck, Truck, Star } from 'lucide-react';
import { prisma } from '../../../lib/prisma';
import { cleanWordPressHtml } from '../../../lib/cleanHtml';
import { notFound } from 'next/navigation';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { media: { orderBy: { order: 'asc' } } },
  });

  if (!product) {
    notFound();
  }

  const related = await prisma.product.findMany({
    where: { category: product.category, slug: { not: product.slug } },
    take: 4,
    orderBy: { createdAt: 'desc' },
  });

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
            {/* Product Images */}
            <ProductImageCarousel
              images={[
                { url: product.img, alt: product.alt || product.name },
                ...product.media
                  .filter((m) => m.type === 'image')
                  .map((m) => ({ url: m.url, alt: m.alt || product.name })),
              ]}
            />

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

              {product.shortDescription && (
                <p className="text-slate-500 mb-8 leading-relaxed text-base">
                  {product.shortDescription}
                </p>
              )}

              {/* Quantity & Add to Cart */}
              <AddToCartButton product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                img: product.img,
                alt: product.alt,
                category: product.category,
              }} />

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

          {/* Full description */}
          {product.description && (
            <div className="mt-16 border-t border-slate-100 pt-12">
              <h2 className="text-2xl font-headline font-bold text-inverse-surface mb-8">Descripción del producto</h2>
              <div
                className="text-slate-600 leading-relaxed max-w-4xl
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:my-4
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol]:my-4
                  [&_li]:text-slate-600
                  [&_p]:mb-4
                  [&_h3]:font-bold [&_h3]:text-inverse-surface [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-2
                  [&_strong]:font-semibold [&_strong]:text-inverse-surface"
                dangerouslySetInnerHTML={{ __html: cleanWordPressHtml(product.description) }}
              />
            </div>
          )}

          {/* Related products */}
          {related.length > 0 && (
            <div className="mt-16 border-t border-slate-100 pt-12">
              <h2 className="text-2xl font-headline font-bold text-inverse-surface mb-8">
                También puedes estar interesado en:
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} compact />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}