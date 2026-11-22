// Decisiones del agente que no dependen del modelo (design §4, N1): ruta
// comercial, clase de modelado, precio de modelado, uso crítico y siguiente
// acción. El modelo aporta lecturas del texto (factores, operaciones, perfil,
// recurrencia, canal); estas funciones las convierten en decisiones.
// Puro: lo prueba verify:clasificador sin red ni BD.

import { archivoListo, faltantes, type Factores, type Ficha, type Operacion, type Ruta } from './ficha';
import { CLASES, type Clase, type HorasPorClase, type ParametrosComerciales, type Umbrales } from './parametros-tipos';

// ── Ruta comercial (R4) ───────────────────────────────────────────────────────────────

/** Gana la primera fila que se cumple. La cantidad es por referencia: no se suman referencias distintas. */
export function rutaComercial(d: Ficha['demand'], p: Umbrales): Ruta {
  const q = typeof d.initial_quantity === 'number' ? d.initial_quantity : 0;
  const mes = typeof d.monthly_quantity_estimate === 'number' ? d.monthly_quantity_estimate : 0;
  if (q >= p.Q_INDUSTRIAL_PRIORITY || mes >= p.Q_INDUSTRIAL_PRIORITY) return 'INDUSTRIAL_PRIORITY';
  if (q >= p.Q_VOLUMEN_MIN) return 'VOLUME';
  // VARIABLE no cuenta: los umbrales de lanzamiento solo nombran semanal, mensual y trimestral.
  const recurrente = d.recurrence === 'WEEKLY' || d.recurrence === 'MONTHLY' || d.recurrence === 'QUARTERLY';
  if (q >= p.Q_EVALUAR || recurrente || d.multiple_references === true || d.channel === 'RESALE' || d.channel === 'BOTH') return 'EVALUATE';
  if (q >= 10) return 'SMALL_BATCH';
  return 'INDIVIDUAL';
}

export const esRutaDeVolumen = (r: Ruta) => r === 'VOLUME' || r === 'INDUSTRIAL_PRIORITY';

// ── Clase de modelado (R5.2–R5.4) ─────────────────────────────────────────────────────

/** §4.2: 0–2 = C1; 3–4 = C2; 5–6 = C3; 7–8 = C4; 9–10 = C5; 11–12 = C6. */
const CORTES: Array<[number, Clase]> = [[2, 'C1'], [4, 'C2'], [6, 'C3'], [8, 'C4'], [10, 'C5'], [12, 'C6']];

/** Piso por operación (§22, §23): la operación impone una clase mínima aunque los puntos sumen menos. */
export const PISO: Partial<Record<Operacion, Clase>> = {
  KINEMATICS: 'C4',
  FREEFORM_SURFACE: 'C4',
  ASSEMBLY: 'C3',
  FIT_TOLERANCE: 'C3',
  LOFT: 'C3',
};

const indice = (c: Clase) => CLASES.indexOf(c);
const mayor = (a: Clase, b: Clase): Clase => (indice(a) >= indice(b) ? a : b);

export function clasePorSuma(puntos: number): Clase {
  for (const [hasta, clase] of CORTES) if (puntos <= hasta) return clase;
  return 'C6';
}

export interface ResultadoClase {
  class_min: Clase;
  class_max: Clase;
  hours_min: number;
  /** null si el rango llega a C6: no hay horas máximas. */
  hours_max: number | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  desconocidos: number;
}

/**
 * El factor desconocido se evalúa en 0 (clase mínima) y en 2 (clase máxima):
 * el rango se abre por falta de datos, no por el nombre de la pieza (§4, §23).
 */
