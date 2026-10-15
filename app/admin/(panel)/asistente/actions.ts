'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { saveAsistenteConfig } from '@/lib/asistente/config';
import { LIMITES_TOPES, MAX_RESPALDOS, type AsistenteConfig } from '@/lib/asistente/tipos';
import { modeloAprobado } from '@/lib/asistente/validaciones';

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
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
