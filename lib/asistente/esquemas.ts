// Contrato de cada tool del asistente: entrada y salida, definidas una vez con
// zod (propuesta §6.1, regla 5). Este archivo no tiene código de servidor: el
// servidor valida con estos esquemas y las tarjetas del chat usan los tipos
// inferidos, así que si cambia un campo la compilación falla en los dos lados.

import { z } from 'zod';
import type { UIMessage } from 'ai';
import { PATRON_CODIGO, PATRON_COTIZACION } from './codigos';
import { CANALES, FACTORES, INTENCIONES, MUESTRAS, OPERACIONES, PERFILES, RECURRENCIAS, RUTAS } from './ficha';
import { MOTIVOS_DERIVACION } from './resumen-asesor';

const tecnologia = z.enum(['fdm', 'resina']);
const cantidad = z.number().int().min(1).max(1000);
const medidas = z.object({ x: z.number(), y: z.number(), z: z.number() });
const clase = z.enum(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
const confianza = z.enum(['alta', 'media', 'baja']);

// Ficha: todo opcional y tolerante a null (el servidor ignora el null, design §3.2).
const t140 = z.string().max(140).nullish();
const punto = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal('UNKNOWN')]).nullish();
const cantidadFicha = z.union([z.number().int().min(0).max(1_000_000), z.literal('UNKNOWN')]).nullish();

const fichaParcial = z.object({
  customer_profile: z.enum(PERFILES).nullish()
    .describe('A=INDIVIDUAL, B1=WORKSHOP_CONSUMER (taller que la usa), B2=RESELLER (la revende), B3=COMPANY (producción). Muchas unidades no es reventa'),
  business_name: t140.describe('Nombre del negocio, solo si el cliente lo dice'),
  intent: z.enum(INTENCIONES).nullish(),
  part: z.object({
    description: t140.describe('Qué pieza es, con palabras del cliente'),
    application: t140.describe('Dónde va instalada y qué hace'),
    vehicle_or_equipment: z.object({ make: t140, model: t140, year: t140, version: t140 }).partial().nullish(),
    physical_sample: z.enum(MUESTRAS).nullish()
      .describe('COMPLETE la pieza entera, FRAGMENTS pedazos, SIMILAR_PART otra parecida, NONE ya no la tiene, UNKNOWN no sabe'),
    has_file: z.boolean().nullish().describe('Tiene STL/CAD listo'),
    file_needs_changes: z.boolean().nullish(),
    needs_cad: z.boolean().nullish().describe('Escaneo: necesita CAD editable además de la malla'),
    dimensions_text: z.string().max(80).nullish().describe('Medidas como las dijo, o UNKNOWN'),
  }).partial().nullish(),
  demand: z.object({
    initial_quantity: cantidadFicha.describe('Unidades iniciales de UNA referencia'),
    monthly_quantity_estimate: cantidadFicha,
    recurrence: z.enum(RECURRENCIAS).nullish(),
    channel: z.enum(CANALES).nullish().describe('RESALE solo si el cliente dice que la vende'),
    multiple_references: z.boolean().nullish(),
    shared_demand_signal: z.boolean().nullish().describe('Otros talleres o clientes piden la misma pieza'),
    city: t140,
  }).partial().nullish(),
  technical: z.object({
    function: t140,
    requirements: t140.describe('Material, carga, temperatura, acabado; en mantenimiento, cambios recientes'),
    critical_use: z.boolean().nullish().describe('Frenos, dirección, suspensión, airbags, cinturones, estructuras, presión, combustible o seguridad'),
    ip_request: z.boolean().nullish().describe('Exige CAD editable, exclusividad o cesión de derechos'),
  }).partial().nullish(),
  modeling: z.object({
    factors: z.object(Object.fromEntries(FACTORES.map((f) => [f, punto])) as Record<(typeof FACTORES)[number], typeof punto>)
      .partial().nullish()
      .describe(
        'Puntos por factor. Infiérelos de lo que es la pieza; deja UNKNOWN solo lo que depende de un dato que no tienes (casi siempre referencias, a veces precisión o desarrollo). geometria: 0 prismática, 1 combinada, 2 orgánica o superficies libres. ' +
        'detalles: 0 pocos, 1 varios agujeros o alojamientos, 2 clips, nervaduras o detalle alto. ensamble: 0 pieza sola, 1 un encaje, 2 mecanismo o varias piezas. ' +
        'referencias: 0 plano completo, 1 medidas parciales, 2 el cliente dijo que solo tiene fotos, una idea o fragmentos. precision: 0 medidas generales, 1 ajuste funcional, 2 tolerancia crítica. ' +
        'desarrollo: 0 copiar o diseñar una pieza común (caja, soporte, buje) con forma clara, 1 adaptar algo existente, 2 desarrollo de producto con iteraciones o prototipos. ' +
        'Ejemplos (g,d,e,r,p,dev): buje 0,0,0,1,1,0; caja para electrónica 0,1,1,?,1,0; piñón con módulo conocido 1,1,?,0,1,0; ' +
        'tapa curva de vehículo 2,1,1,?,1,?; dos piezas que encajan o deslizan 1,1,2,?,1,?; varias piezas atornilladas 1,1,2,?,1,?; hélice 2,2,1,?,?,?. ' +
        'Si la descripción no dice la forma, usa la de la pieza más parecida del ejemplo, no UNKNOWN',
      ),
    operations: z.array(z.enum(OPERACIONES)).max(9).nullish().describe(
      'Operaciones CAD probables: EXTRUDE extrusión, REVOLVE revolución (bujes, poleas), SHELL vaciado (cajas, carcasas), PATTERN patrón (dientes, agujeros), ' +
      'LOFT secciones o barridos, FREEFORM_SURFACE superficies curvas libres, ASSEMBLY varias piezas, FIT_TOLERANCE encajes, holguras o piezas que deslizan, ' +
      'KINEMATICS mecanismos articulados (bisagras, trinquetes, engranajes que transmiten movimiento)',
    ),
    customer_unknown: z.array(z.enum(FACTORES)).max(6).nullish().describe('Factores que el cliente dijo no saber'),
  }).partial().nullish(),
  reset_modeling: z.boolean().nullish().describe('El cliente cambió de pieza: borra factores y operaciones'),
});

