// Banco de pruebas de los textos editables del home. Mismo formato y misma
// filosofía que verify-shipping.ts: usa las funciones reales, no copias, y sale
// con código 1 si algo falla. Casos: docs/specs/textos-home/design.md §8.
//
//   npm run verify:home
import {
  CTA_MAX,
  DEFAULT_HOME_CONTENT,
  FRASES_MAX,
  LIMITES,
  SERVICIO_IDS,
  TOPE_BYTES,
  type HomeContent,
} from '../lib/home-content-types';
import {
  bytesJson,
  largo,
  mezclarConDefaults,
  normalizarTexto,
  validarHomeContent,
} from '../lib/home-content-validate';

let failures = 0;

function check(label: string, pass: boolean, detail: string) {
  if (!pass) failures++;
  console.log(`  ${pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFALLA\x1b[0m'}  ${label}\n         ${detail}`);
}

/** Copia profunda de los textos de fábrica, para mutarla sin tocar el original. */
const base = (): HomeContent => JSON.parse(JSON.stringify(DEFAULT_HOME_CONTENT));

/** Copia de fábrica con un cambio aplicado. */
const con = (cambio: (c: HomeContent) => void): HomeContent => {
  const c = base();
  cambio(c);
  return c;
};

const errores = (entrada: unknown) => {
  const r = validarHomeContent(entrada);
  return r.ok ? {} : r.errores;
};

const iguales = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Recorre todos los textos con su ruta y su límite. */
function* textosConLimite(c: HomeContent): Generator<[string, string, number]> {
  for (const [k, v] of Object.entries(c.seo)) yield [`seo.${k}`, v, LIMITES.seo[k as keyof typeof LIMITES.seo]];
  for (const [i, p] of c.menu.cta.entries()) {
    yield [`menu.cta.${i}.texto`, p.texto, LIMITES.menu.cta.texto];
    yield [`menu.cta.${i}.textoCorto`, p.textoCorto, LIMITES.menu.cta.textoCorto];
  }
  yield ['hero.titulo', c.hero.titulo, LIMITES.hero.titulo];
  for (const [i, f] of c.hero.frases.entries()) yield [`hero.frases.${i}`, f, LIMITES.hero.frase];
  for (const [i, m] of c.hero.metricas.entries()) {
    yield [`hero.metricas.${i}.prefijo`, m.prefijo, LIMITES.hero.metrica.prefijo];
    yield [`hero.metricas.${i}.sufijo`, m.sufijo, LIMITES.hero.metrica.sufijo];
    yield [`hero.metricas.${i}.etiqueta`, m.etiqueta, LIMITES.hero.metrica.etiqueta];
  }
  for (const id of SERVICIO_IDS) {
    for (const [k, v] of Object.entries(c.servicios[id])) {
      yield [`servicios.${id}.${k}`, v, LIMITES.servicio[k as keyof typeof LIMITES.servicio]];
    }
  }
  const { destacados, ...catalogo } = c.catalogo;
  for (const [k, v] of Object.entries(catalogo)) yield [`catalogo.${k}`, v, LIMITES.catalogo[k as keyof typeof catalogo]];
  for (const [i, d] of destacados.entries()) {
    yield [`catalogo.destacados.${i}.titulo`, d.titulo, LIMITES.catalogo.destacado.titulo];
    yield [`catalogo.destacados.${i}.subtitulo`, d.subtitulo, LIMITES.catalogo.destacado.subtitulo];
  }
  for (const [k, v] of Object.entries(c.tienda)) yield [`tienda.${k}`, v, LIMITES.tienda[k as keyof typeof LIMITES.tienda]];
  yield ['clientes.titulo', c.clientes.titulo, LIMITES.clientes.titulo];
  for (const seccion of ['proyectos', 'blog'] as const) {
    const { tarjetaFinal, ...resto } = c[seccion];
    const lim = LIMITES[seccion] as Record<string, number>;
    for (const [k, v] of Object.entries(resto)) yield [`${seccion}.${k}`, v, lim[k]];
    for (const [k, v] of Object.entries(tarjetaFinal)) {
      yield [`${seccion}.tarjetaFinal.${k}`, v, LIMITES.tarjetaFinal[k as keyof typeof LIMITES.tarjetaFinal]];
    }
  }
}

