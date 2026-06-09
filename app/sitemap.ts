import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = 'https://cesgar.com.co';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([
    prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                                    priority: 1.0, changeFrequency: 'weekly'  },
    { url: `${BASE}/tienda`,                        priority: 0.9, changeFrequency: 'daily'   },
    { url: `${BASE}/cotizador`,                     priority: 0.9, changeFrequency: 'monthly' },
    { url: `${BASE}/servicios`,                     priority: 0.8, changeFrequency: 'monthly' },
    { url: `${BASE}/servicios/diseno-3d`,           priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE}/servicios/prototipado-fabricacion`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE}/servicios/repuestos-impresoras`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE}/servicios/escaneo-3d`,          priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE}/sobre-nosotros`,                 priority: 0.6, changeFrequency: 'monthly' },
    { url: `${BASE}/blog`,                          priority: 0.6, changeFrequency: 'weekly'  },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/tienda/${p.slug}`,
    lastModified: p.updatedAt,
    priority: 0.6,
    changeFrequency: 'weekly',
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    priority: 0.5,
    changeFrequency: 'monthly',
  }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
