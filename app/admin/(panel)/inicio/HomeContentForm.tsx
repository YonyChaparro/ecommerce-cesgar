'use client';
import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Save, RotateCcw, CheckCircle, AlertCircle, Plus, Trash2, LayoutTemplate, ExternalLink, Info,
} from 'lucide-react';
import {
  CTA_MAX, CTA_MIN, DEFAULT_HOME_CONTENT, FRASES_MAX, FRASES_MIN, LIMITES, SERVICIO_IDS,
  type HomeContent, type ServicioId,
} from '@/lib/home-content-types';
import { largo, normalizarTexto, validarHomeContent, type ErroresCampo } from '@/lib/home-content-validate';
import type { EstadoLectura } from '@/lib/home-content';
import { saveHomeContentAction } from './actions';

const inputCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4dbdcc] focus:border-transparent transition-shadow';
const inputErrorCls = 'border-red-300 focus:ring-red-300';

type Seccion = keyof HomeContent;

// En el mismo orden en que aparecen en el home.
const SECCIONES: { id: Seccion; titulo: string; desc: string }[] = [
  { id: 'seo',       titulo: 'SEO',       desc: 'Cómo aparece el home en Google y al compartir el enlace.' },
  { id: 'menu',      titulo: 'Menú',      desc: 'El botón «Cotizar» de la barra superior.' },
  { id: 'hero',      titulo: 'Hero',      desc: 'La primera pantalla, sobre el video.' },
  { id: 'servicios', titulo: 'Servicios', desc: 'Las cinco tarjetas bajo el hero.' },
  { id: 'catalogo',  titulo: 'Catálogo',  desc: 'El bloque con el video y el botón al catálogo.' },
  { id: 'tienda',    titulo: 'Tienda',    desc: 'El carrusel de productos.' },
  { id: 'clientes',  titulo: 'Clientes',  desc: 'La franja de logos.' },
  { id: 'proyectos', titulo: 'Proyectos', desc: 'La grilla de proyectos realizados.' },
  { id: 'blog',      titulo: 'Blog',      desc: 'Los artículos apilados al final.' },
];

const SECCION = Object.fromEntries(SECCIONES.map((s) => [s.id, s])) as Record<Seccion, (typeof SECCIONES)[number]>;

const NOMBRE_SERVICIO: Record<ServicioId, string> = {
  cotizador:   'Cotizador (tarjeta ancha)',
  repuestos:   'Repuestos',
  escaneo:     'Escaneo 3D',
  diseno:      'Diseño 3D',
  prototipado: 'Prototipado y fabricación',
};

// ─── Acceso por ruta ("hero.frases.1"): la misma que usan los errores ────────

type Nodo = Record<string, unknown>;

function leer(c: HomeContent, ruta: string): unknown {
  return ruta.split('.').reduce<unknown>((o, k) => (o as Nodo | undefined)?.[k], c);
}

function escribir(c: HomeContent, ruta: string, valor: unknown): HomeContent {
  const copia = structuredClone(c);
  const partes = ruta.split('.');
  const ultimo = partes.pop()!;
  const padre = partes.reduce<Nodo>((o, k) => o[k] as Nodo, copia as unknown as Nodo);
  padre[ultimo] = valor;
  return copia;
}

/** Quita los errores de una ruta y de todo lo que cuelga de ella. */
function sinErrores(errores: ErroresCampo, prefijo: string): ErroresCampo {
  return Object.fromEntries(
    Object.entries(errores).filter(([k]) => k !== prefijo && !k.startsWith(`${prefijo}.`)),
  );
}

// ─── Piezas ──────────────────────────────────────────────────────────────────

