import { cn } from '@/lib/utils';

const VARIANTES = {
  tarjeta: 'aura-ia',
  suave: 'aura-ia-suave',
  orbe: 'aura-ia-orbe',
} as const;

/**
 * Pone el aura detrás de su hijo. La regla (propuesta §5.1): marca lo que está
 * haciendo la IA o lo que espera una decisión del cliente, así que se pasa
 * `activa={false}` en cuanto el cliente confirma o rechaza.
 */
export default function Aura({
  activa = true,
  variante = 'tarjeta',
  className,
  children,
}: {
  activa?: boolean;
  variante?: keyof typeof VARIANTES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('relative isolate', className)}>
      {activa && <div aria-hidden="true" className={VARIANTES[variante]} />}
      {children}
    </div>
  );
}
