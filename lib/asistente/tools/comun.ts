// Validaciones que comparten cotizar_archivo y comparar_opciones: el modelo
// puede mandar ids que no existen y se le responde con un error claro para que
// lo corrija, nunca con un valor por defecto (propuesta §9).

import { getAvailableColors } from '../../quoter-catalog';
import { quantityMultiplier } from '../../quoter-calc';
import type { QuoterPricing } from '../../quoter-types';

export function validarMaterial(tech: 'fdm' | 'resina', materialId: string, pricing: QuoterPricing): void {
  const disponibles = (pricing.materiales[tech] ?? []).filter((m) => !m.disabled);
  if (!disponibles.some((m) => m.id === materialId)) {
    throw new Error(
      `El material "${materialId}" no está disponible en ${tech}. Opciones: ${disponibles.map((m) => `${m.id} (${m.nombre})`).join(', ')}.`,
    );
  }
}

export function validarColor(tech: string, materialId: string, colorId: string): string {
  const colores = getAvailableColors(tech, materialId);
  if (!colores.some((c) => c.id === colorId)) {
    throw new Error(
      `El color "${colorId}" no existe para ese material. Opciones: ${colores.map((c) => `${c.id} (${c.nombre})`).join(', ')}.`,
    );
  }
  return colorId;
}

export function descuentoPct(cantidad: number, pricing: QuoterPricing): number {
  return Math.round((1 - quantityMultiplier(cantidad, pricing)) * 100);
}

/** Traduce los motivos de buildVerifiedConfig a una instrucción para el modelo. */
export function errorDeConfiguracion(motivo: string): Error {
  return new Error(`No se pudo cotizar: ${motivo}. Revisa los ids con listar_materiales y vuelve a intentarlo.`);
}
