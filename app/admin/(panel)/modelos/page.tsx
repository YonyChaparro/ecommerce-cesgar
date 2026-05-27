import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import ModelosClient from './ModelosClient';

export default async function ModelosPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const items = await prisma.orderItem.findMany({
    where: { itemType: 'cotizador', modelUrl: { not: null } },
    include: {
      order: {
        select: {
          id: true,
          createdAt: true,
          shippingName: true,
          shippingEmail: true,
          status: true,
        },
      },
    },
    orderBy: { order: { createdAt: 'desc' } },
  });

  const serialized = items.map((item) => ({
    ...item,
    order: {
      ...item.order,
      createdAt: item.order.createdAt.toISOString(),
    },
  }));

  return <ModelosClient items={serialized} />;
}
