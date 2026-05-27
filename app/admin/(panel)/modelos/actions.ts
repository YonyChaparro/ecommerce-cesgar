'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

function extractPublicId(url: string): string | null {
  // Cloudinary raw URL: https://res.cloudinary.com/<cloud>/raw/upload/v<ver>/<folder>/...
  const match = url.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
  return match ? match[1] : null;
}

export async function deleteModelAction(
  itemId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item?.modelUrl) return { ok: false, error: 'Sin modelo registrado' };

    const publicId = extractPublicId(item.modelUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => {});
    }

    await prisma.orderItem.update({ where: { id: itemId }, data: { modelUrl: null } });
    revalidatePath('/admin/modelos');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
