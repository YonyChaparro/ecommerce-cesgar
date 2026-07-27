// Banco de pruebas del cotizador: el precio debe salir del VOLUMEN de material,
// nunca de las dimensiones, y una pieza hueca no debe tarifarse como maciza.
//
// Genera STLs sintéticos de volumen exacto conocido (binarios y ASCII), los mide
// con el parseSTL real y los tarifa con el calcCost real. Sale con código 1 si
// alguna comprobación falla, así que sirve de red de seguridad al tocar tarifas.
//
//   npm run verify:cotizador
import { calcCost, type PrintConfig } from '../lib/quoter-calc';
import { DEFAULT_QUOTER_PRICING } from '../lib/quoter-types';
import { parseSTL } from '../lib/stl-parse';
import { buildVerifiedConfig, MAX_SCALE, MIN_SCALE } from '../lib/quoter-rules';

// ─── Generación de STL binario ───────────────────────────────────────────────
type V3 = [number, number, number];
type Tri = [V3, V3, V3];

function boxTris(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, flip = false): Tri[] {
  const v: V3[] = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ];
  const idx: [number, number, number][] = [
    [0, 3, 2], [0, 2, 1], // bottom  -z
    [4, 5, 6], [4, 6, 7], // top     +z
    [0, 1, 5], [0, 5, 4], // front   -y
    [1, 2, 6], [1, 6, 5], // right   +x
    [2, 3, 7], [2, 7, 6], // back    +y
    [3, 0, 4], [3, 4, 7], // left    -x
  ];
  return idx.map(([a, b, c]) => (flip ? [v[a], v[c], v[b]] : [v[a], v[b], v[c]]) as Tri);
}

function writeBinarySTL(tris: Tri[]): ArrayBuffer {
  const buf = new ArrayBuffer(84 + tris.length * 50);
  const dv = new DataView(buf);
  dv.setUint32(80, tris.length, true);
  tris.forEach((t, i) => {
    const off = 84 + i * 50;
    // normal (0,0,0) — parseSTL la ignora, solo usa los vértices
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) dv.setFloat32(off + 12 + j * 12 + k * 4, t[j][k], true);
    }
  });
  return buf;
}

