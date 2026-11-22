// Ficha de la solicitud (spec v5.1 §17.1 y §27; design §3). Una por
// conversación: el agente la completa con actualizar_ficha y el servidor la
// mezcla, la clasifica y la guarda. Puro: sin prisma, server-only, react ni next.
//
// `null` = no se preguntó. `'UNKNOWN'` = el cliente no lo sabe (R2.4). Solo
// `null` genera un faltante.

import type { Clase } from './parametros-tipos';

export type Desconocido = 'UNKNOWN';
export type Punto = 0 | 1 | 2 | Desconocido;

export const PERFILES = ['INDIVIDUAL', 'WORKSHOP_CONSUMER', 'RESELLER', 'COMPANY', 'UNKNOWN'] as const;
export const INTENCIONES = [
  'REPLACE_PART', 'REPRODUCE_PART', 'BUY_CATALOG_PART', 'RECURRING_SUPPLY',
  'CUSTOM_MANUFACTURING', 'MODELING', 'SCAN', 'MAINTENANCE', 'OTHER', 'UNKNOWN',
] as const;
export const MUESTRAS = ['COMPLETE', 'FRAGMENTS', 'SIMILAR_PART', 'NONE', 'UNKNOWN'] as const;
export const RECURRENCIAS = ['ONE_TIME', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'VARIABLE', 'UNKNOWN'] as const;
export const CANALES = ['OWN_USE', 'RESALE', 'BOTH', 'UNKNOWN'] as const;
export const OPERACIONES = [
  'EXTRUDE', 'REVOLVE', 'SHELL', 'PATTERN', 'LOFT', 'FREEFORM_SURFACE', 'ASSEMBLY', 'FIT_TOLERANCE', 'KINEMATICS',
] as const;
export const FACTORES = ['geometria', 'detalles', 'ensamble', 'referencias', 'precision', 'desarrollo'] as const;
export const RUTAS = ['INDIVIDUAL', 'SMALL_BATCH', 'EVALUATE', 'VOLUME', 'INDUSTRIAL_PRIORITY'] as const;

export type Perfil = (typeof PERFILES)[number];
export type Intencion = (typeof INTENCIONES)[number];
export type Operacion = (typeof OPERACIONES)[number];
export type Factor = (typeof FACTORES)[number];
export type Ruta = (typeof RUTAS)[number];
export type Factores = Record<Factor, Punto>;

export interface Faltante {
  campo: string;
  /** Pregunta mínima en el tono de la v5.1 (§11.1, §22, §25). El modelo la reformula, no cambia el dato. */
  pregunta: string;
}

export interface Ficha {
  version: 1;
  customer_profile: Perfil;
  /** Solo si el cliente lo dice (D6). */
  business_name: string | null;
  intent: Intencion;
  part: {
    description: string | null;
    application: string | null;
    vehicle_or_equipment: { make: string | null; model: string | null; year: string | null; version: string | null };
    physical_sample: (typeof MUESTRAS)[number] | null;
    has_file: boolean | null;
    file_needs_changes: boolean | null;
    /** Escaneo: si además de la malla necesita un CAD editable (§3.2). */
    needs_cad: boolean | null;
    dimensions_text: string | null;
  };
  demand: {
    /** De UNA referencia (R4.2). */
    initial_quantity: number | Desconocido | null;
    monthly_quantity_estimate: number | Desconocido | null;
    recurrence: (typeof RECURRENCIAS)[number] | null;
    channel: (typeof CANALES)[number] | null;
    multiple_references: boolean | null;
    /** Otros talleres o clientes piden la misma pieza (R4.6). */
    shared_demand_signal: boolean;
    city: string | null;
  };
  technical: {
    function: string | null;
    requirements: string | null;
    critical_use: boolean;
    ip_request: boolean;
  };
  modeling: {
    factors: Factores | null;
    operations: Operacion[];
    /** Factores que el cliente dijo no saber: siguen desconocidos para la clase, pero no se vuelven a preguntar (R2.4). */
    customer_unknown: Factor[];
  };
  // ── Lo calcula el servidor. El modelo no lo escribe ──────────────────────
  derived: {
    volume_route: Ruta;
    catalog_opportunity: boolean;
    critical_by_keywords: boolean;
    class_min: Clase | null;
    class_max: Clase | null;
    hours_min: number | null;
    hours_max: number | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
    requires_human_review: boolean;
    whatsapp: 'REQUIRED' | 'OFFER' | 'NO';
    next_action: 'ASK' | 'SEARCH_CATALOG' | 'QUOTE' | 'TECHNICAL_REVIEW' | 'COMMERCIAL_WHATSAPP';
    missing: Faltante[];
    parameters_version: string;
  };
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]> | null) : T[K] | null };

