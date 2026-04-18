import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// img1..img4 are placeholder URLs reused from the original seed
const IMG = {
  nozzle:  'https://lh3.googleusercontent.com/aida-public/AB6AXuCv6qUeKRAWyUPKx37FHVJ8tCHq_w8lh-X_ZEjND-ZxMxbK4DA692DQNBJabIrH_6kJBIT1Img9N_uy81IIz5jCsHWTFxIAaYgHpK4YUmJDzSA2RbWb1NSs4vkeX36Zjo3Sv76vPggHibq_ymXQxnhp3BzYN04wHDUewiNjc5rc1b47_yuD5AbrNZeaDV7LuN7MbZ4EOuzdfLtiwiUJC50wU_C3W4ZLrXZvK5vqSfevotO9Nk_wWX31bXseCGX1vrODwakWaa7Xl9I',
  extruder:'https://lh3.googleusercontent.com/aida-public/AB6AXuCnrn9qvlTW8MyN6vi8vbNg3rj4Q4k7sOZKCGNQ0Y0B-DN-r0IpRGbb9bjrvYt6Mjnwpc0CA-S8YatrLMu6cwFcsPdLva8k_oO_I81XvTSk7wNwmmjxLYP68yQyvKdivwMQyuYRz7Ewb_l4h4mjAouQjVvsyaFSeKwwVrXKUnSUZzlKH3cthgaKOgltReFrlMmIreXnvuv4-Z1XnpHCTYAVQRFMb-j-N5CaUHwekTm_e498rQJiwaupUsuwt9lDNa7TvDETHw3efd0',
  belt:    'https://lh3.googleusercontent.com/aida-public/AB6AXuATJY-spvKCPPbudfVEMArvrRtF8LLF000jKjLRiRN2aufQ7xrsqmNCBBzaJp1VddGELJ-LCKsQSo6cGa5G1n_NQOAs8AdVW_5fVyak3A3FI5igVWZAK3x4u4EEfilNiLjJlGtFdZYyHcFQx_oTZntUzAp6p6arys5rfUTLnfIXnjR66mQnSODOJlb0gheH9q3I996OJ9mKG_3v0e5Y_SSf_dR-grTQxdUfFt2zI9pI6EsOOD3sEtj-Aa_aMkVOfJ6Oo6g_GjvoqU8',
  board:   'https://lh3.googleusercontent.com/aida-public/AB6AXuAvIAwM6QBD5ufdlfEBNwmoYA9hx1y6VuL_oPqUFSQQvF11I4x_YfuBPt4GaFm9cMukqD491gOj7TPQHjUWt5ygBj4MJJpCVV0wzWl--OHDqyDyR1COzzxY_yzHqjsZxdLrLr_2jXcf-Vwqu1M6PEqfk_mDxX4GnYyNuVBXDBTXU8Wd5x_RuesPDdcKe4zmEo40vBDdawEEQYfmkLjOs2RvSMF7r71AXg1gx6FjpMOH0mC-N61OqC6STmjIMRaHIuL8ZRmXGg4FMl4',
};

type MediaInput = { type: string; url: string; alt?: string; order: number };

const PRODUCTS: {
  img: string;
  alt: string;
  category: string;
  name: string;
  price: number;
  media: MediaInput[];
}[] = [
  {
    img: IMG.nozzle,
    alt: 'Brass Nozzles',
    category: 'Repuestos para impresoras 3D',
    name: 'Boquillas de latón de 0.4 mm MK8',
    price: 4000,
    media: [
      { type: 'image', url: IMG.nozzle,   alt: 'Boquilla frontal',  order: 0 },
      { type: 'image', url: IMG.extruder, alt: 'Boquilla lateral',  order: 1 },
      { type: 'image', url: IMG.belt,     alt: 'Detalle punta',     order: 2 },
    ],
  },
  {
    img: IMG.extruder,
    alt: 'Extruder',
    category: 'Sistemas de Tracción',
    name: 'Direct Drive Extruder V3 Kit',
    price: 84000,
    media: [
      { type: 'image', url: IMG.extruder, alt: 'Extrusor frontal',  order: 0 },
      { type: 'image', url: IMG.nozzle,   alt: 'Extrusor montado',  order: 1 },
    ],
  },
  {
    img: IMG.belt,
    alt: 'Timing Belt',
    category: 'Transmisión',
    name: 'Correa Sincrónica 2GT 9mm x 6m',
    price: 150000,
    media: [
      { type: 'image', url: IMG.belt,     alt: 'Correa completa',   order: 0 },
      { type: 'image', url: IMG.board,    alt: 'Detalle dientes',   order: 1 },
    ],
  },
  {
    img: IMG.board,
    alt: 'Control Board',
    category: 'Electrónica',
    name: '32-Bit Control Board Kit Industrial',
    price: 145000,
    media: [
      { type: 'image', url: IMG.board,    alt: 'Placa frontal',     order: 0 },
      { type: 'image', url: IMG.belt,     alt: 'Placa trasera',     order: 1 },
      { type: 'image', url: IMG.extruder, alt: 'Conectores',        order: 2 },
    ],
  },
  {
    img: IMG.nozzle,
    alt: 'Filamento PLA',
    category: 'Filamentos',
    name: 'Filamento PLA 1kg 1.75mm Blanco',
    price: 65000,
    media: [
      { type: 'image', url: IMG.nozzle,   alt: 'Rollo filamento',   order: 0 },
      { type: 'image', url: IMG.extruder, alt: 'Detalle color',     order: 1 },
    ],
  },
  {
    img: IMG.extruder,
    alt: 'Hotend',
    category: 'Componentes',
    name: 'Hotend All-Metal V6 Kit Completo',
    price: 120000,
    media: [
      { type: 'image', url: IMG.extruder, alt: 'Hotend completo',   order: 0 },
      { type: 'image', url: IMG.nozzle,   alt: 'Hotend desmontado', order: 1 },
      { type: 'image', url: IMG.board,    alt: 'Hotend instalado',  order: 2 },
    ],
  },
  {
    img: IMG.belt,
    alt: 'Cama caliente',
    category: 'Electrónica',
    name: 'Cama Caliente 24V 310x310mm',
    price: 95000,
    media: [
      { type: 'image', url: IMG.belt,     alt: 'Cama caliente',     order: 0 },
      { type: 'image', url: IMG.board,    alt: 'Reverso cama',      order: 1 },
    ],
  },
  {
    img: IMG.board,
    alt: 'Sensor BLTouch',
    category: 'Nivelación',
    name: 'Sensor de Nivelación BLTouch V3.1',
    price: 180000,
    media: [
      { type: 'image', url: IMG.board,    alt: 'Sensor BLTouch',    order: 0 },
      { type: 'image', url: IMG.nozzle,   alt: 'Sensor montado',    order: 1 },
    ],
  },
];

async function main() {
  for (const p of PRODUCTS) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        category: p.category,
        price: p.price,
        img: p.img,
        alt: p.alt || p.name,
        stock: 50,
      },
    });

    // Replace media for this product on each seed run
    await prisma.productMedia.deleteMany({ where: { productId: product.id } });
    await prisma.productMedia.createMany({
      data: p.media.map((m) => ({ ...m, productId: product.id })),
    });
  }

  // Default admin user (skip if already exists)
  const adminEmail = 'admin@cesgar.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash('cesgar2024', 10),
        name: 'Administrador',
        role: 'ADMIN',
      },
    });
    console.log('Admin creado → admin@cesgar.com / cesgar2024');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });