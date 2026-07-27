import { prisma } from './prisma';
import { type ShippingConfig, DEFAULT_SHIPPING_CONFIG } from './shipping-types';

export type { ShippingConfig, ZonaEnvio } from './shipping-types';
export { DEFAULT_SHIPPING_CONFIG } from './shipping-types';

const CLAVE = 'shipping_config';

/**
 * Configuración vigente. Mezcla lo guardado con los valores por defecto para que
 * un campo añadido después de la última vez que se guardó nunca llegue
 * undefined al cálculo. Nunca lanza: ante un JSON corrupto devuelve los
 * defaults, que con `habilitado: false` significan no cobrar envío.
 *
 * Mismo patrón que lib/quoter-config.ts.
 */
export async function getShippingConfig(): Promise<ShippingConfig> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: CLAVE } });
    if (setting?.value) {
      const guardado = JSON.parse(setting.value) as Partial<ShippingConfig>;
      return {
        ...DEFAULT_SHIPPING_CONFIG,
        ...guardado,
        zonas: Array.isArray(guardado.zonas) ? guardado.zonas : DEFAULT_SHIPPING_CONFIG.zonas,
        recogida: { ...DEFAULT_SHIPPING_CONFIG.recogida, ...(guardado.recogida ?? {}) },
      };
    }
  } catch {}
  return DEFAULT_SHIPPING_CONFIG;
}

export async function saveShippingConfig(config: ShippingConfig): Promise<void> {
  await prisma.setting.upsert({
    where:  { key: CLAVE },
    update: { value: JSON.stringify(config) },
    create: { key: CLAVE, value: JSON.stringify(config) },
  });
}
