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

// Agente v5 (R11.1): los códigos son los de la ficha; las etiquetas, las del panel.
export const PERFILES_ETIQUETA = {
  INDIVIDUAL: 'Particular (A)',
  WORKSHOP_CONSUMER: 'Taller (B1)',
  RESELLER: 'Revendedor (B2)',
  COMPANY: 'Empresa (B3)',
  UNKNOWN: 'Sin identificar',
} as const;
export type PerfilFiltro = keyof typeof PERFILES_ETIQUETA;

export const RUTAS_ETIQUETA = {
  INDIVIDUAL: 'Individual',
  SMALL_BATCH: 'Lote pequeño',
  EVALUATE: 'Evaluar',
  VOLUME: 'Volumen',
  INDUSTRIAL_PRIORITY: 'Prioridad industrial',
} as const;
export type RutaFiltro = keyof typeof RUTAS_ETIQUETA;

export const MOTIVOS_ETIQUETA = {
  VOLUME: 'Volumen',
  RECURRING: 'Suministro recurrente',
  RESALE: 'Reventa',
  CRITICAL: 'Pieza crítica',
  MODELING_REVIEW: 'Revisión de diseño',
  PHOTOS_NEEDED: 'Fotos',
  OVERSIZE: 'Más de 30 cm',
  SCAN: 'Escaneo',
  MAINTENANCE: 'Mantenimiento',
  IP_REQUEST: 'CAD o derechos',
  CUSTOMER_ASKED: 'Lo pidió el cliente',
  OTHER: 'Otro',
} as const;
export type MotivoFiltro = keyof typeof MOTIVOS_ETIQUETA;

export interface Filtros {
  periodo: Periodo;
  id?: string;
  resultado?: Resultado;
  modelo?: string;
  perfil?: PerfilFiltro;
  ruta?: RutaFiltro;
  motivo?: MotivoFiltro;
  pagina: number;
}

export const TAMANO_PAGINA = 20;

type Params = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/** Los filtros viven en la URL: un enlace abre exactamente la misma tabla. */
export function leerFiltros(sp: Params): Filtros {
  const periodo = uno(sp.periodo);
  const resultado = uno(sp.resultado);
  const perfil = uno(sp.perfil);
  const ruta = uno(sp.ruta);
  const motivo = uno(sp.motivo);
  const pagina = Number(uno(sp.pagina));
  return {
    periodo: periodo && periodo in PERIODOS ? (periodo as Periodo) : '30d',
    id: uno(sp.q)?.slice(0, 64),
    resultado: resultado && resultado in RESULTADOS ? (resultado as Resultado) : undefined,
    modelo: uno(sp.modelo)?.slice(0, 120),
    perfil: perfil && perfil in PERFILES_ETIQUETA ? (perfil as PerfilFiltro) : undefined,
    ruta: ruta && ruta in RUTAS_ETIQUETA ? (ruta as RutaFiltro) : undefined,
    motivo: motivo && motivo in MOTIVOS_ETIQUETA ? (motivo as MotivoFiltro) : undefined,
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
  };
}

export function desdeDe(periodo: Periodo, ahora = new Date()): Date {
  if (periodo === 'mes') return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const dias = periodo === '7d' ? 7 : 30;
  return new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000);
}
