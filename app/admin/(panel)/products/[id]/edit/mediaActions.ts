'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

export type MediaFormState = { error?: string } | undefined;

export async function addMedia(
  productId: string,
  _prev: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  await requireAdmin();

  const type = formData.get('type') as string;
  const url = (formData.get('url') as string)?.trim();
  const alt = (formData.get('alt') as string)?.trim() || null;
  const order = Number(formData.get('order') ?? 0);

  if (!url) return { error: 'La URL es obligatoria.' };
  if (!['image', 'video'].includes(type)) return { error: 'Tipo inválido.' };

  await prisma.productMedia.create({
    data: { productId, type, url, alt, order },
  });

  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function deleteMedia(mediaId: string, productId: string) {
  await requireAdmin();
  await prisma.productMedia.delete({ where: { id: mediaId } });
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function updateMediaOrder(mediaId: string, productId: string, formData: FormData) {
  await requireAdmin();
  const order = Number(formData.get('order') ?? 0);
  await prisma.productMedia.update({ where: { id: mediaId }, data: { order } });
  revalidatePath(`/admin/products/${productId}/edit`);
}
