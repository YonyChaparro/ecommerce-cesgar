import { cn } from '@/lib/utils';

/** Borde degradado que gira: la tarjeta del asistente y la caja de texto del chat. */
export default function BordeIA({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('borde-ia', className)}>{children}</div>;
}