// ─── T1: los textos de fábrica son válidos ───────────────────────────────────
console.log('\n=== T1: los textos de fábrica pasan la validación ===');
{
  const r = validarHomeContent(DEFAULT_HOME_CONTENT);
  check('validarHomeContent(DEFAULT) no da errores', r.ok, r.ok ? 'sin errores' : JSON.stringify(r.errores));
  check('y devuelve exactamente lo mismo', r.ok && iguales(r.value, DEFAULT_HOME_CONTENT),
    'guardar los textos de fábrica no los altera');
}

// ─── T2: cada texto de fábrica cabe y ya está normalizado ────────────────────
console.log('\n=== T2: cada texto de fábrica cabe en su límite ===');
{
  const lista = [...textosConLimite(DEFAULT_HOME_CONTENT)];
  const largos = lista.filter(([, v, max]) => largo(v) > max);
  const sinNormalizar = lista.filter(([, v]) => normalizarTexto(v) !== v);
  const sinLimite = lista.filter(([, , max]) => typeof max !== 'number');
  check('ninguno supera su máximo', largos.length === 0,
    largos.length ? largos.map(([r, v, m]) => `${r}: ${largo(v)} > ${m}`).join(', ') : `${lista.length} textos revisados`);
  check('todos tienen un límite definido', sinLimite.length === 0, sinLimite.map(([r]) => r).join(', ') || 'ok');
  check('ninguno cambia al normalizarse', sinNormalizar.length === 0, sinNormalizar.map(([r]) => r).join(', ') || 'ok');
}

// ─── T3: obligatorios ────────────────────────────────────────────────────────
console.log('\n=== T3: un campo obligatorio vacío no se guarda ===');
{
  const vacio = errores(con((c) => { c.hero.titulo = ''; }));
  const espacios = errores(con((c) => { c.blog.tarjetaFinal.boton = '   \n\t '; }));
  const faltante = errores(con((c) => { delete (c.seo as Partial<HomeContent['seo']>).titulo; }));
  check('vacío → error en hero.titulo', vacio['hero.titulo'] === 'Obligatorio', JSON.stringify(vacio));
  check('solo espacios → error en blog.tarjetaFinal.boton',
    espacios['blog.tarjetaFinal.boton'] === 'Obligatorio', JSON.stringify(espacios));
  check('ausente → error en seo.titulo', faltante['seo.titulo'] === 'Obligatorio', JSON.stringify(faltante));
  const prefijoVacio = errores(con((c) => { c.hero.metricas[0].prefijo = ''; c.hero.metricas[3].sufijo = ''; }));
  check('prefijo y sufijo de métrica sí pueden ir vacíos', Object.keys(prefijoVacio).length === 0,
    JSON.stringify(prefijoVacio));
}

// ─── T4: máximos ─────────────────────────────────────────────────────────────
console.log('\n=== T4: el máximo de caracteres se respeta al carácter ===');
{
  const max = LIMITES.hero.titulo;
  const justo = errores(con((c) => { c.hero.titulo = 'a'.repeat(max); }));
  const pasado = errores(con((c) => { c.hero.titulo = 'a'.repeat(max + 1); }));
  check(`justo en el máximo (${max}) → pasa`, !justo['hero.titulo'], JSON.stringify(justo));
  check(`un carácter más (${max + 1}) → error`, pasado['hero.titulo'] === `Máximo ${max} caracteres`,
    JSON.stringify(pasado));
  const tildes = errores(con((c) => { c.hero.titulo = 'ñ'.repeat(max); }));
  check('las tildes cuentan como un carácter, no como dos bytes', !tildes['hero.titulo'], JSON.stringify(tildes));
}

