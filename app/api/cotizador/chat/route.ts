import { z } from 'zod';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  generateId,
  isStepCount,
  streamText,
  toUIMessageStream,
} from 'ai';
import { getQuoterPricing } from '@/lib/quoter-config';
import { getShippingConfig } from '@/lib/shipping-config';
import { estadoAsistente, getAsistenteConfig } from '@/lib/asistente/config';
import type { MensajeChat } from '@/lib/asistente/esquemas';
import { contarTurnos, fusionarMensaje, parteDatosParaModelo } from '@/lib/asistente/fusion';
import { limitar, respuestaLimite } from '@/lib/asistente/limite';
import { costoDe, modeloChat } from '@/lib/asistente/openrouter';
import { PROMPT_ASISTENTE } from '@/lib/asistente/prompt';
import {
  contextoTools,
  guardarMensajes,
  guardarSesion,
  leerSesion,
  limpiarSesionesViejas,
  PATRON_ID_SESION,
  registrarUso,
} from '@/lib/asistente/sesion';
import { crearTools } from '@/lib/asistente/tools';

// Streaming del agente (propuesta §8). Varias tools pueden encadenarse en una
// misma respuesta, así que se da margen.
export const maxDuration = 60;

const cuerpo = z.object({
  id: z.string().regex(PATRON_ID_SESION),
  mensaje: z.unknown(),
});

function error(status: number, codigo: string, detalle?: string) {
  return Response.json({ codigo, detalle }, { status });
}

/** Retoma una conversación al recargar: el navegador guarda solo el id. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!PATRON_ID_SESION.test(id)) return error(400, 'id-invalido');
  const sesion = await leerSesion(id);
  return Response.json({ mensajes: sesion?.mensajes ?? [] });
}

export async function POST(req: Request) {
  const config = await getAsistenteConfig();
  if (!estadoAsistente(config).disponible) return error(503, 'apagado');

  const limite = limitar('chat', req);
  if (!limite.ok) return respuestaLimite(limite.reintentarEnS);

  const body = cuerpo.safeParse(await req.json().catch(() => null));
  if (!body.success) return error(400, 'mensaje-invalido');
  const { id } = body.data;

  const sesion = await leerSesion(id);
  if (!sesion) void limpiarSesionesViejas();

  // El servidor decide qué se acepta del navegador (lib/asistente/fusion.ts).
  const fusion = fusionarMensaje(sesion?.mensajes ?? [], body.data.mensaje, {
    maxCaracteres: config.maxCaracteresMensaje,
  });
  if (!fusion.ok) {
    const status = fusion.codigo === 'mensaje-largo' ? 413 : fusion.codigo === 'fuera-de-orden' ? 409 : 400;
    return error(status, fusion.codigo, fusion.detalle);
  }
  const turnos = contarTurnos(fusion.mensajes);
  if (fusion.nuevoTurno && turnos > config.maxTurnos) return error(403, 'tope-turnos');
  await guardarSesion(id, fusion.mensajes, turnos);

  const [pricing, envio] = await Promise.all([getQuoterPricing(), getShippingConfig()]);
  const tools = crearTools(contextoTools(id, pricing, envio));

  const result = streamText({
    model: modeloChat(config, id),
    instructions: PROMPT_ASISTENTE,
    messages: await convertToModelMessages(fusion.mensajes, {
      tools,
      // Una tarjeta de confirmación que el cliente dejó sin responder antes de
      // escribir otra cosa no lleva resultado: se omite en vez de romper la petición.
      ignoreIncompleteToolCalls: true,
      convertDataPart: parteDatosParaModelo,
    }),
    tools,
    stopWhen: isStepCount(6),
    maxOutputTokens: 1500,
    onEnd: async ({ steps, usage, finalStep }) => {
      const modelo = finalStep.response.modelId;
      await registrarUso(id, {
        costoUsd: steps.reduce((s, paso) => s + costoDe(paso.providerMetadata), 0),
        tokensEntrada: usage.inputTokens ?? 0,
        tokensSalida: usage.outputTokens ?? 0,
        modelo,
        respaldo: !!modelo && modelo !== config.modelo,
      }).catch((e) => console.error('[asistente/chat] uso', e));
    },
  });

  return createUIMessageStreamResponse({
    // Que un proxy delante (nginx/LiteSpeed en Hostinger) no acumule la respuesta.
    headers: { 'X-Accel-Buffering': 'no', 'Cache-Control': 'no-cache, no-transform' },
    stream: toUIMessageStream({
      stream: result.stream,
      tools,
      originalMessages: fusion.mensajes,
      generateMessageId: generateId,
      onEnd: async ({ messages }) => {
        // Si el modelo falló antes de escribir nada queda un mensaje vacío: no se
        // guarda, o el siguiente turno le mandaría al modelo un turno en blanco.
        const conContenido = (messages as MensajeChat[]).filter(
          (m) => m.role !== 'assistant' || m.parts.some((p) => p.type !== 'step-start'),
        );
        await guardarMensajes(id, conContenido).catch((e) =>
          console.error('[asistente/chat] guardar', e),
        );
      },
      onError: (e) => {
        console.error('[asistente/chat]', e);
        return 'No pude responder esta vez.';
      },
    }),
  });
}