/** Lo que manda el modelo: cualquier subconjunto, sin `derived`. */
export type FichaParcial = DeepPartial<Omit<Ficha, 'version' | 'derived'>> & { reset_modeling?: boolean | null };

export const FICHA_VACIA: Ficha = {
  version: 1,
  customer_profile: 'UNKNOWN',
  business_name: null,
  intent: 'UNKNOWN',
  part: {
    description: null,
    application: null,
    vehicle_or_equipment: { make: null, model: null, year: null, version: null },
    physical_sample: null,
    has_file: null,
    file_needs_changes: null,
    needs_cad: null,
    dimensions_text: null,
  },
  demand: {
    initial_quantity: null,
    monthly_quantity_estimate: null,
    recurrence: null,
    channel: null,
    multiple_references: null,
    shared_demand_signal: false,
    city: null,
  },
  technical: { function: null, requirements: null, critical_use: false, ip_request: false },
  modeling: { factors: null, operations: [], customer_unknown: [] },
  derived: {
    volume_route: 'INDIVIDUAL',
    catalog_opportunity: false,
    critical_by_keywords: false,
    class_min: null,
    class_max: null,
    hours_min: null,
    hours_max: null,
    confidence: null,
    requires_human_review: false,
    whatsapp: 'NO',
    next_action: 'ASK',
    missing: [],
    parameters_version: '',
  },
};

// ── Mezcla (design §3.2) ──────────────────────────────────────────────────────────────

const de = <T extends readonly string[]>(lista: T, v: unknown): T[number] | undefined =>
  typeof v === 'string' && (lista as readonly string[]).includes(v) ? (v as T[number]) : undefined;
const texto = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : undefined);
const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);
const cantidad = (v: unknown): number | Desconocido | undefined =>
  v === 'UNKNOWN' ? 'UNKNOWN' : typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined;
const punto = (v: unknown): Punto | undefined => (v === 0 || v === 1 || v === 2 || v === 'UNKNOWN' ? v : undefined);

/** Ausente o null conserva lo guardado; un valor válido lo reemplaza. */
const tomar = <T>(nuevo: T | undefined, viejo: T): T => (nuevo === undefined ? viejo : nuevo);
/** Perfil e intención: UNKNOWN es su estado vacío, así que no borra un valor conocido. */
const tomarConocido = <T extends string>(nuevo: T | undefined, viejo: T): T =>
  nuevo === undefined || (nuevo === 'UNKNOWN' && viejo !== 'UNKNOWN') ? viejo : nuevo;

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/**
 * Recorre el esquema, nunca la entrada: lo que no está en la ficha se ignora.
 * Un campo ausente o en null conserva el valor guardado (el modelo no puede
 * «olvidar» un dato). `critical_use`, `ip_request` y `shared_demand_signal`
 * no vuelven a false. `operations` se une sin duplicados, salvo con
 * `reset_modeling`. `derived` no se toca aquí: lo recalcula calcularDerivados.
 */