export function claseModelado(m: { factors: Factores | null; operations: Operacion[] }, horas: HorasPorClase): ResultadoClase | null {
  if (!m.factors) return null;
  const vals = Object.values(m.factors);
  const desconocidos = vals.filter((v) => v === 'UNKNOWN').length;
  const base = vals.reduce<number>((s, v) => s + (v === 'UNKNOWN' ? 0 : v), 0);
  const piso = m.operations.map((o) => PISO[o]).filter((c): c is Clase => !!c).reduce<Clase>(mayor, 'C1');
  const min = mayor(clasePorSuma(base), piso);
  const max = mayor(clasePorSuma(base + 2 * desconocidos), min);
  return {
    class_min: min,
    class_max: max,
    hours_min: horas[min].min,
    hours_max: max === 'C6' ? null : horas[max].max,
    confidence: desconocidos === 0 ? 'HIGH' : desconocidos <= 2 ? 'MEDIUM' : 'LOW',
    desconocidos,
  };
}

/** "C2–C3" o "C1". */
export const textoClase = (min: Clase, max: Clase) => (min === max ? min : `${min}–${max}`);

// ── Uso crítico (R6.1) ────────────────────────────────────────────────────────────────

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Palabras completas, sin tildes. Prefiere el exceso: una falsa alarma cuesta una
 * derivación; un caso no detectado lo cubre el modelo con `critical_use`.
 * «Dirección» sola no cuenta (también es la dirección postal) y «a presión»
 * tampoco (es un encaje: «cierre a presión»).
 */
const CRITICOS = [
  /\bfrenos?\b/, /\bpastillas? de freno\b/, /\bcaliper\b/, /\bmordaza de freno\b/,
  /\bcaja de direccion\b/, /\bcolumna de direccion\b/, /\bcremallera\b/, /\bterminal(es)? de direccion\b/, /\brotulas?\b/, /\bdireccion hidraulica\b/,
  /\bsuspension\b/, /\bamortiguador(es)?\b/, /\bespiral(es)? de suspension\b/, /\btijeras?\b/,
  /\bairbags?\b/, /\bbolsas? de aire\b/, /\bcinturon(es)?\b/, /\bpretensor(es)?\b/,
  // «Estructural» suelto no: el modelo llama así a un soporte de repisa. Cuenta si va con un vehículo o una construcción.
  /\bestructural(es)? (del?|para) (la )?(vehiculo|carro|moto|camion|edificio|casa|construccion|techo|chasis)\b/,
  /\b(viga|columna|refuerzo) estructural\b/, /\bestructura portante\b/, /\bchasis\b/,
  /\balta presion\b/, /\bvalvulas? de presion\b/, /\bcilindros? de gas\b/, /\btanques? de gas\b/,
  /\b(recipiente|tanque|cilindro|linea|manguera|sistema)s? (a|de) presion\b/,
  /(?<!\b(a|al|por) )\bpresion\b/,
  /\bcombustible\b/, /\bgasolina\b/, /\bdiesel\b/, /\binyector(es)?\b/, /\bbomba de gasolina\b/,
  /\bsistemas? de seguridad\b/, /\bdispositivos? de seguridad\b/, /\bproteccion personal\b/, /\bcascos?\b/,
];

export function esUsoCritico(texto: string): boolean {
  const t = normalizar(texto);
  return CRITICOS.some((r) => r.test(t));
}

// ── Precio de modelado (R5.5–R5.9) ────────────────────────────────────────────────────

export type MotivoRevision = 'critica' | 'c6' | 'tolerancia' | 'sin-tarifa' | 'no-publicado';

export type EstimadoModelado =
  | { tipo: 'no-requiere' }
  | ({ tipo: 'en-propuesta' } & ResultadoClase)
  | ({ tipo: 'revision'; motivo: MotivoRevision } & ResultadoClase)
  | ({ tipo: 'estimado'; min: number; max: number; revisionRecomendada: boolean } & ResultadoClase);

const redondear100 = (n: number) => Math.round(n / 100) * 100;

export const esCritica = (f: Ficha) => f.technical.critical_use || f.derived.critical_by_keywords;

/**
 * Con `f.derived` ya calculado. La crítica va antes que la ruta de volumen: una
 * pieza de frenos se revisa aunque sean 200 unidades.
 */
