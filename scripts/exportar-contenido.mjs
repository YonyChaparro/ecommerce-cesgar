#!/usr/bin/env node
/**
 * Exporta los artículos de blog y los proyectos de la base actual a un JSON,
 * para poder replicarlos en otro entorno (p. ej. MySQL en producción).
 *
 *   node scripts/exportar-contenido.mjs [--salida scripts/contenido-export.json]
 *
 * Lee DATABASE_URL igual que la app (.env.local sobreescribe .env).
 * Las URLs de imagen apuntan a Cloudinary, que es compartido entre entornos,
 * así que el JSON resultante es válido en cualquier base.
 */

import fs from 'node:fs';
import path from 'node:path';

// OJO: @prisma/client carga .env al importarse y los import estáticos de ESM
// se evalúan antes que el cuerpo del módulo. Por eso se importa más abajo,
// de forma dinámica, una vez resuelta la precedencia de variables.

// Precedencia: variables reales del entorno > .env.local > .env
// (lo que ya venía definido al arrancar nunca se pisa, así se puede apuntar a
// otra base con DATABASE_URL=... node scripts/...)
const DEL_ENTORNO = new Set(Object.keys(process.env));
function cargarEnv(archivo) {
  try {
    for (const linea of fs.readFileSync(archivo, 'utf8').split('\n')) {
      const m = linea.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s#]*))/);
      if (m && !DEL_ENTORNO.has(m[1])) process.env[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
    }
  } catch {}
}
cargarEnv(path.join(process.cwd(), '.env'));
cargarEnv(path.join(process.cwd(), '.env.local'));

const args = process.argv.slice(2);
const salida = args.includes('--salida')
  ? args[args.indexOf('--salida') + 1]
  : 'scripts/contenido-export.json';

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const posts = await prisma.blogPost.findMany({
  include: { author: { select: { email: true } }, tags: { include: { tag: true } } },
  orderBy: { slug: 'asc' },
});

const projects = await prisma.project.findMany({
  include: { author: { select: { email: true } }, tags: { include: { tag: true } } },
  orderBy: { slug: 'asc' },
});

const limpiar = (r) => ({
  title: r.title,
  slug: r.slug,
  excerpt: r.excerpt,
  coverImage: r.coverImage,
  content: r.content,
  status: r.status,
  publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
  authorEmail: r.author.email,
  tags: r.tags.map(({ tag }) => ({ name: tag.name, slug: tag.slug })),
});

const datos = {
  generado: new Date().toISOString(),
  origen: (process.env.DATABASE_URL ?? '').startsWith('mysql://') ? 'mysql' : 'sqlite',
  blogPosts: posts.map(limpiar),
  projects: projects.map(limpiar),
};

fs.mkdirSync(path.dirname(salida), { recursive: true });
fs.writeFileSync(salida, JSON.stringify(datos, null, 2));

console.log(`✓ ${datos.blogPosts.length} artículos y ${datos.projects.length} proyectos exportados`);
console.log(`  -> ${salida}`);

await prisma.$disconnect();
