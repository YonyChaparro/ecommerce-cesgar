// Rango de precio orientativo sin archivo (propuesta §7.3, vista 4).
//
// Sin malla no hay volumen, así que se supone que la pieza ocupa entre el 25 % y
// el 45 % de su caja envolvente y se tarifa cada extremo con el calcCost real.
// El resultado no se puede pagar: el checkout exige un STL medido.

import { calcCost } from '../quoter-calc';
import { MAX_SINGLE_PIECE_MM } from '../quoter-rules';
import type { QuoterPricing } from '../quoter-types';

/** Decisión 1 de la propuesta: por calibrar con STL reales de /admin/modelos. */
export const OCUPACION_SUPUESTA = { min: 0.25, max: 0.45 } as const;

/** Si el cliente no dice más: FDM, PLA, capa 0,2 mm, relleno 40 %. */
export const ELECCION_POR_DEFECTO = {
  tech: 'fdm',
  materialId: 'pla',
  layerHeight: '0.2',
  infillDensity: '40',
} as const;

const REDONDEO = 100;
const redondear = (n: number) => Math.round(n / REDONDEO) * REDONDEO;

export interface EntradaEstimacion {
  largoCm: number;
  anchoCm: number;
  altoCm: number;
  tech: 'fdm' | 'resina';
  materialId: string;
  layerHeight: string;
  infillDensity: string;
}

export type ResultadoEstimacion =
  | { ok: true; cajaCm3: number; min: number; max: number }
  | { ok: false; motivo: 'grande'; ladoMayorCm: number }
  | { ok: false; motivo: 'invalido'; error: string };

export function estimarRango(e: EntradaEstimacion, pricing: QuoterPricing): ResultadoEstimacion {
  const lados = [e.largoCm, e.anchoCm, e.altoCm];
  if (lados.some((l) => !Number.isFinite(l) || l <= 0)) {
    return { ok: false, motivo: 'invalido', error: 'las medidas tienen que ser números mayores que cero, en centímetros' };
  }
  const ladoMayorCm = Math.max(...lados);
  // Una pieza de más de 30 cm se imprime por partes: no hay rango, se deriva.
  if (ladoMayorCm * 10 > MAX_SINGLE_PIECE_MM) return { ok: false, motivo: 'grande', ladoMayorCm };

  const material = (pricing.materiales[e.tech] ?? []).find((m) => m.id === e.materialId && !m.disabled);
  if (!material) return { ok: false, motivo: 'invalido', error: `el material "${e.materialId}" no está disponible en ${e.tech}` };
  if (!(e.layerHeight in (pricing.tarifas.multiplicadorCalidad[e.tech] ?? {}))) {
    return { ok: false, motivo: 'invalido', error: `la capa "${e.layerHeight}" no existe en ${e.tech}` };
  }
  if (!(e.infillDensity in pricing.tarifas.multiplicadorRelleno)) {
    return { ok: false, motivo: 'invalido', error: `el relleno "${e.infillDensity}" no existe` };
  }

  const cajaCm3 = e.largoCm * e.anchoCm * e.altoCm;
  const precio = (ocupacion: number) =>
    calcCost({
      tech: e.tech,
      materialId: e.materialId,
      layerHeight: e.layerHeight,
      infillDensity: e.infillDensity,
      factorEscalado: 1,
      postProcessing: false,
      meshVolCm3: cajaCm3 * ocupacion,
      bboxVolCm3: cajaCm3,
      quantity: 1,
    }, pricing).billableUnit;

  return {
    ok: true,
    cajaCm3,
    min: redondear(precio(OCUPACION_SUPUESTA.min)),
    max: redondear(precio(OCUPACION_SUPUESTA.max)),
  };
}