export function mezclarFicha(guardada: Ficha, parcial: FichaParcial | Record<string, unknown> | null | undefined): Ficha {
  const p = obj(parcial);
  const g = guardada;
  const part = obj(p.part);
  const veh = obj(part.vehicle_or_equipment);
  const dem = obj(p.demand);
  const tec = obj(p.technical);
  const mod = obj(p.modeling);
  const reset = p.reset_modeling === true;

  const baseModelado = reset ? FICHA_VACIA.modeling : g.modeling;
  const factoresNuevos = obj(mod.factors);
  const hayFactores = FACTORES.some((f) => punto(factoresNuevos[f]) !== undefined);
  let factors = baseModelado.factors;
  if (hayFactores) {
    const previos = factors ?? (Object.fromEntries(FACTORES.map((f) => [f, 'UNKNOWN'])) as Factores);
    factors = Object.fromEntries(FACTORES.map((f) => [f, tomar(punto(factoresNuevos[f]), previos[f])])) as Factores;
  }
  const ops = Array.isArray(mod.operations) ? mod.operations.map((o) => de(OPERACIONES, o)).filter((o): o is Operacion => !!o) : [];
  const noSabe = Array.isArray(mod.customer_unknown) ? mod.customer_unknown.map((f) => de(FACTORES, f)).filter((f): f is Factor => !!f) : [];

  return {
    version: 1,
    customer_profile: tomarConocido(de(PERFILES, p.customer_profile), g.customer_profile),
    business_name: tomar(texto(p.business_name), g.business_name),
    intent: tomarConocido(de(INTENCIONES, p.intent), g.intent),
    part: {
      description: tomar(texto(part.description), g.part.description),
      application: tomar(texto(part.application), g.part.application),
      vehicle_or_equipment: {
        make: tomar(texto(veh.make), g.part.vehicle_or_equipment.make),
        model: tomar(texto(veh.model), g.part.vehicle_or_equipment.model),
        year: tomar(texto(typeof veh.year === 'number' ? String(veh.year) : veh.year), g.part.vehicle_or_equipment.year),
        version: tomar(texto(veh.version), g.part.vehicle_or_equipment.version),
      },
      physical_sample: tomar(de(MUESTRAS, part.physical_sample), g.part.physical_sample),
      has_file: tomar(bool(part.has_file), g.part.has_file),
      file_needs_changes: tomar(bool(part.file_needs_changes), g.part.file_needs_changes),
      needs_cad: tomar(bool(part.needs_cad), g.part.needs_cad),
      dimensions_text: tomar(texto(part.dimensions_text), g.part.dimensions_text),
    },
    demand: {
      initial_quantity: tomar(cantidad(dem.initial_quantity), g.demand.initial_quantity),
      monthly_quantity_estimate: tomar(cantidad(dem.monthly_quantity_estimate), g.demand.monthly_quantity_estimate),
      recurrence: tomar(de(RECURRENCIAS, dem.recurrence), g.demand.recurrence),
      channel: tomar(de(CANALES, dem.channel), g.demand.channel),
      multiple_references: tomar(bool(dem.multiple_references), g.demand.multiple_references),
      shared_demand_signal: g.demand.shared_demand_signal || dem.shared_demand_signal === true,
      city: tomar(texto(dem.city), g.demand.city),
    },
    technical: {
      function: tomar(texto(tec.function), g.technical.function),
      requirements: tomar(texto(tec.requirements), g.technical.requirements),
      critical_use: g.technical.critical_use || tec.critical_use === true,
      ip_request: g.technical.ip_request || tec.ip_request === true,
    },
    modeling: {
      factors,
      operations: [...new Set([...baseModelado.operations, ...ops])],
      customer_unknown: [...new Set([...baseModelado.customer_unknown, ...noSabe])],
    },
    derived: g.derived,
  };
}

/**
 * Ficha guardada en ChatSession.ficha. Una conversación de antes del cambio
 * (sin ficha) o un JSON corrupto arrancan vacíos (N5).
 */
export function leerFichaGuardada(json: string | null | undefined): Ficha | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    const ficha = mezclarFicha(FICHA_VACIA, raw);
    const d = obj(raw.derived);
    return { ...ficha, derived: { ...FICHA_VACIA.derived, ...(d as Partial<Ficha['derived']>), missing: Array.isArray(d.missing) ? (d.missing as Faltante[]) : [] } };
  } catch {
    return null;
  }
}

// ── Faltantes (design §3.3) ───────────────────────────────────────────────────────────

export const PREGUNTA_PERFIL =
  '¿Necesitas esta pieza para reparar algo puntual o trabajas en un taller o negocio donde la usas o la vendes?';

