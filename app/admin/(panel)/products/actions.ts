'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export type ProductFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const name = (formData.get('name') as string)?.trim();
  const category = (formData.get('category') as string)?.trim();
  const price = Number(formData.get('price'));
  const stock = Number(formData.get('stock') ?? 0);
  const img = (formData.get('img') as string)?.trim();
  const alt = (formData.get('alt') as string)?.trim() || name;
  const description = (formData.get('description') as string)?.trim() || null;

  const errors: Record<string, string[]> = {};
  if (!name) errors.name = ['El nombre es obligatorio.'];
  if (!category) errors.category = ['La categoría es obligatoria.'];
  if (!img) errors.img = ['La URL de la imagen es obligatoria.'];
  if (isNaN(price) || price < 0) errors.price = ['Ingresa un precio válido.'];

  if (Object.keys(errors).length) return { errors };

  const slug = slugify(name);

  let product;
  try {
    product = await prisma.product.create({
      data: { name, slug, category, price, stock, img, alt, description },
    });
  } catch {
    return { message: 'El slug ya existe. Cambia el nombre del producto.' };
  }

  // Redirect to edit so the user can add media right away
  redirect(`/admin/products/${product.id}/edit`);
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const name = (formData.get('name') as string)?.trim();
  const category = (formData.get('category') as string)?.trim();
  const price = Number(formData.get('price'));
  const stock = Number(formData.get('stock') ?? 0);
  const img = (formData.get('img') as string)?.trim();
  const alt = (formData.get('alt') as string)?.trim() || name;
  const description = (formData.get('description') as string)?.trim() || null;

  const errors: Record<string, string[]> = {};
  if (!name) errors.name = ['El nombre es obligatorio.'];
  if (!category) errors.category = ['La categoría es obligatoria.'];
  if (!img) errors.img = ['La URL de la imagen es obligatoria.'];
  if (isNaN(price) || price < 0) errors.price = ['Ingresa un precio válido.'];

  if (Object.keys(errors).length) return { errors };

  const slug = slugify(name);

  await prisma.product.update({
    where: { id },
    data: { name, slug, category, price, stock, img, alt, description },
  });

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}/edit`);
  return undefined;
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath('/admin/products');
  redirect('/admin/products');
}