// ─── T5: métricas ────────────────────────────────────────────────────────────
console.log('\n=== T5: una métrica tiene que ser un entero de 0 a 999.999 ===');
{
  const casos: [string, unknown, boolean][] = [
    ['-1', -1, false],
    ['12.5', 12.5, false],
    ['"500" (texto)', '500', false],
    ['1 000 000', 1_000_000, false],
    ['NaN', NaN, false],
    ['0', 0, true],
    ['999 999', 999_999, true],
  ];
  for (const [nombre, valor, valido] of casos) {
    const e = errores(con((c) => { (c.hero.metricas[1] as { valor: unknown }).valor = valor; }));
    const tieneError = Boolean(e['hero.metricas.1.valor']);
    check(`${nombre} → ${valido ? 'pasa' : 'error'}`, tieneError !== valido, JSON.stringify(e));
  }
}

// ─── T6: normalización ───────────────────────────────────────────────────────
console.log('\n=== T6: los textos se guardan en una línea y sin caracteres de control ===');
{
  const r = validarHomeContent(con((c) => {
    c.hero.titulo = '  Precisión\nindustrial\t\ta tu\u0000alcance  ';
    c.catalogo.parrafo = 'Línea uno.\r\n\r\nLínea dos.';
  }));
  check('saltos, tabs y \\u0000 quedan en un espacio',
    r.ok && r.value.hero.titulo === 'Precisión industrial a tu alcance',
    r.ok ? `"${r.value.hero.titulo}"` : JSON.stringify(r.errores));
  check('párrafo con líneas en blanco queda en una línea',
    r.ok && r.value.catalogo.parrafo === 'Línea uno. Línea dos.',
    r.ok ? `"${r.value.catalogo.parrafo}"` : '');
  const html = validarHomeContent(con((c) => { c.clientes.titulo = '<b>hola</b>'; }));
  check('el HTML se guarda tal cual, como texto (React lo escapa al pintar)',
    html.ok && html.value.clientes.titulo === '<b>hola</b>', html.ok ? html.value.clientes.titulo : '');
}

// ─── T7: cantidad de frases ──────────────────────────────────────────────────
console.log(`\n=== T7: el hero tiene entre 1 y ${FRASES_MAX} frases ===`);
{
  const n = (k: number) => errores(con((c) => { c.hero.frases = Array.from({ length: k }, (_, i) => `Frase ${i + 1}`); }));
  check('0 frases → error', Boolean(n(0)['hero.frases']), JSON.stringify(n(0)));
  check(`${FRASES_MAX + 1} frases → error`, Boolean(n(FRASES_MAX + 1)['hero.frases']), JSON.stringify(n(FRASES_MAX + 1)));
  check('1 frase → pasa', Object.keys(n(1)).length === 0, JSON.stringify(n(1)));
  check(`${FRASES_MAX} frases → pasa`, Object.keys(n(FRASES_MAX)).length === 0, JSON.stringify(n(FRASES_MAX)));
}

// ─── T8: cantidad de métricas ────────────────────────────────────────────────
console.log('\n=== T8: las métricas son exactamente 4 ===');
{
  const tres = errores(con((c) => { c.hero.metricas = c.hero.metricas.slice(0, 3); }));
  const cinco = errores(con((c) => { c.hero.metricas = [...c.hero.metricas, { ...c.hero.metricas[0] }]; }));
  check('3 métricas → error', Boolean(tres['hero.metricas']), JSON.stringify(tres));
  check('5 métricas → error', Boolean(cinco['hero.metricas']), JSON.stringify(cinco));
  const dos = errores(con((c) => { c.catalogo.destacados = c.catalogo.destacados.slice(0, 1); }));
  check('1 destacado en el catálogo → error', Boolean(dos['catalogo.destacados']), JSON.stringify(dos));
}

// ─── T9: servicios ───────────────────────────────────────────────────────────
console.log('\n=== T9: los servicios son exactamente los 5 conocidos ===');
{
  const falta = errores(con((c) => { delete (c.servicios as Partial<HomeContent['servicios']>).escaneo; }));
  const inventado = errores(con((c) => {
    (c.servicios as Record<string, unknown>).impresion = { titulo: 'x', descripcion: 'x', cta: 'x' };
  }));
  check('servicio faltante → error', falta['servicios.escaneo'] === 'Falta este servicio', JSON.stringify(falta));
  check('id inventado → error', inventado['servicios.impresion'] === 'Servicio desconocido', JSON.stringify(inventado));
}

