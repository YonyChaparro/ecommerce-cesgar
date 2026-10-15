// Contrato de cada tool del asistente: entrada y salida, definidas una vez con
// zod (propuesta §6.1, regla 5). Este archivo no tiene código de servidor: el
// servidor valida con estos esquemas y las tarjetas del chat usan los tipos
// inferidos, así que si cambia un campo la compilación falla en los dos lados.

import { z } from 'zod';
import type { UIMessage } from 'ai';
import { PATRON_CODIGO, PATRON_COTIZACION } from './codigos';

const tecnologia = z.enum(['fdm', 'resina']);
const cantidad = z.number().int().min(1).max(1000);
const medidas = z.object({ x: z.number(), y: z.number(), z: z.number() });
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
      }),
      z.object({
        tipo: z.literal('no-cotizable'),
        archivo: z.string(),
        motivo: z.enum(['grande', 'volumen']),
        medidasMm: medidas,
        ladoMayorCm: z.number(),
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
        precioUnitario: z.number(),
        descuentoPct: z.number(),
        total: z.number(),
        elegida: z.boolean(),
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
      }),
      z.object({
        tipo: z.literal('grande'),
        descripcion: z.string(),
        ladoMayorCm: z.number(),
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
      piezas: z.array(z.object({
        descripcion: z.string().trim().min(3).max(140).describe('Qué necesita el cliente, sin precios'),
        codigo: z.string().regex(PATRON_CODIGO).optional().describe('Código Q- o E- si la pieza tiene uno'),
        nota: z.string().max(80).optional().describe('Por qué va a un asesor, por ejemplo "pasa de 30 cm". Sin precios'),
      })).min(1).max(6),
    }),
    salida: z.object({
      mensaje: z.string(),
      enlace: z.string(),
    }),
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