function asciiSTL(tris: Tri[]): ArrayBuffer {
  const body = tris.map(t =>
    `facet normal 0 0 0\n outer loop\n${t.map(p => `  vertex ${p[0]} ${p[1]} ${p[2]}`).join('\n')}\n endloop\nendfacet`
  ).join('\n');
  const buf = Buffer.from(`solid test\n${body}\nendsolid test\n`, 'utf-8');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BASE: Omit<PrintConfig, 'meshVolCm3' | 'bboxVolCm3'> = {
  tech: 'fdm', materialId: 'pla', layerHeight: '0.2', infillDensity: '40',
  factorEscalado: 1, postProcessing: false, quantity: 1,
};

function price(stl: ReturnType<typeof parseSTL>, over: Partial<PrintConfig> = {}) {
  return calcCost({
    ...BASE,
    meshVolCm3: stl.volumeMm3 / 1000,
    bboxVolCm3: stl.boundingBoxVolumeCm3,
    ...over,
  }, DEFAULT_QUOTER_PRICING);
}

const cop = (n: number) => '$' + n.toLocaleString('es-CO');
let failures = 0;
function check(label: string, pass: boolean, detail: string) {
  if (!pass) failures++;
  console.log(`  ${pass ? '[32mPASS[0m' : '[31mFALLA[0m'}  ${label}\n         ${detail}`);
}

// ─── Piezas de prueba ────────────────────────────────────────────────────────
// A: cubo sólido 20mm            -> 8 cm³ reales, bbox  8 cm³
const solidCube = parseSTL(writeBinarySTL(boxTris(0, 0, 0, 20, 20, 20)));
// B: placa sólida 200×20×2mm     -> 8 cm³ reales, bbox  8 cm³ (misma vol, forma extrema)
const plate = parseSTL(writeBinarySTL(boxTris(0, 0, 0, 200, 20, 2)));
// C: cubo HUECO 40mm, pared 0.87 -> ~8 cm³ reales, bbox 64 cm³
const t = 0.8704;
const hollowCube = parseSTL(writeBinarySTL([
  ...boxTris(0, 0, 0, 40, 40, 40),
  ...boxTris(t, t, t, 40 - t, 40 - t, 40 - t, true), // cavidad: winding invertido
]));
// D: cubo SÓLIDO 40mm            -> 64 cm³ reales, bbox 64 cm³
const solidCube40 = parseSTL(writeBinarySTL(boxTris(0, 0, 0, 40, 40, 40)));
// E: cubo hueco con normales internas MAL orientadas (exportador defectuoso)
const hollowBadNormals = parseSTL(writeBinarySTL([
  ...boxTris(0, 0, 0, 40, 40, 40),
  ...boxTris(t, t, t, 40 - t, 40 - t, 40 - t, false), // cavidad SIN invertir
]));

console.log('\n=== Geometría detectada ===');
for (const [n, s] of [['A cubo sólido 20mm', solidCube], ['B placa 200×20×2', plate],
                      ['C cubo hueco 40mm', hollowCube], ['D cubo sólido 40mm', solidCube40],
                      ['E hueco normales rotas', hollowBadNormals]] as const) {
  console.log(`  ${n.padEnd(24)} malla ${(s.volumeMm3 / 1000).toFixed(2).padStart(7)} cm³ | bbox ${s.boundingBoxVolumeCm3.toFixed(2).padStart(7)} cm³`);
}

console.log('\n=== T1: mismo volumen, dimensiones opuestas -> mismo precio ===');
const pA = price(solidCube), pB = price(plate), pC = price(hollowCube);
console.log(`  A cubo 20mm    ${cop(pA.total).padStart(10)}`);
console.log(`  B placa 200mm  ${cop(pB.total).padStart(10)}`);
console.log(`  C hueco 40mm   ${cop(pC.total).padStart(10)}`);
check('A vs B (aspecto 1:1 vs 100:1, mismo volumen)', pA.total === pB.total,
  `${cop(pA.total)} vs ${cop(pB.total)}`);
check('A vs C (bbox 8 cm³ vs 64 cm³, mismo volumen)', Math.abs(pA.total - pC.total) / pA.total < 0.01,
  `${cop(pA.total)} vs ${cop(pC.total)} — desvío ${((pC.total / pA.total - 1) * 100).toFixed(1)}%`);

console.log('\n=== T2: hueco NO debe cobrarse como sólido ===');
const pD = price(solidCube40);
console.log(`  C hueco 40mm (8 cm³)    ${cop(pC.total).padStart(10)}`);
console.log(`  D sólido 40mm (64 cm³)  ${cop(pD.total).padStart(10)}`);
check('hueco cuesta mucho menos que el sólido de igual tamaño', pC.total < pD.total * 0.25,
  `hueco = ${(pC.total / pD.total * 100).toFixed(1)}% del sólido`);

console.log('\n=== T3: escalado -> el volumen manda (×2 lineal = ×8 volumen) ===');
const p1 = price(solidCube), p2 = price(solidCube, { factorEscalado: 2 });
const matTime1 = p1.unitPrice - DEFAULT_QUOTER_PRICING.tarifas.costoSetup;
const matTime2 = p2.unitPrice - DEFAULT_QUOTER_PRICING.tarifas.costoSetup;
console.log(`  ×1 ${cop(p1.total).padStart(10)}   ×2 ${cop(p2.total).padStart(10)}`);
check('coste variable escala ×8 exacto', Math.abs(matTime2 / matTime1 - 8) < 0.01,
  `ratio variable = ${(matTime2 / matTime1).toFixed(3)} (setup $1.000 se mantiene fijo)`);

console.log('\n=== T4: el recargo por hora sigue vivo ===');
console.log(`  A: ${p1.timeH} h -> ${cop(Math.round(p1.timeH * DEFAULT_QUOTER_PRICING.tarifas.precioHora))} de ${cop(p1.unitPrice)}`);
check('el componente tiempo es > 0 y proporcional al volumen', p1.timeH > 0 && Math.abs(p2.timeH / p1.timeH - 8) < 0.01,
  `timeH ×1 = ${p1.timeH} h, ×2 = ${p2.timeH} h (ratio ${(p2.timeH / p1.timeH).toFixed(2)})`);

console.log('\n=== T5: hueco con normales internas mal orientadas ===');
const pE = price(hollowBadNormals);
console.log(`  volumen real de la pieza: 8 cm³ | malla calculada: ${(hollowBadNormals.volumeMm3 / 1000).toFixed(2)} cm³ | bbox: ${hollowBadNormals.boundingBoxVolumeCm3.toFixed(2)} cm³`);
console.log(`  E hueco (normales rotas) ${cop(pE.total).padStart(10)}   vs   C hueco correcto ${cop(pC.total).padStart(10)}`);
check('no se cobra como sólido', pE.total < pD.total * 0.5,
  `E = ${cop(pE.total)}, sólido D = ${cop(pD.total)} -> sobrecosto ×${(pE.total / pC.total).toFixed(1)} sobre el hueco real`);

console.log('\n=== T6: STL ASCII (antes: volumen inventado según el peso del archivo) ===');
const asciiHollow = parseSTL(asciiSTL([
  ...boxTris(0, 0, 0, 40, 40, 40),
  ...boxTris(t, t, t, 40 - t, 40 - t, 40 - t, true),
]));
console.log(`  hueco 40mm en ASCII -> malla ${(asciiHollow.volumeMm3 / 1000).toFixed(2)} cm³ | bbox ${asciiHollow.boundingBoxVolumeCm3.toFixed(2)} cm³ | ${cop(price(asciiHollow).total)}`);
check('ASCII mide el mismo volumen que su equivalente binario',
  Math.abs(asciiHollow.volumeMm3 - hollowCube.volumeMm3) / hollowCube.volumeMm3 < 0.001,
  `ASCII ${(asciiHollow.volumeMm3 / 1000).toFixed(3)} cm³ vs binario ${(hollowCube.volumeMm3 / 1000).toFixed(3)} cm³`);

console.log('\n=== T7: dos cuerpos sólidos sueltos -> deben SUMAR, no restar ===');
const twoBodies = parseSTL(writeBinarySTL([
  ...boxTris(0, 0, 0, 20, 20, 20),
  ...boxTris(50, 0, 0, 70, 20, 20),
]));
check('2 cubos de 8 cm³ miden 16 cm³', Math.abs(twoBodies.volumeMm3 / 1000 - 16) < 0.01,
  `medido ${(twoBodies.volumeMm3 / 1000).toFixed(2)} cm³`);

console.log('\n=== T8: isla sólida dentro de la cavidad -> vuelve a sumar ===');
const island = parseSTL(writeBinarySTL([
  ...boxTris(0, 0, 0, 40, 40, 40),                                  // cuerpo   64 cm³
  ...boxTris(5, 5, 5, 35, 35, 35, true),                            // cavidad -27 cm³
  ...boxTris(15, 15, 15, 25, 25, 25),                               // isla     +1 cm³
]));
check('64 - 27 + 1 = 38 cm³', Math.abs(island.volumeMm3 / 1000 - 38) < 0.01,
  `medido ${(island.volumeMm3 / 1000).toFixed(2)} cm³`);

console.log('\n=== T9: archivo ilegible -> se marca, no se inventa precio ===');
const junk = parseSTL(new Uint8Array(500).fill(7).buffer);
check('volumeUnreliable = true', junk.volumeUnreliable === true, `volumeUnreliable = ${junk.volumeUnreliable}`);

// Los tests anteriores son de invariantes (relativos), así que un error de
// magnitud uniforme en la fórmula los atraviesa. Este recalcula el precio desde
// la tabla de tarifas de forma independiente: si cambia la fórmula, falla; si
// cambian las tarifas, ambos lados se mueven juntos y sigue en verde.
console.log('\n=== T10: la fórmula coincide con un cálculo independiente ===');
const { tarifas, materiales } = DEFAULT_QUOTER_PRICING;
const volA = solidCube.volumeMm3 / 1000;
const pla = materiales.fdm.find((m) => m.id === 'pla')!;
const oraculo = Math.round(
  tarifas.costoSetup +
  volA * pla.precioCm3 * tarifas.multiplicadorCalidad.fdm['0.2'] * tarifas.multiplicadorRelleno['40'] +
  volA * 0.15 * tarifas.precioHora,
);
console.log(`  calcCost ${cop(p1.unitPrice)}  |  oráculo ${cop(oraculo)}`);
check('precio unitario = setup + material + tiempo según la tabla de tarifas',
  Math.abs(p1.unitPrice - oraculo) <= 1, `${cop(p1.unitPrice)} vs ${cop(oraculo)}`);

console.log('\n=== T11: descuento por cantidad (el orden de los tramos importa) ===');
for (const [qty, mult] of [[1, 1.0], [2, 0.95], [5, 0.85], [10, 0.80], [20, 0.75], [50, 0.70]] as const) {
  const r = price(solidCube, { quantity: qty });
  // El descuento se aplica sobre la unidad y luego se multiplica, así que el total
  // puede desviarse del ideal hasta medio peso por unidad. Es a propósito: es la
  // única forma de que MercadoPago (unit_price × quantity) cobre esta misma cifra.
  const esperado = Math.round(p1.unitPrice * qty * mult);
  check(`${String(qty).padStart(2)} u → ×${mult.toFixed(2)}`,
    Math.abs(r.total - esperado) <= Math.ceil(qty / 2) + 1,
    `${cop(r.total)} vs esperado ${cop(esperado)}`);
  check(`${String(qty).padStart(2)} u → total = unitario cobrado × cantidad`,
    r.total === r.billableUnit * qty,
    `${cop(r.billableUnit)} × ${qty} = ${cop(r.total)}`);
}

// El carrito muestra `billableUnit` y /api/checkout manda ese mismo número como
// unit_price. Antes el checkout usaba `unitPrice` (sin descuento) y cobraba hasta
// un 42,8% de más que lo que el cliente había visto en el carrito.
console.log('\n=== T11b: el carrito y la pasarela cobran lo mismo ===');
for (const qty of [1, 2, 10, 50]) {
  const r = price(solidCube, { quantity: qty });
  const sinDescuento = r.unitPrice * qty;
  check(`${String(qty).padStart(2)} u: MercadoPago cobra el total con descuento`,
    r.billableUnit * qty === r.total && r.billableUnit <= r.unitPrice,
    `MP ${cop(r.billableUnit * qty)} = carrito ${cop(r.total)} (sin descuento serían ${cop(sinDescuento)})`);
}

// ─── Reglas que aplica el servidor antes de tarifar ─────────────────────────────
const OK_CHOICES = { tech: 'fdm', materialId: 'pla', layerHeight: '0.2', infillDensity: '40', factorEscalado: 1 };
const build = (over: Record<string, unknown>, stl = solidCube) =>
  buildVerifiedConfig({ ...OK_CHOICES, ...over }, stl, DEFAULT_QUOTER_PRICING, 1);

console.log('\n=== T12: la geometría del config la pone el servidor ===');
const okCfg = build({});
check('meshVolCm3 sale del STL medido, no del cliente',
  'config' in okCfg && Math.abs(okCfg.config.meshVolCm3 - solidCube.volumeMm3 / 1000) < 1e-9,
  'config' in okCfg ? `${okCfg.config.meshVolCm3.toFixed(3)} cm³` : `rechazado: ${okCfg.error}`);

console.log('\n=== T13: pieza de más de 30 cm rechazada (escala ×8 sobre 40 mm = 320 mm) ===');
const big = build({ factorEscalado: 8 }, solidCube40);
check('rechazada con motivo', 'error' in big, 'error' in big ? big.error : 'ACEPTADA');

console.log('\n=== T14: el relleno de una pieza hueca se fija, no lo elige el cliente ===');
const hollowCfg = build({ infillDensity: '15' }, hollowCube);
check('relleno forzado a 40% (multiplicador 1.0)',
  'config' in hollowCfg && hollowCfg.config.infillDensity === '40',
  'config' in hollowCfg ? `infill = ${hollowCfg.config.infillDensity}` : `rechazado: ${hollowCfg.error}`);
check('en una pieza sólida sí se respeta la elección',
  'config' in build({ infillDensity: '15' }) && (build({ infillDensity: '15' }) as { config: { infillDensity: string } }).config.infillDensity === '15',
  'infill = 15');

console.log('\n=== T15: escala fuera de rango ===');
for (const scale of [MIN_SCALE / 2, MAX_SCALE + 1, NaN, -1]) {
  check(`escala ${scale} rechazada`, 'error' in build({ factorEscalado: scale }), `×${scale}`);
}

console.log('\n=== T16: opciones que no existen en la tabla de tarifas ===');
for (const [label, over] of [
  ['tecnología', { tech: 'laser' }],
  ['material',   { materialId: 'oro' }],
  ['capa',       { layerHeight: '0.0001' }],
  ['relleno',    { infillDensity: '3' }],
] as const) {
  const r = build(over);
  check(`${label} inventad${label === 'capa' || label === 'tecnología' ? 'a' : 'o'} rechazad${label === 'capa' || label === 'tecnología' ? 'a' : 'o'}`,
    'error' in r, 'error' in r ? r.error : 'ACEPTADA — calcCost aplicaría ×1.0 en silencio');
}

// ─── Lo que el admin configura tiene que llegar al precio y al pago ─────────────
console.log('\n=== T17: material bloqueado por el admin ("Sin stock") ===');
const conBloqueado = {
  ...DEFAULT_QUOTER_PRICING,
  materiales: {
    ...DEFAULT_QUOTER_PRICING.materiales,
    fdm: DEFAULT_QUOTER_PRICING.materiales.fdm.map(m => m.id === 'pla' ? { ...m, disabled: true } : m),
  },
};
const bloqueado = buildVerifiedConfig(OK_CHOICES, solidCube, conBloqueado, 1);
check('el servidor rechaza un material sin stock', 'error' in bloqueado,
  'error' in bloqueado ? bloqueado.error : 'ACEPTADO — se podría pagar un material retirado');
check('y tampoco se tarifa con su precio',
  calcCost({ ...BASE, meshVolCm3: 8, bboxVolCm3: 8 }, conBloqueado).unitPrice !== p1.unitPrice,
  'cae al primer material disponible, que es el que la UI muestra');

console.log('\n=== T18: la densidad del admin mueve el peso estimado, no el precio ===');
const conDensidad = {
  ...DEFAULT_QUOTER_PRICING,
  materiales: {
    ...DEFAULT_QUOTER_PRICING.materiales,
    fdm: DEFAULT_QUOTER_PRICING.materiales.fdm.map(m => m.id === 'pla' ? { ...m, densidad: 2 } : m),
  },
};
const denso = calcCost({ ...BASE, meshVolCm3: 8, bboxVolCm3: 8 }, conDensidad);
check('duplicar la densidad duplica el peso mostrado',
  Math.abs(denso.weightG - p1.weightG * 2) < 0.05,
  `${p1.weightG} g → ${denso.weightG} g`);
check('el precio no se mueve (se cobra por volumen)', denso.total === p1.total,
  `${cop(p1.total)} vs ${cop(denso.total)}`);

console.log(`\n${failures === 0 ? '[32mTodo OK[0m' : `[31m${failures} verificación(es) fallaron[0m`}\n`);
process.exit(failures === 0 ? 0 : 1);
