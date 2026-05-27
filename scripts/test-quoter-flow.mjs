/**
 * Test del flujo completo:
 * DB pricing → calculateItemCosts → /api/checkout (sandbox MP)
 *
 * Ejecutar con: node scripts/test-quoter-flow.mjs
 * El servidor dev debe estar corriendo en localhost:3000
 */

import { PrismaClient } from '@prisma/client';

const BASE = 'http://localhost:3000';
const prisma = new PrismaClient();

// ─── Replica exacta de calculateItemCosts de Quoter.tsx ───────────────────────

function isHollow(stl) {
  const volumeCm3 = stl.volumeMm3 / 1000;
  const relacion = volumeCm3 / Math.max(stl.boundingBoxVolumeCm3, 0.1);
  return relacion < 0.2;
}

function calculateItemCosts(model, pricing) {
  if (!model.stl) return { cost: 0, weightG: 0, timeH: 0 };

  const tech = model.config.printingTech;
  const materialId = model.config.materialType;
  const layerHeight = model.config.layerHeight;
  const infill = model.config.infillDensity;
  const quantity = model.config.quantity;

  const mats = pricing.materiales[tech] ?? [];
  const matObj = mats.find(m => m.id === materialId) || mats[0];
  const { tarifas } = pricing;

  const factor = model.config.factorEscalado ?? 1;
  const isObjHollow = isHollow(model.stl);
  const volCm3 = (model.stl.volumeMm3 / 1000) * Math.pow(factor, 3);

  let pesoGramos = volCm3 * matObj.densidad;
  if (!isObjHollow && tech !== 'resina') {
    pesoGramos *= parseInt(infill) / 100;
  }

  let costoMaterial = pesoGramos * matObj.precioGramo;
  const multiplicadorCalidad = (tarifas.multiplicadorCalidad[tech] ?? {})[layerHeight] ?? 1.0;
  costoMaterial *= multiplicadorCalidad;

  if (!isObjHollow && tech !== 'resina') {
    costoMaterial *= tarifas.multiplicadorRelleno[infill] ?? 1.0;
  }

  const baseTimePerCm3 = tech === 'fdm' ? 0.15 : 0.08;
  let tiempoHoras = volCm3 * baseTimePerCm3;
  if (parseFloat(layerHeight) < 0.1) tiempoHoras *= 1.5;
  if (parseFloat(layerHeight) < 0.05) tiempoHoras *= 2.0;

  const costoTiempo = tiempoHoras * tarifas.precioHora;
  const costoPost = model.config.postProcessing ? tarifas.postProcesado : 0;

  let descuentoCantidad = 1.0;
  for (const discount of tarifas.multiplicadorCantidad) {
    if (quantity >= discount.min) {
      descuentoCantidad = discount.mult;
      break;
    }
  }

  const costoEscalado = factor !== 1 ? (tarifas.costoEscalado ?? 0) : 0;
  const subtotalUnitario = tarifas.costoSetup + costoMaterial + costoTiempo + costoPost + costoEscalado;
  const total = subtotalUnitario * quantity * Math.min(1.0, descuentoCantidad);

  return {
    cost: Math.round(total),
    weightG: pesoGramos * quantity,
    timeH: tiempoHoras * quantity,
    unitPrice: subtotalUnitario,
    detail: {
      volCm3: +volCm3.toFixed(4),
      pesoGramos: +pesoGramos.toFixed(3),
      costoMaterial: Math.round(costoMaterial),
      costoTiempo: Math.round(costoTiempo),
      costoPost,
      costoEscalado,
      costoSetup: tarifas.costoSetup,
      subtotalUnitario: Math.round(subtotalUnitario),
      descuentoCantidad,
      total: Math.round(total),
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHECK = '✅';
const FAIL  = '❌';
const INFO  = '  ·';

function pass(msg) { console.log(`${CHECK} ${msg}`); }
function fail(msg) { console.log(`${FAIL} ${msg}`); }
function info(msg) { console.log(`${INFO} ${msg}`); }
function sep()     { console.log('─'.repeat(60)); }

// ─── Casos de prueba ──────────────────────────────────────────────────────────

const CASOS = [
  {
    label: 'PLA 40% relleno 0.2mm ×1',
    model: {
      stl: { volumeMm3: 10000, dimensions: { x: 30, y: 30, z: 15 }, boundingBoxVolumeCm3: 13.5 },
      config: { printingTech: 'fdm', materialType: 'pla', layerHeight: '0.2', infillDensity: '40', quantity: 1, postProcessing: false, factorEscalado: 1 },
    },
  },
  {
    label: 'ABS 60% relleno 0.1mm ×3 (descuento 10%)',
    model: {
      stl: { volumeMm3: 25000, dimensions: { x: 50, y: 40, z: 30 }, boundingBoxVolumeCm3: 60 },
      config: { printingTech: 'fdm', materialType: 'abs', layerHeight: '0.1', infillDensity: '60', quantity: 3, postProcessing: true, factorEscalado: 1 },
    },
  },
  {
    label: 'PLA factor escalado ×2.0',
    model: {
      stl: { volumeMm3: 10000, dimensions: { x: 30, y: 30, z: 15 }, boundingBoxVolumeCm3: 13.5 },
      config: { printingTech: 'fdm', materialType: 'pla', layerHeight: '0.2', infillDensity: '40', quantity: 1, postProcessing: false, factorEscalado: 2.0 },
    },
  },
  {
    label: 'Resina Standard 50µm ×1',
    model: {
      stl: { volumeMm3: 5000, dimensions: { x: 20, y: 15, z: 25 }, boundingBoxVolumeCm3: 7.5 },
      config: { printingTech: 'resina', materialType: 'standard', layerHeight: '0.05', infillDensity: '40', quantity: 1, postProcessing: false, factorEscalado: 1 },
    },
  },
  {
    label: 'PLA ×20 (descuento 25%)',
    model: {
      stl: { volumeMm3: 8000, dimensions: { x: 25, y: 25, z: 20 }, boundingBoxVolumeCm3: 12.5 },
      config: { printingTech: 'fdm', materialType: 'pla', layerHeight: '0.2', infillDensity: '20', quantity: 20, postProcessing: false, factorEscalado: 1 },
    },
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  sep();
  console.log('PRUEBA DE FLUJO COMPLETO — COTIZADOR 3D');
  sep();

  // 1. Leer pricing de la BD
  console.log('\n[1] Leyendo configuración de precios desde la BD…\n');
  let pricing;
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'quoter_pricing' } });
    if (setting?.value) {
      pricing = JSON.parse(setting.value);
      pass('Pricing encontrado en BD (configuración personalizada)');
    } else {
      pricing = null;
      info('No hay pricing en BD — usando valores por defecto');
    }
  } catch (e) {
    fail(`Error leyendo BD: ${e.message}`);
    process.exit(1);
  }

  // Merge con defaults (igual que getQuoterPricing)
  const DEFAULT = {
    tarifas: {
      costoSetup: 1000, precioHora: 300, postProcesado: 2000, costoEscalado: 0,
      multiplicadorCalidad: {
        fdm:    { '0.3': 0.9, '0.2': 1.0, '0.15': 1.2, '0.1': 1.5, '0.05': 2.0 },
        resina: { '0.1': 1.0, '0.05': 1.4, '0.02': 1.8 },
      },
      multiplicadorRelleno: { '15': 0.8, '20': 0.9, '40': 1.0, '60': 1.3, '80': 1.7, '100': 2.0 },
      multiplicadorCantidad: [
        { min: 50, mult: 0.70 }, { min: 20, mult: 0.75 }, { min: 10, mult: 0.80 },
        { min: 5, mult: 0.85 }, { min: 3, mult: 0.90 }, { min: 2, mult: 0.95 }, { min: 1, mult: 1.00 },
      ],
    },
    materiales: {
      fdm: [
        { id: 'pla', nombre: 'PLA', precioGramo: 420, densidad: 1.00 },
        { id: 'abs', nombre: 'ABS', precioGramo: 490, densidad: 1.04 },
        { id: 'petg', nombre: 'PETG', precioGramo: 430, densidad: 1.27 },
        { id: 'nylon', nombre: 'Nylon', precioGramo: 800, densidad: 1.27 },
        { id: 'tpu', nombre: 'TPU', precioGramo: 900, densidad: 1.27 },
        { id: 'pp', nombre: 'Polipropileno', precioGramo: 900, densidad: 1.27 },
      ],
      resina: [
        { id: 'standard', nombre: 'Standard', precioGramo: 700, densidad: 1.12 },
        { id: 'abs_like', nombre: 'ABS-Like', precioGramo: 800, densidad: 1.15 },
        { id: 'ultra_transparente', nombre: 'Ultra Transparente', precioGramo: 900, densidad: 1.12 },
        { id: 'tough', nombre: 'Tough', precioGramo: 1200, densidad: 1.15 },
        { id: 'nylon', nombre: 'Nylon Anti-impact', precioGramo: 2400, densidad: 1.15 },
        { id: 'f80', nombre: 'F-80', precioGramo: 2400, densidad: 1.15 },
      ],
    },
  };

  const effectivePricing = pricing ? {
    tarifas: { ...DEFAULT.tarifas, ...(pricing.tarifas ?? {}) },
    materiales: {
      fdm:    pricing.materiales?.fdm    ?? DEFAULT.materiales.fdm,
      resina: pricing.materiales?.resina ?? DEFAULT.materiales.resina,
    },
  } : DEFAULT;

  info(`costoSetup=${effectivePricing.tarifas.costoSetup} precioHora=${effectivePricing.tarifas.precioHora} postProcesado=${effectivePricing.tarifas.postProcesado} costoEscalado=${effectivePricing.tarifas.costoEscalado}`);
  info(`FDM materials: ${effectivePricing.materiales.fdm.map(m => m.disabled ? `[${m.nombre}]` : m.nombre).join(', ')}`);
  info(`Resina materials: ${effectivePricing.materiales.resina.map(m => m.disabled ? `[${m.nombre}]` : m.nombre).join(', ')}`);

  // 2. Calcular precios para cada caso
  console.log('\n[2] Calculando precios…\n');

  const calculatedCases = [];
  for (const caso of CASOS) {
    const result = calculateItemCosts(caso.model, effectivePricing);
    const effectiveUnitPrice = Math.max(1, Math.round(result.cost / caso.model.config.quantity));
    calculatedCases.push({ ...caso, result, effectiveUnitPrice });

    const matLabel = effectivePricing.materiales[caso.model.config.printingTech]
      ?.find(m => m.id === caso.model.config.materialType)?.nombre ?? '?';

    if (result.cost > 0) {
      pass(`${caso.label}`);
      info(`Material: ${matLabel} | Vol: ${result.detail.volCm3}cm³ | Peso: ${result.detail.pesoGramos.toFixed(1)}g`);
      info(`Material: $${result.detail.costoMaterial.toLocaleString('es-CO')} | Tiempo: ${result.timeH.toFixed(1)}h → $${result.detail.costoTiempo.toLocaleString('es-CO')}`);
      info(`Subtotal/u: $${result.detail.subtotalUnitario.toLocaleString('es-CO')} × ${caso.model.config.quantity} pz × descuento ${result.detail.descuentoCantidad}`);
      info(`→ Total: $${result.cost.toLocaleString('es-CO')} | Precio unitario (cobrado): $${effectiveUnitPrice.toLocaleString('es-CO')}`);
    } else {
      fail(`${caso.label} → cost=0 (revisar)`);
    }
    console.log();
  }

  // Verificar que escalado multiplica volumen por factor^3
  const casoBase    = calculatedCases[0];  // PLA ×1, factor=1
  const casoEscalado = calculatedCases[2]; // PLA ×1, factor=2
  const volRatio = casoEscalado.result.detail.volCm3 / casoBase.result.detail.volCm3;
  const expectedRatio = Math.pow(2.0, 3); // 8x
  sep();
  console.log('[3] Verificando escalado (factor=2.0 → volumen ×8)\n');
  if (Math.abs(volRatio - expectedRatio) < 0.01) {
    pass(`Volumen escalado correcto: ${casoBase.result.detail.volCm3}cm³ × 8 = ${casoEscalado.result.detail.volCm3}cm³`);
  } else {
    fail(`Escalado incorrecto: ratio=${volRatio} (esperado ${expectedRatio})`);
  }
  if (casoEscalado.result.detail.costoEscalado > 0) {
    pass(`Cargo costoEscalado aplicado: +$${casoEscalado.result.detail.costoEscalado.toLocaleString('es-CO')}`);
  } else {
    info(`costoEscalado = 0 (no hay cargo extra por escalado — configurable en admin)`);
  }

  // Verificar descuento por cantidad
  sep();
  console.log('\n[4] Verificando descuentos por cantidad\n');
  const casox20 = calculatedCases[4]; // 20 pz → 25% descuento
  if (casox20.result.detail.descuentoCantidad === 0.75) {
    pass(`Descuento ×20 piezas correcto: multiplicador = 0.75 (25% off)`);
  } else {
    fail(`Descuento ×20 incorrecto: got ${casox20.result.detail.descuentoCantidad}`);
  }
  const casox3 = calculatedCases[1]; // 3 pz → 10% descuento
  if (casox3.result.detail.descuentoCantidad === 0.90) {
    pass(`Descuento ×3 piezas correcto: multiplicador = 0.90 (10% off)`);
  } else {
    fail(`Descuento ×3 incorrecto: got ${casox3.result.detail.descuentoCantidad}`);
  }

  // 3. Probar el endpoint /api/checkout con un ítem de cotizador
  sep();
  console.log('\n[5] Probando POST /api/checkout (sandbox MP)…\n');

  const testCase = calculatedCases[0]; // PLA 40% ×1
  const checkoutPayload = {
    items: [
      {
        id: `cotizador-test-${Date.now()}`,
        quantity: testCase.model.config.quantity,
        name: 'Test_pieza_prueba.stl',
        price: testCase.effectiveUnitPrice,
        note: `FDM · PLA · 0.2mm · 40% relleno · Sin post-proc.`,
      },
    ],
    shipping: {
      name: 'Test Usuario',
      email: 'test@cesgar.co',
      docType: 'CC',
      docNumber: '1234567890',
      phone: '3001234567',
      address: 'Calle 45 # 23-10',
      department: 'Cundinamarca',
      city: 'Bogotá D.C.',
    },
  };

  info(`Enviando: precio unitario $${testCase.effectiveUnitPrice.toLocaleString('es-CO')} × ${testCase.model.config.quantity} = $${(testCase.effectiveUnitPrice * testCase.model.config.quantity).toLocaleString('es-CO')}`);

  try {
    const res = await fetch(`${BASE}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload),
    });
    const data = await res.json();

    if (res.ok && data.url && data.order_id) {
      pass(`Checkout API respondió correctamente (status ${res.status})`);
      info(`order_id: ${data.order_id}`);
      info(`MP sandbox URL: ${data.url.slice(0, 80)}…`);

      // Verificar que la orden fue creada en BD con el precio correcto
      const order = await prisma.order.findUnique({
        where: { id: data.order_id },
        include: { items: true },
      });
      if (order) {
        pass(`Orden creada en BD: #${order.id.slice(-8).toUpperCase()}`);
        info(`total en BD: $${order.total.toLocaleString('es-CO')}`);
        info(`Ítems: ${order.items.length}`);
        const item = order.items[0];
        if (item) {
          info(`  → ${item.name}: price=$${item.price.toLocaleString('es-CO')} × qty=${item.quantity}`);
          const dbTotal = item.price * item.quantity;
          const calcTotal = testCase.effectiveUnitPrice * testCase.model.config.quantity;
          if (dbTotal === calcTotal && dbTotal === order.total) {
            pass(`Precio en BD coincide con cálculo del cotizador: $${dbTotal.toLocaleString('es-CO')}`);
          } else {
            fail(`Discrepancia de precios: BD=${dbTotal} vs calc=${calcTotal} vs order.total=${order.total}`);
          }
        }
        // Limpiar orden de prueba
        await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
        info(`Orden de prueba eliminada de BD`);
      }
    } else if (res.status === 502) {
      info(`MP no disponible en sandbox (502) — esto es normal si no hay credenciales de test configuradas`);
      info(`Respuesta: ${JSON.stringify(data).slice(0, 120)}`);
    } else {
      fail(`Checkout API error ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
    }
  } catch (e) {
    fail(`Error llamando checkout API: ${e.message}`);
  }

  // 4. Verificar materials disabled no afectan precio en calculateItemCosts
  sep();
  console.log('\n[6] Verificando materiales bloqueados…\n');

  const pricingWithDisabled = JSON.parse(JSON.stringify(effectivePricing));
  pricingWithDisabled.materiales.fdm[0].disabled = true; // bloquear PLA

  const casoPLA = CASOS[0];
  const resultConDisabled = calculateItemCosts(casoPLA.model, pricingWithDisabled);
  // Si PLA está bloqueado pero el config sigue teniendo materialType='pla',
  // calculateItemCosts aún lo encuentra porque no filtra disabled — esto es intencional
  // (un pedido ya en carrito no debe cambiar de precio si admin bloquea el material después)
  if (resultConDisabled.cost === testCase.result.cost) {
    pass(`Órdenes existentes no se ven afectadas por bloqueo de material (precio conservado: $${resultConDisabled.cost.toLocaleString('es-CO')})`);
  } else {
    fail(`Diferencia de precio inesperada con material bloqueado`);
  }

  const visibleMats = pricingWithDisabled.materiales.fdm.filter(m => !m.disabled);
  pass(`Materiales visibles en modal del cotizador (filtrado): ${visibleMats.map(m => m.nombre).join(', ')}`);

  sep();
  console.log('\n✅ Todas las pruebas completadas.\n');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
