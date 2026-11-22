import type { Resultado } from '@/lib/asistente/metricas';

/** US$0,0052 para costos chicos; US$1,12 para totales. */
export function usd(n: number): string {
  const decimales = n > 0 && n < 0.1 ? 4 : 2;
  return `US$${n.toLocaleString('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}`;
}

/** "03 oct, 14:22" en hora de Colombia. */
export function fechaCorta(d: Date): string {
  const f = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Bogota',
  }).formatToParts(d);
  const v = (t: string) => f.find((p) => p.type === t)?.value ?? '';
  return `${v('day')} ${v('month').replace('.', '')}, ${v('hour')}:${v('minute')}`;
}

export const CHIP_RESULTADO: Record<Resultado, string> = {
  carrito: 'bg-primary-container/15 text-primary',
  derivado: 'bg-ia-niebla text-ia-tinta',
  abandonado: 'bg-slate-100 text-slate-600',
};

export const ordenCorta = (id: string) => `#${id.slice(-8).toUpperCase()}`;
