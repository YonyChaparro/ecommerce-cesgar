import type { QuoterPricing } from './quoter-types';

export interface PrintConfig {
  tech: 'fdm' | 'resina';
  materialId: string;
  layerHeight: string;
  infillDensity: string;
  factorEscalado: number;
  postProcessing: boolean;
  meshVolCm3: number;
  bboxVolCm3: number;
  quantity: number;
}

export interface CostResult {
  unitPrice: number;
  total: number;
  weightG: number;
  timeH: number;
}

export function calcCost(config: PrintConfig, pricing: QuoterPricing): CostResult {
  const { tech, materialId, layerHeight, infillDensity, factorEscalado, postProcessing, meshVolCm3, bboxVolCm3, quantity } = config;

  const mats = pricing.materiales[tech] ?? [];
  const matObj = mats.find(m => m.id === materialId) ?? mats[0];
  const { tarifas } = pricing;

  const effectiveVolCm3 = Math.min(meshVolCm3, bboxVolCm3) * Math.pow(factorEscalado, 3);

  // Peso: densidad fija (base PLA 1.0 g/cm³) aplicada igual para FDM y resina
  // con el mismo factor de relleno → el peso no varía al cambiar de material
  const pesoGramos = effectiveVolCm3 * (parseInt(infillDensity) / 100) * 1.0;

  // Precio: basado en volumen (precioCm3 independiente de la densidad del material)
  let costoMaterial = effectiveVolCm3 * matObj.precioCm3;
  costoMaterial *= (tarifas.multiplicadorCalidad[tech] ?? {})[layerHeight] ?? 1.0;
  costoMaterial *= tarifas.multiplicadorRelleno[infillDensity] ?? 1.0;

  const baseTimePerCm3 = tech === 'fdm' ? 0.15 : 0.08;
  let tiempoHoras = effectiveVolCm3 * baseTimePerCm3;
  if (parseFloat(layerHeight) < 0.1) tiempoHoras *= 1.5;
  if (parseFloat(layerHeight) < 0.05) tiempoHoras *= 2.0;

  const costoTiempo = tiempoHoras * tarifas.precioHora;
  const costoPost = postProcessing ? tarifas.postProcesado : 0;

  let descuentoCantidad = 1.0;
  for (const d of tarifas.multiplicadorCantidad) {
    if (quantity >= d.min) { descuentoCantidad = d.mult; break; }
  }

  // Sin recargo por tamaño/escalado: el factor solo entra vía el volumen efectivo
  const unitPrice = tarifas.costoSetup + costoMaterial + costoTiempo + costoPost;
  const total = Math.round(unitPrice * quantity * Math.min(1.0, descuentoCantidad));

  return {
    unitPrice: Math.round(unitPrice),
    total,
    weightG: Math.round(pesoGramos * quantity * 10) / 10,
    timeH: Math.round(tiempoHoras * quantity * 10) / 10,
  };
}
