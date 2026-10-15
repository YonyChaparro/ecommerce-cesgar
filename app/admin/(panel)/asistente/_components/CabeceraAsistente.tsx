import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const PESTANAS = [
  { id: 'configuracion', href: '/admin/asistente', texto: 'Configuración' },
  { id: 'conversaciones', href: '/admin/asistente/conversaciones', texto: 'Conversaciones y costos' },
  { id: 'estados', href: '/admin/asistente/estados', texto: 'Estados del chat' },
] as const;

/** Título, acciones y pestañas; la usan las páginas del asistente en el panel. */
export default function CabeceraAsistente({ pestana, descripcion, acciones }: {
  pestana: (typeof PESTANAS)[number]['id'];
  descripcion: string;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline font-bold text-2xl text-inverse-surface flex items-center gap-2">
            <Sparkles size={20} /> Asistente de IA
          </h1>
          <p className="text-sm text-slate-400 mt-1">{descripcion}</p>
        </div>
        {acciones && <div className="flex gap-2 flex-wrap items-center">{acciones}</div>}
      </div>
      <nav aria-label="Secciones del asistente" className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {PESTANAS.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            aria-current={p.id === pestana ? 'page' : undefined}
            className={cn(
              'px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px',
              p.id === pestana ? 'font-bold text-inverse-surface border-inverse-surface' : 'text-slate-500 border-transparent hover:text-inverse-surface',
            )}
          >
            {p.texto}
          </Link>
        ))}
      </nav>
    </div>
  );
}
