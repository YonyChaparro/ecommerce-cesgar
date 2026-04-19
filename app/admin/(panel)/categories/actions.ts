'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function renameCategory(oldName: string, newName: string) {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return;

  await prisma.product.updateMany({
    where: { category: oldName },
    data: { category: trimmed },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/tienda');
}

export async function deleteCategory(name: string) {
  await prisma.product.updateMany({
    where: { category: name },
    data: { category: 'Sin categoría' },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/tienda');
}
