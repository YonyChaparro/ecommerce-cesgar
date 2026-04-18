'use client';
import { useActionState } from 'react';
import type { ProductFormState } from './actions';
import type { Product } from '@prisma/client';

type Props = {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product?: Product;
  submitLabel: string;
};

export default function ProductForm({ action, product, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const field = (name: string) =>
    state?.errors?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      {state?.message && (
        <p className="text-red-500 text-sm font-medium bg-red-50 px-4 py-3 rounded-xl">{state.message}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Nombre *</label>
          <input
            name="name"
            defaultValue={product?.name}
            required
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[#16234d] text-sm outline-none focus:border-[#4dbdcc] focus:ring-2 focus:ring-[#4dbdcc]/20 transition"
          />
          {field('name') && <p className="text-red-500 text-xs mt-1">{field('name')}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Categoría *</label>
          <input
            name="category"
            defaultValue={product?.category}
            required
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[#16234d] text-sm outline-none focus:border-[#4dbdcc] focus:ring-2 focus:ring-[#4dbdcc]/20 transition"
          />
          {field('category') && <p className="text-red-500 text-xs mt-1">{field('category')}</p>}
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Precio (COP) *</label>
          <input
            name="price"
            type="number"
            min={0}
            defaultValue={product?.price}
            required
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[#16234d] text-sm outline-none focus:border-[#4dbdcc] focus:ring-2 focus:ring-[#4dbdcc]/20 transition"
          />
          {field('price') && <p className="text-red-500 text-xs mt-1">{field('price')}</p>}
        </div>

        {/* Stock */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Stock</label>
          <input
            name="stock"
            type="number"
            min={0}
            defaultValue={product?.stock ?? 0}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[#16234d] text-sm outline-none focus:border-[#4dbdcc] focus:ring-2 focus:ring-[#4dbdcc]/20 transition"
          />
        </div>

        {/* Image URL */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">URL imagen principal *</label>
          <input
            name="img"
            type="url"
            defaultValue={product?.img}
            required
            placeholder="https://..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[#16234d] text-sm outline-none focus:border-[#4dbdcc] focus:ring-2 focus:ring-[#4dbdcc]/20 transition"
          />
          {field('img') && <p className="text-red-500 text-xs mt-1">{field('img')}</p>}
        </div>

        {/* Alt */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Texto alternativo (imagen)</label>
          <input
            name="alt"
            defaultValue={product?.alt ?? ''}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[#16234d] text-sm outline-none focus:border-[#4dbdcc] focus:ring-2 focus:ring-[#4dbdcc]/20 transition"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Descripción</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={product?.description ?? ''}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[#16234d] text-sm outline-none focus:border-[#4dbdcc] focus:ring-2 focus:ring-[#4dbdcc]/20 transition resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#16234d] hover:bg-[#4dbdcc] text-white hover:text-[#16234d] font-headline font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50 text-sm"
        >
          {pending ? 'Guardando…' : submitLabel}
        </button>
        <a href="/admin/products" className="text-slate-400 hover:text-[#16234d] text-sm font-medium transition-colors">
          Cancelar
        </a>
      </div>
    </form>
  );
}
