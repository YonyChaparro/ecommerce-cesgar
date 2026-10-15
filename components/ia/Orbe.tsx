import { cn } from '@/lib/utils';
import IconoIA from './IconoIA';

const TAMANOS = {
  sm: { caja: 'size-7', icono: 13 },
  lg: { caja: 'size-18', icono: 30 },
} as const;

/** Avatar del asistente. Con `activo` gira y lleva aura: hay una respuesta en curso. */
export default function Orbe({
  tamano = 'sm',
  activo = false,
  className,
}: {
  tamano?: keyof typeof TAMANOS;
  activo?: boolean;
  className?: string;
}) {
  const t = TAMANOS[tamano];
  return (
    <span className={cn('relative isolate flex shrink-0', t.caja, className)} aria-hidden="true">
      {activo && <span className="aura-ia-orbe" />}
      <span className={cn('orbe-ia flex size-full items-center justify-center rounded-full text-white', activo && 'orbe-ia-vivo')}>
        <IconoIA size={t.icono} />
      </span>
    </span>
  );
}
