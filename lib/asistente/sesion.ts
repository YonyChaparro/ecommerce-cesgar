import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import type { QuoterPricing } from '../quoter-types';
import type { ShippingConfig } from '../shipping-types';
import { medirArchivo } from './archivos';
import { generarCodigo } from './codigos';
import type { MensajeChat } from './esquemas';
import type { ContextoTools, CotizacionGuardada, ProductoTienda } from './tools/contexto';

// Persistencia del asistente: ChatSession (conversación anónima) y ChatQuote
// (cotizaciones y estimaciones con código). Sin datos personales.

/** El id lo genera el navegador; se trata como un token opaco. */
export const PATRON_ID_SESION = /^[A-Za-z0-9_-]{12,64}$/;

const RETENCION_DIAS = 90; // decisión 4 de la propuesta

export async function leerSesion(id: string): Promise<{ mensajes: MensajeChat[]; turnos: number } | null> {
  const s = await prisma.chatSession.findUnique({ where: { id }, select: { mensajes: true, turnos: true } });
  if (!s) return null;
  try {
    return { mensajes: JSON.parse(s.mensajes) as MensajeChat[], turnos: s.turnos };
  } catch {
    return { mensajes: [], turnos: s.turnos };
  }
}

/** Guarda el estado antes de llamar al modelo: si la respuesta falla, el mensaje del cliente no se pierde. */
export async function guardarSesion(id: string, mensajes: MensajeChat[], turnos: number): Promise<void> {
  const json = JSON.stringify(mensajes);
  await prisma.chatSession.upsert({
    where: { id },
    update: { mensajes: json, turnos },
    create: { id, mensajes: json, turnos },
  });
}

export async function guardarMensajes(id: string, mensajes: MensajeChat[]): Promise<void> {
  await prisma.chatSession.update({ where: { id }, data: { mensajes: JSON.stringify(mensajes) } });
}

export async function registrarUso(
  id: string,
  uso: { costoUsd: number; tokensEntrada: number; tokensSalida: number; modelo?: string; respaldo: boolean },
): Promise<void> {
  const s = await prisma.chatSession.findUnique({ where: { id }, select: { modelos: true } });
  let modelos: { modelo: string; respaldo: boolean }[] = [];
  try { modelos = s?.modelos ? JSON.parse(s.modelos) : []; } catch {}
  if (uso.modelo && !modelos.some((m) => m.modelo === uso.modelo)) {
    modelos.push({ modelo: uso.modelo, respaldo: uso.respaldo });
  }
  await prisma.chatSession.update({
    where: { id },
    data: {
      costoUsd: { increment: uso.costoUsd },
      tokensEntrada: { increment: uso.tokensEntrada },
      tokensSalida: { increment: uso.tokensSalida },
      modelos: JSON.stringify(modelos),
    },
  });
}

/**
 * "carrito" al confirmar una tarjeta o usar el "+"; "derivado" al abrir WhatsApp.
 * Si una conversación tiene las dos, queda "carrito" (propuesta §14).
 */
export async function marcarResultado(id: string, resultado: 'carrito' | 'derivado'): Promise<void> {
  if (resultado === 'carrito') {
    await prisma.chatSession.updateMany({ where: { id }, data: { resultado: 'carrito' } });
  } else {
    await prisma.chatSession.updateMany({ where: { id, resultado: null }, data: { resultado: 'derivado' } });
  }
}

let ultimaLimpieza = 0;

/**
 * Borra las conversaciones de más de 90 días. Hostinger puede no ofrecer tareas
 * programadas, así que corre al crear conversaciones, como mucho una vez por hora.
 */
export async function limpiarSesionesViejas(): Promise<void> {
  const ahora = Date.now();
  if (ahora - ultimaLimpieza < 60 * 60 * 1000) return;
  ultimaLimpieza = ahora;
  const limite = new Date(ahora - RETENCION_DIAS * 24 * 60 * 60 * 1000);
  await prisma.chatSession.deleteMany({ where: { createdAt: { lt: limite } } }).catch((e) => {
    console.error('[asistente] limpieza de conversaciones', e);
  });
}

// ── Contexto real de las tools ──────────────────────────────────────────────────────────

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

async function buscarProductos(consulta: string): Promise<ProductoTienda[]> {
  const palabras = consulta.toLowerCase().split(/\s+/).filter((p) => p.length >= 2).slice(0, 5);
  if (palabras.length === 0) return [];
  const candidatos = await prisma.product.findMany({
    where: {
      stock: { gt: 0 },
      OR: palabras.flatMap((p) => [{ name: { contains: p } }, { category: { contains: p } }]),
    },
    select: { id: true, name: true, slug: true, category: true, price: true, salePrice: true, img: true, stock: true },
    take: 40,
  });
  const claves = palabras.map(normalizar);
  return candidatos
    .map((p) => ({ p, puntos: claves.filter((c) => normalizar(p.name).includes(c)).length }))
    .sort((a, b) => b.puntos - a.puntos || a.p.name.length - b.p.name.length)
    .slice(0, 4)
    .map(({ p }) => ({
      id: p.id,
      nombre: p.name,
      slug: p.slug,
      categoria: p.category,
      // Lo mismo que cobra /api/checkout.
      precio: p.salePrice ?? p.price,
      imagen: p.img,
      stock: p.stock,
    }));
}

async function leerProducto(id: string): Promise<ProductoTienda | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, category: true, price: true, salePrice: true, img: true, stock: true },
  });
  return p && {
    id: p.id, nombre: p.name, slug: p.slug, categoria: p.category,
    precio: p.salePrice ?? p.price, imagen: p.img, stock: p.stock,
  };
}

export async function leerCotizacion(sesionId: string, codigo: string): Promise<CotizacionGuardada | null> {
  const q = await prisma.chatQuote.findUnique({ where: { sessionId_codigo: { sessionId: sesionId, codigo } } });
  if (!q) return null;
  return { tipo: q.tipo, id: q.id, codigo: q.codigo, datos: JSON.parse(q.datos) } as CotizacionGuardada;
}

export function contextoTools(sesionId: string, pricing: QuoterPricing, envio: ShippingConfig): ContextoTools {
  return {
    pricing,
    envio,
    medirArchivo,
    buscarProductos,
    leerProducto,
    async guardarCotizacion(nueva) {
      // Códigos de 4 caracteres: una colisión dentro de la misma conversación es
      // rarísima, pero la restricción única la detecta y se reintenta.
      for (let intento = 0; intento < 5; intento++) {
        const codigo = generarCodigo(nueva.tipo === 'archivo' ? 'Q' : 'E');
        try {
          await prisma.chatQuote.create({
            data: { sessionId: sesionId, codigo, tipo: nueva.tipo, datos: JSON.stringify(nueva.datos) },
          });
          return codigo;
        } catch (e) {
          if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
        }
      }
      throw new Error('No se pudo generar un código de cotización. Inténtalo de nuevo.');
    },
    leerCotizacion: (codigo) => leerCotizacion(sesionId, codigo),
    async actualizarPreciosMostrados(codigo, precios) {
      const cot = await leerCotizacion(sesionId, codigo);
      if (cot?.tipo !== 'archivo') return;
      await prisma.chatQuote.update({
        where: { sessionId_codigo: { sessionId: sesionId, codigo } },
        data: { datos: JSON.stringify({ ...cot.datos, preciosMostrados: precios }) },
      });
    },
  };
}
