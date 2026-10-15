import type { Filtros } from '@/lib/asistente/metricas';

const BASE = '/admin/asistente/conversaciones';

/**
 * Periodo, filtros, página y conversación abierta viven en la URL: la página es
 * de servidor y un enlace abre exactamente la misma tabla y el mismo detalle.
 */
export function urlConversaciones(
  f: Filtros,
  cambios: Partial<Filtros> & { detalle?: string | null } = {},
  base = BASE,
): string {
  const v = { ...f, ...cambios };
  const p = new URLSearchParams();
  if (v.periodo !== '30d') p.set('periodo', v.periodo);
  if (v.id) p.set('q', v.id);
  if (v.resultado) p.set('resultado', v.resultado);
  if (v.modelo) p.set('modelo', v.modelo);
  if (v.pagina > 1) p.set('pagina', String(v.pagina));
  if (cambios.detalle) p.set('id', cambios.detalle);
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

export const urlCsv = (f: Filtros) => urlConversaciones({ ...f, pagina: 1 }, {}, `${BASE}/csv`);