function Card({ id, title, desc, aside, children }: {
  id: string; title: string; desc?: string; aside?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section id={`seccion-${id}`} className="scroll-mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-[#f8fafc] flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h2>
          {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
        </div>
        {aside}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-bold text-inverse-surface">{titulo}</h3>
      {children}
    </div>
  );
}

function ErrorBloque({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p data-error="true" className="text-xs text-red-500 flex items-center gap-1">
      <AlertCircle size={12} /> {error}
    </p>
  );
}

type PropsCampo = { ruta: string; valor: string; error?: string; onChange: (v: string) => void };

function CampoTexto({ ruta, valor, error, onChange, label, hint, max, multilinea = false, opcional = false, className = '' }:
  PropsCampo & { label: string; hint?: string; max: number; multilinea?: boolean; opcional?: boolean; className?: string }) {
  // Se cuenta lo que se va a guardar: sin espacios sobrantes ni saltos de línea.
  const n = largo(normalizarTexto(valor));
  const ayuda = `${ruta}-ayuda`;
  const comun = {
    id: ruta,
    value: valor,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    className: `${inputCls} ${error ? inputErrorCls : ''}`,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error || hint ? ayuda : undefined,
  };
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <label htmlFor={ruta} className="block text-xs font-bold uppercase tracking-widest text-slate-400">
          {label}
          {opcional && <span className="normal-case tracking-normal font-normal"> · opcional</span>}
        </label>
        {/* En campos de 1–3 caracteres (prefijo, sufijo) el contador no cabe ni aporta. */}
        {max > 3 && (
          <span className={`text-[11px] tabular-nums shrink-0 ${n > max ? 'text-red-500 font-bold' : 'text-slate-300'}`}>
            {n} / {max}
          </span>
        )}
      </div>
      {/* Sin maxLength: cortaría en silencio un texto pegado. Mejor dejarlo y marcar el error. */}
      {multilinea ? <textarea rows={3} {...comun} /> : <input type="text" {...comun} />}
      {error
        ? <p id={ayuda} className="text-xs text-red-500 mt-1">{error}</p>
        : hint && <p id={ayuda} className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Formulario ──────────────────────────────────────────────────────────────

export default function HomeContentForm({ initial, estadoLectura }: { initial: HomeContent; estadoLectura: EstadoLectura }) {
  const sinConexion = estadoLectura === 'sin-conexion';
  const [contenido, setContenido] = useState<HomeContent>(initial);
  const [guardado, setGuardado] = useState(() => JSON.stringify(initial));
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [saltoAError, setSaltoAError] = useState(0);
  const [guardando, startTransition] = useTransition();

  const sucio = JSON.stringify(contenido) !== guardado;

  // Recargar o cerrar la pestaña con cambios sin guardar: el navegador pregunta.
  useEffect(() => {
    if (!sucio) return;
    const avisar = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [sucio]);

  // Tras un intento fallido, lleva al primer campo con error.
  useEffect(() => {
    if (!saltoAError) return;
    const el = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-error="true"]');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus({ preventScroll: true });
  }, [saltoAError]);

  /** Tras editar: el aviso de éxito ya no aplica, y el de error tampoco si no queda nada marcado. */
  function limpiarAviso(erroresRestantes: number) {
    setAviso((a) => (a && (a.ok || erroresRestantes === 0) ? null : a));
  }

  function cambiar(ruta: string, valor: unknown) {
    setContenido((c) => escribir(c, ruta, valor));
    const resto = { ...errores };
    delete resto[ruta];
    setErrores(resto);
    limpiarAviso(Object.keys(resto).length);
  }

  /** Props de un campo de texto a partir de su ruta. */
  const campo = (ruta: string): PropsCampo => ({
    ruta,
    valor: String(leer(contenido, ruta) ?? ''),
    error: errores[ruta],
    onChange: (v) => cambiar(ruta, v),
  });

  function restaurar(seccion: Seccion) {
    setContenido((c) => ({ ...c, [seccion]: structuredClone(DEFAULT_HOME_CONTENT[seccion]) }));
    setErrores((e) => sinErrores(e, seccion));
    setAviso(null);
  }

  function restaurarTodo() {
    if (!confirm('¿Volver todos los textos a los originales? No se publica nada hasta que guardes.')) return;
    setContenido(structuredClone(DEFAULT_HOME_CONTENT));
    setErrores({});
    setAviso(null);
  }

  /** Agregar o quitar elementos corre los índices: se limpian los errores de toda la lista. */
  function setLista(ruta: 'hero.frases' | 'menu.cta', lista: unknown[]) {
    setContenido((c) => escribir(c, ruta, lista));
    const resto = sinErrores(errores, ruta);
    setErrores(resto);
    limpiarAviso(Object.keys(resto).length);
  }

  function fallar(errs: ErroresCampo, texto: string) {
    setErrores(errs);
    setAviso({ ok: false, texto });
    setSaltoAError((n) => n + 1);
  }

  function guardar() {
    setAviso(null);
    // Aviso temprano en el navegador; quien decide es la acción en el servidor.
    const local = validarHomeContent(contenido);
    if (!local.ok) {
      const n = Object.keys(local.errores).length;
      fallar(local.errores, n === 1 ? 'Hay 1 campo por corregir' : `Hay ${n} campos por corregir`);
      return;
    }
    startTransition(async () => {
      try {
        const r = await saveHomeContentAction(contenido);
        if (r.ok) {
          setContenido(r.contenido);
          setGuardado(JSON.stringify(r.contenido));
          setErrores({});
          setAviso({ ok: true, texto: 'Textos guardados' });
        } else {
          fallar(r.errores ?? {}, r.error);
        }
      } catch {
        // También llega aquí si la sesión venció: el proxy redirige la acción a
        // /admin/login y la respuesta ya no es la de la acción.
        setAviso({
          ok: false,
          texto: 'No se pudo guardar. Si tu sesión venció, inicia sesión en otra pestaña y vuelve a intentarlo: tus cambios siguen aquí.',
        });
      }
    });
  }

  const asideRestaurar = (seccion: Seccion) => {
    const igual = JSON.stringify(contenido[seccion]) === JSON.stringify(DEFAULT_HOME_CONTENT[seccion]);
    return (
      <button
        type="button"
        onClick={() => restaurar(seccion)}
        disabled={igual}
        title={igual ? 'Ya tiene los textos originales' : undefined}
        className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:hover:text-slate-400 flex items-center gap-1 transition-colors"
      >
        <RotateCcw size={12} /> Restaurar originales
      </button>
    );
  };

  const L = LIMITES;
  const { frases, metricas } = contenido.hero;
  const pares = contenido.menu.cta;

  return (
    // pb-32: que la barra flotante no tape los últimos campos.
    <div className="p-4 sm:p-6 md:p-8 pb-32 sm:pb-32 md:pb-32">
      <div className="max-w-4xl space-y-5">

        {/* ── Cabecera ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="font-headline font-bold text-2xl text-inverse-surface flex items-center gap-2">
                <LayoutTemplate size={20} /> Textos del inicio
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Lo que se lee en la página principal. Guardar es publicar.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={restaurarTodo}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-white transition-colors flex items-center gap-2"
              >
                <RotateCcw size={14} /> Restaurar todo
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={guardando || !sucio || sinConexion}
                className="px-5 py-2 rounded-lg bg-inverse-surface text-white text-sm font-bold hover:bg-[#1e2f63] disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                <Save size={14} /> {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>

          <nav aria-label="Secciones" className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
            {SECCIONES.map((s) => {
              const conError = Object.keys(errores).some((k) => k === s.id || k.startsWith(`${s.id}.`));
              return (
                <a
                  key={s.id}
                  href={`#seccion-${s.id}`}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    conError
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {s.titulo}
                </a>
              );
            })}
          </nav>
        </div>

        {sinConexion && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            No se pudieron leer los textos guardados y se muestran los originales. El guardado está
            bloqueado para no pisar lo que haya en la base: recarga la página en un momento.
          </div>
        )}
        {estadoLectura === 'danado' && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm bg-amber-50 text-amber-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            Los textos guardados estaban dañados y no se pudieron recuperar; el home muestra los
            originales. Revisa los textos y guarda para reemplazarlos.
          </div>
        )}

        {/* ── SEO ── */}
        <Card id="seo" title="SEO" desc={SECCION.seo.desc} aside={asideRestaurar('seo')}>
          <CampoTexto {...campo('seo.titulo')} max={L.seo.titulo}
            label="Título de la pestaña y de Google"
            hint="Google tarda días en reflejar un cambio de título." />
          <CampoTexto {...campo('seo.descripcion')} max={L.seo.descripcion} multilinea
            label="Descripción para Google"
            hint="El texto gris bajo el título en los resultados de búsqueda." />
          <CampoTexto {...campo('seo.ogDescripcion')} max={L.seo.ogDescripcion} multilinea
            label="Descripción al compartir"
            hint="La que aparece al pegar el enlace en WhatsApp, Facebook o LinkedIn." />
        </Card>

        {/* ── Menú ── */}
        <Card id="menu" title="Menú" desc={SECCION.menu.desc} aside={asideRestaurar('menu')}>
          <div className="flex items-start gap-2 text-xs text-sky-700 bg-sky-50 rounded-lg px-3 py-2">
            <Info size={14} className="shrink-0 mt-px" />
            <span>
              Este botón está en la barra superior de <b>todas las páginas</b>, no solo del inicio. Los textos
              rotan cada 3 segundos; con uno solo, queda fijo.
            </span>
          </div>
          <ErrorBloque error={errores['menu.cta']} />
          {pares.map((_, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3 border border-slate-100 rounded-xl p-3">
                <CampoTexto {...campo(`menu.cta.${i}.texto`)} max={L.menu.cta.texto}
                  label={`Texto ${i + 1}`} hint={i === 0 ? 'Tablet y escritorio. El más largo fija el ancho del botón.' : undefined} />
                <CampoTexto {...campo(`menu.cta.${i}.textoCorto`)} max={L.menu.cta.textoCorto}
                  label="Corto" hint={i === 0 ? 'Celular: el botón es angosto.' : undefined} />
              </div>
              <button
                type="button"
                onClick={() => setLista('menu.cta', pares.filter((__, j) => j !== i))}
                disabled={pares.length <= CTA_MIN}
                aria-label={`Quitar el texto ${i + 1}`}
                className="mt-8 p-2.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLista('menu.cta', [...pares, { texto: '', textoCorto: '' }])}
            disabled={pares.length >= CTA_MAX}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={14} /> {pares.length >= CTA_MAX ? `Máximo ${CTA_MAX} textos` : 'Agregar texto'}
          </button>
        </Card>

        {/* ── Hero ── */}
        <Card id="hero" title="Hero" desc={SECCION.hero.desc} aside={asideRestaurar('hero')}>
          <CampoTexto {...campo('hero.titulo')} max={L.hero.titulo}
            label="Título principal" hint="Aparece letra por letra." />

          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Frases que se escriben solas</p>
              <p className="text-xs text-slate-400 mt-0.5">Rotan bajo el título, una tras otra. Entre {FRASES_MIN} y {FRASES_MAX}.</p>
            </div>
            <ErrorBloque error={errores['hero.frases']} />
            {frases.map((_, i) => (
              <div key={i} className="flex items-end gap-2">
                <CampoTexto {...campo(`hero.frases.${i}`)} max={L.hero.frase}
                  label={`Frase ${i + 1}`} className="flex-1 min-w-0" />
                <button
                  type="button"
                  onClick={() => setLista('hero.frases', frases.filter((__, j) => j !== i))}
                  disabled={frases.length <= FRASES_MIN}
                  aria-label={`Quitar la frase ${i + 1}`}
                  className="mb-0.5 p-2.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLista('hero.frases', [...frases, ''])}
              disabled={frases.length >= FRASES_MAX}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> {frases.length >= FRASES_MAX ? `Máximo ${FRASES_MAX} frases` : 'Agregar frase'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cifras</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Las cuatro casillas sobre el video. «Antes» y «después» son opcionales: por ejemplo <b>+</b> o <b>h</b>.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metricas.map((m, i) => {
                const ruta = `hero.metricas.${i}`;
                const errValor = errores[`${ruta}.valor`];
                return (
                  <div key={i} className="border border-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-inverse-surface">Cifra {i + 1}</span>
                      <span className="text-lg font-bold text-primary-container tabular-nums">
                        {m.prefijo}{Number.isFinite(m.valor) ? m.valor : '–'}{m.sufijo}
                      </span>
                    </div>
                    <div className="grid grid-cols-[1fr_2fr_1fr] gap-2 items-start">
                      <CampoTexto {...campo(`${ruta}.prefijo`)} max={L.hero.metrica.prefijo} label="Antes" />
                      <div>
                        <label htmlFor={`${ruta}.valor`} className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          Número
                        </label>
                        <input
                          id={`${ruta}.valor`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={999999}
                          step={1}
                          value={Number.isFinite(m.valor) ? m.valor : ''}
                          onChange={(e) => cambiar(`${ruta}.valor`, e.target.value === '' ? NaN : Number(e.target.value))}
                          aria-invalid={errValor ? true : undefined}
                          className={`${inputCls} ${errValor ? inputErrorCls : ''}`}
                        />
                      </div>
                      <CampoTexto {...campo(`${ruta}.sufijo`)} max={L.hero.metrica.sufijo} label="Después" />
                    </div>
                    {errValor && <p className="text-xs text-red-500">{errValor}</p>}
                    <CampoTexto {...campo(`${ruta}.etiqueta`)} max={L.hero.metrica.etiqueta} label="Etiqueta" />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* ── Servicios ── */}
        <Card id="servicios" title="Servicios" desc={SECCION.servicios.desc} aside={asideRestaurar('servicios')}>
          <div className="flex items-start gap-2 text-xs text-sky-700 bg-sky-50 rounded-lg px-3 py-2">
            <Info size={14} className="shrink-0 mt-px" />
            <span>
              Estos textos también se muestran en{' '}
              <Link href="/servicios" target="_blank" className="font-bold underline underline-offset-2">/servicios</Link>.
              Las imágenes, íconos y enlaces de cada tarjeta no cambian.
            </span>
          </div>
          {SERVICIO_IDS.map((id) => (
            <Grupo key={id} titulo={NOMBRE_SERVICIO[id]}>
              <CampoTexto {...campo(`servicios.${id}.titulo`)} max={L.servicio.titulo} label="Título" />
              <CampoTexto {...campo(`servicios.${id}.descripcion`)} max={L.servicio.descripcion} multilinea label="Descripción" />
              <CampoTexto {...campo(`servicios.${id}.cta`)} max={L.servicio.cta} label="Texto del botón" />
            </Grupo>
          ))}
        </Card>

        {/* ── Catálogo ── */}
        <Card id="catalogo" title="Catálogo" desc={SECCION.catalogo.desc} aside={asideRestaurar('catalogo')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoTexto {...campo('catalogo.etiqueta')} max={L.catalogo.etiqueta} label="Etiqueta superior" />
            <CampoTexto {...campo('catalogo.titulo')} max={L.catalogo.titulo} label="Título" />
            <CampoTexto {...campo('catalogo.parrafo')} max={L.catalogo.parrafo} multilinea label="Párrafo" className="sm:col-span-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contenido.catalogo.destacados.map((_, i) => (
              <Grupo key={i} titulo={`Destacado ${i + 1}`}>
                <CampoTexto {...campo(`catalogo.destacados.${i}.titulo`)} max={L.catalogo.destacado.titulo} label="Título" />
                <CampoTexto {...campo(`catalogo.destacados.${i}.subtitulo`)} max={L.catalogo.destacado.subtitulo} label="Subtítulo" />
              </Grupo>
            ))}
          </div>
          <CampoTexto {...campo('catalogo.boton')} max={L.catalogo.boton} label="Texto del botón" />
        </Card>

        {/* ── Tienda ── */}
        <Card id="tienda" title="Tienda" desc={SECCION.tienda.desc} aside={asideRestaurar('tienda')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoTexto {...campo('tienda.migaPan')} max={L.tienda.migaPan} label="Miga de pan"
              hint="Se lee «Cesgar › Tienda»." />
            <CampoTexto {...campo('tienda.titulo')} max={L.tienda.titulo} label="Título" />
            <CampoTexto {...campo('tienda.subtitulo')} max={L.tienda.subtitulo} multilinea label="Subtítulo" className="sm:col-span-2" />
            <CampoTexto {...campo('tienda.enlaceVerTodos')} max={L.tienda.enlaceVerTodos} label="Enlace junto al título" />
            <CampoTexto {...campo('tienda.botonTarjeta')} max={L.tienda.botonTarjeta} label="Botón de cada producto" />
            <CampoTexto {...campo('tienda.botonFinal')} max={L.tienda.botonFinal} label="Botón bajo el carrusel" />
          </div>
        </Card>

        {/* ── Clientes ── */}
        <Card id="clientes" title="Clientes" desc={SECCION.clientes.desc} aside={asideRestaurar('clientes')}>
          <CampoTexto {...campo('clientes.titulo')} max={L.clientes.titulo} label="Título sobre los logos"
            hint="Los logos y nombres de las empresas no se editan aquí." />
        </Card>

        {/* ── Proyectos y Blog: misma forma ── */}
        {(['proyectos', 'blog'] as const).map((sec) => (
          <Card key={sec} id={sec} title={SECCION[sec].titulo} desc={SECCION[sec].desc} aside={asideRestaurar(sec)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CampoTexto {...campo(`${sec}.etiqueta`)} max={L[sec].etiqueta} label="Etiqueta superior" />
              <CampoTexto {...campo(`${sec}.titulo`)} max={L[sec].titulo} label="Título" />
              <CampoTexto {...campo(`${sec}.subtitulo`)} max={L[sec].subtitulo} multilinea label="Subtítulo" className="sm:col-span-2" />
              {sec === 'blog' && (
                <>
                  <CampoTexto {...campo('blog.enlaceVerTodos')} max={L.blog.enlaceVerTodos} label="Enlace junto al título" />
                  <CampoTexto {...campo('blog.enlaceArticulo')} max={L.blog.enlaceArticulo} label="Enlace de cada artículo" />
                </>
              )}
            </div>
            <Grupo titulo="Última tarjeta: invitación a ver todos">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CampoTexto {...campo(`${sec}.tarjetaFinal.etiqueta`)} max={L.tarjetaFinal.etiqueta} label="Etiqueta" />
                <CampoTexto {...campo(`${sec}.tarjetaFinal.titulo`)} max={L.tarjetaFinal.titulo} label="Título" />
                <CampoTexto {...campo(`${sec}.tarjetaFinal.texto`)} max={L.tarjetaFinal.texto} multilinea label="Texto" className="sm:col-span-2" />
                <CampoTexto {...campo(`${sec}.tarjetaFinal.boton`)} max={L.tarjetaFinal.boton} label="Texto del botón" />
              </div>
            </Grupo>
          </Card>
        ))}

      </div>

      {/* ── Barra flotante: estado y aviso, siempre a la vista ── */}
      {(sucio || aviso) && (
        <div
          role="status"
          className={`fixed z-20 bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-xl flex items-center gap-3 flex-wrap justify-between pl-4 pr-2 py-2 rounded-2xl shadow-lg border text-sm ${
            aviso && !aviso.ok ? 'bg-red-50 border-red-100 text-red-600'
              : aviso?.ok ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
              : 'bg-white border-slate-200 text-amber-700'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0 py-1.5">
            {aviso ? (aviso.ok ? <CheckCircle size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />) : null}
            {aviso ? aviso.texto : <b>Cambios sin guardar</b>}
            {aviso?.ok && (
              <Link href="/" target="_blank" className="font-bold underline underline-offset-2 inline-flex items-center gap-1">
                Ver el home <ExternalLink size={12} />
              </Link>
            )}
          </span>
          {sucio && (
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || sinConexion}
              className="px-4 py-2 rounded-xl bg-inverse-surface text-white text-sm font-bold hover:bg-[#1e2f63] disabled:opacity-60 transition-colors flex items-center gap-2 shrink-0"
            >
              <Save size={14} /> {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
