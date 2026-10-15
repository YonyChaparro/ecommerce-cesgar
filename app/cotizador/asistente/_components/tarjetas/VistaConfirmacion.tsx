import { Check, Loader2, ShoppingCart } from 'lucide-react';
import Aura from '@/components/ia/Aura';
import { numero, pesos } from '@/lib/formato';
import { cn } from '@/lib/utils';
import Aviso from '../Aviso';

export interface DatosConfirmacion {
  titulo: string;
  detalle?: string;
  cantidad: number;
  precioUnitario?: number;
  total: number;
  pie?: string;
}

export type EstadoConfirmacion =
  | { estado: 'cargando' }
  | { estado: 'pendiente'; datos: DatosConfirmacion; precioAnterior?: number }
  | { estado: 'confirmado'; datos: DatosConfirmacion }
  | { estado: 'rechazado'; datos?: DatosConfirmacion }
  | { estado: 'sin-stock'; titulo: string; disponible: number }
  | { estado: 'no-disponible'; detalle: string }
  | { estado: 'sin-confirmar' };

/**
 * La tarjeta de confirmación de la vista 3 con sus estados de la vista 5. Todo
 * entra por props: TarjetaConfirmacion la conecta con el servidor y el carrito.
 */
export default function VistaConfirmacion({ e, onConfirmar, onRechazar, onVerCarrito }: {
  e: EstadoConfirmacion;
  onConfirmar?: () => void;
  onRechazar?: () => void;
  onVerCarrito?: () => void;
}) {
  if (e.estado === 'cargando') {
    return (
      <div className="flex max-w-xl items-center gap-2.5 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Preparando la confirmación…
      </div>
    );
  }
  if (e.estado === 'sin-stock') {
    return (
      <Aviso
        tono="advertencia"
        titulo="Sin stock suficiente"
        texto={e.disponible > 0
          ? `De ${e.titulo} quedan ${numero(e.disponible)} unidades. No se agregó nada a tu carrito.`
          : `${e.titulo} está agotado. No se agregó nada a tu carrito.`}
      />
    );
  }
  if (e.estado === 'no-disponible') return <Aviso tono="advertencia" titulo="No se puede agregar" texto={e.detalle} />;
  if (e.estado === 'sin-confirmar') {
    return <p className="text-sm text-slate-500">Esta propuesta quedó sin confirmar. No se agregó nada a tu carrito.</p>;
  }

  const pendiente = e.estado === 'pendiente';
  const d = e.datos;
  return (
    <Aura activa={pendiente} className="max-w-xl">
      <div
        className={cn(
          'flex flex-col gap-4 rounded-3xl border-2 bg-white p-5',
          pendiente ? 'border-ia-violeta' : e.estado === 'confirmado' ? 'border-primary-container' : 'border-slate-200',
        )}
      >
        {d && (
          <div className="flex flex-wrap items-center gap-3.5">
            <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-ia-tinta">¿Agregar al carrito?</span>
              <strong className="text-base">{d.titulo}</strong>
              {d.detalle && <span className="text-sm text-slate-600">{d.detalle}</span>}
            </div>
            <div className="flex flex-col items-end gap-0.5 tabular-nums">
              <span className="text-sm text-slate-600">
                {numero(d.cantidad)} × {pesos(d.precioUnitario ?? d.total / d.cantidad)}
              </span>
              <strong className="text-2xl">{pesos(d.total)}</strong>
            </div>
          </div>
        )}

        {pendiente && e.precioAnterior != null && (
          <Aviso
            tono="advertencia"
            titulo="El precio cambió"
            texto={`Las tarifas se actualizaron desde tu cotización: antes ${pesos(e.precioAnterior)} c/u. Te muestro el precio nuevo antes de agregarlo.`}
          />
        )}

        {pendiente && (
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onConfirmar}
              className="boton-ia inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-base font-bold text-white"
            >
              <ShoppingCart size={18} aria-hidden="true" />
              Confirmar y agregar
            </button>
            <button
              type="button"
              onClick={onRechazar}
              className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-5.5 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              No agregar
            </button>
          </div>
        )}
        {e.estado === 'confirmado' && (
          <div className="flex flex-wrap items-center gap-2.5 text-base">
            <span className="flex size-6.5 items-center justify-center rounded-full bg-primary-container text-inverse-surface">
              <Check size={15} aria-hidden="true" />
            </span>
            <strong>Agregado a tu carrito</strong>
            {onVerCarrito && (
              <button type="button" onClick={onVerCarrito} className="ml-auto text-sm font-bold text-primary hover:underline">
                Ver carrito
              </button>
            )}
          </div>
        )}
        {e.estado === 'rechazado' && <p className="text-sm text-slate-600">No se agregó nada a tu carrito.</p>}
        {d?.pie && <p className="text-xs text-slate-500">{d.pie}</p>}
      </div>
    </Aura>
  );
}
