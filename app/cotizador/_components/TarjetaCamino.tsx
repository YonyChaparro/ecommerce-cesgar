import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ESTILOS = {
  archivo: {
    tarjeta: 'border-2 border-inverse-surface bg-white shadow-xl shadow-inverse-surface/20 hover:shadow-2xl hover:shadow-inverse-surface/30',
    check: 'text-primary',
    boton: 'bg-inverse-surface text-white',
  },
  asistente: {
    tarjeta: 'borde-ia fondo-ia-suave',
    check: 'text-ia-tinta',
    boton: 'cta-ia text-white',
  },
  personalizada: {
    tarjeta: 'border-2 border-slate-200 bg-white',
    check: 'text-primary',
    boton: 'bg-primary-container text-inverse-surface',
  },
} as const;

/**
 * Molde de las tres tarjetas del selector (vista 1). Cada una solo le pasa su
 * contenido; lo que cambia de estilo entre ellas es `variante`. Toda la tarjeta
 * es un enlace, así que adentro no va nada interactivo.
 */
export default function TarjetaCamino({
  variante,
  href,
  encabezado,
  ilustracion,
  titulo,
  texto,
  ventajas = [],
  boton,
  botonIcono,
  pie,
  className,
}: {
  variante: keyof typeof ESTILOS;
  href: string;
  encabezado?: React.ReactNode;
  ilustracion: React.ReactNode;
  titulo: React.ReactNode;
  texto: string;
  ventajas?: string[];
  boton: string;
  botonIcono?: React.ReactNode;
  pie?: React.ReactNode;
  className?: string;
}) {
  const e = ESTILOS[variante];
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col gap-6 rounded-3xl p-6 sm:p-9 text-inverse-surface no-underline',
        'transition duration-300 hover:-translate-y-1 motion-reduce:transform-none',
        e.tarjeta,
        className,
      )}
    >
      {encabezado}
      {ilustracion}
      <div className="flex flex-col gap-2.5">
        {titulo}
        <p className="text-base leading-relaxed text-slate-600">{texto}</p>
      </div>
      {ventajas.length > 0 && (
        <ul className="flex flex-col gap-2.5 text-base text-slate-700">
          {ventajas.map((v) => (
            <li key={v} className="flex items-center gap-2.5">
              <Check size={18} className={cn('shrink-0', e.check)} aria-hidden="true" />
              {v}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex flex-col gap-3">
        <span className={cn('inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full px-6 text-base font-bold', e.boton)}>
          {botonIcono}
          {boton}
          {!botonIcono && <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />}
        </span>
        {pie}
      </div>
    </Link>
  );
}
