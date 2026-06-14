import { prisma } from './prisma';
import { type MaterialConfig, type QuoterPricing, DEFAULT_QUOTER_PRICING } from './quoter-types';

export type { QuoterPricing } from './quoter-types';
export { DEFAULT_QUOTER_PRICING } from './quoter-types';

type StoredMaterial = MaterialConfig & { precioGramo?: number };

// Configs guardadas antes del cambio a precio por volumen traen precioGramo;
// se convierten manteniendo el precio vigente: resina = $/g × densidad,
// FDM anclado al relleno 40% (su multiplicador 1.0)
function migrateMaterial(m: StoredMaterial, tech: 'fdm' | 'resina'): MaterialConfig {
  if (typeof m.precioCm3 === 'number') return m;
  const factorRelleno = tech === 'fdm' ? 0.4 : 1;
  const migrated: StoredMaterial = {
    ...m,
    precioCm3: Math.round((m.precioGramo ?? 0) * (m.densidad ?? 1) * factorRelleno),
  };
  delete migrated.precioGramo;
  return migrated;
}

export async function getQuoterPricing(): Promise<QuoterPricing> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'quoter_pricing' } });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value) as Partial<QuoterPricing>;
      // Merge with defaults so new fields added after initial save are never undefined
      const tarifas = { ...DEFAULT_QUOTER_PRICING.tarifas, ...(parsed.tarifas ?? {}) };
      // El cargo por escalado fue eliminado — se descarta si viene en configs guardadas
      delete (tarifas as { costoEscalado?: number }).costoEscalado;
      return {
        tarifas,
        materiales: {
          fdm:    (parsed.materiales?.fdm    ?? DEFAULT_QUOTER_PRICING.materiales.fdm).map((m) => migrateMaterial(m, 'fdm')),
          resina: (parsed.materiales?.resina ?? DEFAULT_QUOTER_PRICING.materiales.resina).map((m) => migrateMaterial(m, 'resina')),
        },
      };
    }
  } catch {}
  return DEFAULT_QUOTER_PRICING;
}

export async function saveQuoterPricing(pricing: QuoterPricing): Promise<void> {
  await prisma.setting.upsert({
    where:  { key: 'quoter_pricing' },
    update: { value: JSON.stringify(pricing) },
    create: { key: 'quoter_pricing', value: JSON.stringify(pricing) },
  });
}
