import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import type { MensajeChat } from './esquemas';
import { desdeDe, TAMANO_PAGINA, type Filtros, type Resultado } from './filtros';
import { modelosDe, type ModeloRespondio } from './resumen';

export * from './filtros';

// Consultas de /admin/asistente/conversaciones (vista 7). Todo sale de
// ChatSession, y de Order para saber si una conversación terminó en una compra
// pagada (Order.chatSessionId).

function dondeDe(f: Filtros, conFiltrosDeTabla: boolean): Prisma.ChatSessionWhereInput {
  const where: Prisma.ChatSessionWhereInput = { createdAt: { gte: desdeDe(f.periodo) } };
  if (!conFiltrosDeTabla) return where;
  if (f.id) where.id = { contains: f.id };
  if (f.resultado) where.resultado = f.resultado === 'abandonado' ? null : f.resultado;
  // `modelos` es JSON en texto: basta con buscar la entrada de ese modelo.
  if (f.modelo) where.modelos = { contains: `"modelo":${JSON.stringify(f.modelo)}` };
  return where;
}

export interface OrdenDeChat {
  id: string;
  pagada: boolean;
  total: number;
}

/** La orden de cada conversación; si hay varias, gana la pagada. */
async function ordenesDe(ids: string[]): Promise<Map<string, OrdenDeChat>> {
  if (ids.length === 0) return new Map();
  const ordenes = await prisma.order.findMany({
    where: { chatSessionId: { in: ids } },
    select: { id: true, status: true, total: true, chatSessionId: true },
    orderBy: { createdAt: 'desc' },
  });
  const porChat = new Map<string, OrdenDeChat>();
  for (const o of ordenes) {
    const previa = porChat.get(o.chatSessionId!);
    const pagada = o.status === 'approved';
    if (!previa || (pagada && !previa.pagada)) porChat.set(o.chatSessionId!, { id: o.id, pagada, total: o.total });
  }
  return porChat;
}

export interface Indicadores {
  conversaciones: number;
  carrito: number;
  pagadas: number;
  derivadas: number;
  costoUsd: number;
}

/** Los indicadores van por periodo, sin los filtros de la tabla (vista 7). */
export async function indicadores(f: Filtros): Promise<Indicadores> {
  const where = dondeDe(f, false);
  const [conversaciones, carrito, derivadas, costo, pagadas] = await Promise.all([
    prisma.chatSession.count({ where }),
    prisma.chatSession.count({ where: { ...where, resultado: 'carrito' } }),
    prisma.chatSession.count({ where: { ...where, resultado: 'derivado' } }),
    prisma.chatSession.aggregate({ where, _sum: { costoUsd: true } }),
    prisma.order.count({ where: { status: 'approved', chatSessionId: { not: null }, createdAt: { gte: desdeDe(f.periodo) } } }),
  ]);
  return { conversaciones, carrito, derivadas, pagadas, costoUsd: costo._sum.costoUsd ?? 0 };
}

export interface FilaConversacion {
  id: string;
  inicio: Date;
  modelo: ModeloRespondio | null;
  turnos: number;
  tokensEntrada: number;
  tokensSalida: number;
  costoUsd: number;
  resultado: Resultado;
  orden: OrdenDeChat | null;
}

const SELECT_FILA = {
  id: true, createdAt: true, modelos: true, turnos: true, tokensEntrada: true,
  tokensSalida: true, costoUsd: true, resultado: true,
} as const;

function aFila(
  s: Prisma.ChatSessionGetPayload<{ select: typeof SELECT_FILA }>,
  ordenes: Map<string, OrdenDeChat>,
): FilaConversacion {
  return {
    id: s.id,
    inicio: s.createdAt,
    modelo: modelosDe(s.modelos)[0] ?? null,
    turnos: s.turnos,
    tokensEntrada: s.tokensEntrada,
    tokensSalida: s.tokensSalida,
    costoUsd: s.costoUsd,
    resultado: (s.resultado as Resultado | null) ?? 'abandonado',
    orden: ordenes.get(s.id) ?? null,
  };
}