const codigoCotizacion = z
  .string()
  .regex(PATRON_COTIZACION, 'Usa el código Q-XXXX que devolvió cotizar_archivo en esta conversación');

export const esquemas = {
  buscar_productos: {
    entrada: z.object({
      consulta: z.string().trim().min(2).max(80)
        .describe('Palabras clave del producto, por ejemplo "boquilla 0.4" o "hotend v6"'),
    }),
    salida: z.object({
      productos: z.array(z.object({
        id: z.string(),
        nombre: z.string(),
        slug: z.string(),
        categoria: z.string(),
        precio: z.number(),
        imagen: z.string(),
        stock: z.number(),
      })),
    }),
  },

  listar_materiales: {
    entrada: z.object({}),
    salida: z.object({
      materiales: z.array(z.object({
        tecnologia,
        id: z.string(),
        nombre: z.string(),
        descripcion: z.string(),
        colores: z.array(z.object({ id: z.string(), nombre: z.string() })),
      })),
      capas: z.object({
        fdm: z.array(z.object({ capa: z.string(), nombre: z.string() })),
        resina: z.array(z.object({ capa: z.string(), nombre: z.string() })),
      }),
      rellenos: z.array(z.object({ relleno: z.string(), nombre: z.string() })),
      descuentosPorCantidad: z.array(z.object({ desde: z.number(), descuentoPct: z.number() })),
      ladoMaximoCm: z.number(),
    }),
  },

  mostrar_materiales: {
    entrada: z.object({
      materiales: z.array(z.object({
        tecnologia,
        id: z.string().describe('id de listar_materiales'),
        recomendado: z.boolean(),
        ventajas: z.array(z.string().max(60)).max(3).describe('Ventajas para el uso que describió el cliente, sin precios'),
        limites: z.array(z.string().max(60)).max(2).describe('Límites para ese uso, sin precios'),
      })).min(1).max(3),
    }),
    salida: z.object({
      materiales: z.array(z.object({
        tecnologia,
        id: z.string(),
        nombre: z.string(),
        descripcion: z.string(),
        colores: z.array(z.string()),
        recomendado: z.boolean(),
        ventajas: z.array(z.string()),
        limites: z.array(z.string()),
      })),
    }),
  },

  cotizar_archivo: {
    entrada: z.object({
      modelUrl: z.string().describe('modelUrl del archivo que el cliente adjuntó en el chat'),
      tecnologia,
      material: z.string().describe('id de listar_materiales'),
      color: z.string().describe('id de color de listar_materiales'),
      capa: z.string().describe('Altura de capa de listar_materiales, por ejemplo "0.2"'),
      relleno: z.string().describe('Relleno de listar_materiales, por ejemplo "40"'),
      cantidad,
      postProcesado: z.boolean().optional().describe('Limpieza y lijado básico. Solo si el cliente lo pide'),
    }),
    salida: z.discriminatedUnion('tipo', [
      z.object({
        tipo: z.literal('cotizacion'),
        codigo: z.string(),
        archivo: z.string(),
        opcion: z.string(),
        configuracion: z.string(),
        medidasMm: medidas,
        volumenCm3: z.number(),
        pesoGPorUnidad: z.number(),
        horasPorUnidad: z.number(),
        cantidad: z.number(),
        precioUnitario: z.number(),
        descuentoPct: z.number(),
        total: z.number(),
        /** La geometría impuso relleno 100 %: ya está en el precio. */
        rellenoFijado: z.enum(['hueca', 'laminar']).nullable(),
        /** Nivel de precio (R9.1). Falta en las cotizaciones de antes de la v5. */
        nivel: z.literal('calculada').optional(),
      }),
      z.object({
        tipo: z.literal('no-cotizable'),
        archivo: z.string(),
        motivo: z.enum(['grande', 'volumen']),
        medidasMm: medidas,
        ladoMayorCm: z.number(),
      }),
      // Desde Q_VOLUMEN_MIN por referencia: sin precio ni carrito, propuesta por WhatsApp (R4.5, D1).
      z.object({
        tipo: z.literal('volumen'),
        archivo: z.string(),
        cantidad: z.number(),
        medidasMm: medidas,
      }),
      // Uso crítico: sin precio, revisión técnica (R6.2).
      z.object({
        tipo: z.literal('revision'),
        archivo: z.string(),
        motivo: z.literal('critica'),
      }),
    ]),
  },

  comparar_opciones: {
    entrada: z.object({
      codigo: codigoCotizacion,
      opciones: z.array(z.object({
        tecnologia: tecnologia.optional(),
        material: z.string().optional(),
        color: z.string().optional(),
        capa: z.string().optional(),
        relleno: z.string().optional(),
        cantidad: cantidad.optional(),
      })).min(1).max(4).describe('Variaciones sobre la cotización; lo que no se indica se toma de ella'),
    }),
    salida: z.object({
      codigo: z.string(),
      archivo: z.string(),
      configuracion: z.string(),
      filas: z.array(z.object({
        opcion: z.string(),
        cantidad: z.number(),
        /** null en las filas de volumen: no hay precio (R4.5). */
        precioUnitario: z.number().nullable(),
        descuentoPct: z.number().nullable(),
        total: z.number().nullable(),
        elegida: z.boolean(),
        volumen: z.boolean().optional(),
      })),
    }),
  },

  estimar_rango: {
    entrada: z.object({
      descripcion: z.string().trim().min(3).max(120).describe('Qué es la pieza, en pocas palabras'),
      largoCm: z.number().positive().max(1000),
      anchoCm: z.number().positive().max(1000),
      altoCm: z.number().positive().max(1000),
      tecnologia: tecnologia.optional(),
      material: z.string().optional(),
      capa: z.string().optional(),
      relleno: z.string().optional(),
    }),
    salida: z.discriminatedUnion('tipo', [
      z.object({
        tipo: z.literal('estimacion'),
        codigo: z.string(),
        descripcion: z.string(),
        medidasCm: medidas,
        cajaCm3: z.number(),
        tecnologia: z.string(),
        material: z.string(),
        capa: z.string(),
        relleno: z.string(),
        ocupacionMinPct: z.number(),
        ocupacionMaxPct: z.number(),
        min: z.number(),
        max: z.number(),
        nivel: z.literal('preliminar').optional(),
      }),
      z.object({
        tipo: z.literal('grande'),
        descripcion: z.string(),
        ladoMayorCm: z.number(),
      }),
      z.object({
        tipo: z.literal('revision'),
        descripcion: z.string(),
        motivo: z.literal('critica'),
      }),
    ]),
  },

  estimar_envio: {
    entrada: z.object({
      ciudad: z.string().trim().min(2).max(80).describe('Ciudad de destino. Nunca pidas la dirección'),
      departamento: z.string().trim().max(80).optional().describe('Solo si la ciudad no basta para ubicarla'),
      codigos: z.array(codigoCotizacion).max(10).optional().describe('Cotizaciones Q- que irían en el pedido'),
      productos: z.array(z.object({ productoId: z.string(), cantidad })).max(10).optional()
        .describe('Productos de buscar_productos que irían en el pedido'),
    }),
    salida: z.discriminatedUnion('tipo', [
      z.object({
        tipo: z.literal('envio'),
        destino: z.string(),
        etiqueta: z.string(),
        costoEnvio: z.number(),
        gratisPorMonto: z.boolean(),
        lineas: z.array(z.object({ descripcion: z.string(), cantidad: z.number(), total: z.number() })),
        subtotal: z.number(),
        total: z.number(),
        recogida: z.string().nullable(),
      }),
      z.object({
        tipo: z.literal('a-confirmar'),
        destino: z.string(),
        subtotal: z.number(),
      }),
    ]),
  },

  // Corre en el navegador: muestra la tarjeta de confirmación y el cliente decide.
  agregar_al_carrito: {
    entrada: z.object({
      codigo: codigoCotizacion.optional().describe('Código Q- de cotizar_archivo'),
      productoId: z.string().optional().describe('id de buscar_productos'),
      cantidad,
    }).refine((e) => !!e.codigo !== !!e.productoId, 'Pasa codigo o productoId, uno de los dos'),
    salida: z.object({
      resultado: z.enum(['confirmado', 'rechazado', 'sin-stock', 'no-disponible']),
      cantidad: z.number().optional(),
      total: z.number().optional(),
      /** Qué se agregó ("Impresión 3D · soporte.stl") o por qué no se pudo. */
      detalle: z.string().max(200).optional(),
    }),
  },

  derivar_a_asesor: {
    entrada: z.object({
      motivo: z.enum(MOTIVOS_DERIVACION).describe('Por qué se deriva'),
      piezas: z.array(z.object({
        descripcion: z.string().trim().min(3).max(140).describe('Qué necesita el cliente, sin precios'),
        codigo: z.string().regex(PATRON_CODIGO).optional().describe('Código Q-, E- o M- si la pieza tiene uno'),
        nota: z.string().max(80).optional().describe('Por qué va a un asesor, por ejemplo "pasa de 30 cm". Sin precios'),
      })).max(6),
    }),
    salida: z.object({
      mensaje: z.string(),
      enlace: z.string(),
      /** Falta en las derivaciones de antes de la v5. */
      motivo: z.enum(MOTIVOS_DERIVACION).optional(),
    }),
  },

  // ── Agente v5 ──
  actualizar_ficha: {
    entrada: fichaParcial,
    salida: z.object({
      perfil: z.enum(PERFILES),
      ruta: z.enum(RUTAS),
      whatsapp: z.enum(['REQUIRED', 'OFFER', 'NO']),
      next_action: z.enum(['ASK', 'SEARCH_CATALOG', 'QUOTE', 'TECHNICAL_REVIEW', 'COMMERCIAL_WHATSAPP']),
      primerFaltante: z.object({ campo: z.string(), pregunta: z.string() }).nullable(),
      requiereRevision: z.boolean(),
      motivoRevision: z.string().nullable(),
      /** "C2–C3, confianza media" */
      clase: z.string().nullable(),
      /** Lo que el agente debe hacer ahora, calculado por el servidor. */
      siguientePaso: z.string(),
    }),
  },

  estimar_modelado: {
    entrada: z.object({
      descripcion: z.string().trim().min(3).max(140).describe('Qué hay que diseñar, en pocas palabras. La clase sale de la ficha'),
    }),
    salida: z.discriminatedUnion('tipo', [
      z.object({
        tipo: z.literal('estimado'),
        codigo: z.string(),
        descripcion: z.string(),
        claseMin: clase,
        claseMax: clase,
        horasMin: z.number(),
        horasMax: z.number(),
        confianza,
        min: z.number(),
        max: z.number(),
        revisionRecomendada: z.boolean(),
        operaciones: z.array(z.string()),
        podriaCambiar: z.array(z.string()),
        noIncluye: z.string(),
      }),
      z.object({
        tipo: z.literal('revision'),
        codigo: z.string(),
        descripcion: z.string(),
        motivo: z.enum(['critica', 'c6', 'tolerancia', 'sin-tarifa', 'no-publicado']),
        claseMin: clase,
        claseMax: clase,
        horasMin: z.number(),
        horasMax: z.number().nullable(),
        confianza,
        operaciones: z.array(z.string()),
        podriaCambiar: z.array(z.string()),
        noIncluye: z.string(),
      }),
      z.object({
        tipo: z.literal('en-propuesta'),
        codigo: z.string(),
        descripcion: z.string(),
        claseMin: clase,
        claseMax: clase,
        horasMin: z.number(),
        horasMax: z.number().nullable(),
        confianza,
        mensaje: z.string(),
      }),
      z.object({
        tipo: z.literal('no-requiere'),
        descripcion: z.string(),
      }),
    ]),
  },

  consultar_escaneo: {
    entrada: z.object({
      tamano: z.enum(['pequeno', 'mediano', 'grande']).optional().describe('Tamaño del objeto, si se sabe'),
      necesitaCad: z.boolean().optional().describe('Si además de la malla necesita un CAD editable'),
    }),
    salida: z.discriminatedUnion('tipo', [
      z.object({
        tipo: z.literal('tarifas'),
        filas: z.array(z.object({ servicio: z.string(), desde: z.number(), condicion: z.string() })),
        aclaracion: z.string(),
      }),
      z.object({
        tipo: z.literal('no-disponible'),
        motivo: z.enum(['sin-tarifa', 'no-publicado']),
        aclaracion: z.string(),
      }),
    ]),
  },
} as const;

