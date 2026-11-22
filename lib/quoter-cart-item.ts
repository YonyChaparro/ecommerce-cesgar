// Ítem del carrito para una impresión del cotizador.
//
// Estaba dentro de app/components/Quoter.tsx. Vive aquí para que el cotizador y
// el asistente de IA generen ítems idénticos (id `cotizador-*`, nota,
// printConfig y modelUrl): /api/checkout los vuelve a verificar con
// esos mismos campos.

import type { CartItem } from '@/app/components/CartContext';
import { calcCost } from './quoter-calc';
import { getAvailableColors } from './quoter-catalog';
import { effectiveInfill } from './quoter-rules';
import type { QuoterPricing } from './quoter-types';
import type { STLData } from './stl-parse';

/** Lo que el cliente eligió para un modelo, con los nombres que usa el cotizador. */
export interface QuoterChoices {
  printingTech: string;
  materialType: string;
  layerHeight: string;
  infillDensity: string;
  printColor: string;
  quantity: number;
  postProcessing: boolean;
  factorEscalado: number;
}

export function buildQuoterCartItem({
  idCotizacion,
  nombreArchivo,
  stl,
  config,
  modelUrl,
  pricing,
}: {
  /** Va tras `cotizador-`: el id del modelo en el cotizador o el código Q- en el chat. */
  idCotizacion: string;
  nombreArchivo: string;
  stl: STLData | null;
  config: QuoterChoices;
  modelUrl: string;
  pricing: QuoterPricing;
}): { item: Omit<CartItem, 'quantity'>; quantity: number } {
  const sf = config.factorEscalado ?? 1;
  const infill = effectiveInfill(stl, config.infillDensity);
  const printConfig = stl ? {
    tech: config.printingTech as 'fdm' | 'resina',
    materialId: config.materialType,
    layerHeight: config.layerHeight,
    infillDensity: infill,
    factorEscalado: sf,
    postProcessing: config.postProcessing,
    meshVolCm3: stl.volumeMm3 / 1000,
    bboxVolCm3: stl.boundingBoxVolumeCm3,
    quantity: config.quantity,
  } : undefined;

  // El mismo precio unitario que recalcula /api/checkout: lleva el descuento
  // por cantidad dentro, porque MercadoPago cobra unit_price × quantity.
  const { billableUnit, weightG, timeH } = printConfig
    ? calcCost(printConfig, pricing)
    : { billableUnit: 0, weightG: 0, timeH: 0 };

  const techMats = pricing.materiales[config.printingTech as 'fdm' | 'resina'] ?? [];
  const matObj = techMats.find(mat => mat.id === config.materialType) || techMats[0];
  const colorObj = getAvailableColors(config.printingTech, config.materialType).find(c => c.id === config.printColor);
  const dims = stl
    ? `${(stl.dimensions.x * sf).toFixed(1)}×${(stl.dimensions.y * sf).toFixed(1)}×${(stl.dimensions.z * sf).toFixed(1)}mm`
    : null;
  const note = [
    config.printingTech.toUpperCase(),
    matObj?.nombre,
    colorObj?.nombre,
    `${config.layerHeight}mm`,
    `${infill}% relleno`,
    sf !== 1 ? `Escala ×${sf}` : null,
    dims,
    `~${(weightG / config.quantity).toFixed(1)}g/u`,
    `~${(timeH / config.quantity).toFixed(1)}h/u`,
    config.postProcessing ? 'Post-proc.' : 'Sin post-proc.',
  ].filter(Boolean).join(' · ');

  return {
    item: {
      id: `cotizador-${idCotizacion}`,
      slug: 'cotizador',
      name: nombreArchivo.replace(/\.stl$/i, ''),
      price: billableUnit,
      img: '/3d-print.svg',
      alt: note,
      category: 'Impresión 3D',
      note,
      modelUrl,
      printConfig,
    },
    quantity: config.quantity,
  };
}
