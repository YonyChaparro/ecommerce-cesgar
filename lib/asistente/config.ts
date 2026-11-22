import 'server-only';
import { prisma } from '../prisma';
import { type AsistenteConfig, DEFAULT_ASISTENTE_CONFIG } from './tipos';
import { modeloAprobado } from './validaciones';

export type { AsistenteConfig } from './tipos';

const CLAVE = 'asistente_config';

/**
 * Configuración vigente, mezclada con los valores por defecto para que un campo
 * añadido después nunca llegue undefined. Nunca lanza: ante un JSON corrupto
 * devuelve los defaults, que dejan el asistente apagado.
 */
export async function getAsistenteConfig(): Promise<AsistenteConfig> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: CLAVE } });
    if (setting?.value) {
      const guardado = JSON.parse(setting.value) as Partial<AsistenteConfig>;
      return {
        ...DEFAULT_ASISTENTE_CONFIG,
        ...guardado,
        respaldos: Array.isArray(guardado.respaldos) ? guardado.respaldos : [],
      };
    }
  } catch {}
  return DEFAULT_ASISTENTE_CONFIG;
}

export async function saveAsistenteConfig(config: AsistenteConfig): Promise<void> {
  await prisma.setting.upsert({
    where: { key: CLAVE },
    update: { value: JSON.stringify(config) },
    create: { key: CLAVE, value: JSON.stringify(config) },
  });
}

export type EstadoAsistente =
  | { disponible: true }
  | { disponible: false; motivo: 'apagado' | 'sin-modelo' | 'modelo-no-aprobado' | 'sin-key' };

/**
 * Si el chat puede atender. Lo consultan el selector (qué tarjeta mostrar), la
 * página del chat y los endpoints: un modelo que dejó de estar aprobado o una
 * key que falta apagan el asistente aunque el interruptor diga otra cosa.
 */
export function estadoAsistente(config: AsistenteConfig): EstadoAsistente {
  if (!config.activo) return { disponible: false, motivo: 'apagado' };
  if (!config.modelo) return { disponible: false, motivo: 'sin-modelo' };
  if (!modeloAprobado(config.modelo)) return { disponible: false, motivo: 'modelo-no-aprobado' };
  if (!process.env.OPENROUTER_API_KEY) return { disponible: false, motivo: 'sin-key' };
  return { disponible: true };
}
