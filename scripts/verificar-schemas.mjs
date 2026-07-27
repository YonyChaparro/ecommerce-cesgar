#!/usr/bin/env node
/**
 * Cuida que el schema de producción (MySQL) no se quede atrás del de local
 * (SQLite). Corre en el build y falla el build si encuentra algo.
 *
 *   node scripts/verificar-schemas.mjs
 *   node scripts/verificar-schemas.mjs --local otro.prisma --prod otro.prod.prisma
 *
 * Comprueba dos cosas:
 *
 *   1. PARIDAD — todo modelo y campo de schema.prisma existe en
 *      schema.production.prisma con el mismo tipo, la misma opcionalidad y los
 *      mismos atributos (sin contar los @db.*), y al revés. El build hace
 *      `prisma db push` con el schema de producción: un campo que solo esté en
 *      el schema local es una columna que no existe en producción.
 *
 *   2. COLUMNAS LARGAS — en MySQL un `String` de Prisma es VARCHAR(191), y
 *      SQLite no tiene ese límite. Un valor más largo se ve bien en local y en
 *      producción se guarda cortado sin ningún error (así se rompieron las
 *      portadas del blog: URLs de Cloudinary de 200+ caracteres truncadas a
 *      191). Por eso, todo campo `String` cuyo nombre indique URL o texto largo
 *      tiene que declarar @db.Text / @db.MediumText / @db.LongText, o un
 *      @db.VarChar(n) con n >= 512.
 *
 * Si un campo de esos de verdad debe ser corto, añádelo a EXCEPCIONES.
 */

import fs from 'node:fs';

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto) =>
  args.includes(nombre) ? args[args.indexOf(nombre) + 1] : porDefecto;

const RUTA_LOCAL = opcion('--local', 'prisma/schema.prisma');
const RUTA_PROD = opcion('--prod', 'prisma/schema.production.prisma');

// Nombres que delatan una URL o un texto que crece: necesitan @db.Text en MySQL.
const PATRONES_LARGOS = [
  /url$/i, /uri$/i, /^img/i, /image$/i, /^cover/i, /src$/i, /href$/i,
  /photo/i, /video/i, /file$/i, /thumb/i, /logo$/i, /icon$/i, /avatar/i,
  /content$/i, /description$/i, /excerpt$/i, /message$/i, /^note$/i,
  /^body$/i, /^extra$/i, /instructions$/i,
];

// "Modelo.campo" que quedan fuera de la comprobación de columnas largas.
const EXCEPCIONES = new Set([]);

