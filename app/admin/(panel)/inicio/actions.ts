'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { saveHomeContent } from '@/lib/home-content';
import { TOPE_BYTES, type HomeContent } from '@/lib/home-content-types';
import { bytesJson, validarHomeContent, type ErroresCampo } from '@/lib/home-content-validate';

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

export type ResultadoGuardado =
  | { ok: true; contenido: HomeContent }
  | { ok: false; error: string; errores?: ErroresCampo };

/**
 * `entrada` es unknown a propósito: una Server Action se puede llamar con un
 * POST cualquiera y su tipo TypeScript no protege nada en tiempo de ejecución.
 * Devuelve el contenido ya normalizado, que es lo que quedó guardado.
 */
export async function saveHomeContentAction(entrada: unknown): Promise<ResultadoGuardado> {
  await requireAdmin();

  const r = validarHomeContent(entrada);
  if (!r.ok) return { ok: false, error: 'Hay campos por corregir', errores: r.errores };

  // MySQL corta en silencio lo que no cabe en TEXT; un JSON cortado haría que
  // el home vuelva a los textos de fábrica sin que nadie lo note.
  if (bytesJson(r.value) > TOPE_BYTES) {
    return { ok: false, error: 'El contenido es demasiado largo para guardarse' };
  }

  try {
    await saveHomeContent(r.value);
  } catch (e) {
    console.error('[admin/inicio] no se pudo guardar:', e);
    return { ok: false, error: 'No se pudo guardar. Intenta de nuevo.' };
  }

  // Todo el sitio: el botón del menú está en cada página que usa Navbar, y
  // algunas son estáticas (/servicios, /sobre-nosotros, el 404).
  revalidatePath('/', 'layout');
  return { ok: true, contenido: r.value };
}
