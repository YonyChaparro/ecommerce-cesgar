// Periodo y filtros de /admin/asistente/conversaciones (vista 7). Puro: lo
// usan la página de servidor, la exportación CSV y los filtros del navegador.

export const PERIODOS = {
  '30d': 'Últimos 30 días',
  '7d': 'Últimos 7 días',
  mes: 'Este mes',
} as const;
export type Periodo = keyof typeof PERIODOS;

export const RESULTADOS = { carrito: 'Carrito', derivado: 'Derivado', abandonado: 'Abandonado' } as const;
export type Resultado = keyof typeof RESULTADOS;

export interface Filtros {
  periodo: Periodo;
  id?: string;
  resultado?: Resultado;
  modelo?: string;
  pagina: number;
}

export const TAMANO_PAGINA = 20;

type Params = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/** Los filtros viven en la URL: un enlace abre exactamente la misma tabla. */
export function leerFiltros(sp: Params): Filtros {
  const periodo = uno(sp.periodo);
  const resultado = uno(sp.resultado);
  const pagina = Number(uno(sp.pagina));
  return {
    periodo: periodo && periodo in PERIODOS ? (periodo as Periodo) : '30d',
    id: uno(sp.q)?.slice(0, 64),
    resultado: resultado && resultado in RESULTADOS ? (resultado as Resultado) : undefined,
    modelo: uno(sp.modelo)?.slice(0, 120),
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
  };
}

export function desdeDe(periodo: Periodo, ahora = new Date()): Date {
  if (periodo === 'mes') return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const dias = periodo === '7d' ? 7 : 30;
  return new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000);
}
