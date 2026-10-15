// Textos con los que las tarjetas del chat describen una configuración:
// "FDM · PETG Negro · Capa 0,2 mm · Relleno 40 %". Los arman las tools en el
// servidor, así la tarjeta y el texto del agente nombran lo mismo.

import { numero } from '../formato';
import { getAvailableColors } from '../quoter-catalog';
import type { QuoterPricing } from '../quoter-types';

export interface Eleccion {
  tech: 'fdm' | 'resina';
  materialId: string;
  colorId?: string;
  layerHeight: string;
  infillDensity: string;
}

export function nombreMaterial(tech: string, materialId: string, pricing: QuoterPricing): string {
  return (pricing.materiales[tech as 'fdm' | 'resina'] ?? []).find((m) => m.id === materialId)?.nombre ?? materialId;
}

export function nombreColor(tech: string, materialId: string, colorId?: string): string | null {
  if (!colorId) return null;
  return getAvailableColors(tech, materialId).find((c) => c.id === colorId)?.nombre ?? null;
}

/** "PETG Negro": lo que distingue una fila de comparar_opciones. */
export function etiquetaOpcion(e: Eleccion, pricing: QuoterPricing): string {
  return [nombreMaterial(e.tech, e.materialId, pricing), nombreColor(e.tech, e.materialId, e.colorId)]
    .filter(Boolean)
    .join(' ');
}

/** "FDM · PETG Negro · Capa 0,2 mm · Relleno 40 %" */
export function etiquetaConfiguracion(e: Eleccion, pricing: QuoterPricing): string {
  return [
    e.tech === 'fdm' ? 'FDM' : 'Resina',
    etiquetaOpcion(e, pricing),
    `Capa ${numero(parseFloat(e.layerHeight), 2)} mm`,
    `Relleno ${e.infillDensity} %`,
  ].join(' · ');
}
