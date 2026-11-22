// Banco de pruebas del cobro de envío. Mismo formato y misma filosofía que
// verify-quoter-pricing.ts: usa las funciones reales, no copias, y sale con
// código 1 si algo falla, así que sirve de red al tocar tarifas o zonas.
//
//   npm run verify:envios
import { calcShipping, buscarZona, type DestinoEnvio } from '../lib/shipping-calc';
import { DEFAULT_SHIPPING_CONFIG, type ShippingConfig } from '../lib/shipping-types';
import { COLOMBIA } from '../app/data/colombia';

let failures = 0;

function check(label: string, pass: boolean, detail: string) {
  if (!pass) failures++;
  console.log(`  ${pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFALLA\x1b[0m'}  ${label}\n         ${detail}`);
}

/** Configuración de trabajo: la de fábrica pero encendida. */
const cfg = (extra: Partial<ShippingConfig> = {}): ShippingConfig => ({
  ...DEFAULT_SHIPPING_CONFIG,
  habilitado: true,
  ...extra,
});

const aDomicilio = (departamento: string, ciudad?: string): DestinoEnvio =>
  ({ metodo: 'domicilio', departamento, ciudad });

const cop = (n: number) => `$${n.toLocaleString('es-CO')}`;

// ─── T1: apagado = comportamiento anterior ───────────────────────────────────
console.log('\n=== T1: con la función apagada no se cobra nada ===');
{
  const off = DEFAULT_SHIPPING_CONFIG; // habilitado: false de fábrica
  const conDir = calcShipping(aDomicilio('Bogotá D.C.', 'Bogotá'), 500000, off);
  const sinDir = calcShipping({ metodo: 'domicilio' }, 500000, off);
  check('con dirección, costo 0', conDir.costo === 0, `${cop(conDir.costo)} · "${conDir.etiqueta}"`);
  check('sin dirección, costo 0', sinDir.costo === 0, `${cop(sinDir.costo)} · "${sinDir.etiqueta}"`);
  check('se marca indeterminado para que la UI diga "A confirmar"',
    conDir.indeterminado && conDir.etiqueta === 'A confirmar', `etiqueta "${conDir.etiqueta}"`);
}

// ─── T2: cada zona cobra lo suyo ─────────────────────────────────────────────
console.log('\n=== T2: cada zona configurada devuelve su costo ===');
for (const z of cfg().zonas) {
  const d = z.departamentos[0];
  const r = calcShipping(aDomicilio(d), 10000, cfg());
  check(`${z.nombre} (${d})`, r.costo === z.costo && r.zona === z.id,
    `${cop(r.costo)} esperado ${cop(z.costo)} · zona "${r.zona}"`);
}

// ─── T3: la ciudad manda sobre el departamento ───────────────────────────────
console.log('\n=== T3: una ciudad con tarifa propia gana sobre su departamento ===');
{
  const c = cfg({
    zonas: [
      { id: 'especial', nombre: 'Medellín centro', costo: 5000, departamentos: [], ciudades: ['Medellín'] },
      { id: 'antioquia', nombre: 'Antioquia', costo: 18000, departamentos: ['Antioquia'] },
    ],
  });
  const medellin = calcShipping(aDomicilio('Antioquia', 'Medellín'), 10000, c);
  const bello    = calcShipping(aDomicilio('Antioquia', 'Bello'), 10000, c);
  check('Medellín usa la zona de ciudad', medellin.costo === 5000, `${cop(medellin.costo)} · zona "${medellin.zona}"`);
  check('otra ciudad del mismo depto usa la zona de departamento',
    bello.costo === 18000, `${cop(bello.costo)} · zona "${bello.zona}"`);
}

// ─── T4: destino fuera de toda zona ──────────────────────────────────────────
console.log('\n=== T4: destino sin zona cae en la tarifa por defecto ===');
{
  const r = calcShipping(aDomicilio('Amazonas', 'Leticia'), 10000, cfg());
  check('Amazonas usa costoPorDefecto',
    r.costo === DEFAULT_SHIPPING_CONFIG.costoPorDefecto && r.zona === null,
    `${cop(r.costo)} · zona ${r.zona}`);
  check('la etiqueta lo dice', r.etiqueta.includes('Resto del país'), `"${r.etiqueta}"`);
}

// ─── T5: umbral de envío gratis ──────────────────────────────────────────────
console.log('\n=== T5: umbral de envío gratis, en el borde exacto ===');
{
  const c = cfg({ envioGratisDesde: 200000 });
  const justoDebajo = calcShipping(aDomicilio('Bogotá D.C.'), 199999, c);
  const exacto      = calcShipping(aDomicilio('Bogotá D.C.'), 200000, c);
  const arriba      = calcShipping(aDomicilio('Bogotá D.C.'), 200001, c);
  check('un peso por debajo cobra', justoDebajo.costo > 0, `${cop(justoDebajo.costo)}`);
  check('justo en el umbral es gratis', exacto.costo === 0 && exacto.gratisPorMonto, `${cop(exacto.costo)}`);
  check('por encima es gratis', arriba.costo === 0 && arriba.gratisPorMonto, `${cop(arriba.costo)}`);
}

console.log('\n=== T6: umbral en 0 significa "nunca gratis" ===');
{
  const r = calcShipping(aDomicilio('Bogotá D.C.'), 99_000_000, cfg({ envioGratisDesde: 0 }));
  check('un pedido enorme sigue pagando envío', r.costo > 0 && !r.gratisPorMonto, `${cop(r.costo)}`);
}

