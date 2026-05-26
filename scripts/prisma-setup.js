#!/usr/bin/env node
// Sets up the Prisma client and database for the current environment.
// - DATABASE_URL starts with "mysql://" → schema.production.prisma (MySQL) + db push
// - Everything else                     → schema.prisma (SQLite, local dev)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env manually so process.env is populated before we check DATABASE_URL
try {
  const envPath = path.join(process.cwd(), '.env');
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s#]*))/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  }
} catch (_) {}

const url = process.env.DATABASE_URL ?? '';
const isMySQL = url.startsWith('mysql://');
const schema = isMySQL ? 'prisma/schema.production.prisma' : 'prisma/schema.prisma';
const shouldPush = process.argv.includes('--push');

console.log(`[prisma-setup] Using schema: ${schema} (DATABASE_URL: ${isMySQL ? 'mysql' : 'sqlite'})`);
execSync(`npx prisma generate --schema=${schema}`, { stdio: 'inherit' });

if (isMySQL && shouldPush) {
  console.log('[prisma-setup] Syncing MySQL schema with db push...');
  try {
    execSync(`npx prisma db push --schema=${schema} --accept-data-loss`, { stdio: 'inherit' });
  } catch (e) {
    console.warn('[prisma-setup] db push failed (tables may already exist) — continuing build.');
  }
}