export async function paginaConversaciones(f: Filtros): Promise<{ filas: FilaConversacion[]; total: number }> {
  const where = dondeDe(f, true);
  const [total, sesiones] = await Promise.all([
    prisma.chatSession.count({ where }),
    prisma.chatSession.findMany({
      where,
      select: SELECT_FILA,
      orderBy: { createdAt: 'desc' },
      skip: (f.pagina - 1) * TAMANO_PAGINA,
      take: TAMANO_PAGINA,
    }),
  ]);
  const ordenes = await ordenesDe(sesiones.map((s) => s.id));
  return { total, filas: sesiones.map((s) => aFila(s, ordenes)) };
}

/** Para "Exportar CSV": todas las filas que cumplen los filtros, sin paginar. */
export async function todasLasConversaciones(f: Filtros): Promise<FilaConversacion[]> {
  const sesiones = await prisma.chatSession.findMany({
    where: dondeDe(f, true),
    select: SELECT_FILA,
    orderBy: { createdAt: 'desc' },
    take: 10_000,
  });
  const ordenes = await ordenesDe(sesiones.map((s) => s.id));
  return sesiones.map((s) => aFila(s, ordenes));
}

export interface CostoModelo {
  modelo: string;
  respaldo: boolean;
  conversaciones: number;
  costoUsd: number;
  pctCarrito: number;
}

/**
 * Costo por el modelo que respondió, separando principal y respaldo. Una
 * conversación cuenta para el primer modelo que la atendió.
 */
export async function costoPorModelo(f: Filtros): Promise<CostoModelo[]> {
  const sesiones = await prisma.chatSession.findMany({
    where: dondeDe(f, false),
    select: { modelos: true, costoUsd: true, resultado: true },
  });
  const grupos = new Map<string, CostoModelo & { carrito: number }>();
  for (const s of sesiones) {
    const m = modelosDe(s.modelos)[0];
    if (!m) continue;
    const clave = `${m.modelo}|${m.respaldo}`;
    const g = grupos.get(clave) ?? { modelo: m.modelo, respaldo: m.respaldo, conversaciones: 0, costoUsd: 0, pctCarrito: 0, carrito: 0 };
    g.conversaciones++;
    g.costoUsd += s.costoUsd;
    if (s.resultado === 'carrito') g.carrito++;
    grupos.set(clave, g);
  }
  return [...grupos.values()]
    .map(({ carrito, ...g }) => ({ ...g, pctCarrito: g.conversaciones ? (carrito / g.conversaciones) * 100 : 0 }))
    .sort((a, b) => Number(a.respaldo) - Number(b.respaldo) || b.conversaciones - a.conversaciones);
}

/** Modelos que aparecen en el periodo, para el filtro de la tabla. */
export async function modelosDelPeriodo(f: Filtros): Promise<string[]> {
  const sesiones = await prisma.chatSession.findMany({ where: dondeDe(f, false), select: { modelos: true } });
  return [...new Set(sesiones.flatMap((s) => modelosDe(s.modelos).map((m) => m.modelo)))].sort();
}

export interface DetalleConversacion extends FilaConversacion {
  modelos: ModeloRespondio[];
  mensajes: MensajeChat[];
}

export async function detalleConversacion(id: string): Promise<DetalleConversacion | null> {
  const s = await prisma.chatSession.findUnique({ where: { id }, select: { ...SELECT_FILA, mensajes: true } });
  if (!s) return null;
  let mensajes: MensajeChat[] = [];
  try { mensajes = JSON.parse(s.mensajes); } catch {}
  const ordenes = await ordenesDe([s.id]);
  return { ...aFila(s, ordenes), modelos: modelosDe(s.modelos), mensajes };
}
