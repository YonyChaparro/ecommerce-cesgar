import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CSV_PATH = path.resolve(
  __dirname,
  '../wc-product-export-18-4-2026-1776560590493.csv'
);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseImages(raw: string): string[] {
  return raw
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

function parseIntOrNull(raw: string): number | null {
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? null : n;
}

async function main() {
  const content = fs.readFileSync(CSV_PATH, 'utf-8');

  const rows: Record<string, string>[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  // Skip service/downloadable entries with no real image or price
  const products = rows.filter(
    (r) => r['Tipo'] === 'simple' && r['Imágenes']?.trim()
  );

  console.log(`Importing ${products.length} products...`);

  const usedSlugs = new Set<string>();

  for (const row of products) {
    const name = row['Nombre']?.trim() ?? '';
    if (!name) continue;

    // Generate unique slug
    let slug = slugify(name);
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${Date.now()}`;
    }
    usedSlugs.add(slug);

    const images = parseImages(row['Imágenes'] ?? '');
    const [firstImg, ...extraImgs] = images;

    const price = parseIntOrNull(row['Precio normal'] ?? '') ?? 0;
    const salePrice = parseIntOrNull(row['Precio rebajado'] ?? '');
    const stock = parseIntOrNull(row['Inventario'] ?? '') ?? 0;
    const category = row['Categorías']?.split(',')[0]?.trim() ?? 'Sin categoría';
    const description = row['Descripción']?.trim() || null;
    const shortDescription = row['Descripción corta']?.trim() || null;

    // Check if product with this slug already exists
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  SKIP (exists): ${name}`);
      continue;
    }

    await prisma.product.create({
      data: {
        name,
        slug,
        category,
        price,
        salePrice,
        img: firstImg,
        alt: name,
        shortDescription,
        description,
        stock,
        media: {
          create: extraImgs.map((url, i) => ({
            type: 'image',
            url,
            alt: `${name} ${i + 2}`,
            order: i + 1,
          })),
        },
      },
    });

    console.log(`  OK: ${name}`);
  }

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
