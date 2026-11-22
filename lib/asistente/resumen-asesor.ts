// Mensaje de WhatsApp para el asesor, armado con la ficha (spec v5.1 §5.7,
// §25.1; design §5.5). Lo usan la tool derivar_a_asesor y el navegador
// («Hablar con una persona» y el aviso de fotos). Puro.
//
// Los precios salen de las cotizaciones guardadas (LineaPieza.detalle), nunca
// de un texto del modelo: los textos de la ficha que traigan un precio se omiten.

import { numero } from '../formato';
import { enlaceWhatsApp } from '../contacto';
import { textoClase } from './clasificador';
import type { Faltante, Ficha } from './ficha';
import type { LineaPieza } from './mensaje-asesor';

export const MOTIVOS_DERIVACION = [
  'VOLUME', 'RECURRING', 'RESALE', 'CRITICAL', 'MODELING_REVIEW', 'PHOTOS_NEEDED',
  'OVERSIZE', 'SCAN', 'MAINTENANCE', 'IP_REQUEST', 'CUSTOMER_ASKED', 'OTHER',
] as const;
export type MotivoDerivacion = (typeof MOTIVOS_DERIVACION)[number];

/** Lo que ve el asesor y la tarjeta (una línea). */
export const ETIQUETA_MOTIVO: Record<MotivoDerivacion, string> = {
  VOLUME: 'Producción por volumen',
  RECURRING: 'Propuesta de suministro',
  RESALE: 'Compra para reventa',
  CRITICAL: 'Revisión técnica',
  MODELING_REVIEW: 'Revisión del diseño 3D',
  PHOTOS_NEEDED: 'Revisión con fotos',
  OVERSIZE: 'Pieza de más de 30 cm',
  SCAN: 'Escaneo 3D',
  MAINTENANCE: 'Mantenimiento o reparación',
  IP_REQUEST: 'CAD editable o derechos',
  CUSTOMER_ASKED: 'Atención con un asesor',
  OTHER: 'Atención con un asesor',
};

export const SALUDO_RESUMEN = 'Hola, vengo del asistente de cotización de Cesgar.';
export const MAX_CARACTERES_RESUMEN = 1500;
const TIENE_PRECIO = /\$\s?\d|\d\s?(pesos|cop)\b/i;

const PERFIL: Record<Ficha['customer_profile'], string | null> = {
  INDIVIDUAL: 'Cliente particular',
  WORKSHOP_CONSUMER: 'Taller',
  RESELLER: 'Revendedor',
  COMPANY: 'Empresa',
  UNKNOWN: null,
};
const RECURRENCIA: Record<NonNullable<Ficha['demand']['recurrence']>, string | null> = {
  ONE_TIME: 'compra única', WEEKLY: 'semanal', MONTHLY: 'mensual', QUARTERLY: 'trimestral', VARIABLE: 'recompra variable', UNKNOWN: null,
};
const CANAL: Record<NonNullable<Ficha['demand']['channel']>, string | null> = {
  OWN_USE: 'para uso propio', RESALE: 'para reventa', BOTH: 'para uso propio y reventa', UNKNOWN: null,
};
const MUESTRA: Record<NonNullable<Ficha['part']['physical_sample']>, string> = {
  COMPLETE: 'pieza completa', FRAGMENTS: 'fragmentos', SIMILAR_PART: 'una pieza similar', NONE: 'sin muestra', UNKNOWN: 'no sabe',
};
const CONFIANZA = { HIGH: 'alta', MEDIUM: 'media', LOW: 'baja' } as const;

/** Etiqueta corta de cada faltante para «Pendientes»; si no hay, la pregunta. */
const PENDIENTE: Record<string, string> = {
  customer_profile: 'perfil (particular o negocio)',
  'part.description': 'qué pieza es',
  'part.vehicle_or_equipment': 'vehículo o equipo',
  'part.vehicle_or_equipment.year': 'año exacto',
  'part.vehicle_or_equipment.make': 'marca',
  'part.vehicle_or_equipment.model': 'modelo',
  'part.application': 'ubicación y función',
  'part.physical_sample': 'si conserva la pieza',
  'part.has_file': 'si tiene archivo',
  'part.dimensions_text': 'medidas',
  'part.needs_cad': 'si necesita CAD editable',
  'demand.initial_quantity': 'cantidad',
  'demand.recurrence': 'recurrencia',
  'demand.channel': 'uso propio o reventa',
  'technical.function': 'función y esfuerzo',
  'technical.requirements': 'requisitos',
  'modeling.factors.precision': 'precisión del ajuste',
  'modeling.factors.referencias': 'medidas o plano',
  'modeling.factors.ensamble': 'cómo encaja con otras piezas',
  'modeling.factors.geometria': 'forma general',
  'modeling.factors.detalles': 'detalles (agujeros, clips)',
  'modeling.factors.desarrollo': 'copiar, adaptar o diseñar',
};

const limpiar = (s: string) => s.replace(/\s+/g, ' ').trim().replace(/[.·,;:]+$/, '');
/** Texto del modelo: sin precios. */
const seguro = (s: string | null | undefined): string | null => {
  if (!s || s === 'UNKNOWN') return null;
  const t = limpiar(s);
  return t && !TIENE_PRECIO.test(t) ? t : null;
};
const unir = (partes: (string | null | undefined | false)[], sep = ' · ') => partes.filter(Boolean).join(sep);

