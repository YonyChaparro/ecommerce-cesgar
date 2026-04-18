import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { deleteProduct } from './actions';
import { Plus, Pencil } from 'lucide-react';
import DeleteButton from './DeleteButton';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-headline font-bold text-[#16234d]">Productos</h1>
          <p className="text-slate-500 text-sm mt-1">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-[#16234d] hover:bg-[#4dbdcc] text-white hover:text-[#16234d] font-headline font-bold px-5 py-2.5 rounded-xl transition-all text-sm"
        >
          <Plus size={16} />
          Nuevo producto
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-[#f8fafc]">
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Producto</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Categoría</th>
              <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Precio</th>
              <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Stock</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-[#f8fafc] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.img} alt={p.alt || p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                    <span className="font-medium text-[#16234d] truncate max-w-[220px]">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-500">{p.category}</td>
                <td className="px-5 py-3 text-right font-medium text-[#16234d]">
                  $ {p.price.toLocaleString('es-CO')}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="p-2 rounded-lg text-slate-400 hover:text-[#16234d] hover:bg-slate-100 transition-colors"
                    >
                      <Pencil size={15} />
                    </Link>
                    <DeleteButton
                      productId={p.id}
                      productName={p.name}
                      action={deleteProduct.bind(null, p.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                  No hay productos. <Link href="/admin/products/new" className="text-[#4dbdcc] font-bold hover:underline">Crea el primero.</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
