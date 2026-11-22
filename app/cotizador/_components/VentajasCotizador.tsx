import { Zap, Package, Cog, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const VENTAJAS = [
  { Icono: Zap, texto: 'Precio inmediato para servicios de impresión 3D' },
  { Icono: Package, texto: 'Impresión 3D industrial con materiales técnicos' },
  { Icono: Cog, texto: 'Configuración individual de cada modelo 3D' },
  { Icono: Truck, texto: 'Producción en Bogotá · Envíos a todo Colombia' },
];

/**
 * Las cuatro ventajas del cotizador. En el selector (claro) van en fila al pie;
 * en /cotizador/modelo (oscuro) van en columna junto al cotizador, como antes.
 */
export default function VentajasCotizador({ tono, className }: { tono: 'claro' | 'oscuro'; className?: string }) {
  const claro = tono === 'claro';
  return (
    <ul
      className={cn(
        claro ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-sm text-slate-600' : 'space-y-6 text-slate-300',
        className,
      )}
    >
      {VENTAJAS.map(({ Icono, texto }) => (
        <li key={texto} className={cn('flex items-center', claro ? 'gap-3' : 'gap-4')}>
          <Icono size={22} className="text-primary-container shrink-0" aria-hidden="true" />
          <span>{texto}</span>
        </li>
      ))}
    </ul>
  );
}
