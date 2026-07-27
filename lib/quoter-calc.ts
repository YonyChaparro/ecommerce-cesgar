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
  /** Precio de una unidad ANTES del descuento por cantidad. */
  unitPrice: number;
  /**
   * Lo que se cobra por unidad, con el descuento por cantidad ya repartido.
   * Es el número que va al carrito y a MercadoPago como `unit_price`: la pasarela
   * cobra `unit_price × quantity`, así que el descuento tiene que estar aquí
   * dentro o se pierde entre lo que se muestra y lo que se paga.
   */
  billableUnit: number;
  total: number;
  weightG: number;
  timeH: number;
}

export function calcCost(config: PrintConfig, pricing: QuoterPricing): CostResult {
  const { tech, materialId, layerHeight, infillDensity, factorEscalado, postProcessing, meshVolCm3, bboxVolCm3, quantity } = config;

  const mats = pricing.materiales[tech] ?? [];
  // Un material bloqueado por el admin no se tarifa: el selector ya lo esconde y el
  // servidor lo rechaza, así que aquí se cae al primero disponible —el mismo que la
  // UI muestra seleccionado— en vez de cobrar el que quedó guardado en el config.
  const disponibles = mats.filter(m => !m.disabled);
  const matObj = disponibles.find(m => m.id === materialId) ?? disponibles[0] ?? mats[0];
  const { tarifas } = pricing;

  const effectiveVolCm3 = Math.min(meshVolCm3, bboxVolCm3) * Math.pow(factorEscalado, 3);

  // Peso estimado — solo informativo, el precio va por volumen. Usa la densidad que
  // el admin configura por material, que es lo que el panel promete que hace.
  const pesoGramos = effectiveVolCm3 * (parseInt(infillDensity) / 100) * (matObj.densidad || 1);

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

  // El descuento se aplica sobre la unidad y luego se multiplica —no al revés—
  // porque MercadoPago cobra `unit_price × quantity`: si el descuento viviera solo
  // en el total, la pasarela cobraría el precio sin rebaja.
  const billableUnit = Math.max(1, Math.round(unitPrice * Math.min(1.0, descuentoCantidad)));

  return {
    unitPrice: Math.round(unitPrice),
    billableUnit,
    total: billableUnit * quantity,
    weightG: Math.round(pesoGramos * quantity * 10) / 10,
    timeH: Math.round(tiempoHoras * quantity * 10) / 10,
  };
}
