// Banco de pruebas del clasificador del agente v5, sin modelo, sin BD y sin red
// (design §9.1, requirements R12.2). Prueba las funciones puras que deciden en
// lugar del modelo: ruta por volumen, clase C1–C6, precio de modelado, palabras
// críticas, mezcla de la ficha, faltantes y armado del resumen. Sale con
// código 1 si algo falla.
//
//   npm run verify:clasificador

import {
  calcularDerivados, claseModelado, esUsoCritico, precioModelado, rutaComercial, textoClase,
  type ResultadoClase,
} from '../lib/asistente/clasificador';
import { FICHA_VACIA, faltantes, mezclarFicha, type Factores, type Ficha, type FichaParcial, type Operacion } from '../lib/asistente/ficha';
import { DEFAULT_PARAMETROS, validarParametros, type ParametrosComerciales } from '../lib/asistente/parametros-tipos';
import { armarResumenAsesor, MAX_CARACTERES_RESUMEN } from '../lib/asistente/resumen-asesor';
import { effectiveInfill } from '../lib/quoter-rules';
import { quoteVerifiedModel } from '../lib/quoter-verify';
import { DEFAULT_QUOTER_PRICING } from '../lib/quoter-types';
import { pesos } from '../lib/formato';

let fallas = 0;
function check(etiqueta: string, ok: boolean, detalle = '') {
  if (!ok) fallas++;
  console.log(`  ${ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFALLA\x1b[0m'}  ${etiqueta}${detalle ? `\n         ${detalle}` : ''}`);
}

const P = DEFAULT_PARAMETROS;
/** Los interruptores encendidos, para probar el precio (de fábrica están apagados, D2). */
const PUBLICADO: ParametrosComerciales = { ...P, publicarPrecioModelado: true, publicarTarifasEscaneo: true };

const demanda = (d: Partial<Ficha['demand']>): Ficha['demand'] => ({ ...FICHA_VACIA.demand, ...d });
const ficha = (parcial: FichaParcial, p: ParametrosComerciales = PUBLICADO) => calcularDerivados(mezclarFicha(FICHA_VACIA, parcial), p);
const U = 'UNKNOWN' as const;
const fac = (g: Factores['geometria'], d: Factores['detalles'], e: Factores['ensamble'], r: Factores['referencias'], p: Factores['precision'], dev: Factores['desarrollo']): Factores =>
  ({ geometria: g, detalles: d, ensamble: e, referencias: r, precision: p, desarrollo: dev });

