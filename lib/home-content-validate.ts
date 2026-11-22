// Reglas de los textos del home. Módulo puro: sin base de datos, sin React, sin
// next/*. Lo usan el formulario del panel (para avisar), la acción de guardado
// (para decidir) y getHomeContent (para no romper nunca el home).
//
// Las dos funciones públicas recorren el mismo esquema con distinto rigor:
//   validarHomeContent  → estricta, al escribir: acumula errores por campo.
//   mezclarConDefaults  → tolerante, al leer: lo inválido cae al texto de fábrica.
// Ambas construyen el resultado desde el esquema, nunca desde la entrada, así
// que una clave que no exista en HomeContent no llega a la salida.

import {
  CANTIDAD_DESTACADOS,
  CANTIDAD_METRICAS,
  CTA_MAX,
  CTA_MIN,
  DEFAULT_HOME_CONTENT,
  FRASES_MAX,
  FRASES_MIN,
  LIMITES,
  SERVICIO_IDS,
  VALOR_METRICA_MAX,
  type Destacado,
  type HomeContent,
  type MetricaHero,
  type ServicioId,
  type TextoCta,
  type TextoServicio,
} from './home-content-types';

/** Ruta del campo → mensaje. Ej.: "hero.frases.1" → "Máximo 90 caracteres". */
export type ErroresCampo = Record<string, string>;

/**
 * Texto plano en una línea: los caracteres de control y cualquier secuencia de
 * espacios (saltos de línea incluidos) quedan en un solo espacio, sin espacios
 * en los extremos.
 */
export function normalizarTexto(s: string): string {
  return s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Largo en caracteres visibles (una tilde o un emoji cuentan 1). */
export function largo(s: string): number {
  return Array.from(s).length;
}

/** Tamaño del JSON que se guardaría, en bytes UTF-8. */
export function bytesJson(c: HomeContent): number {
  return new TextEncoder().encode(JSON.stringify(c)).length;
}

function recortar(s: string, max: number): string {
  return Array.from(s).slice(0, max).join('');
}

// ─── Recorrido del esquema ───────────────────────────────────────────────────

type Modo = 'estricto' | 'tolerante';

interface Lector {
  modo: Modo;
  errores: ErroresCampo;
}

type Objeto = Record<string, unknown>;

function comoObjeto(v: unknown): Objeto {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Objeto) : {};
}

/** Solo propiedades propias: nunca lee nada heredado del prototipo. */
function campo(o: Objeto, k: string): unknown {
  return Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined;
}

function texto(
  L: Lector,
  ruta: string,
  valor: unknown,
  defecto: string,
  max: number,
  obligatorio = true,
): string {
  if (typeof valor !== 'string') {
    if (L.modo === 'tolerante') return defecto;
    if (valor === undefined && !obligatorio) return '';
    L.errores[ruta] = valor === undefined ? 'Obligatorio' : 'Debe ser texto';
    return defecto;
  }
  const t = normalizarTexto(valor);
  if (L.modo === 'tolerante') {
    if (!t) return obligatorio ? defecto : '';
    // Un límite que se bajó después de guardar no debe tirar el texto entero.
    return recortar(t, max);
  }
  if (!t && obligatorio) L.errores[ruta] = 'Obligatorio';
  else if (largo(t) > max) L.errores[ruta] = `Máximo ${max} caracteres`;
  return t;
}

function entero(L: Lector, ruta: string, valor: unknown, defecto: number): number {
  const ok = typeof valor === 'number' && Number.isInteger(valor)
    && valor >= 0 && valor <= VALOR_METRICA_MAX;
  if (ok) return valor;
  if (L.modo === 'estricto') {
    L.errores[ruta] = `Debe ser un número entero entre 0 y ${VALOR_METRICA_MAX.toLocaleString('es-CO')}`;
  }
  return defecto;
}

/** Un objeto cuyos campos son todos texto obligatorio; los límites mandan qué claves existen. */
function plano<K extends string>(
  L: Lector,
  ruta: string,
  entrada: unknown,
  defecto: NoInfer<Record<K, string>>,
  limites: Record<K, number>,
): Record<K, string> {
  const o = comoObjeto(entrada);
  const out = {} as Record<K, string>;
  for (const k of Object.keys(limites) as K[]) {
    out[k] = texto(L, `${ruta}.${k}`, campo(o, k), defecto[k], limites[k]);
  }
  return out;
}

