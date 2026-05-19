#!/usr/bin/env node
// Generates the Prisma client using the correct schema for the current environment.
// - DATABASE_URL starts with "mysql://" → prisma/schema.production.prisma (MySQL)
// - Everything else                     → prisma/schema.prisma (SQLite, local dev)

const { execSync } = require('child_process');

const url = process.env.DATABASE_URL ?? '';
const isMySQL = url.startsWith('mysql://');
const schema = isMySQL ? 'prisma/schema.production.prisma' : 'prisma/schema.prisma';

console.log(`[prisma-setup] Using schema: ${schema} (DATABASE_URL: ${isMySQL ? 'mysql' : 'sqlite'})`);
execSync(`npx prisma generate --schema=${schema}`, { stdio: 'inherit' });