const P = {
  description: '¿Qué pieza necesitas fabricar o reemplazar?',
  vehicle: '¿De qué vehículo o equipo es (marca y modelo)?',
  year: '¿De qué año es el vehículo o equipo?',
  application: '¿En qué parte va instalada y qué función cumple?',
  sample: '¿Conservas la pieza dañada, algunos fragmentos u otra igual?',
  quantity: '¿Cuántas unidades necesitas de esa pieza?',
  function: '¿Qué función cumple la pieza y qué esfuerzo o temperatura soporta?',
  recurrence: '¿Es una compra única o la vas a necesitar cada semana, mes o trimestre?',
  channel: '¿Es para usarla en tu taller o negocio, para venderla, o las dos?',
  requirements: '¿Qué requisitos tiene: material, carga, temperatura o acabado?',
  hasFile: '¿Ya tienes un archivo STL o CAD de la pieza, o hay que diseñarla?',
  dimensions: '¿Tienes el largo, ancho y alto aproximados?',
  scanSize: '¿Qué tamaño aproximado tiene el objeto que quieres escanear?',
  needsCad: '¿Necesitas solo la malla 3D o también un CAD editable para modificarla?',
  make: '¿Qué marca es tu impresora?',
  modelPrinter: '¿Qué modelo es?',
  symptom: '¿Qué está fallando o qué síntoma notas?',
  changes: '¿Cambiaste algo hace poco (pieza, filamento, configuración o firmware)?',
} as const;

/** Preguntas mínimas de §22 por factor. La de ensamble y precisión se afinan con las operaciones probables. */
function preguntaFactor(f: Factor, ops: Operacion[]): string {
  switch (f) {
    case 'precision':
      return ops.includes('FIT_TOLERANCE')
        ? '¿Las piezas quedan fijas, deslizan o giran, y qué holgura necesitan?'
        : '¿La pieza tiene que encajar con otra a una medida exacta, o bastan medidas generales?';
    case 'referencias':
      return '¿Tienes medidas, un plano o la pieza original para tomarlas?';
    case 'ensamble':
      if (ops.includes('KINEMATICS')) return '¿Qué movimiento hace, con qué recorrido y qué carga soporta?';
      if (ops.includes('ASSEMBLY')) return '¿Cuántas piezas son, cómo se unen y cuáles se mueven?';
      if (ops.includes('PATTERN') && ops.includes('REVOLVE')) return '¿Con qué pieza engrana y conoces el módulo?';
      return '¿La pieza va sola o encaja, se atornilla o se mueve con otras?';
    case 'geometria':
      return '¿Es una pieza plana o recta, o tiene curvas o formas irregulares?';
    case 'detalles':
      return '¿Lleva agujeros, ranuras, clips, pestañas o texto?';
    case 'desarrollo':
      return '¿Es copiar una pieza que ya existe, adaptarla o diseñarla desde cero?';
  }
}

/** Orden de §3.3: primero lo que cambia la clase y la confianza. */
const ORDEN_FACTORES: Factor[] = ['precision', 'referencias', 'ensamble', 'geometria', 'detalles', 'desarrollo'];

const PERFIL_B = new Set<Perfil>(['WORKSHOP_CONSUMER', 'RESELLER', 'COMPANY']);
const RECURRENTE = new Set(['WEEKLY', 'MONTHLY', 'QUARTERLY']);

/** Hay una señal de perfil aunque el modelo no lo haya marcado (§11.1). */
function haySenalDePerfil(f: Ficha): boolean {
  return !!f.business_name || f.demand.channel === 'RESALE' || f.demand.channel === 'BOTH';
}

/** El modelado no aplica: archivo listo y sin cambios (R5.8). */
export const archivoListo = (f: Ficha) => f.part.has_file === true && f.part.file_needs_changes === false;

/**
 * Los datos que faltan, en orden de importancia para la intención. El agente
 * pregunta solo el primero (R2.3). `UNKNOWN` cuenta como respondido (R2.4).
 */
