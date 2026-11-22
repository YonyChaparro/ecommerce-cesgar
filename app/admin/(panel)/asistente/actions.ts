'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { saveAsistenteConfig } from '@/lib/asistente/config';
import { saveParametros } from '@/lib/asistente/parametros';
import { MONTOS, validarParametros, type ParametrosComerciales } from '@/lib/asistente/parametros-tipos';
import { LIMITES_TOPES, MAX_RESPALDOS, type AsistenteConfig } from '@/lib/asistente/tipos';
import { modeloAprobado } from '@/lib/asistente/validaciones';

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}

const esquema = z.object({
  activo: z.boolean(),
  modelo: z.string().max(120),
  respaldos: z.array(z.string().min(1).max(120)).max(MAX_RESPALDOS),
  maxTurnos: z.number().int().min(LIMITES_TOPES.maxTurnos.min).max(LIMITES_TOPES.maxTurnos.max),
  maxCaracteresMensaje: z.number().int()
    .min(LIMITES_TOPES.maxCaracteresMensaje.min).max(LIMITES_TOPES.maxCaracteresMensaje.max),
});

/**
 * Decide el servidor, no solo la UI: un modelo que no aprobó verify:agente no
 * se guarda aunque alguien se salte el formulario (propuesta §12).
 */
export async function saveAsistenteConfigAction(config: AsistenteConfig): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const p = esquema.safeParse(config);
  if (!p.success) {
    const t = LIMITES_TOPES;
    return {
      ok: false,
      error: `Revisa los topes: turnos entre ${t.maxTurnos.min} y ${t.maxTurnos.max}; caracteres entre ` +
        `${t.maxCaracteresMensaje.min} y ${t.maxCaracteresMensaje.max}; hasta ${MAX_RESPALDOS} respaldos.`,
    };
  }
  const c = p.data;

  for (const id of [c.modelo, ...c.respaldos].filter(Boolean)) {
    if (!modeloAprobado(id)) return { ok: false, error: `${id} no aprobó verify:agente: no se puede elegir.` };
  }
  if (c.respaldos.includes(c.modelo)) return { ok: false, error: 'Un respaldo no puede ser el mismo modelo principal.' };
  if (new Set(c.respaldos).size !== c.respaldos.length) return { ok: false, error: 'Hay respaldos repetidos.' };
  if (c.activo && !c.modelo) return { ok: false, error: 'Para activar el asistente elige un modelo principal aprobado.' };
  if (c.activo && !process.env.OPENROUTER_API_KEY) {
    return { ok: false, error: 'No se puede activar: falta OPENROUTER_API_KEY en las variables del servidor.' };
  }

  try {
    await saveAsistenteConfig(c);
    revalidatePath('/cotizador');
    revalidatePath('/cotizador/asistente');
    revalidatePath('/admin/asistente');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

const monto = z.number().int().min(0).max(100_000_000).nullable();
const horas = z.object({ min: z.number().positive().max(1000), max: z.number().positive().max(1000) });
const esquemaParametros = z.object({
  PRICE_LIST_VERSION: z.string().trim().min(1).max(40),
  ...Object.fromEntries(MONTOS.map((k) => [k, monto])) as Record<(typeof MONTOS)[number], typeof monto>,
  horasPorClase: z.object({ C1: horas, C2: horas, C3: horas, C4: horas, C5: horas, C6: z.object({ min: z.number().positive().max(1000) }) }),
  Q_EVALUAR: z.number().int(),
  Q_VOLUMEN_MIN: z.number().int(),
  Q_INDUSTRIAL_PRIORITY: z.number().int(),
  publicarPrecioModelado: z.boolean(),
  publicarTarifasEscaneo: z.boolean(),
});

/**
 * Parámetros comerciales del agente (R1). El servidor valida el orden de los
 * umbrales y las horas, y registra quién y cuándo (R1.4): el usuario del panel
 * y la fecha. Devuelve lo guardado para que el formulario muestre «Aprobado por».
 */
export async function saveParametrosAction(
  p: ParametrosComerciales,
): Promise<{ ok: true; guardado: ParametrosComerciales } | { ok: false; error: string }> {
  const session = await requireAdmin();
  const r = esquemaParametros.safeParse(p);
  if (!r.success) return { ok: false, error: 'Revisa los campos: montos enteros ≥ 0 o vacíos, horas positivas y la versión obligatoria.' };
  const completos: ParametrosComerciales = { ...r.data, aprobadoPor: null, aprobadoEn: null };
  const errores = validarParametros(completos);
  if (errores.length) return { ok: false, error: errores.join(' ') };

  const usuario = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } }).catch(() => null);
  try {
    const guardado = await saveParametros(completos, usuario?.name || usuario?.email || session.userId);
    revalidatePath('/admin/asistente');
    return { ok: true, guardado };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