export function precioModelado(c: ResultadoClase, p: ParametrosComerciales, f: Ficha): EstimadoModelado {
  if (archivoListo(f)) return { tipo: 'no-requiere' };
  if (esCritica(f)) return { tipo: 'revision', motivo: 'critica', ...c };
  if (esRutaDeVolumen(f.derived.volume_route)) return { tipo: 'en-propuesta', ...c };
  const motivo: MotivoRevision | null =
    c.class_max === 'C6' ? 'c6'
    : f.modeling.factors?.precision === 2 ? 'tolerancia'
    : p.MODEL_HOURLY_RATE_COP == null || p.MODEL_MIN_PRICE_COP == null ? 'sin-tarifa'
    : !p.publicarPrecioModelado ? 'no-publicado'
    : null;
  if (motivo) return { tipo: 'revision', motivo, ...c };
  const tarifa = p.MODEL_HOURLY_RATE_COP!;
  const minimo = p.MODEL_MIN_PRICE_COP!;
  const precio = (h: number) => redondear100(Math.max(minimo, h * tarifa));
  return { tipo: 'estimado', ...c, min: precio(c.hours_min), max: precio(c.hours_max!), revisionRecomendada: c.class_max === 'C5' };
}

// ── Siguiente acción (design §4.5) ────────────────────────────────────────────────────

export function siguienteAccion(f: Ficha, hayFaltantes: boolean): Pick<Ficha['derived'], 'next_action' | 'whatsapp'> {
  const ruta = f.derived.volume_route;
  if (f.derived.requires_human_review || f.technical.ip_request) return { next_action: 'TECHNICAL_REVIEW', whatsapp: 'REQUIRED' };
  if (esRutaDeVolumen(ruta)) return { next_action: 'COMMERCIAL_WHATSAPP', whatsapp: 'REQUIRED' };
  const ofrecer = ruta === 'EVALUATE' ? 'OFFER' : 'NO';
  if (hayFaltantes) return { next_action: 'ASK', whatsapp: ofrecer };
  if (f.intent === 'BUY_CATALOG_PART' || f.intent === 'MAINTENANCE') return { next_action: 'SEARCH_CATALOG', whatsapp: ofrecer };
  return { next_action: 'QUOTE', whatsapp: ofrecer };
}

// ── Todo junto ────────────────────────────────────────────────────────────────────────

/** Arma `ficha.derived` completo, después de mezclar (design §3.2). */
export function calcularDerivados(ficha: Ficha, p: ParametrosComerciales): Ficha {
  const textoLibre = [ficha.part.description, ficha.part.application, ficha.technical.function, ficha.technical.requirements]
    .filter(Boolean).join(' · ');
  const clase = archivoListo(ficha) ? null : claseModelado(ficha.modeling, p.horasPorClase);
  const critical_by_keywords = esUsoCritico(textoLibre);
  const requires_human_review =
    ficha.technical.critical_use || critical_by_keywords || clase?.class_max === 'C6' || ficha.modeling.factors?.precision === 2;

  const parcial: Ficha = {
    ...ficha,
    derived: {
      ...ficha.derived,
      volume_route: rutaComercial(ficha.demand, p),
      catalog_opportunity: ficha.demand.shared_demand_signal,
      critical_by_keywords,
      class_min: clase?.class_min ?? null,
      class_max: clase?.class_max ?? null,
      hours_min: clase?.hours_min ?? null,
      hours_max: clase?.hours_max ?? null,
      confidence: clase?.confidence ?? null,
      requires_human_review,
      missing: [],
      parameters_version: p.PRICE_LIST_VERSION,
    },
  };
  const missing = faltantes(parcial);
  return { ...parcial, derived: { ...parcial.derived, missing, ...siguienteAccion(parcial, missing.length > 0) } };
}

/** Por qué la ficha pide revisión humana, en una frase para el modelo y el asesor. */
export function motivoRevision(f: Ficha): string | null {
  if (esCritica(f)) return 'uso crítico o de seguridad';
  if (f.technical.ip_request) return 'pide CAD editable, exclusividad o derechos';
  if (f.derived.class_max === 'C6') return 'desarrollo especial (C6)';
  if (f.modeling.factors?.precision === 2) return 'tolerancia crítica';
  return null;
}