// ─── T10: claves extra ───────────────────────────────────────────────────────
console.log('\n=== T10: lo que no está en el esquema no llega a la base ===');
{
  const entrada = JSON.parse(
    JSON.stringify(con((c) => { (c.seo as Record<string, unknown>).script = '<script>'; })).replace(
      '{"seo"', '{"__proto__":{"admin":true},"extra":1,"seo"'),
  );
  const r = validarHomeContent(entrada);
  const salida = r.ok ? r.value : null;
  check('la entrada trae __proto__ propio (para que la prueba valga)',
    Object.prototype.hasOwnProperty.call(entrada, '__proto__'), Object.keys(entrada).slice(0, 3).join(', '));
  check('valida sin errores', r.ok, r.ok ? 'ok' : JSON.stringify(r.errores));
  check('la salida no tiene "extra" ni "__proto__" propio',
    !!salida && !('extra' in salida) && !Object.prototype.hasOwnProperty.call(salida, '__proto__'),
    salida ? Object.keys(salida).join(', ') : '');
  check('seo.script se descarta', !!salida && !('script' in salida.seo), salida ? Object.keys(salida.seo).join(', ') : '');
  check('ningún objeto quedó contaminado', ({} as Record<string, unknown>).admin === undefined, 'Object.prototype intacto');
}

// ─── T11: todos los errores de una vez ───────────────────────────────────────
console.log('\n=== T11: se reportan todos los errores, no solo el primero ===');
{
  const e = errores(con((c) => {
    c.seo.titulo = '';
    c.hero.frases[1] = 'x'.repeat(LIMITES.hero.frase + 1);
    c.servicios.diseno.cta = '';
    c.blog.tarjetaFinal.texto = 'x'.repeat(LIMITES.tarjetaFinal.texto + 1);
  }));
  const esperadas = ['seo.titulo', 'hero.frases.1', 'servicios.diseno.cta', 'blog.tarjetaFinal.texto'];
  check('4 errores en 4 rutas', esperadas.every((k) => e[k]) && Object.keys(e).length === 4, Object.keys(e).join(', '));
}

// ─── T12: lectura de basura ──────────────────────────────────────────────────
console.log('\n=== T12: leer algo inválido devuelve los textos de fábrica sin lanzar ===');
{
  for (const [nombre, v] of [['null', null], ['"x"', 'x'], ['{}', {}], ['[]', []], ['42', 42]] as const) {
    let r: HomeContent | null = null;
    let lanzo = false;
    try { r = mezclarConDefaults(v); } catch { lanzo = true; }
    check(`mezclarConDefaults(${nombre})`, !lanzo && iguales(r, DEFAULT_HOME_CONTENT), lanzo ? 'lanzó' : 'fábrica');
  }
}

// ─── T13: mezcla campo por campo ─────────────────────────────────────────────
console.log('\n=== T13: un guardado parcial conserva lo suyo y completa con fábrica ===');
{
  const guardado = { hero: { titulo: 'Título nuevo' }, servicios: { escaneo: { cta: 'Escanear' } } };
  const r = mezclarConDefaults(guardado);
  check('el campo guardado se usa', r.hero.titulo === 'Título nuevo', r.hero.titulo);
  check('el servicio parcial mezcla por campo',
    r.servicios.escaneo.cta === 'Escanear' && r.servicios.escaneo.titulo === DEFAULT_HOME_CONTENT.servicios.escaneo.titulo,
    `${r.servicios.escaneo.titulo} · ${r.servicios.escaneo.cta}`);
  check('las frases ausentes toman las de fábrica', iguales(r.hero.frases, DEFAULT_HOME_CONTENT.hero.frases),
    `${r.hero.frases.length} frases`);
  const sinCampo = JSON.parse(JSON.stringify(DEFAULT_HOME_CONTENT));
  delete sinCampo.blog.enlaceArticulo; // simula un campo añadido después de guardar
  check('un campo nuevo aparece con su texto de fábrica (R6.4)',
    mezclarConDefaults(sinCampo).blog.enlaceArticulo === DEFAULT_HOME_CONTENT.blog.enlaceArticulo,
    mezclarConDefaults(sinCampo).blog.enlaceArticulo);
  const prefijoBorrado = mezclarConDefaults(con((c) => { c.hero.metricas[0].prefijo = ''; }));
  check('un prefijo vaciado a propósito se respeta', prefijoBorrado.hero.metricas[0].prefijo === '',
    `"${prefijoBorrado.hero.metricas[0].prefijo}"`);
}

