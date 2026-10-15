'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { PERIODOS, RESULTADOS } from '@/lib/asistente/filtros';
import { cn } from '@/lib/utils';
import { inputCls } from '../../../_ui';

/** Solo cambia la URL: la página de servidor vuelve a consultar con esos filtros. */
function useCambiarParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (clave: string, valor: string) => {
    const p = new URLSearchParams(params.toString());
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    p.delete('pagina');
    router.push(p.size ? `${pathname}?${p}` : pathname);
  };
}

export function SelectorPeriodo({ periodo }: { periodo: string }) {
  const cambiar = useCambiarParam();
  return (
    <>
      <label htmlFor="periodo" className="sr-only">Periodo</label>
      <select
        id="periodo"
        value={periodo}
        onChange={(e) => cambiar('periodo', e.target.value === '30d' ? '' : e.target.value)}
        className={cn(inputCls, 'w-auto')}
      >
        {Object.entries(PERIODOS).map(([id, texto]) => <option key={id} value={id}>{texto}</option>)}
      </select>
    </>
  );
}

export default function FiltrosConversaciones({ q, resultado, modelo, modelos }: {
  q?: string;
  resultado?: string;
  modelo?: string;
  modelos: string[];
}) {
  const cambiar = useCambiarParam();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="relative min-w-40 flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          cambiar('q', String(new FormData(e.currentTarget).get('q') ?? '').trim());
        }}
      >
        <label htmlFor="buscar-id" className="sr-only">Buscar por id</label>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input id="buscar-id" name="q" type="search" defaultValue={q} placeholder="Buscar por id…" className={cn(inputCls, 'pl-8')} />
      </form>
      <label htmlFor="filtro-resultado" className="sr-only">Resultado</label>
      <select id="filtro-resultado" value={resultado ?? ''} onChange={(e) => cambiar('resultado', e.target.value)} className={cn(inputCls, 'w-auto')}>
        <option value="">Todos los resultados</option>
        {Object.entries(RESULTADOS).map(([id, texto]) => <option key={id} value={id}>{texto}</option>)}
      </select>
      <label htmlFor="filtro-modelo" className="sr-only">Modelo</label>
      <select id="filtro-modelo" value={modelo ?? ''} onChange={(e) => cambiar('modelo', e.target.value)} className={cn(inputCls, 'w-auto max-w-56')}>
        <option value="">Todos los modelos</option>
        {modelos.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
}
