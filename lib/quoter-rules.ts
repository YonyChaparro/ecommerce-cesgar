// Reglas del cotizador compartidas por el navegador y el servidor.
//
// Viven aquí y no dentro del componente para que la comprobación que hace la UI
// y la que hace /api/checkout sean literalmente la misma: si divergen, el
// cliente enseña un precio que el servidor luego rechaza.

import type { STLData } from './stl-parse';
import type { PrintConfig } from './quoter-calc';
import type { QuoterPricing } from './quoter-types';

// Arista máxima que sale de una sola impresión. Por encima la pieza va
// fraccionada y el corte se pacta con el cliente, así que no se cotiza sola.
export const MAX_SINGLE_PIECE_MM = 300;

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 10;

// Relleno cuyo multiplicador es 1.0. Se impone a las geometrías que no llevan
// relleno real para que elegirlo no mueva el precio en ninguna dirección.
export const NEUTRAL_INFILL = '40';

export type GeomType = 'solid' | 'hollow' | 'thin';

export function detectGeometry(stl: STLData | null): GeomType {
  if (!stl) return 'solid';
  const ratio = (stl.volumeMm3 / 1000) / Math.max(stl.boundingBoxVolumeCm3, 0.1);
  if (ratio < 0.2) return 'hollow';
  const dims = [stl.dimensions.x, stl.dimensions.y, stl.dimensions.z].sort((a, b) => a - b);
  if (dims[2] > 0 && dims[0] / dims[2] < 0.08) return 'thin';
  return 'solid';
}

/** Dimensiones ya escaladas y qué ejes pasan de la arista imprimible de una pieza. */
export function checkOversize(stl: STLData | null, factorEscalado: number) {
  if (!stl) return null;
  const axes = ['X', 'Y', 'Z'] as const;
  const dims = (['x', 'y', 'z'] as const).map((a) => stl.dimensions[a] * factorEscalado);
  const over = axes.filter((_, i) => dims[i] > MAX_SINGLE_PIECE_MM);
  return { oversize: over.length > 0, dims, over };
}

/** Lo que el navegador envía como configuración: nada de esto es de fiar todavía. */
export interface RawPrintChoices {
  tech?: unknown;
  materialId?: unknown;
  layerHeight?: unknown;
  infillDensity?: unknown;
  factorEscalado?: unknown;
  postProcessing?: unknown;
}

/**
 * Arma el PrintConfig con el que se tarifa de verdad. Las decisiones (material,
 * calidad, escala…) vienen del cliente pero tienen que existir en la tabla de
 * tarifas — calcCost hace `?? 1.0` ante una clave desconocida, así que sin esta
 * validación un multiplicador inventado se colaría como 1.0. La geometría la
 * pone siempre el servidor.
 */
export function buildVerifiedConfig(
  raw: RawPrintChoices,
  stl: STLData,
  pricing: QuoterPricing,
  quantity: number,
): { config: PrintConfig } | { error: string } {
  const tech = raw.tech === 'fdm' || raw.tech === 'resina' ? raw.tech : null;
  if (!tech) return { error: 'tecnología de impresión inválida' };

  const materialId = String(raw.materialId ?? '');
  if (!(pricing.materiales[tech] ?? []).some((m) => m.id === materialId)) {
    return { error: 'material no disponible' };
  }

  const layerHeight = String(raw.layerHeight ?? '');
  if (!(layerHeight in (pricing.tarifas.multiplicadorCalidad[tech] ?? {}))) {
    return { error: 'altura de capa no disponible' };
  }

  const factorEscalado = Number(raw.factorEscalado ?? 1);
  if (!Number.isFinite(factorEscalado) || factorEscalado < MIN_SCALE || factorEscalado > MAX_SCALE) {
    return { error: `escala fuera de rango (${MIN_SCALE}–${MAX_SCALE})` };
  }

  // Una pieza hueca o laminar no lleva relleno real, y la UI bloquea el selector.
  // El servidor lo fija igual: si no, bastaría mandar '15' para un 20% de rebaja.
  const geom = detectGeometry(stl);
  const infillDensity = geom === 'solid' ? String(raw.infillDensity ?? '') : NEUTRAL_INFILL;
  if (!(infillDensity in pricing.tarifas.multiplicadorRelleno)) {
    return { error: 'relleno no disponible' };
  }

  const cm = MAX_SINGLE_PIECE_MM / 10;
  if (checkOversize(stl, factorEscalado)!.oversize) {
    return { error: `supera los ${cm}×${cm}×${cm} cm y necesita cotización personalizada` };
  }

  return {
    config: {
      tech,
      materialId,
      layerHeight,
      infillDensity,
      factorEscalado,
      postProcessing: raw.postProcessing === true,
      meshVolCm3: stl.volumeMm3 / 1000,
      bboxVolCm3: stl.boundingBoxVolumeCm3,
      quantity,
    },
  };
}