// ─── T14: tipos incorrectos al leer ──────────────────────────────────────────
console.log('\n=== T14: un campo con tipo incorrecto cae a fábrica, solo ese ===');
{
  const r = mezclarConDefaults({
    seo: { titulo: 123, descripcion: 'Descripción guardada' },
    hero: { metricas: [{ valor: '500', etiqueta: 'Guardada' }, 'basura'], frases: [7, '', 'Frase buena'] },
    catalogo: { destacados: 'no es lista' },
  });
  check('seo.titulo numérico → fábrica', r.seo.titulo === DEFAULT_HOME_CONTENT.seo.titulo, r.seo.titulo);
  check('seo.descripcion válida se conserva', r.seo.descripcion === 'Descripción guardada', r.seo.descripcion);
  check('valor de métrica en texto → fábrica, etiqueta se conserva',
    r.hero.metricas[0].valor === 500 && r.hero.metricas[0].etiqueta === 'Guardada',
    `${r.hero.metricas[0].valor} · ${r.hero.metricas[0].etiqueta}`);
  check('siempre salen 4 métricas', r.hero.metricas.length === 4, `${r.hero.metricas.length}`);
  check('las frases inválidas se descartan, las buenas quedan', iguales(r.hero.frases, ['Frase buena']),
    JSON.stringify(r.hero.frases));
  check('destacados que no son lista → fábrica', iguales(r.catalogo.destacados, DEFAULT_HOME_CONTENT.catalogo.destacados),
    `${r.catalogo.destacados.length} destacados`);
}

// ─── T15: límite reducido después de guardar ─────────────────────────────────
console.log('\n=== T15: un texto guardado más largo que el límite se recorta al leer ===');
{
  const largoGuardado = 'x'.repeat(LIMITES.hero.titulo + 25);
  const r = mezclarConDefaults({ hero: { titulo: largoGuardado } });
  check('se recorta al máximo, no se descarta',
    r.hero.titulo === 'x'.repeat(LIMITES.hero.titulo), `${largo(r.hero.titulo)} caracteres`);
}

// ─── T16: tope de bytes ──────────────────────────────────────────────────────
console.log(`\n=== T16: con todo al máximo, el JSON queda bajo ${TOPE_BYTES.toLocaleString('es-CO')} bytes ===`);
{
  // '€' ocupa 3 bytes en UTF-8: el peor caso realista para texto en español.
  const lleno = base();
  const relleno = (max: number) => '€'.repeat(max);
  lleno.hero.frases = Array.from({ length: FRASES_MAX }, () => relleno(LIMITES.hero.frase));
  lleno.menu.cta = Array.from({ length: CTA_MAX }, () => ({ texto: '', textoCorto: '' }));
  for (const [ruta, , max] of textosConLimite(lleno)) {
    const partes = ruta.split('.');
    const ultimo = partes.pop()!;
    const padre = partes.reduce<Record<string, unknown>>((o, k) => o[k] as Record<string, unknown>,
      lleno as unknown as Record<string, unknown>);
    padre[ultimo] = relleno(max);
  }
  for (const m of lleno.hero.metricas) m.valor = 999_999;
  const r = validarHomeContent(lleno);
  const bytes = bytesJson(lleno);
  check('el contenido al máximo es válido', r.ok, r.ok ? 'ok' : Object.keys(r.errores).slice(0, 5).join(', '));
  check('y pesa menos que el tope', bytes < TOPE_BYTES, `${bytes.toLocaleString('es-CO')} bytes`);
}