export function faltantes(f: Ficha): Faltante[] {
  const lista: Faltante[] = [];
  const falta = (cond: boolean, campo: string, pregunta: string) => { if (cond) lista.push({ campo, pregunta }); };
  const v = f.part.vehicle_or_equipment;

  // El perfil cambia la ruta; en mantenimiento y compras de tienda no cambia nada,
  // y con un archivo listo no se le pregunta antes de cotizar (la cantidad ya decide la ruta).
  if (f.intent !== 'MAINTENANCE' && f.intent !== 'BUY_CATALOG_PART' && f.part.has_file !== true) {
    falta(f.customer_profile === 'UNKNOWN' && !haySenalDePerfil(f), 'customer_profile', PREGUNTA_PERFIL);
  }

  const pieza = () => {
    falta(v.make == null || v.model == null, 'part.vehicle_or_equipment', P.vehicle);
    falta(v.make != null && v.model != null && v.year == null, 'part.vehicle_or_equipment.year', P.year);
    falta(f.part.application == null, 'part.application', P.application);
    falta(f.part.physical_sample == null, 'part.physical_sample', P.sample);
  };
  const suministro = () => {
    falta(f.part.description == null, 'part.description', P.description);
    falta(f.demand.initial_quantity == null, 'demand.initial_quantity', P.quantity);
    falta(f.demand.recurrence == null, 'demand.recurrence', P.recurrence);
    falta(f.demand.channel == null, 'demand.channel', P.channel);
    falta(f.technical.requirements == null, 'technical.requirements', P.requirements);
  };

  switch (f.intent) {
    case 'REPLACE_PART':
    case 'REPRODUCE_PART':
      if (PERFIL_B.has(f.customer_profile)) {
        // Un negocio: primero lo que decide la ruta comercial, después la pieza.
        suministro();
        pieza();
      } else {
        falta(f.part.description == null, 'part.description', P.description);
        pieza();
        falta(f.demand.initial_quantity == null, 'demand.initial_quantity', P.quantity);
        falta(f.technical.function == null, 'technical.function', P.function);
      }
      break;
    case 'RECURRING_SUPPLY':
    case 'CUSTOM_MANUFACTURING':
      suministro();
      break;
    case 'MODELING': {
      falta(f.part.description == null, 'part.description', P.description);
      falta(f.part.has_file == null, 'part.has_file', P.hasFile);
      if (!archivoListo(f) && f.modeling.factors) {
        const factores = f.modeling.factors;
        const desconocido = ORDEN_FACTORES.find((k) => factores[k] === 'UNKNOWN' && !f.modeling.customer_unknown.includes(k));
        if (desconocido) lista.push({ campo: `modeling.factors.${desconocido}`, pregunta: preguntaFactor(desconocido, f.modeling.operations) });
      }
      falta(f.part.dimensions_text == null, 'part.dimensions_text', P.dimensions);
      if (PERFIL_B.has(f.customer_profile)) falta(f.demand.initial_quantity == null, 'demand.initial_quantity', P.quantity);
      break;
    }
    case 'SCAN':
      falta(f.part.description == null, 'part.description', P.description);
      falta(f.part.dimensions_text == null, 'part.dimensions_text', P.scanSize);
      falta(f.part.needs_cad == null, 'part.needs_cad', P.needsCad);
      break;
    case 'MAINTENANCE':
      falta(v.make == null, 'part.vehicle_or_equipment.make', P.make);
      falta(v.make != null && v.model == null, 'part.vehicle_or_equipment.model', P.modelPrinter);
      falta(f.part.description == null, 'part.description', P.symptom);
      falta(f.technical.requirements == null, 'technical.requirements', P.changes);
      break;
    case 'BUY_CATALOG_PART':
      falta(f.part.description == null, 'part.description', '¿Qué repuesto o insumo buscas y para qué impresora?');
      break;
    default:
      falta(f.part.description == null, 'part.description', P.description);
      if (PERFIL_B.has(f.customer_profile) || RECURRENTE.has(f.demand.recurrence ?? '')) {
        falta(f.demand.initial_quantity == null, 'demand.initial_quantity', P.quantity);
      }
  }
  return lista;
}
