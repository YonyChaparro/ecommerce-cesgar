'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function StoreSearch({ className = '' }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  function navigate(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('q', value.trim());
    } else {
      params.delete('q');
    }
    router.push(`/tienda?${params.toString()}`);
  }

  function handleChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(value), 400);
  }

  function handleClear() {
    setQuery('');
    clearTimeout(debounceRef.current);
    navigate('');
  }

  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type="text"
        placeholder="Buscar productos..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm text-inverse-surface placeholder-slate-400 outline-none focus:border-primary-container transition-colors bg-white"
      />
      {query && (
        <button
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