function lineaMotivo(f: Ficha | null, motivo: MotivoDerivacion): string {
  const q = f?.demand.initial_quantity;
  if (motivo === 'VOLUME') {
    const base = f?.derived.volume_route === 'INDUSTRIAL_PRIORITY' ? 'Producción industrial' : ETIQUETA_MOTIVO.VOLUME;
    return typeof q === 'number' ? `${base} (${numero(q)} unidades de una referencia)` : base;
  }
  return ETIQUETA_MOTIVO[motivo];
}

function lineaCantidad(f: Ficha): string | null {
  const d = f.demand;
  const q = d.initial_quantity;
  const mes = d.monthly_quantity_estimate;
  return unir([
    typeof q === 'number' ? `${numero(q)} iniciales` : q === 'UNKNOWN' ? 'cantidad sin definir' : null,
    d.recurrence && RECURRENCIA[d.recurrence],
    typeof mes === 'number' ? `≈ ${numero(mes)}/mes` : null,
    d.channel && CANAL[d.channel],
    d.multiple_references && 'varias referencias',
  ]) || null;
}

function riesgos(f: Ficha): string | null {
  return unir([
    (f.technical.critical_use || f.derived.critical_by_keywords) && 'uso crítico o de seguridad',
    f.technical.ip_request && 'pide CAD editable, exclusividad o derechos',
    f.modeling.factors?.precision === 2 && 'tolerancia crítica',
    f.derived.class_max === 'C6' && 'desarrollo especial (C6)',
  ], '; ') || null;
}

const pendientes = (faltan: Faltante[]) => faltan.map((x) => PENDIENTE[x.campo] ?? limpiar(x.pregunta)).join('; ') || null;

const bullet = (l: LineaPieza) => `• ${limpiar(l.descripcion)}${l.detalle ? ` (${limpiar(l.detalle)})` : ''}.`;

/**
 * Plantilla de design §5.5. Las líneas vacías se omiten. Tope de 1.500
 * caracteres: se recortan los pendientes, luego los requisitos y luego las
 * piezas (dejando la cuenta). El motivo, la pieza y la cantidad no se recortan.
 */
export function armarResumenAsesor(ficha: Ficha | null, lineas: LineaPieza[], motivo: MotivoDerivacion): string {
  const f = ficha;
  const veh = f?.part.vehicle_or_equipment;
  const vehiculo = veh ? unir([seguro(veh.make), seguro(veh.model), seguro(veh.year), seguro(veh.version)], ' ') : '';
  const pieza = f ? unir([seguro(f.part.description), unir([vehiculo, seguro(f.part.application)], ', ')], ' — ') : '';
  const medidas = seguro(f?.part.dimensions_text);
  const muestra = f?.part.physical_sample ? MUESTRA[f.part.physical_sample] : null;
  const requisitos = f ? unir([seguro(f.technical.function), seguro(f.technical.requirements)], '; ') : '';
  const modelado = f?.derived.class_min && f.derived.class_max
    ? `${textoClase(f.derived.class_min, f.derived.class_max)} preliminar${f.derived.confidence ? ` (confianza ${CONFIANZA[f.derived.confidence]})` : ''}`
    : null;
  const fotos = motivo === 'PHOTOS_NEEDED' || f?.part.physical_sample === 'FRAGMENTS' || f?.part.physical_sample === 'NONE';

  let listaPiezas = lineas.map(bullet);
  let conPendientes = true;
  let conRequisitos = true;

  const armar = () => [
    SALUDO_RESUMEN,
    `Motivo: ${lineaMotivo(f, motivo)}.`,
    f && unir([PERFIL[f.customer_profile], seguro(f.business_name)]) && `Perfil: ${unir([PERFIL[f.customer_profile], seguro(f.business_name)])}`,
    pieza && `Pieza: ${pieza}`,
    f && lineaCantidad(f) && `Cantidad: ${lineaCantidad(f)}`,
    (muestra || medidas) && unir([muestra && `Muestra: ${muestra}`, medidas && `Medidas: ${medidas}`]),
    conRequisitos && requisitos && `Requisitos: ${requisitos}`,
    modelado && `Modelado: ${modelado}`,
    f?.derived.catalog_opportunity && 'Demanda: otros talleres o clientes piden esta pieza',
    f && riesgos(f) && `Riesgos: ${riesgos(f)}`,
    conPendientes && f && pendientes(f.derived.missing) && `Pendientes: ${pendientes(f.derived.missing)}`,
    listaPiezas.length > 0 && `${f ? 'Detalle:\n' : 'Necesito:\n'}${listaPiezas.join('\n')}`,
    fotos && 'Envío fotos de la pieza por aquí.',
  ].filter(Boolean).join('\n');

  let mensaje = armar();
  if (mensaje.length > MAX_CARACTERES_RESUMEN) { conPendientes = false; mensaje = armar(); }
  if (mensaje.length > MAX_CARACTERES_RESUMEN) { conRequisitos = false; mensaje = armar(); }
  const todas = lineas.map(bullet);
  for (let n = todas.length - 1; mensaje.length > MAX_CARACTERES_RESUMEN && n >= 0; n--) {
    listaPiezas = [...todas.slice(0, n), `• y ${todas.length - n} más.`];
    mensaje = armar();
  }
  return mensaje.length > MAX_CARACTERES_RESUMEN ? `${mensaje.slice(0, MAX_CARACTERES_RESUMEN - 1)}…` : mensaje;
}

export function enlaceResumen(ficha: Ficha | null, lineas: LineaPieza[], motivo: MotivoDerivacion): { mensaje: string; enlace: string } {
  const mensaje = armarResumenAsesor(ficha, lineas, motivo);
  return { mensaje, enlace: enlaceWhatsApp(mensaje) };
}
