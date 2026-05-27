import { prisma } from './prisma';
import { type QuoterPricing, DEFAULT_QUOTER_PRICING } from './quoter-types';

export type { QuoterPricing } from './quoter-types';
export { DEFAULT_QUOTER_PRICING } from './quoter-types';

export async function getQuoterPricing(): Promise<QuoterPricing> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'quoter_pricing' } });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value) as Partial<QuoterPricing>;
      // Merge with defaults so new fields added after initial save are never undefined
      return {
        tarifas: { ...DEFAULT_QUOTER_PRICING.tarifas, ...(parsed.tarifas ?? {}) },
        materiales: {
          fdm:    parsed.materiales?.fdm    ?? DEFAULT_QUOTER_PRICING.materiales.fdm,
          resina: parsed.materiales?.resina ?? DEFAULT_QUOTER_PRICING.materiales.resina,
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
