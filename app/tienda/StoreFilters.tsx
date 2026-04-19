'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  categories: string[];
  priceMin: number;
  priceMax: number;
}

export default function StoreFilters({ categories, priceMin, priceMax }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get('categoria') ?? '';
  const paramMin = searchParams.get('precioMin');
  const paramMax = searchParams.get('precioMax');

  const [localMin, setLocalMin] = useState(paramMin ?? '');
  const [localMax, setLocalMax] = useState(paramMax ?? '');

  // Sync local state when URL changes (e.g. clearing filters)
  useEffect(() => {
    setLocalMin(searchParams.get('precioMin') ?? '');
    setLocalMax(searchParams.get('precioMax') ?? '');
  }, [searchParams]);

  function buildParams(overrides: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    return params.toString();
  }

  function setCategory(cat: string | null) {
    router.push(`/tienda?${buildParams({ categoria: cat })}`);
  }

  function applyPrice() {
    router.push(`/tienda?${buildParams({ precioMin: localMin, precioMax: localMax })}`);
  }

  function clearAll() {
    setLocalMin('');
    setLocalMax('');
    router.push('/tienda');
  }

  const hasFilters = activeCategory || paramMin || paramMax;

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="sticky top-28 space-y-8">

        {/* Clear filters — space always reserved */}
        <button
          onClick={clearAll}
          className={`flex items-center gap-2 text-sm font-bold transition-colors ${
            hasFilters
              ? 'text-slate-500 hover:text-red-500'
              : 'invisible pointer-events-none'
          }`}
        >
          <X size={14} /> Limpiar filtros
        </button>

        {/* Categories */}
        <div>
          <h3 className="font-headline font-bold text-inverse-surface text-sm uppercase tracking-widest mb-4">
            Categorías
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !activeCategory
                    ? 'bg-inverse-surface text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todas las categorías
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => setCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategory === cat
                      ? 'bg-inverse-surface text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Price range */}
        <div>
          <h3 className="font-headline font-bold text-inverse-surface text-sm uppercase tracking-widest mb-4">
            Precio
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Mínimo (COP)</label>
              <input
                type="number"
                min={priceMin}
                max={priceMax}
                placeholder={`$ ${priceMin.toLocaleString('es-CO')}`}
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-inverse-surface placeholder-slate-300 outline-none focus:border-primary-container transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Máximo (COP)</label>
              <input
                type="number"
                min={priceMin}
                max={priceMax}
                placeholder={`$ ${priceMax.toLocaleString('es-CO')}`}
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-inverse-surface placeholder-slate-300 outline-none focus:border-primary-container transition-colors"
              />
            </div>
            <button
              onClick={applyPrice}
              className="w-full py-2.5 bg-inverse-surface text-white rounded-lg font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary-container hover:text-inverse-surface transition-all"
            >
              Aplicar
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}
