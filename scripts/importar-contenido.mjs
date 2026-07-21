#!/usr/bin/env node
/**
 * Importa el contenido exportado por scripts/exportar-contenido.mjs en la base
 * a la que apunte DATABASE_URL. Pensado para dejar producción igual que local.
 *
 *   node scripts/importar-contenido.mjs --dry-run     # muestra el plan, no escribe
 *   node scripts/importar-contenido.mjs               # aplica los cambios
 *
 * Qué hace, en orden:
 *   1. Crea los proyectos en la tabla Project (con sus etiquetas).
 *   2. Borra de BlogPost los 7 registros que en realidad son proyectos,
 *      SOLO después de confirmar que ya existen en Project.
 *   3. Crea los artículos de blog en BlogPost (con sus etiquetas).
 *
 * Es idempotente: omite cualquier slug que ya exista. Se puede reejecutar.
 *
 * REQUISITO: las tablas Project/ProjectTag/ProjectTagLink deben existir.
 * En producción las crea el build (`prisma db push` vía scripts/prisma-setup.js).
 *
 * RECOMENDADO: respaldar antes.
 *   mysqldump -h HOST -u USUARIO -p BASE > respaldo.sql
 */

import fs from 'node:fs';
import path from 'node:path';

// OJO: @prisma/client carga .env al importarse y los import estáticos de ESM
// se evalúan antes que el cuerpo del módulo. Por eso se importa más abajo,
// de forma dinámica, una vez resuelta la precedencia de variables.

// Precedencia: variables reales del entorno > .env.local > .env
// (lo que ya venía definido al arrancar nunca se pisa, así se puede apuntar a
// otra base con DATABASE_URL=... node scripts/importar-contenido.mjs)
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
const dryRun = args.includes('--dry-run');
const entrada = args.includes('--entrada')
  ? args[args.indexOf('--entrada') + 1]
  : 'scripts/contenido-export.json';

if (!fs.existsSync(entrada)) {
  console.error(`No encuentro ${entrada}. Genéralo antes con scripts/exportar-contenido.mjs`);
  process.exit(1);
}

const datos = JSON.parse(fs.readFileSync(entrada, 'utf8'));
const destino = (process.env.DATABASE_URL ?? '').startsWith('mysql://') ? 'MySQL' : 'SQLite';

console.log(`Origen : ${entrada} (generado ${datos.generado}, desde ${datos.origen})`);
console.log(`Destino: ${destino}`);
console.log(dryRun ? 'Modo   : SIMULACIÓN (no se escribe nada)\n' : 'Modo   : APLICAR CAMBIOS\n');

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

// Las tablas de proyectos deben existir antes de nada
try {
  await prisma.project.count();
} catch {
  console.error('✗ La tabla Project no existe en la base de destino.');
  console.error('  Ejecuta primero el push del esquema:');
  console.error('    node scripts/prisma-setup.js --push');
  process.exit(1);
}

// Autor: se respeta el email original; si no existe, se usa un ADMIN
async function resolverAutor(email) {
  const porEmail = await prisma.user.findUnique({ where: { email } });
  if (porEmail) return porEmail.id;
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error(`No existe el autor ${email} ni ningún usuario ADMIN`);
  console.warn(`  ! autor ${email} no existe; se usa ${admin.email}`);
  return admin.id;
}

const comun = (r, authorId) => ({
  title: r.title,
  slug: r.slug,
  excerpt: r.excerpt,
  coverImage: r.coverImage,
  content: r.content,
  status: r.status,
  publishedAt: r.publishedAt ? new Date(r.publishedAt) : null,
  createdAt: new Date(r.createdAt),
  updatedAt: new Date(r.updatedAt),
  authorId,
});

// ── 1. Proyectos ────────────────────────────────────────────────────────────
console.log('1. Proyectos');
let proyCreados = 0, proyOmitidos = 0;

for (const p of datos.projects) {
  if (await prisma.project.findUnique({ where: { slug: p.slug } })) {
    console.log(`   · ya existe: ${p.slug}`);
    proyOmitidos++;
    continue;
  }
  if (dryRun) {
    console.log(`   + crearía: ${p.title} (${p.tags.length} etiquetas)`);
    proyCreados++;
    continue;
  }

  const authorId = await resolverAutor(p.authorEmail);
  const tagIds = [];
  for (const t of p.tags) {
    const pt = await prisma.projectTag.upsert({
      where: { slug: t.slug }, update: {}, create: { name: t.name, slug: t.slug },
    });
    tagIds.push(pt.id);
  }
  await prisma.project.create({
    data: { ...comun(p, authorId), tags: { create: tagIds.map((tagId) => ({ tagId })) } },
  });
  console.log(`   ✓ creado: ${p.title}`);
  proyCreados++;
}

// ── 2. Quitar de BlogPost los que son proyectos ─────────────────────────────
console.log('\n2. Limpieza de BlogPost');
const slugsProyecto = datos.projects.map((p) => p.slug);
const enBlog = await prisma.blogPost.findMany({
  where: { slug: { in: slugsProyecto } }, select: { slug: true },
});

let borrados = 0;
if (enBlog.length === 0) {
  console.log('   · nada que limpiar');
} else if (dryRun) {
  console.log(`   - borraría ${enBlog.length} de BlogPost: ${enBlog.map((p) => p.slug).join(', ')}`);
  borrados = enBlog.length;
} else {
  // solo se borra lo que quedó confirmado en Project
  const confirmados = (await prisma.project.findMany({
    where: { slug: { in: enBlog.map((p) => p.slug) } }, select: { slug: true },
  })).map((p) => p.slug);

  if (confirmados.length !== enBlog.length) {
    console.error('   ✗ ABORTA: no todos están en Project todavía. No se borra nada.');
    process.exit(1);
  }
  const r = await prisma.blogPost.deleteMany({ where: { slug: { in: confirmados } } });
  borrados = r.count;
  console.log(`   ✓ ${borrados} borrados de BlogPost`);
}

// ── 3. Artículos de blog ────────────────────────────────────────────────────
console.log('\n3. Artículos de blog');
let artCreados = 0, artOmitidos = 0;

for (const a of datos.blogPosts) {
  if (await prisma.blogPost.findUnique({ where: { slug: a.slug } })) {
    console.log(`   · ya existe: ${a.slug}`);
    artOmitidos++;
    continue;
  }
  if (dryRun) {
    console.log(`   + crearía: ${a.title.slice(0, 60)}`);
    artCreados++;
    continue;
  }

  const authorId = await resolverAutor(a.authorEmail);
  const tagIds = [];
  for (const t of a.tags) {
    const bt = await prisma.blogTag.upsert({
      where: { slug: t.slug }, update: {}, create: { name: t.name, slug: t.slug },
    });
    tagIds.push(bt.id);
  }
  await prisma.blogPost.create({
    data: { ...comun(a, authorId), tags: { create: tagIds.map((tagId) => ({ tagId })) } },
  });
  console.log(`   ✓ creado: ${a.title.slice(0, 60)}`);
  artCreados++;
}

console.log(`\n${dryRun ? 'Simulación' : 'Resultado'}: ${proyCreados} proyectos, ${artCreados} artículos, ${borrados} limpiados de BlogPost`);
console.log(`(omitidos por existir: ${proyOmitidos} proyectos, ${artOmitidos} artículos)`);

if (!dryRun) {
  console.log(`\nEstado final -> BlogPost: ${await prisma.blogPost.count()} | Project: ${await prisma.project.count()}`);
}

await prisma.$disconnect();