function main() {
  // ── Parámetros ──
  console.log('\nParámetros (R1)');
  check('los de fábrica son válidos', validarParametros(P).length === 0, validarParametros(P).join(' · '));
  check('interruptores apagados de fábrica (D2, D3)', !P.publicarPrecioModelado && !P.publicarTarifasEscaneo);
  const umbralMal = validarParametros({ ...P, Q_EVALUAR: 60 });
  check('rechaza Q_EVALUAR = 60 con Q_VOLUMEN_MIN = 50', umbralMal.length > 0, umbralMal.join(' · '));
  check('rechaza horas que no crecen', validarParametros({ ...P, horasPorClase: { ...P.horasPorClase, C3: { min: 0.3, max: 0.6 } } }).length > 0);
  check('rechaza versión vacía', validarParametros({ ...P, PRICE_LIST_VERSION: ' ' }).length > 0);
  check('acepta una tarifa vacía (null = falta)', validarParametros({ ...P, MODEL_HOURLY_RATE_COP: null }).length === 0);
  check('rechaza montos negativos o con decimales', validarParametros({ ...P, SCAN_SMALL_FROM_COP: -1 }).length > 0 && validarParametros({ ...P, MESH_CLEANUP_FROM_COP: 10.5 }).length > 0);

  // ── Ruta comercial ──
  console.log('\nRuta comercial (R4, design §4.1)');
  const ruta = (d: Partial<Ficha['demand']>) => rutaComercial(demanda(d), P);
  check('T04: taller, 15 al mes → EVALUATE', ruta({ initial_quantity: 15, recurrence: 'MONTHLY' }) === 'EVALUATE');
  check('T05: 30 sin recurrencia → EVALUATE', ruta({ initial_quantity: 30 }) === 'EVALUATE');
  check('T06: 50 para reventa → VOLUME', ruta({ initial_quantity: 50, channel: 'RESALE' }) === 'VOLUME');
  check('T07: 120 → INDUSTRIAL_PRIORITY', ruta({ initial_quantity: 120 }) === 'INDUSTRIAL_PRIORITY');
  check('T11: 3 unidades → INDIVIDUAL', ruta({ initial_quantity: 3 }) === 'INDIVIDUAL');
  check('borde 9 / 10', ruta({ initial_quantity: 9 }) === 'INDIVIDUAL' && ruta({ initial_quantity: 10 }) === 'SMALL_BATCH');
  check('borde 24 / 25', ruta({ initial_quantity: 24 }) === 'SMALL_BATCH' && ruta({ initial_quantity: 25 }) === 'EVALUATE');
  check('borde 49 / 50', ruta({ initial_quantity: 49 }) === 'EVALUATE' && ruta({ initial_quantity: 50 }) === 'VOLUME');
  check('borde 99 / 100', ruta({ initial_quantity: 99 }) === 'VOLUME' && ruta({ initial_quantity: 100 }) === 'INDUSTRIAL_PRIORITY');
  check('consumo mensual de 100 → INDUSTRIAL_PRIORITY', ruta({ initial_quantity: 5, monthly_quantity_estimate: 100 }) === 'INDUSTRIAL_PRIORITY');
  check('VARIABLE no cuenta como recurrente', ruta({ initial_quantity: 5, recurrence: 'VARIABLE' }) === 'INDIVIDUAL');
  check('varias referencias de 30 c/u no se suman: EVALUATE, no VOLUME', ruta({ initial_quantity: 30, multiple_references: true }) === 'EVALUATE');
  check('varias referencias activan EVALUATE por sí solas', ruta({ initial_quantity: 2, multiple_references: true }) === 'EVALUATE');
  check('cantidad desconocida → INDIVIDUAL', ruta({ initial_quantity: 'UNKNOWN' }) === 'INDIVIDUAL');
  check('T08: 5 unidades con demanda compartida sigue INDIVIDUAL, con oportunidad de catálogo',
    (() => { const f = ficha({ demand: { initial_quantity: 5, shared_demand_signal: true } }); return f.derived.volume_route === 'INDIVIDUAL' && f.derived.catalog_opportunity; })());
  check('los umbrales salen de los parámetros', rutaComercial(demanda({ initial_quantity: 40 }), { ...P, Q_EVALUAR: 20, Q_VOLUMEN_MIN: 40 }) === 'VOLUME');

  // ── Clase de modelado ──
  console.log('\nClase de modelado (R5.2–R5.4, design §4.2)');
  const filas: { caso: string; f: Factores; ops: Operacion[]; min: string; max: string; conf: string; dentro: [string, string] }[] = [
    { caso: 'Buje de 10 × 20 mm (§26)', f: fac(0, 0, 0, 1, 1, 0), ops: ['REVOLVE'], min: 'C1', max: 'C1', conf: 'HIGH', dentro: ['C1', 'C2'] },
    { caso: 'T18: piñón 24 dientes, módulo 2, eje 8', f: fac(1, 1, U, 0, 1, 0), ops: ['PATTERN', 'REVOLVE'], min: 'C2', max: 'C3', conf: 'MEDIUM', dentro: ['C2', 'C3'] },
    { caso: 'T19: caja para electrónica', f: fac(0, 1, 1, U, 1, 0), ops: ['SHELL', 'EXTRUDE'], min: 'C2', max: 'C3', conf: 'MEDIUM', dentro: ['C2', 'C3'] },
    { caso: 'T20: cuatro elementos atornillados', f: fac(1, 1, 2, U, 1, U), ops: ['ASSEMBLY'], min: 'C3', max: 'C5', conf: 'MEDIUM', dentro: ['C3', 'C5'] },
    { caso: 'T21: dos piezas encajan y una desliza', f: fac(1, 1, 2, U, 1, U), ops: ['FIT_TOLERANCE', 'ASSEMBLY'], min: 'C3', max: 'C5', conf: 'MEDIUM', dentro: ['C3', 'C5'] },
    { caso: 'T17: tapa lateral Hilux 2015', f: fac(2, 1, 1, U, 1, U), ops: ['FREEFORM_SURFACE', 'FIT_TOLERANCE'], min: 'C4', max: 'C5', conf: 'MEDIUM', dentro: ['C3', 'C5'] },
    { caso: 'Hélice de 5 aspas (§26)', f: fac(2, 2, 1, U, U, U), ops: ['FREEFORM_SURFACE', 'PATTERN'], min: 'C4', max: 'C6', conf: 'LOW', dentro: ['C4', 'C6'] },
  ];
  const orden = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
  for (const r of filas) {
    const c = claseModelado({ factors: r.f, operations: r.ops }, P.horasPorClase)!;
    const ok = c.class_min === r.min && c.class_max === r.max && c.confidence === r.conf
      && orden.indexOf(c.class_min) >= orden.indexOf(r.dentro[0]) && orden.indexOf(c.class_max) <= orden.indexOf(r.dentro[1]);
    check(`${r.caso} → ${textoClase(r.min as never, r.max as never)}, ${r.conf}`, ok, `${textoClase(c.class_min, c.class_max)}, ${c.confidence}`);
  }
  const helice = claseModelado({ factors: fac(2, 2, 1, U, U, U), operations: ['FREEFORM_SURFACE'] }, P.horasPorClase)!;
  check('el rango que llega a C6 no tiene horas máximas', helice.hours_max === null && helice.hours_min === 2);
  const piso = claseModelado({ factors: fac(0, 0, 0, 0, 0, 0), operations: ['KINEMATICS'] }, P.horasPorClase)!;
  check('piso por operación: KINEMATICS con 0 puntos → C4', piso.class_min === 'C4' && piso.class_max === 'C4');
  const pisoC3 = claseModelado({ factors: fac(0, 1, 0, 0, 0, 0), operations: ['LOFT'] }, P.horasPorClase)!;
  check('piso por operación: LOFT → C3', pisoC3.class_min === 'C3');
  const conf = (n: number) => claseModelado({ factors: fac(...(Array.from({ length: 6 }, (_, i) => (i < n ? U : 0)) as [0, 0, 0, 0, 0, 0])), operations: [] }, P.horasPorClase)!.confidence;
  check('confianza: 0 desconocidos alta, 1–2 media, 3+ baja', conf(0) === 'HIGH' && conf(1) === 'MEDIUM' && conf(2) === 'MEDIUM' && conf(3) === 'LOW');
  check('horas: desde el mínimo de la clase mínima hasta el máximo de la máxima',
    (() => { const c = claseModelado({ factors: fac(1, 1, U, 0, 1, 0), operations: [] }, P.horasPorClase)!; return c.hours_min === 0.5 && c.hours_max === 2; })());
  check('sin factores no hay clase', claseModelado({ factors: null, operations: ['EXTRUDE'] }, P.horasPorClase) === null);

  // ── Precio de modelado ──
  console.log('\nPrecio de modelado (R5.5–R5.9, design §4.3)');
  const clase = (min: string, max: string): ResultadoClase => ({
    class_min: min as never, class_max: max as never,
    hours_min: P.horasPorClase[min as 'C1'].min, hours_max: max === 'C6' ? null : P.horasPorClase[max as 'C1'].max,
    confidence: 'HIGH', desconocidos: 0,
  });
  const base = ficha({ intent: 'MODELING' });
  const precio = (min: string, max: string) => {
    const r = precioModelado(clase(min, max), PUBLICADO, base);
    return r.tipo === 'estimado' ? `${pesos(r.min)}–${pesos(r.max)}` : r.tipo;
  };
  check('C1 → $25.000 (mínimo)', precio('C1', 'C1') === '$25.000–$25.000', precio('C1', 'C1'));
  check('C2 → $25.000–$45.000', precio('C2', 'C2') === '$25.000–$45.000', precio('C2', 'C2'));
  check('C3 → $45.000–$90.000', precio('C3', 'C3') === '$45.000–$90.000', precio('C3', 'C3'));
  check('C2–C3 → $25.000–$90.000', precio('C2', 'C3') === '$25.000–$90.000', precio('C2', 'C3'));
  check('C4 → $90.000–$180.000', precio('C4', 'C4') === '$90.000–$180.000', precio('C4', 'C4'));
  check('C5 → $180.000–$360.000, con revisión recomendada',
    (() => { const r = precioModelado(clase('C5', 'C5'), PUBLICADO, base); return r.tipo === 'estimado' && r.min === 180000 && r.max === 360000 && r.revisionRecomendada; })());
  const rev = (c: ResultadoClase, p: ParametrosComerciales, f: Ficha) => { const r = precioModelado(c, p, f); return r.tipo === 'revision' ? r.motivo : r.tipo; };
  check('C6 → revisión', rev(clase('C4', 'C6'), PUBLICADO, base) === 'c6');
  check('T12: tarifa vacía → revisión/sin-tarifa', rev(clase('C2', 'C2'), { ...PUBLICADO, MODEL_HOURLY_RATE_COP: null }, base) === 'sin-tarifa');
  check('mínimo vacío → revisión/sin-tarifa', rev(clase('C2', 'C2'), { ...PUBLICADO, MODEL_MIN_PRICE_COP: null }, base) === 'sin-tarifa');
  check('interruptor apagado → revisión/no-publicado, con clase y horas',
    (() => { const r = precioModelado(clase('C2', 'C3'), P, base); return r.tipo === 'revision' && r.motivo === 'no-publicado' && r.class_min === 'C2' && r.hours_max === 2; })());
  check('precisión 2 → revisión/tolerancia', rev(clase('C3', 'C3'), PUBLICADO, ficha({ modeling: { factors: fac(1, 1, 1, 1, 2, 0) } })) === 'tolerancia');
  check('uso crítico → revisión/crítica', rev(clase('C2', 'C2'), PUBLICADO, ficha({ technical: { critical_use: true } })) === 'critica');
  check('ruta VOLUME → en-propuesta (T07)', rev(clase('C2', 'C3'), PUBLICADO, ficha({ demand: { initial_quantity: 120 } })) === 'en-propuesta');
  check('archivo listo sin cambios → no-requiere (T11)', rev(clase('C2', 'C3'), PUBLICADO, ficha({ part: { has_file: true, file_needs_changes: false } })) === 'no-requiere');

  // ── Uso crítico ──
  console.log('\nUso crítico (R6.1, design §4.4)');
  for (const t of ['pastilla de freno de una moto', 'soporte de la caja de dirección', 'tapa del airbag del timón', 'hebilla del cinturón de seguridad',
    'pieza estructural del chasis', 'refuerzo estructural del techo', 'válvula de presión de un compresor', 'tapa de la bomba de gasolina', 'casco de protección', 'rótula de la suspensión']) {
    check(`positivo: «${t}»`, esUsoCritico(t));
  }
  for (const t of ['mi dirección es calle 10 # 5-20', 'tapa decorativa para el tablero', 'soporte para celular', 'rejilla con encaje a presión', 'clip que cierra a presión', 'soporte estructural para repisa de baño']) {
    check(`negativo: «${t}»`, !esUsoCritico(t));
  }
  check('la ficha lo marca aunque el modelo no lo haga', ficha({ part: { description: 'Soporte de la mordaza de freno' } }).derived.critical_by_keywords);
  check('T10: crítica → TECHNICAL_REVIEW con WhatsApp obligatorio',
    (() => { const f = ficha({ part: { description: 'pieza del freno' } }); return f.derived.next_action === 'TECHNICAL_REVIEW' && f.derived.whatsapp === 'REQUIRED'; })());

  // ── Mezcla ──
  console.log('\nMezcla de la ficha (R2.2, design §3.2)');
  const f1 = mezclarFicha(FICHA_VACIA, { customer_profile: 'WORKSHOP_CONSUMER', part: { description: 'rejilla' }, demand: { initial_quantity: 15 } });
  const f2 = mezclarFicha(f1, { part: { application: 'tablero' } });
  check('conserva lo que no viene (T16)', f2.customer_profile === 'WORKSHOP_CONSUMER' && f2.part.description === 'rejilla' && f2.demand.initial_quantity === 15 && f2.part.application === 'tablero');
  const f3 = mezclarFicha(f2, { part: { description: null }, demand: { initial_quantity: null } } as FichaParcial);
  check('un null explícito no borra', f3.part.description === 'rejilla' && f3.demand.initial_quantity === 15);
  check('UNKNOWN no borra un perfil conocido', mezclarFicha(f2, { customer_profile: 'UNKNOWN' }).customer_profile === 'WORKSHOP_CONSUMER');
  check('un valor nuevo corrige', mezclarFicha(f2, { demand: { initial_quantity: 20 } }).demand.initial_quantity === 20);
  const o1 = mezclarFicha(FICHA_VACIA, { modeling: { operations: ['SHELL', 'EXTRUDE'] } });
  const o2 = mezclarFicha(o1, { modeling: { operations: ['EXTRUDE', 'PATTERN'] } });
  check('las operaciones se unen sin duplicados', o2.modeling.operations.join() === 'SHELL,EXTRUDE,PATTERN', o2.modeling.operations.join());
  check('reset_modeling las borra', mezclarFicha(o2, { reset_modeling: true, modeling: { operations: ['REVOLVE'] } }).modeling.operations.join() === 'REVOLVE');
  const c1 = mezclarFicha(FICHA_VACIA, { technical: { critical_use: true, ip_request: true } });
  const c2 = mezclarFicha(c1, { technical: { critical_use: false, ip_request: false } });
  check('critical_use e ip_request no vuelven a false', c2.technical.critical_use && c2.technical.ip_request);
  const parcialF = mezclarFicha(FICHA_VACIA, { modeling: { factors: { geometria: 1, detalles: 1 } } });
  check('factores no enviados quedan desconocidos', parcialF.modeling.factors?.ensamble === 'UNKNOWN' && parcialF.modeling.factors?.geometria === 1);
  const sobre = mezclarFicha(parcialF, { modeling: { factors: { ensamble: 2 } } });
  check('un factor nuevo conserva los anteriores', sobre.modeling.factors?.geometria === 1 && sobre.modeling.factors?.ensamble === 2);
  check('ignora campos que no son de la ficha', !('precio' in mezclarFicha(FICHA_VACIA, { precio: 1 } as unknown as FichaParcial)));
  check('ignora valores fuera del enum', mezclarFicha(FICHA_VACIA, { customer_profile: 'VIP' } as unknown as FichaParcial).customer_profile === 'UNKNOWN');

  // ── Faltantes ──
  console.log('\nFaltantes (R2.3, R2.4, design §3.3)');
  const campos = (f: Ficha) => faltantes(f).map((x) => x.campo);
  check('sin perfil, lo primero es el perfil', campos(ficha({ intent: 'REPLACE_PART' }))[0] === 'customer_profile');
  const t01 = ficha({ customer_profile: 'INDIVIDUAL', intent: 'REPLACE_PART', part: { description: 'rejilla del aire del carro' } });
  check('T01: después del perfil y la pieza pregunta el vehículo', campos(t01)[0] === 'part.vehicle_or_equipment', campos(t01).join(' → '));
  check('T01: no empieza por modelado', t01.derived.next_action === 'ASK' && t01.derived.class_min === null);
  const reemplazo = ficha({ customer_profile: 'INDIVIDUAL', intent: 'REPLACE_PART', part: { description: 'x', vehicle_or_equipment: { make: 'Chevrolet', model: 'Spark', year: '2016' } } });
  check('reemplazo: aplicación → muestra → cantidad → función', campos(reemplazo).join(',') === 'part.application,part.physical_sample,demand.initial_quantity,technical.function', campos(reemplazo).join(','));
  const taller = ficha({ customer_profile: 'WORKSHOP_CONSUMER', intent: 'RECURRING_SUPPLY', part: { description: 'buje' } });
  check('suministro: cantidad → recurrencia → canal → requisitos', campos(taller).join(',') === 'demand.initial_quantity,demand.recurrence,demand.channel,technical.requirements', campos(taller).join(','));
  const modelado = ficha({ customer_profile: 'INDIVIDUAL', intent: 'MODELING', part: { description: 'piñón', has_file: false }, modeling: { factors: fac(1, 1, U, 0, U, 0), operations: ['PATTERN', 'REVOLVE'] } });
  check('modelado: el factor desconocido de más peso (precisión antes que ensamble)', campos(modelado)[0] === 'modeling.factors.precision', campos(modelado).join(','));
  const engranaje = ficha({ customer_profile: 'INDIVIDUAL', intent: 'MODELING', part: { description: 'piñón', has_file: false }, modeling: { factors: fac(1, 1, U, 0, 1, 0), operations: ['PATTERN', 'REVOLVE'] } });
  check('engranaje: pregunta con qué engrana (§22)', faltantes(engranaje)[0].pregunta.includes('engrana'), faltantes(engranaje)[0].pregunta);
  const t23 = ficha({ customer_profile: 'INDIVIDUAL', intent: 'REPLACE_PART', part: { description: 'tapa', physical_sample: 'NONE', dimensions_text: 'UNKNOWN', application: 'UNKNOWN', vehicle_or_equipment: { make: 'UNKNOWN', model: 'UNKNOWN', year: 'UNKNOWN' } } });
  check('T23: UNKNOWN no aparece como faltante', !campos(t23).some((c) => c.startsWith('part.')), campos(t23).join(','));
  const noSabe = ficha({ customer_profile: 'INDIVIDUAL', intent: 'MODELING', part: { description: 'x', has_file: false, dimensions_text: 'UNKNOWN' }, modeling: { factors: fac(1, 1, U, 0, 1, 0), customer_unknown: ['ensamble'] } });
  check('un factor que el cliente no sabe no se vuelve a preguntar', !campos(noSabe).includes('modeling.factors.ensamble') && noSabe.derived.class_max === 'C3', campos(noSabe).join(','));
  check('mantenimiento: marca → síntoma → cambios, sin perfil',
    campos(ficha({ intent: 'MAINTENANCE' })).join(',') === 'part.vehicle_or_equipment.make,part.description,technical.requirements',
    campos(ficha({ intent: 'MAINTENANCE' })).join(','));
  check('mantenimiento: con la marca, pregunta el modelo',
    campos(ficha({ intent: 'MAINTENANCE', part: { vehicle_or_equipment: { make: 'Creality' } } }))[0] === 'part.vehicle_or_equipment.model');
  check('con un archivo listo no pregunta el perfil antes de cotizar',
    !campos(ficha({ part: { has_file: true }, demand: { initial_quantity: 4 } })).includes('customer_profile'));
  check('la señal de reventa basta como perfil', !campos(ficha({ intent: 'RECURRING_SUPPLY', demand: { channel: 'RESALE' } })).includes('customer_profile'));

  // ── Siguiente acción ──
  console.log('\nSiguiente acción (design §4.5)');
  const t06 = ficha({ customer_profile: 'RESELLER', intent: 'RECURRING_SUPPLY', part: { description: 'rejilla' }, demand: { initial_quantity: 50, channel: 'RESALE' } });
  check('T06: VOLUME → COMMERCIAL_WHATSAPP, obligatorio', t06.derived.next_action === 'COMMERCIAL_WHATSAPP' && t06.derived.whatsapp === 'REQUIRED');
  const t04 = ficha({ customer_profile: 'WORKSHOP_CONSUMER', intent: 'RECURRING_SUPPLY', part: { description: 'buje' }, demand: { initial_quantity: 15, recurrence: 'MONTHLY' } });
  check('T04: EVALUATE → ofrece WhatsApp', t04.derived.volume_route === 'EVALUATE' && t04.derived.whatsapp === 'OFFER');
  check('T09: ip_request → TECHNICAL_REVIEW', ficha({ technical: { ip_request: true } }).derived.next_action === 'TECHNICAL_REVIEW');
  check('sin faltantes y compra de tienda → SEARCH_CATALOG', ficha({ intent: 'BUY_CATALOG_PART', part: { description: 'boquilla 0.4' } }).derived.next_action === 'SEARCH_CATALOG');

  // ── Resumen ──
  console.log('\nResumen para el asesor (R10, design §5.5)');
  const rejilla = ficha({
    customer_profile: 'RESELLER', business_name: 'Repuestos El Cruce', intent: 'RECURRING_SUPPLY',
    part: { description: 'rejilla de ventilación central', application: 'tablero', vehicle_or_equipment: { make: 'Chevrolet', model: 'Spark GT', year: '2016' }, physical_sample: 'FRAGMENTS', dimensions_text: 'unos 12 x 6 cm' },
    demand: { initial_quantity: 50, recurrence: 'MONTHLY', monthly_quantity_estimate: 20, channel: 'RESALE' },
    technical: { requirements: 'ABS negro, encaje a presión' },
    modeling: { factors: fac(1, 2, 1, 2, 1, U), operations: ['SHELL'] },
  });
  const msg = armarResumenAsesor(rejilla, [{ descripcion: 'Impresión de rejilla.stl', detalle: 'cotización Q-7F3K: 4 × $10.983' }], 'VOLUME');
  const esperado = [
    'Hola, vengo del asistente de cotización de Cesgar.',
    'Motivo: Producción por volumen (50 unidades de una referencia).',
    'Perfil: Revendedor · Repuestos El Cruce',
    'Pieza: rejilla de ventilación central — Chevrolet Spark GT 2016, tablero',
    'Cantidad: 50 iniciales · mensual · ≈ 20/mes · para reventa',
    'Muestra: fragmentos · Medidas: unos 12 x 6 cm',
    'Requisitos: ABS negro, encaje a presión',
    'Modelado: C4–C5 preliminar (confianza media)',
    'Detalle:',
    '• Impresión de rejilla.stl (cotización Q-7F3K: 4 × $10.983).',
    'Envío fotos de la pieza por aquí.',
  ].join('\n');
  check('plantilla de design §5.5', msg === esperado, JSON.stringify(msg));
  check('«encaje a presión» no la vuelve crítica', !rejilla.derived.critical_by_keywords);
  const conPrecio = ficha({ part: { description: 'tapa de $20.000' }, technical: { requirements: 'cuesta 5000 pesos' } });
  const sinPrecios = armarResumenAsesor(conPrecio, [], 'OTHER');
  check('sin precios escritos por el modelo', !/\$|pesos/.test(sinPrecios), sinPrecios);
  const larga = ficha({
    customer_profile: 'COMPANY', intent: 'REPLACE_PART',
    part: { description: 'p'.repeat(140), application: 'a'.repeat(140) },
    technical: { function: 'f'.repeat(140), requirements: 'r'.repeat(140) },
  });
  const muchas = Array.from({ length: 6 }, (_, i) => ({ descripcion: `${'d'.repeat(130)} ${i}`, detalle: 'n'.repeat(70) }));
  const recortado = armarResumenAsesor(larga, muchas, 'CRITICAL');
  check(`no pasa de ${MAX_CARACTERES_RESUMEN} caracteres`, recortado.length <= MAX_CARACTERES_RESUMEN, String(recortado.length));
  check('recorta primero pendientes, luego requisitos y luego piezas, con la cuenta',
    !recortado.includes('Pendientes:') && !recortado.includes('Requisitos:') && /• y \d+ más\./.test(recortado));
  check('nunca recorta el motivo ni la pieza', recortado.includes('Motivo: Revisión técnica.') && recortado.includes(`Pieza: ${'p'.repeat(140)}`));
  check('la línea de fotos va con PHOTOS_NEEDED', armarResumenAsesor(ficha({}), [], 'PHOTOS_NEEDED').endsWith('Envío fotos de la pieza por aquí.'));
  check('sin ficha (conversación vieja): saludo, motivo y piezas', armarResumenAsesor(null, [{ descripcion: 'Caja' }], 'CUSTOMER_ASKED') ===
    'Hola, vengo del asistente de cotización de Cesgar.\nMotivo: Atención con un asesor.\nNecesito:\n• Caja.');

  // ── T12 y T13, sin modelo ──
  console.log('\nT12 y T13');
  check('T12: sin tarifa de modelado no hay precio',
    precioModelado(clase('C2', 'C2'), { ...PUBLICADO, MODEL_HOURLY_RATE_COP: null }, base).tipo === 'revision');
  const hueca = { volumeMm3: 60_000, dimensions: { x: 250, y: 200, z: 150 }, boundingBoxVolumeCm3: (250 * 200 * 150) / 1000 };
  check('T13: STL hueco grande → relleno fijo 100', effectiveInfill(hueca, '20') === '100', effectiveInfill(hueca, '20'));
  const eleccion = { tech: 'fdm' as const, materialId: 'pla', layerHeight: '0.2', factorEscalado: 1, postProcessing: false };
  const q20 = quoteVerifiedModel({ ...eleccion, infillDensity: '20' }, hueca, DEFAULT_QUOTER_PRICING, 1);
  const q100 = quoteVerifiedModel({ ...eleccion, infillDensity: '100' }, hueca, DEFAULT_QUOTER_PRICING, 1);
  check('T13: sin descuento por caja ni por relleno', q20.ok && q100.ok && q20.cost.billableUnit === q100.cost.billableUnit,
    q20.ok && q100.ok ? `${pesos(q20.cost.billableUnit)} = ${pesos(q100.cost.billableUnit)}` : 'no cotizó');

  console.log(fallas ? `\n\x1b[31m${fallas} comprobación(es) fallaron\x1b[0m\n` : '\n\x1b[32mTodo en orden\x1b[0m\n');
  process.exit(fallas ? 1 : 0);
}

main();
