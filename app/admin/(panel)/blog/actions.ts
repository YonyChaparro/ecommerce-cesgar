'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { z } from 'zod';

const Schema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  excerpt: z.string().optional(),
  coverImage: z.string().url('URL inválida').optional().or(z.literal('')),
  content: z.string().min(2, 'El contenido es requerido'),
  status: z.enum(['draft', 'published']),
  publishedAt: z.string().optional(),
  tags: z.string().optional(),
});

export type BlogFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

async function getAuthorId() {
  const session = await getSession();
  if (!session?.userId) throw new Error('No autenticado');
  return session.userId;
}

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
}

async function upsertTags(tagNames: string[]) {
  return Promise.all(
    tagNames.map((name) => {
      const slug = name.replace(/\s+/g, '-');
      return prisma.blogTag.upsert({
        where: { slug },
        update: {},
        create: { name, slug },
      });
    }),
  );
}

export async function createPost(prev: BlogFormState, formData: FormData): Promise<BlogFormState> {
  const parsed = Schema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt'),
    coverImage: formData.get('coverImage'),
    content: formData.get('content'),
    status: formData.get('status'),
    publishedAt: formData.get('publishedAt'),
    tags: formData.get('tags'),
  });

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { title, slug, excerpt, coverImage, content, status, publishedAt, tags } = parsed.data;

  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) return { errors: { slug: ['Este slug ya está en uso'] } };

  try {
    const authorId = await getAuthorId();
    const tagNames = parseTags(tags);
    const tagRecords = await upsertTags(tagNames);

    await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        content,
        status,
        publishedAt: status === 'published' ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
        authorId,
        tags: { create: tagRecords.map((t) => ({ tagId: t.id })) },
      },
    });
  } catch {
    return { message: 'Error al guardar el artículo' };
  }

  redirect('/admin/blog');
}

export async function updatePost(id: string, prev: BlogFormState, formData: FormData): Promise<BlogFormState> {
  const parsed = Schema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt'),
    coverImage: formData.get('coverImage'),
    content: formData.get('content'),
    status: formData.get('status'),
    publishedAt: formData.get('publishedAt'),
    tags: formData.get('tags'),
  });

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { title, slug, excerpt, coverImage, content, status, publishedAt, tags } = parsed.data;

  const conflict = await prisma.blogPost.findFirst({ where: { slug, NOT: { id } } });
  if (conflict) return { errors: { slug: ['Este slug ya está en uso'] } };

  try {
    const tagNames = parseTags(tags);
    const tagRecords = await upsertTags(tagNames);

    await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        content,
        status,
        publishedAt: status === 'published' ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
        tags: {
          deleteMany: {},
          create: tagRecords.map((t) => ({ tagId: t.id })),
        },
      },
    });
  } catch {
    return { message: 'Error al actualizar el artículo' };
  }

  redirect('/admin/blog');
}

export async function deletePost(id: string) {
  await prisma.blogPost.delete({ where: { id } });
  redirect('/admin/blog');
}
