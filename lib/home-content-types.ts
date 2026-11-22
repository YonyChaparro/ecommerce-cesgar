// Textos de la página principal. Igual que las tarifas del cotizador y de envíos,
// se guardan como JSON en la tabla Setting y el administrador los edita desde
// /admin/inicio. Spec: docs/specs/textos-home/.
//
// Módulo puro: lo importan el home, el panel y scripts/verify-home-content.ts.

export const SERVICIO_IDS = ['cotizador', 'repuestos', 'escaneo', 'diseno', 'prototipado'] as const;
export type ServicioId = (typeof SERVICIO_IDS)[number];

export interface MetricaHero {
  /** Entero 0–999 999; lo anima CountUp. */
  valor: number;
  /** "+", o vacío. */
  prefijo: string;
  /** "h", o vacío. */
  sufijo: string;
  etiqueta: string;
}

export interface TextoServicio {
  titulo: string;
  descripcion: string;
  cta: string;
}

export interface TarjetaFinal {
  etiqueta: string;
  titulo: string;
  texto: string;
  boton: string;
}

export interface Destacado {
  titulo: string;
  subtitulo: string;
}

/** Un texto del botón «Cotizar» del menú superior. Los dos rotan juntos. */
export interface TextoCta {
  /** Desde 640 px. El más largo fija el ancho del botón. */
  texto: string;
  /** Celular: el botón mide 96 px fijos y corta lo que sobra. */
  textoCorto: string;
}

export interface HomeContent {
  seo: { titulo: string; descripcion: string; ogDescripcion: string };
  /** Menú superior: se ve en todas las páginas, no solo en el inicio. */
  menu: {
    /** Entre CTA_MIN y CTA_MAX pares. */
    cta: TextoCta[];
  };
  hero: {
    titulo: string;
    /** Rotan en el TextType del hero. Entre FRASES_MIN y FRASES_MAX. */
    frases: string[];
    /** Exactamente CANTIDAD_METRICAS: la grilla del hero es de 4 columnas. */
    metricas: MetricaHero[];
  };
  /** También se muestran en /servicios. */
  servicios: Record<ServicioId, TextoServicio>;
  catalogo: {
    etiqueta: string;
    titulo: string;
    parrafo: string;
    boton: string;
    /** Exactamente CANTIDAD_DESTACADOS: cada uno tiene su ícono fijo en el código. */
    destacados: Destacado[];
  };
  tienda: {
    migaPan: string;
    titulo: string;
    subtitulo: string;
    enlaceVerTodos: string;
    botonTarjeta: string;
    botonFinal: string;
  };
  clientes: { titulo: string };
  proyectos: { etiqueta: string; titulo: string; subtitulo: string; tarjetaFinal: TarjetaFinal };
  blog: {
    etiqueta: string;
    titulo: string;
    subtitulo: string;
    enlaceVerTodos: string;
    enlaceArticulo: string;
    tarjetaFinal: TarjetaFinal;
  };
}

export const CTA_MIN = 1;
export const CTA_MAX = 6;
export const FRASES_MIN = 1;
export const FRASES_MAX = 5;
export const CANTIDAD_METRICAS = 4;
export const CANTIDAD_DESTACADOS = 2;
export const VALOR_METRICA_MAX = 999_999;

/**
 * Tope del JSON guardado, en bytes UTF-8. En producción Setting.value es TEXT
 * (65 535 bytes) y MySQL corta en silencio lo que no cabe: un JSON cortado no
 * se parsea y el home volvería a los textos de fábrica sin ningún aviso.
 */
export const TOPE_BYTES = 60_000;

/**
 * Máximo de caracteres por campo. Pensados para el diseño actual: el texto más
 * largo de hoy cabe con holgura. Los de arreglos y de tarjetas finales son por
 * elemento.
 */
export const LIMITES = {
  seo: { titulo: 70, descripcion: 170, ogDescripcion: 200 },
  menu: { cta: { texto: 24, textoCorto: 11 } },
  hero: {
    titulo: 60,
    frase: 90,
    metrica: { prefijo: 3, sufijo: 3, etiqueta: 30 },
  },
  servicio: { titulo: 50, descripcion: 220, cta: 30 },
  catalogo: {
    etiqueta: 40,
    titulo: 60,
    parrafo: 400,
    boton: 30,
    destacado: { titulo: 30, subtitulo: 50 },
  },
  tienda: {
    migaPan: 30,
    titulo: 40,
    subtitulo: 160,
    enlaceVerTodos: 40,
    botonTarjeta: 20,
    botonFinal: 40,
  },
  clientes: { titulo: 80 },
  proyectos: { etiqueta: 30, titulo: 60, subtitulo: 200 },
  blog: { etiqueta: 30, titulo: 60, subtitulo: 200, enlaceVerTodos: 30, enlaceArticulo: 30 },
  tarjetaFinal: { etiqueta: 30, titulo: 50, texto: 160, boton: 30 },
} as const;

/**
 * Textos de fábrica: los que tenía el código antes de hacerlos editables. Es la
 * única fuente de estos textos; si no hay nada guardado, el home se ve igual
 * que siempre.
 */
