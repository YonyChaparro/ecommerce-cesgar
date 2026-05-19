'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const VALID_STATUSES = ['pending', 'approved', 'in_process', 'rejected', 'cancelled'];

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  if (!VALID_STATUSES.includes(status)) throw new Error('Estado inválido');

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
}
