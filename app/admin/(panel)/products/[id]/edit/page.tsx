import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { updateProduct } from '../../actions';
import ProductForm from '../../ProductForm';
import MediaManager from './MediaManager';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { media: true },
  });
  if (!product) notFound();

  const boundAction = updateProduct.bind(null, id);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-inverse-surface">Editar producto</h1>
        <p className="text-slate-500 text-sm mt-1 truncate">{product.name}</p>
      </div>

      {/* Product fields */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-8">
        <h2 className="text-sm font-headline font-bold text-slate-500 uppercase tracking-widest mb-6">
          Datos del producto
        </h2>
        <ProductForm action={boundAction} product={product} submitLabel="Guardar cambios" />
      </div>

      {/* Media gallery */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-sm font-headline font-bold text-slate-500 uppercase tracking-widest mb-1">
          Galería de medios
        </h2>
        <p className="text-xs text-slate-400 mb-6">{product.media.length} elemento{product.media.length !== 1 ? 's' : ''}</p>
        <MediaManager productId={product.id} media={product.media} />
      </div>
    </div>
  );
}
