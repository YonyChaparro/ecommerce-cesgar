import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONOS = {
  info: { caja: 'border-slate-200 bg-white', icono: 'bg-slate-100 text-slate-600', Icono: Info },
  advertencia: { caja: 'border-amber-200 bg-amber-50', icono: 'bg-amber-100 text-amber-800', Icono: AlertTriangle },
  error: { caja: 'border-red-200 bg-red-50', icono: 'bg-red-100 text-red-700', Icono: XCircle },
} as const;

/**
 * Un mismo aviso para todos los estados de la vista 5: pieza hueca, más de 30
 * cm, límite por IP, precio cambiado, errores. Solo recibe props.
 */
export default function Aviso({
  tono = 'info',
  titulo,
  texto,
  accion,
  icono,
  className,
}: {
  tono?: keyof typeof TONOS;
  titulo?: string;
  texto?: React.ReactNode;
  accion?: React.ReactNode;
  icono?: React.ReactNode;
  className?: string;
}) {
  const t = TONOS[tono];
  return (
    <div
      role={tono === 'error' ? 'alert' : undefined}
      className={cn('flex items-start gap-3 rounded-2xl border px-4 py-3', t.caja, className)}
    >
      <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', t.icono)} aria-hidden="true">
        {icono ?? <t.Icono size={16} />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
        {titulo && <strong className="text-inverse-surface">{titulo}</strong>}
        {texto && <span className="leading-relaxed text-slate-600">{texto}</span>}
        {accion && <div className="mt-1.5">{accion}</div>}
      </div>
    </div>
  );
}