/**
 * Lista de largo fijo (métricas, destacados). Estricto: el largo tiene que ser
 * exacto. Tolerante: se mezcla por índice contra los de fábrica y siempre sale
 * la cantidad fija.
 */
function fija<T>(
  L: Lector,
  ruta: string,
  entrada: unknown,
  defecto: T[],
  cantidad: number,
  elemento: (ruta: string, valor: unknown, defecto: T) => T,
): T[] {
  const lista = Array.isArray(entrada) ? entrada : [];
  if (L.modo === 'estricto' && (!Array.isArray(entrada) || entrada.length !== cantidad)) {
    L.errores[ruta] = `Deben ser exactamente ${cantidad}`;
  }
  return defecto.slice(0, cantidad).map((d, i) => elemento(`${ruta}.${i}`, lista[i], d));
}

function frases(L: Lector, entrada: unknown): string[] {
  const ruta = 'hero.frases';
  const max = LIMITES.hero.frase;

  if (L.modo === 'tolerante') {
    if (!Array.isArray(entrada)) return [...DEFAULT_HOME_CONTENT.hero.frases];
    const validas = entrada
      .filter((f): f is string => typeof f === 'string')
      .map((f) => recortar(normalizarTexto(f), max))
      .filter(Boolean)
      .slice(0, FRASES_MAX);
    return validas.length ? validas : [...DEFAULT_HOME_CONTENT.hero.frases];
  }

  if (!Array.isArray(entrada)) {
    L.errores[ruta] = 'Debe ser una lista';
    return [];
  }
  if (entrada.length < FRASES_MIN || entrada.length > FRASES_MAX) {
    L.errores[ruta] = `Entre ${FRASES_MIN} y ${FRASES_MAX} frases`;
  }
  return entrada.slice(0, FRASES_MAX).map((f, i) => texto(L, `${ruta}.${i}`, f, '', max));
}

/**
 * Pares del botón del menú. Como las frases, es una lista de largo variable:
 * al leer no hay un «par de fábrica» por índice, así que un par incompleto se
 * descarta entero en vez de mezclarse a medias.
 */
function menuCta(L: Lector, entrada: unknown): TextoCta[] {
  const ruta = 'menu.cta';
  const lim = LIMITES.menu.cta;

  if (L.modo === 'tolerante') {
    if (!Array.isArray(entrada)) return structuredClone(DEFAULT_HOME_CONTENT.menu.cta);
    const validos = entrada
      .map((p) => {
        const o = comoObjeto(p);
        const texto = campo(o, 'texto');
        const corto = campo(o, 'textoCorto');
        if (typeof texto !== 'string' || typeof corto !== 'string') return null;
        const par = { texto: recortar(normalizarTexto(texto), lim.texto), textoCorto: recortar(normalizarTexto(corto), lim.textoCorto) };
        return par.texto && par.textoCorto ? par : null;
      })
      .filter((p): p is TextoCta => p !== null)
      .slice(0, CTA_MAX);
    return validos.length ? validos : structuredClone(DEFAULT_HOME_CONTENT.menu.cta);
  }

  if (!Array.isArray(entrada)) {
    L.errores[ruta] = 'Debe ser una lista';
    return [];
  }
  if (entrada.length < CTA_MIN || entrada.length > CTA_MAX) {
    L.errores[ruta] = `Entre ${CTA_MIN} y ${CTA_MAX} textos`;
  }
  return entrada.slice(0, CTA_MAX).map((p, i) => plano(L, `${ruta}.${i}`, p, { texto: '', textoCorto: '' }, lim));
}

function metrica(L: Lector, ruta: string, entrada: unknown, d: MetricaHero): MetricaHero {
  const o = comoObjeto(entrada);
  const lim = LIMITES.hero.metrica;
  return {
    valor: entero(L, `${ruta}.valor`, campo(o, 'valor'), d.valor),
    prefijo: texto(L, `${ruta}.prefijo`, campo(o, 'prefijo'), d.prefijo, lim.prefijo, false),
    sufijo: texto(L, `${ruta}.sufijo`, campo(o, 'sufijo'), d.sufijo, lim.sufijo, false),
    etiqueta: texto(L, `${ruta}.etiqueta`, campo(o, 'etiqueta'), d.etiqueta, lim.etiqueta),
  };
}