// ─── T17: botón del menú al escribir ─────────────────────────────────────────
console.log(`\n=== T17: el botón del menú tiene entre 1 y ${CTA_MAX} pares completos ===`);
{
  const n = (k: number) => errores(con((c) => {
    c.menu.cta = Array.from({ length: k }, (_, i) => ({ texto: `Texto ${i + 1}`, textoCorto: `Corto ${i + 1}` }));
  }));
  check('0 pares → error', Boolean(n(0)['menu.cta']), JSON.stringify(n(0)));
  check(`${CTA_MAX + 1} pares → error`, Boolean(n(CTA_MAX + 1)['menu.cta']), JSON.stringify(n(CTA_MAX + 1)));
  check('1 par → pasa', Object.keys(n(1)).length === 0, JSON.stringify(n(1)));
  check(`${CTA_MAX} pares → pasa`, Object.keys(n(CTA_MAX)).length === 0, JSON.stringify(n(CTA_MAX)));
  const sinCorto = errores(con((c) => { c.menu.cta[2].textoCorto = '  '; }));
  check('par sin texto corto → error en esa ruta', sinCorto['menu.cta.2.textoCorto'] === 'Obligatorio', JSON.stringify(sinCorto));
  const largoCorto = errores(con((c) => { c.menu.cta[0].textoCorto = 'x'.repeat(LIMITES.menu.cta.textoCorto + 1); }));
  check(`texto corto de ${LIMITES.menu.cta.textoCorto + 1} → error`,
    largoCorto['menu.cta.0.textoCorto'] === `Máximo ${LIMITES.menu.cta.textoCorto} caracteres`, JSON.stringify(largoCorto));
}

// ─── T18: botón del menú al leer ─────────────────────────────────────────────
console.log('\n=== T18: al leer, un par incompleto se descarta entero ===');
{
  const r = mezclarConDefaults({ menu: { cta: [
    { texto: 'Cotiza ya', textoCorto: 'Cotiza' },
    { texto: 'Sin corto' },
    { texto: '', textoCorto: 'Sin largo' },
    'basura',
    { texto: 'Otro', textoCorto: 'Otro' },
  ] } });
  check('quedan solo los pares completos, en orden',
    iguales(r.menu.cta, [{ texto: 'Cotiza ya', textoCorto: 'Cotiza' }, { texto: 'Otro', textoCorto: 'Otro' }]),
    JSON.stringify(r.menu.cta));
  const nada = mezclarConDefaults({ menu: { cta: [{ texto: 'Solo largo' }] } });
  check('sin pares válidos → los de fábrica', iguales(nada.menu.cta, DEFAULT_HOME_CONTENT.menu.cta), `${nada.menu.cta.length} pares`);
  const muchos = mezclarConDefaults({ menu: { cta: Array.from({ length: CTA_MAX + 3 }, (_, i) => ({ texto: `T${i}`, textoCorto: `C${i}` })) } });
  check(`más de ${CTA_MAX} guardados → se leen ${CTA_MAX}`, muchos.menu.cta.length === CTA_MAX, `${muchos.menu.cta.length}`);
  const mutado = mezclarConDefaults(null);
  mutado.menu.cta[0].texto = 'cambiado';
  check('mutar lo leído no toca los textos de fábrica', DEFAULT_HOME_CONTENT.menu.cta[0].texto === 'Cotización Instantánea',
    DEFAULT_HOME_CONTENT.menu.cta[0].texto);
}

// ─── Resumen ─────────────────────────────────────────────────────────────────
console.log(failures === 0
  ? '\n\x1b[32mTodo OK\x1b[0m\n'
  : `\n\x1b[31m${failures} comprobación(es) fallaron\x1b[0m\n`);

process.exit(failures === 0 ? 0 : 1);
