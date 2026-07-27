'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { saveShippingConfig } from '@/lib/shipping-config';
import type { ShippingConfig } from '@/lib/shipping-types';

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

export async function saveShippingConfigAction(
  config: ShippingConfig,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    await saveShippingConfig(config);
    revalidatePath('/checkout');
    revalidatePath('/admin/envios');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