type Contrato = typeof esquemas;
export type NombreTool = keyof Contrato;
export type EntradaTool<K extends NombreTool> = z.infer<Contrato[K]['entrada']>;
export type SalidaTool<K extends NombreTool> = z.infer<Contrato[K]['salida']>;
export type ToolsAsistente = { [K in NombreTool]: { input: EntradaTool<K>; output: SalidaTool<K> } };

// ── Partes que agrega el navegador a un mensaje del cliente ───────────────────────────

/** Lo que devuelve /api/cotizador/archivo y viaja en el mensaje como `data-archivo`. */
export const archivoAdjunto = z.object({
  nombre: z.string().max(200),
  bytes: z.number().int().nonnegative(),
  modelUrl: z.url(),
  medidasMm: medidas,
  volumenCm3: z.number().nonnegative(),
  geometria: z.enum(['solid', 'hollow', 'thin']),
  grande: z.boolean(),
  ladoMayorCm: z.number(),
  volumenNoFiable: z.boolean(),
});
export type ArchivoAdjunto = z.infer<typeof archivoAdjunto>;

/** Productos que el cliente agregó con el "+" (§10.2): el agente lo sabe en el siguiente turno. */
export const agregadosPorCliente = z.object({
  productos: z.array(z.object({ nombre: z.string().max(200), cantidad: z.number().int().min(1) })).max(20),
});
export type AgregadosPorCliente = z.infer<typeof agregadosPorCliente>;

export type DatosAsistente = {
  archivo: ArchivoAdjunto;
  agregados: AgregadosPorCliente;
};

export type MensajeChat = UIMessage<unknown, DatosAsistente, ToolsAsistente>;
export type ParteMensaje = MensajeChat['parts'][number];
