#!/usr/bin/env node
/**
 * Repara las portadas (coverImage) que MySQL truncó a 191 caracteres.
 *
 * Contexto: en el schema de producción `coverImage` era un `String` de Prisma,
 * que en MySQL es VARCHAR(191). Las URLs de Cloudinary más largas que eso se
 * guardaron cortadas (p. ej. terminando en ".pn"), así que esas portadas no se
 * renderizaban. En SQLite (local) no hay límite y por eso se veían bien.
 *
 * El schema ya usa @db.Text, pero ampliar la columna no devuelve los caracteres
 * que se perdieron: hay que reescribir el valor completo desde el export.
 *
 *   node scripts/reparar-portadas.mjs --dry-run    # muestra el plan, no escribe
 *   node scripts/reparar-portadas.mjs              # aplica los cambios
 *
 * Solo reescribe cuando el valor de la base es un prefijo del valor del export
 * (la firma de un truncado). Si difieren de otra forma lo reporta y no lo toca,
 * para no pisar una portada que se haya cambiado a propósito desde el panel.
 * Es idempotente: reejecutarlo no hace nada.
 *
 * REQUISITO: correrlo después de `node scripts/prisma-setup.js --push`, que es
 * lo que convierte la columna a TEXT. Si no, MySQL la volverá a truncar.
 */

import fs from 'node:fs';
import path from 'node:path';

// Igual que en importar-contenido.mjs: @prisma/client carga .env al importarse,
// así que se importa de forma dinámica más abajo, ya resuelta la precedencia.
// Precedencia: variables reales del entorno > .env.local > .env
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

let reparados = 0, correctos = 0, distintos = 0, ausentes = 0;

async function reparar(nombre, modelo, registros) {
  console.log(`${nombre}`);
  for (const r of registros) {
    const esperado = r.coverImage;
    if (!esperado) continue;

    const actual = await modelo.findUnique({
      where: { slug: r.slug },
      select: { id: true, coverImage: true },
    });
    if (!actual) {
      console.log(`   ? no está en la base: ${r.slug}`);
      ausentes++;
      continue;
    }
    if (actual.coverImage === esperado) {
      correctos++;
      continue;
    }
    // Un truncado es un prefijo del valor completo. Cualquier otra diferencia
    // se respeta: puede ser una portada cambiada desde el panel.
    if (!actual.coverImage || !esperado.startsWith(actual.coverImage)) {
      console.log(`   ! difiere sin ser un truncado, se deja como está: ${r.slug}`);
      console.log(`     base   (${actual.coverImage?.length ?? 0}): ${actual.coverImage ?? 'NULL'}`);
      console.log(`     export (${esperado.length}): ${esperado}`);
      distintos++;
      continue;
    }

    console.log(`   ${dryRun ? '+ repararía' : '✓ reparado'}: ${r.slug}`);
    console.log(`     ${actual.coverImage.length} → ${esperado.length} caracteres`);
    if (!dryRun) {
      await modelo.update({ where: { id: actual.id }, data: { coverImage: esperado } });
    }
    reparados++;
  }
}

await reparar('1. Artículos de blog', prisma.blogPost, datos.blogPosts ?? []);
console.log();
await reparar('2. Proyectos', prisma.project, datos.projects ?? []);

console.log(
  `\n${dryRun ? 'Simulación' : 'Resultado'}: ${reparados} portadas ${dryRun ? 'por reparar' : 'reparadas'}` +
  ` | ${correctos} ya correctas | ${distintos} distintas (sin tocar) | ${ausentes} no encontradas`
);

await prisma.$disconnect();
