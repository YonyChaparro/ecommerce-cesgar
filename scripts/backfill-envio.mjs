#!/usr/bin/env node
/**
 * Rellena el desglose de las órdenes creadas antes de que se cobrara el envío.
 *
 * Esas órdenes tienen `total` con lo que se cobró, pero `subtotal` en 0 porque
 * la columna es nueva. Sin esto, el panel y el correo enseñarían un desglose
 * falso ("Subtotal $0 · Envío $0 · Total $120.000").
 *
 *   node scripts/backfill-envio.mjs --dry-run    # muestra el plan, no escribe
 *   node scripts/backfill-envio.mjs              # aplica
 *
 * Para cada orden con subtotal = 0 y total > 0: subtotal = total,
 * shippingCost = 0, shippingMethod = 'domicilio'. No toca ninguna orden que ya
 * tenga subtotal. Es idempotente: reejecutarlo no hace nada.
 *
 * REQUISITO: correrlo después de que el despliegue aplique el db push.
 */

import fs from 'node:fs';
import path from 'node:path';

// Igual que en importar-contenido.mjs: precedencia entorno > .env.local > .env
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

const dryRun = process.argv.includes('--dry-run');
const destino = (process.env.DATABASE_URL ?? '').startsWith('mysql://') ? 'MySQL' : 'SQLite';

console.log(`Destino: ${destino}`);
console.log(dryRun ? 'Modo   : SIMULACIÓN (no se escribe nada)\n' : 'Modo   : APLICAR CAMBIOS\n');

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const pendientes = await prisma.order.findMany({
  where: { subtotal: 0, total: { gt: 0 } },
  select: { id: true, total: true, createdAt: true },
  orderBy: { createdAt: 'asc' },
});

const yaHechas = await prisma.order.count({ where: { subtotal: { gt: 0 } } });

console.log(`Órdenes por rellenar : ${pendientes.length}`);
console.log(`Órdenes ya con desglose: ${yaHechas}\n`);

for (const o of pendientes) {
  const fecha = o.createdAt.toISOString().slice(0, 10);
  console.log(`   ${dryRun ? '+ rellenaría' : '✓ rellenada'}: ${o.id.slice(-8).toUpperCase()} (${fecha}) subtotal = $${o.total.toLocaleString('es-CO')}`);
  if (!dryRun) {
    await prisma.order.update({
      where: { id: o.id },
      data: { subtotal: o.total, shippingCost: 0, shippingMethod: 'domicilio' },
    });
  }
}

console.log(`\n${dryRun ? 'Simulación' : 'Resultado'}: ${pendientes.length} órdenes ${dryRun ? 'por rellenar' : 'rellenadas'}`);

await prisma.$disconnect();