function servicios(L: Lector, entrada: unknown): Record<ServicioId, TextoServicio> {
  const o = comoObjeto(entrada);
  if (L.modo === 'estricto') {
    for (const k of Object.keys(o)) {
      if (!(SERVICIO_IDS as readonly string[]).includes(k)) L.errores[`servicios.${k}`] = 'Servicio desconocido';
    }
  }
  const out = {} as Record<ServicioId, TextoServicio>;
  for (const id of SERVICIO_IDS) {
    const d = DEFAULT_HOME_CONTENT.servicios[id];
    const valor = campo(o, id);
    if (valor === undefined && L.modo === 'estricto') {
      L.errores[`servicios.${id}`] = 'Falta este servicio';
      out[id] = { ...d };
    } else {
      out[id] = plano(L, `servicios.${id}`, valor, d, LIMITES.servicio);
    }
  }
  return out;
}

function construir(entrada: unknown, L: Lector): HomeContent {
  const D = DEFAULT_HOME_CONTENT;
  const raiz = comoObjeto(entrada);
  const hero = comoObjeto(campo(raiz, 'hero'));
  const menu = comoObjeto(campo(raiz, 'menu'));
  const catalogo = comoObjeto(campo(raiz, 'catalogo'));
  const proyectos = comoObjeto(campo(raiz, 'proyectos'));
  const blog = comoObjeto(campo(raiz, 'blog'));

  return {
    seo: plano(L, 'seo', campo(raiz, 'seo'), D.seo, LIMITES.seo),
    menu: { cta: menuCta(L, campo(menu, 'cta')) },
    hero: {
      titulo: texto(L, 'hero.titulo', campo(hero, 'titulo'), D.hero.titulo, LIMITES.hero.titulo),
      frases: frases(L, campo(hero, 'frases')),
      metricas: fija(L, 'hero.metricas', campo(hero, 'metricas'), D.hero.metricas, CANTIDAD_METRICAS,
        (ruta, v, d) => metrica(L, ruta, v, d)),
    },
    servicios: servicios(L, campo(raiz, 'servicios')),
    catalogo: {
      ...plano(L, 'catalogo', catalogo, D.catalogo, {
        etiqueta: LIMITES.catalogo.etiqueta,
        titulo: LIMITES.catalogo.titulo,
        parrafo: LIMITES.catalogo.parrafo,
        boton: LIMITES.catalogo.boton,
      }),
      destacados: fija<Destacado>(L, 'catalogo.destacados', campo(catalogo, 'destacados'),
        D.catalogo.destacados, CANTIDAD_DESTACADOS,
        (ruta, v, d) => plano(L, ruta, v, d, LIMITES.catalogo.destacado)),
    },
    tienda: plano(L, 'tienda', campo(raiz, 'tienda'), D.tienda, LIMITES.tienda),
    clientes: plano(L, 'clientes', campo(raiz, 'clientes'), D.clientes, LIMITES.clientes),
    proyectos: {
      ...plano(L, 'proyectos', proyectos, D.proyectos, LIMITES.proyectos),
      tarjetaFinal: plano(L, 'proyectos.tarjetaFinal', campo(proyectos, 'tarjetaFinal'),
        D.proyectos.tarjetaFinal, LIMITES.tarjetaFinal),
    },
    blog: {
      ...plano(L, 'blog', blog, D.blog, LIMITES.blog),
      tarjetaFinal: plano(L, 'blog.tarjetaFinal', campo(blog, 'tarjetaFinal'),
        D.blog.tarjetaFinal, LIMITES.tarjetaFinal),
    },
  };
}

// ─── API ─────────────────────────────────────────────────────────────────────

/** Al escribir. Devuelve todos los errores a la vez, no solo el primero. */
export function validarHomeContent(
  entrada: unknown,
): { ok: true; value: HomeContent } | { ok: false; errores: ErroresCampo } {
  const L: Lector = { modo: 'estricto', errores: {} };
  const value = construir(entrada, L);
  return Object.keys(L.errores).length ? { ok: false, errores: L.errores } : { ok: true, value };
}

/** Al leer. Nunca lanza: lo que falte o no sirva toma el texto de fábrica. */
export function mezclarConDefaults(guardado: unknown): HomeContent {
  return construir(guardado, { modo: 'tolerante', errores: {} });
}