export const DEFAULT_HOME_CONTENT: HomeContent = {
  seo: {
    titulo: 'Cesgar | Impresión 3D Industrial en Bogotá',
    descripcion: 'Impresión 3D industrial bajo demanda en Bogotá. Fabricamos repuestos, prototipos y piezas técnicas con FDM y resina. Cotiza en segundos.',
    ogDescripcion: 'Fabricamos repuestos, prototipos y piezas técnicas con FDM y resina. Cotiza en segundos.',
  },
  menu: {
    cta: [
      { texto: 'Cotización Instantánea', textoCorto: '¡Cotizar!' },
      { texto: 'Sin tiempos de espera',  textoCorto: 'Sin esperas' },
      { texto: 'Precio en segundos',     textoCorto: 'Precio ya' },
      { texto: 'Cotiza sin registrarte', textoCorto: 'Sin cuenta' },
      { texto: '¡Empieza ahora!',        textoCorto: '¡Ahora!' },
    ],
  },
  hero: {
    titulo: 'Precisión industrial a tu alcance',
    frases: [
      'Impresión 3D, diseño, escaneo y prototipado de precisión.',
      'Todo lo que necesitas para llevar tus ideas a la realidad.',
      'Fabricación industrial de precisión en Bogotá.',
    ],
    metricas: [
      { valor: 500, prefijo: '+', sufijo: '',  etiqueta: 'Proyectos completados' },
      { valor: 150, prefijo: '+', sufijo: '',  etiqueta: 'Clientes satisfechos' },
      { valor: 15,  prefijo: '+', sufijo: '',  etiqueta: 'Materiales disponibles' },
      { valor: 48,  prefijo: '',  sufijo: 'h', etiqueta: 'Tiempo de entrega' },
    ],
  },
  servicios: {
    cotizador: {
      titulo: 'Cotizar al instante',
      descripcion: 'Sube tu archivo y genera una cotización inmediata para impresión 3D. Sin esperas, sin complicaciones.',
      cta: 'Subir STL y cotizar',
    },
    repuestos: {
      titulo: 'Repuestos para tus impresoras',
      descripcion: 'Encuentra y cotiza boquillas, extrusores, correas, drivers y todo lo que necesitas para mantener tu impresora en marcha.',
      cta: 'Cotizar repuesto',
    },
    escaneo: {
      titulo: 'Escaneo 3D',
      descripcion: 'Capturamos tu pieza u objeto con escáner de alta precisión y la convertimos en un modelo digital listo para producción o ingeniería inversa.',
      cta: 'Cotizar escaneo',
    },
    diseno: {
      titulo: 'Diseño 3D',
      descripcion: 'Nuestros ingenieros modelan tu idea desde cero o adaptan un diseño existente, entregando archivos optimizados para fabricación.',
      cta: 'Cotizar diseño',
    },
    prototipado: {
      titulo: 'Prototipado y fabricación',
      descripcion: 'De la idea al objeto en el menor tiempo posible. Producimos prototipos funcionales y series cortas con materiales de ingeniería.',
      cta: 'Cotizar fabricación',
    },
  },
  catalogo: {
    etiqueta: 'Catálogo técnico especializado',
    titulo: 'Explora nuestra tienda técnica',
    parrafo: 'Desde boquillas de alta precisión hasta placas de control industriales, en Cesgar encuentras todo lo que tu impresora necesita. Contamos con un inventario especializado de repuestos, insumos electrónicos y recursos técnicos.',
    boton: 'VER CATÁLOGO COMPLETO',
    destacados: [
      { titulo: 'Partes mecánicas', subtitulo: 'Correas, poleas y extrusores' },
      { titulo: 'Electrónica', subtitulo: 'Drivers y placas de control' },
    ],
  },
  tienda: {
    migaPan: 'Tienda',
    titulo: 'Tienda',
    subtitulo: 'Insumos industriales y electrónicos especializados.',
    enlaceVerTodos: 'Ver todos los productos',
    botonTarjeta: 'Ver producto',
    botonFinal: 'Ir a la tienda completa',
  },
  clientes: {
    titulo: 'Empresas e instituciones que confían en nosotros',
  },
  proyectos: {
    etiqueta: 'Proyectos',
    titulo: 'Proyectos realizados',
    subtitulo: 'Casos reales de clientes resueltos con impresión 3D, escaneo e ingeniería a medida.',
    tarjetaFinal: {
      etiqueta: 'Proyectos',
      titulo: '¿Quieres ver más?',
      texto: 'Explora todos los proyectos que hemos resuelto con impresión 3D, escaneo e ingeniería.',
      boton: 'Ver todos los proyectos',
    },
  },
  blog: {
    etiqueta: 'Blog',
    titulo: 'Recursos y artículos',
    subtitulo: 'Conocimiento técnico sobre impresión 3D, materiales y fabricación digital.',
    enlaceVerTodos: 'Ver todos →',
    enlaceArticulo: 'Leer artículo →',
    tarjetaFinal: {
      etiqueta: 'Blog',
      titulo: '¿Quieres seguir leyendo?',
      texto: 'Explora todos los artículos sobre impresión 3D, materiales y fabricación digital.',
      boton: 'Ver todos los artículos',
    },
  },
};
