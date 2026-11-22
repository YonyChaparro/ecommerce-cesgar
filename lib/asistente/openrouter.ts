import 'server-only';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { AsistenteConfig } from './tipos';

// La key vive solo en las variables de Hostinger (OPENROUTER_API_KEY). El tope
// de gasto se configura en la propia key: es la última barrera de costo.
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  compatibility: 'strict',
  headers: {
    'HTTP-Referer': 'https://cesgar.com.co',
    'X-Title': 'Cesgar - Asistente del cotizador',
  },
});

/**
 * El modelo del chat. Con el arreglo `models`, si el principal falla (caída,
 * límite de peticiones, contexto) OpenRouter prueba los respaldos en orden y
 * cobra el que respondió. `session_id` hace que las peticiones de una
 * conversación vayan al mismo proveedor, para aprovechar su caché.
 */
export function modeloChat(config: Pick<AsistenteConfig, 'modelo' | 'respaldos'>, sesionId: string) {
  return openrouter.chat(config.modelo, {
    models: [config.modelo, ...config.respaldos],
    usage: { include: true },
    extraBody: { session_id: sesionId },
  });
}

/** Costo en US$ que OpenRouter informa en providerMetadata (usage accounting). */
export function costoDe(providerMetadata: unknown): number {
  const costo = (providerMetadata as { openrouter?: { usage?: { cost?: unknown } } } | undefined)
    ?.openrouter?.usage?.cost;
  return typeof costo === 'number' && Number.isFinite(costo) ? costo : 0;
}

export interface ModeloOpenRouter {
  id: string;
  proveedor: string;
  contexto: number;
}

/**
 * Modelos de OpenRouter que soportan tools, para el buscador del admin. Es una
 * lista pública (no gasta la key) y se cachea una hora. Si OpenRouter no
 * responde, devuelve null y el admin lo dice en vez de mostrar una lista vacía.
 */
export async function listarModelosConTools(): Promise<ModeloOpenRouter[] | null> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models?supported_parameters=tools', {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const { data } = (await res.json()) as {
      data?: { id: string; name?: string; context_length?: number; supported_parameters?: string[] }[];
    };
    return (data ?? [])
      .filter((m) => !m.supported_parameters || m.supported_parameters.includes('tools'))
      .map((m) => ({
        id: m.id,
        proveedor: (m.name ?? m.id).split(':')[0].trim(),
        contexto: m.context_length ?? 0,
      }));
  } catch {
    return null;
  }
}
