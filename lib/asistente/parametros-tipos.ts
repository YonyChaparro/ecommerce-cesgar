// Parámetros comerciales del agente (spec v5.1 §16.5, requirements R1). Se
// editan en /admin/asistente y viven en Setting como JSON. Puro: sin prisma ni
// next, así lo usan los scripts verify:*.

export type Clase = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
export const CLASES: Clase[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

export type HorasPorClase = Record<'C1' | 'C2' | 'C3' | 'C4' | 'C5', { min: number; max: number }> & { C6: { min: number } };

export interface ParametrosComerciales {
  /** Obligatorio: se copia en cada cotización. */
  PRICE_LIST_VERSION: string;
  /** null = falta → el agente no da precio de modelado y deriva (§16.5, «Si falta»). */
  MODEL_HOURLY_RATE_COP: number | null;
  MODEL_MIN_PRICE_COP: number | null;
  horasPorClase: HorasPorClase;
  SCAN_SMALL_FROM_COP: number | null;
  SCAN_MEDIUM_FROM_COP: number | null;
  SCAN_LARGE_FROM_COP: number | null;
  MESH_CLEANUP_FROM_COP: number | null;
  CAD_RECONSTRUCTION_FROM_COP: number | null;
  Q_EVALUAR: number;
  Q_VOLUMEN_MIN: number;
  Q_INDUSTRIAL_PRIORITY: number;
  /** D2: apagado hasta que CESGAR apruebe la tarifa de modelado. */
  publicarPrecioModelado: boolean;
  /** D3: apagado hasta que CESGAR apruebe las tarifas de escaneo. */
  publicarTarifasEscaneo: boolean;
  /** Los pone saveParametros: el usuario del panel y la fecha ISO. */
  aprobadoPor: string | null;
  aprobadoEn: string | null;
}

export type Umbrales = Pick<ParametrosComerciales, 'Q_EVALUAR' | 'Q_VOLUMEN_MIN' | 'Q_INDUSTRIAL_PRIORITY'>;

export const HORAS_POR_DEFECTO: HorasPorClase = {
  C1: { min: 0.25, max: 0.5 },
  C2: { min: 0.5, max: 1 },
  C3: { min: 1, max: 2 },
  C4: { min: 2, max: 4 },
  C5: { min: 4, max: 8 },
  C6: { min: 8 },
};

export const DEFAULT_PARAMETROS: ParametrosComerciales = {
  PRICE_LIST_VERSION: 'v5.0-pilot',
  MODEL_HOURLY_RATE_COP: 45_000,
  MODEL_MIN_PRICE_COP: 25_000,
  horasPorClase: HORAS_POR_DEFECTO,
  SCAN_SMALL_FROM_COP: 80_000,
  SCAN_MEDIUM_FROM_COP: 130_000,
  SCAN_LARGE_FROM_COP: 220_000,
  MESH_CLEANUP_FROM_COP: 30_000,
  CAD_RECONSTRUCTION_FROM_COP: 250_000,
  Q_EVALUAR: 25,
  Q_VOLUMEN_MIN: 50,
  Q_INDUSTRIAL_PRIORITY: 100,
  publicarPrecioModelado: false,
  publicarTarifasEscaneo: false,
  aprobadoPor: null,
  aprobadoEn: null,
};

export const MONTOS = [
  'MODEL_HOURLY_RATE_COP',
  'MODEL_MIN_PRICE_COP',
  'SCAN_SMALL_FROM_COP',
  'SCAN_MEDIUM_FROM_COP',
  'SCAN_LARGE_FROM_COP',
  'MESH_CLEANUP_FROM_COP',
  'CAD_RECONSTRUCTION_FROM_COP',
] as const;

const entero = (n: unknown) => typeof n === 'number' && Number.isInteger(n);

/**
 * Lo que el servidor exige antes de guardar (R1.4). Devuelve la lista de
 * errores en español; vacía = válido.
 */
export function validarParametros(p: ParametrosComerciales): string[] {
  const errores: string[] = [];
  if (typeof p.PRICE_LIST_VERSION !== 'string' || !p.PRICE_LIST_VERSION.trim()) {
    errores.push('La versión de la lista de precios es obligatoria.');
  } else if (p.PRICE_LIST_VERSION.length > 40) {
    errores.push('La versión de la lista de precios tiene más de 40 caracteres.');
  }
  for (const k of MONTOS) {
    const v = p[k];
    if (v !== null && (!entero(v) || v < 0 || v > 100_000_000)) errores.push(`${k} debe ser un entero ≥ 0 o quedar vacío.`);
  }
  for (const k of ['Q_EVALUAR', 'Q_VOLUMEN_MIN', 'Q_INDUSTRIAL_PRIORITY'] as const) {
    if (!entero(p[k]) || p[k] < 2 || p[k] > 100_000) errores.push(`${k} debe ser un entero entre 2 y 100.000.`);
  }
  if (!(p.Q_EVALUAR < p.Q_VOLUMEN_MIN && p.Q_VOLUMEN_MIN <= p.Q_INDUSTRIAL_PRIORITY)) {
    errores.push('Los umbrales deben cumplir Q_EVALUAR < Q_VOLUMEN_MIN ≤ Q_INDUSTRIAL_PRIORITY.');
  }
  const h = p.horasPorClase;
  const numero = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 1000;
  const cinco = ['C1', 'C2', 'C3', 'C4', 'C5'] as const;
  if (!h || cinco.some((c) => !h[c] || !numero(h[c].min) || !numero(h[c].max)) || !h.C6 || !numero(h.C6.min)) {
    errores.push('Las horas guía de C1 a C6 deben ser números positivos.');
  } else {
    for (const c of cinco) if (h[c].min > h[c].max) errores.push(`Las horas mínimas de ${c} superan las máximas.`);
    for (let i = 1; i < cinco.length; i++) {
      const prev = h[cinco[i - 1]];
      const act = h[cinco[i]];
      if (act.min < prev.min || act.max < prev.max) errores.push(`Las horas guía deben crecer de C1 a C5 (${cinco[i - 1]} → ${cinco[i]}).`);
    }
    if (h.C6.min < h.C5.max) errores.push('Las horas mínimas de C6 no pueden ser menores que las máximas de C5.');
  }
  if (typeof p.publicarPrecioModelado !== 'boolean' || typeof p.publicarTarifasEscaneo !== 'boolean') {
    errores.push('Los interruptores deben ser sí o no.');
  }
  return errores;
}

/**
 * Mezcla lo guardado con los defaults, campo por campo: un campo agregado
 * después nunca llega undefined. Un monto guardado como null se respeta
 * (significa «falta»); solo un campo ausente toma el valor de fábrica.
 */
export function mezclarParametros(guardado: Partial<ParametrosComerciales> | null | undefined): ParametrosComerciales {
  if (!guardado || typeof guardado !== 'object') return DEFAULT_PARAMETROS;
  const horas = { ...HORAS_POR_DEFECTO } as HorasPorClase;
  for (const c of CLASES) {
    const g = guardado.horasPorClase?.[c];
    if (g && typeof g === 'object') (horas as Record<string, unknown>)[c] = { ...HORAS_POR_DEFECTO[c], ...g };
  }
  const r: ParametrosComerciales = { ...DEFAULT_PARAMETROS, horasPorClase: horas };
  for (const k of Object.keys(DEFAULT_PARAMETROS) as (keyof ParametrosComerciales)[]) {
    if (k === 'horasPorClase') continue;
    if (k in guardado) (r as unknown as Record<string, unknown>)[k] = guardado[k];
  }
  return r;
}

/** Copia de los parámetros que se guarda con cada cotización M- (R9.2). */
export function snapshotModelado(p: ParametrosComerciales, fecha = new Date()) {
  return {
    version: p.PRICE_LIST_VERSION,
    fecha: fecha.toISOString(),
    valores: {
      MODEL_HOURLY_RATE_COP: p.MODEL_HOURLY_RATE_COP,
      MODEL_MIN_PRICE_COP: p.MODEL_MIN_PRICE_COP,
      publicarPrecioModelado: p.publicarPrecioModelado,
      horas: p.horasPorClase,
    },
  };
}
