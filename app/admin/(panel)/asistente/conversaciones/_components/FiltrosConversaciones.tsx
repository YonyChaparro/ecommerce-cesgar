'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { MOTIVOS_ETIQUETA, PERFILES_ETIQUETA, PERIODOS, RESULTADOS, RUTAS_ETIQUETA } from '@/lib/asistente/filtros';
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

function Selector({ id, etiqueta, todos, valor, opciones, onCambio }: {
  id: string;
  etiqueta: string;
  todos: string;
  valor?: string;
  opciones: Record<string, string>;
  onCambio: (v: string) => void;
}) {
  return (
    <>
      <label htmlFor={id} className="sr-only">{etiqueta}</label>
      <select id={id} value={valor ?? ''} onChange={(e) => onCambio(e.target.value)} className={cn(inputCls, 'w-auto max-w-48')}>
        <option value="">{todos}</option>
        {Object.entries(opciones).map(([k, texto]) => <option key={k} value={k}>{texto}</option>)}
      </select>
    </>
  );
}

export default function FiltrosConversaciones({ q, resultado, modelo, modelos, perfil, ruta, motivo }: {
  q?: string;
  resultado?: string;
  modelo?: string;
  modelos: string[];
  perfil?: string;
  ruta?: string;
  motivo?: string;
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
      <Selector id="filtro-perfil" etiqueta="Perfil" todos="Todos los perfiles" valor={perfil} opciones={PERFILES_ETIQUETA} onCambio={(v) => cambiar('perfil', v)} />
      <Selector id="filtro-ruta" etiqueta="Ruta" todos="Todas las rutas" valor={ruta} opciones={RUTAS_ETIQUETA} onCambio={(v) => cambiar('ruta', v)} />
      <Selector id="filtro-motivo" etiqueta="Motivo de derivación" todos="Todos los motivos" valor={motivo} opciones={MOTIVOS_ETIQUETA} onCambio={(v) => cambiar('motivo', v)} />
    </div>
  );
}