// ─── T7: recogida en punto ───────────────────────────────────────────────────
console.log('\n=== T7: recoger en punto ===');
{
  const conRecogida = cfg({ recogida: { habilitada: true, etiqueta: 'Recoger en taller', direccion: 'Calle 1' } });
  const r = calcShipping({ metodo: 'recogida' }, 10000, conRecogida);
  check('no cobra y no exige destino', r.costo === 0 && !r.indeterminado, `${cop(r.costo)} · "${r.etiqueta}"`);
  check('usa la etiqueta configurada', r.etiqueta === 'Recoger en taller', `"${r.etiqueta}"`);

  // Pedida pero deshabilitada: el cálculo la trata como domicilio. La ruta de
  // checkout además la rechaza con 400 (ver T11).
  const sinRecogida = calcShipping({ metodo: 'recogida', departamento: 'Bogotá D.C.' }, 10000, cfg());
  check('si está deshabilitada no regala el envío', sinRecogida.costo > 0, `${cop(sinRecogida.costo)}`);
}

// ─── T8: tope de seguridad ───────────────────────────────────────────────────
console.log('\n=== T8: costoMaximo acota una tarifa mal configurada ===');
{
  const c = cfg({
    costoMaximo: 50000,
    zonas: [{ id: 'x', nombre: 'Dedo gordo', costo: 9_999_999, departamentos: ['Bogotá D.C.'] }],
  });
  const r = calcShipping(aDomicilio('Bogotá D.C.'), 10000, c);
  check('un costo absurdo se recorta al tope', r.costo === 50000, `${cop(r.costo)} con tope ${cop(50000)}`);

  const neg = calcShipping(aDomicilio('Bogotá D.C.'), 10000,
    cfg({ zonas: [{ id: 'n', nombre: 'Negativa', costo: -5000, departamentos: ['Bogotá D.C.'] }] }));
  check('un costo negativo se vuelve 0', neg.costo === 0, `${cop(neg.costo)}`);
}

// ─── T9: sin destino todavía ─────────────────────────────────────────────────
console.log('\n=== T9: sin destino elegido no se inventa un precio ===');
{
  const r = calcShipping({ metodo: 'domicilio' }, 10000, cfg());
  check('queda indeterminado', r.indeterminado && r.costo === 0, `${cop(r.costo)} · "${r.etiqueta}"`);
}

// ─── T10: tildes y mayúsculas no rompen la búsqueda ──────────────────────────
console.log('\n=== T10: el nombre del destino se compara sin tildes ni mayúsculas ===');
{
  const esperado = calcShipping(aDomicilio('Bogotá D.C.'), 10000, cfg()).costo;
  for (const variante of ['bogota d.c.', 'BOGOTÁ D.C.', '  Bogota D.C.  ']) {
    const r = calcShipping(aDomicilio(variante), 10000, cfg());
    check(`"${variante}"`, r.costo === esperado, `${cop(r.costo)} esperado ${cop(esperado)}`);
  }
}

// ─── T11: todos los departamentos reales resuelven a algo cobrable ───────────
console.log('\n=== T11: los 33 departamentos del formulario tienen tarifa ===');
{
  let malos = 0;
  for (const d of COLOMBIA) {
    const r = calcShipping(aDomicilio(d.name, d.cities[0]), 10000, cfg());
    if (!(r.costo > 0 && Number.isInteger(r.costo) && !r.indeterminado)) malos++;
  }
  check('ninguno queda sin precio', malos === 0, `${COLOMBIA.length} departamentos, ${malos} sin tarifa válida`);
}

// ─── T12: el total siempre cuadra ────────────────────────────────────────────
console.log('\n=== T12: subtotal + envío = total, sin decimales sueltos ===');
{
  let malos = 0;
  for (const d of COLOMBIA) {
    for (const subtotal of [1, 999, 100000, 4999999]) {
      const r = calcShipping(aDomicilio(d.name), subtotal, cfg({ envioGratisDesde: 1000000 }));
      const total = subtotal + r.costo;
      if (!Number.isInteger(total) || total < subtotal) malos++;
    }
  }
  check('todas las combinaciones dan un entero >= subtotal', malos === 0,
    `${COLOMBIA.length * 4} combinaciones probadas`);
}

// ─── T13: buscarZona no depende del orden de llamada ─────────────────────────
console.log('\n=== T13: la búsqueda de zona es determinista ===');
{
  const zonas = cfg().zonas;
  const a = buscarZona(zonas, 'Antioquia', 'Medellín')?.id;
  const b = buscarZona(zonas, 'Antioquia', 'Medellín')?.id;
  check('dos llamadas iguales dan lo mismo', a === b, `${a} === ${b}`);

  // Departamento repetido en dos zonas: gana la primera, y eso no debe cambiar.
  const dup = [
    { id: 'primera', nombre: 'Primera', costo: 1000, departamentos: ['Tolima'] },
    { id: 'segunda', nombre: 'Segunda', costo: 2000, departamentos: ['Tolima'] },
  ];
  check('con un departamento duplicado gana la primera zona',
    buscarZona(dup, 'Tolima', null)?.id === 'primera',
    `ganó "${buscarZona(dup, 'Tolima', null)?.id}"`);
}

// ─── Resumen ─────────────────────────────────────────────────────────────────
console.log(failures === 0
  ? '\n\x1b[32mTodo OK\x1b[0m\n'
  : `\n\x1b[31m${failures} comprobación(es) fallaron\x1b[0m\n`);

process.exit(failures === 0 ? 0 : 1);