// ── Parseo ──────────────────────────────────────────────────────────────────
// Parser mínimo: solo bloques `model` y sus campos. Suficiente y sin dependencias.
function parsear(ruta) {
  const texto = fs.readFileSync(ruta, 'utf8');
  const modelos = new Map();
  let actual = null;

  texto.split('\n').forEach((cruda, i) => {
    const linea = cruda.replace(/\/\/.*$/, '').trim();
    if (!linea) return;

    if (!actual) {
      const m = linea.match(/^model\s+(\w+)\s*\{/);
      if (m) actual = { nombre: m[1], campos: new Map(), bloque: [] };
      return;
    }
    if (linea === '}') {
      modelos.set(actual.nombre, actual);
      actual = null;
      return;
    }
    if (linea.startsWith('@@')) {
      actual.bloque.push(linea.replace(/\s+/g, ''));
      return;
    }

    const m = linea.match(/^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/);
    if (!m) return;
    const [, nombre, tipo, lista, opcional, resto] = m;
    const atributos = (resto.replace(/\s+/g, '').match(/@[^@]+/g) ?? []).sort();
    actual.campos.set(nombre, {
      nombre,
      tipo,
      lista: !!lista,
      opcional: !!opcional,
      atributos,
      // los @db.* son justamente lo que puede diferir entre los dos schemas
      atributosSinDb: atributos.filter((a) => !a.startsWith('@db.')),
      db: atributos.find((a) => a.startsWith('@db.')) ?? null,
      linea: i + 1,
    });
  });

  return modelos;
}

const local = parsear(RUTA_LOCAL);
const prod = parsear(RUTA_PROD);
const errores = [];

// ── 1. Paridad ──────────────────────────────────────────────────────────────
const firma = (c) => `${c.tipo}${c.lista ? '[]' : ''}${c.opcional ? '?' : ''}`;

for (const [nombre, mLocal] of local) {
  const mProd = prod.get(nombre);
  if (!mProd) {
    errores.push(`${RUTA_PROD}: falta el modelo ${nombre} (está en ${RUTA_LOCAL})`);
    continue;
  }
  for (const [campo, cLocal] of mLocal.campos) {
    const cProd = mProd.campos.get(campo);
    if (!cProd) {
      errores.push(
        `${RUTA_PROD}: falta ${nombre}.${campo} (${RUTA_LOCAL}:${cLocal.linea}). ` +
        `El build hace db push con este schema, así que la columna no existiría en producción.`
      );
      continue;
    }
    if (firma(cLocal) !== firma(cProd)) {
      errores.push(
        `${RUTA_PROD}:${cProd.linea}: ${nombre}.${campo} es ${firma(cProd)} ` +
        `y en ${RUTA_LOCAL}:${cLocal.linea} es ${firma(cLocal)}`
      );
    }
    if (cLocal.atributosSinDb.join(' ') !== cProd.atributosSinDb.join(' ')) {
      errores.push(
        `${RUTA_PROD}:${cProd.linea}: ${nombre}.${campo} tiene atributos distintos que en ` +
        `${RUTA_LOCAL}:${cLocal.linea} (sin contar @db.*)\n` +
        `     producción: ${cProd.atributosSinDb.join(' ') || '(ninguno)'}\n` +
        `     local     : ${cLocal.atributosSinDb.join(' ') || '(ninguno)'}`
      );
    }
  }
  for (const campo of mProd.campos.keys()) {
    if (!mLocal.campos.has(campo)) {
      errores.push(`${RUTA_LOCAL}: falta ${nombre}.${campo} (está en ${RUTA_PROD})`);
    }
  }
  if (mLocal.bloque.sort().join(' ') !== mProd.bloque.sort().join(' ')) {
    errores.push(`${RUTA_PROD}: los atributos @@ del modelo ${nombre} no coinciden con ${RUTA_LOCAL}`);
  }
}
for (const nombre of prod.keys()) {
  if (!local.has(nombre)) errores.push(`${RUTA_LOCAL}: falta el modelo ${nombre} (está en ${RUTA_PROD})`);
}

// ── 2. Columnas largas en producción ────────────────────────────────────────
const suficiente = (db) => {
  if (!db) return false;
  if (/^@db\.(Text|MediumText|LongText)$/.test(db)) return true;
  const v = db.match(/^@db\.VarChar\((\d+)\)$/);
  return !!v && Number(v[1]) >= 512;
};

for (const [nombre, modelo] of prod) {
  for (const campo of modelo.campos.values()) {
    if (campo.tipo !== 'String' || campo.lista) continue;
    if (EXCEPCIONES.has(`${nombre}.${campo.nombre}`)) continue;
    if (!PATRONES_LARGOS.some((p) => p.test(campo.nombre))) continue;
    if (suficiente(campo.db)) continue;
    errores.push(
      `${RUTA_PROD}:${campo.linea}: ${nombre}.${campo.nombre} guarda una URL o texto largo ` +
      `pero es ${campo.db ?? 'VARCHAR(191)'} en MySQL. Añade @db.Text ` +
      `(o mételo en EXCEPCIONES de ${process.argv[1].split('/').pop()} si de verdad es corto).`
    );
  }
}

// ── Informe ─────────────────────────────────────────────────────────────────
if (errores.length > 0) {
  console.error(`\n✗ [verificar-schemas] ${errores.length} problema(s):\n`);
  for (const e of errores) console.error(`   • ${e}`);
  console.error(
    `\n  Recordatorio: en MySQL un String de Prisma es VARCHAR(191) y trunca sin avisar;\n` +
    `  en SQLite (local) no hay límite, así que estos fallos no se ven en desarrollo.\n`
  );
  process.exit(1);
}

const campos = [...prod.values()].reduce((n, m) => n + m.campos.size, 0);
console.log(`[verificar-schemas] ✓ ${prod.size} modelos y ${campos} campos en paridad; columnas largas con @db.Text`);
