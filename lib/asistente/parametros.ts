import 'server-only';
import { prisma } from '../prisma';
import { DEFAULT_PARAMETROS, mezclarParametros, type ParametrosComerciales } from './parametros-tipos';

export * from './parametros-tipos';

const CLAVE = 'agente_parametros';

/**
 * Parámetros vigentes, mezclados con los defaults (patrón de config.ts). Nunca
 * lanza: ante un JSON corrupto devuelve los defaults, que dejan los dos
 * interruptores apagados.
 */
export async function getParametros(): Promise<ParametrosComerciales> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: CLAVE } });
    if (setting?.value) return mezclarParametros(JSON.parse(setting.value) as Partial<ParametrosComerciales>);
  } catch {}
  return DEFAULT_PARAMETROS;
}

/** Guarda y registra quién y cuándo (R1.4). La validación la hace la acción antes. */
export async function saveParametros(p: ParametrosComerciales, usuario: string): Promise<ParametrosComerciales> {
  const guardar: ParametrosComerciales = { ...p, aprobadoPor: usuario, aprobadoEn: new Date().toISOString() };
  const value = JSON.stringify(guardar);
  await prisma.setting.upsert({ where: { key: CLAVE }, update: { value }, create: { key: CLAVE, value } });
  return guardar;
}

/** Fecha de las tarifas del cotizador, para la copia que guardan las Q- y E- (design §6.2). */
export async function fechaTarifasCotizador(): Promise<string | null> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: 'quoter_pricing' }, select: { updatedAt: true } });
    return s?.updatedAt.toISOString() ?? null;
  } catch {
    return null;
  }
}
