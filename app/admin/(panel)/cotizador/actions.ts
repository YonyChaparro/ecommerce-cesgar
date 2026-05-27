'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { saveQuoterPricing } from '@/lib/quoter-config';
import type { QuoterPricing } from '@/lib/quoter-types';

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

export async function saveQuoterPricingAction(pricing: QuoterPricing): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    await saveQuoterPricing(pricing);
    revalidatePath('/cotizador');
    revalidatePath('/admin/cotizador');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
