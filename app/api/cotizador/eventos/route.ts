import { z } from 'zod';
import { limitar, respuestaLimite } from '@/lib/asistente/limite';
import { marcarResultado, PATRON_ID_SESION } from '@/lib/asistente/sesion';

const cuerpo = z.object({
  id: z.string().regex(PATRON_ID_SESION),
  tipo: z.enum(['carrito', 'derivado']),
});

/**
 * El "+" de un producto y abrir WhatsApp no pasan por el modelo, así que el
 * navegador los avisa aquí para medir la conversación (propuesta §14). Llega
 * con sendBeacon si la página se está cerrando, por eso se lee como texto.
 */
export async function POST(req: Request) {
  const limite = limitar('eventos', req);
  if (!limite.ok) return respuestaLimite(limite.reintentarEnS);

  let json: unknown = null;
  try { json = JSON.parse(await req.text()); } catch {}
  const body = cuerpo.safeParse(json);
  if (!body.success) return new Response(null, { status: 400 });

  await marcarResultado(body.data.id, body.data.tipo).catch((e) => console.error('[asistente/eventos]', e));
  return new Response(null, { status: 204 });
}
