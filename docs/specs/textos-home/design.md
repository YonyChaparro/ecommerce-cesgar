# Diseño — Editar los textos del home desde el panel

Estado: **implementado, pendiente de desplegar**. Fecha: 2026-10-03.
Las notas «*Al implementar:*» marcan dónde el código se apartó de la propuesta y por qué.
Documentos hermanos: [`requirements.md`](requirements.md) (qué) · [`tasks.md`](tasks.md) (en qué orden).
Los ids `R*` remiten a los criterios de aceptación de `requirements.md`.

---

## 1. Principios que hereda del código existente

No son decisiones nuevas: son las convenciones que ya siguen `/admin/cotizador`
y `/admin/envios`, y este trabajo las respeta para no introducir otro patrón.

1. **La configuración editable vive en la tabla `Setting` como un JSON**, con un
   módulo `get*/save*` que mezcla lo guardado con los valores de fábrica y
   nunca lanza. Precedente exacto: `lib/shipping-config.ts`.
2. **Las reglas viven en un módulo puro**, sin base de datos, que importan por
   igual el navegador, el servidor y el script de pruebas. Precedente:
   `lib/shipping-calc.ts`.
3. **El servidor decide.** El formulario valida para avisar; la acción vuelve a
   validar para decidir (R3.4).
4. **Una pantalla del panel son tres archivos**: `page.tsx` (carga),
   `*Form.tsx` (cliente), `actions.ts` (`requireAdmin()` + guardar +
   `revalidatePath`). Precedente: `app/admin/(panel)/envios/`.
5. **Pruebas como script ejecutable** con el formato PASS/FALLA de
   `scripts/verify-shipping.ts`.

---

## 2. Flujo

```
/admin/inicio
  page.tsx ──leerHomeContent()──► HomeContentForm (cliente)
                                   │ validarHomeContent() → avisa por campo
                                   ▼
                          saveHomeContentAction(input)
                                   │ requireAdmin()
                                   │ validarHomeContent() → decide
                                   │ tamaño ≤ 60 000 bytes
                                   ▼
                     Setting { key: 'home_content', value: JSON }
                                   │ revalidatePath('/', 'layout')  ← todo el sitio (R8.3)
                                   ▼
/  (force-dynamic)
  generateMetadata ─┐
  Navbar (servidor)─┤
  Home ─────────────┴─ getHomeContent()  ← React cache(): 1 consulta por request
     ├─ NavbarClient     textos.menu.cta    (cliente, por props)
     ├─ HeroCarousel     textos.hero        (cliente, por props)
     ├─ servicios        serviciosConTextos(textos.servicios)
     ├─ catálogo/tienda/clientes/proyectos  (servidor, directo)
     └─ BlogSection      textos.blog        (cliente, por props)

/servicios (estática) ── getHomeContent() → serviciosConTextos(...)
```

---

## 3. Modelo de datos

### 3.1 Sin cambios de esquema

Se usa la tabla `Setting` que ya existe, con `key: 'home_content'`. No hay
`db push`, no hay migración y `scripts/verificar-schemas.mjs` no se entera.
Desplegar el código sin haber guardado nada deja el home idéntico (R6.1).

### 3.2 Tipos — `lib/home-content-types.ts`

```ts
export const SERVICIO_IDS = ['cotizador', 'repuestos', 'escaneo', 'diseno', 'prototipado'] as const;
export type ServicioId = (typeof SERVICIO_IDS)[number];

export interface MetricaHero {
  valor: number;    // entero 0–999 999, lo anima CountUp
  prefijo: string;  // "+", o vacío
  sufijo: string;   // "h", o vacío
  etiqueta: string;
}

export interface TextoServicio { titulo: string; descripcion: string; cta: string }
export interface TarjetaFinal   { etiqueta: string; titulo: string; texto: string; boton: string }
export interface TextoCta       { texto: string; textoCorto: string }   // rotan juntos (R8.1)

export interface HomeContent {
  seo:       { titulo: string; descripcion: string; ogDescripcion: string };
  menu:      { cta: TextoCta[] };                                         // 1–6 pares (R8.2)
  hero:      { titulo: string; frases: string[]; metricas: MetricaHero[] };   // 1–5 frases, 4 métricas
  servicios: Record<ServicioId, TextoServicio>;
  catalogo:  {
    etiqueta: string; titulo: string; parrafo: string;
    destacados: { titulo: string; subtitulo: string }[];                     // exactamente 2
    boton: string;
  };
  tienda:    { migaPan: string; titulo: string; subtitulo: string;
               enlaceVerTodos: string; botonTarjeta: string; botonFinal: string };
  clientes:  { titulo: string };
  proyectos: { etiqueta: string; titulo: string; subtitulo: string; tarjetaFinal: TarjetaFinal };
  blog:      { etiqueta: string; titulo: string; subtitulo: string;
               enlaceVerTodos: string; enlaceArticulo: string; tarjetaFinal: TarjetaFinal };
}

/** Textos de fábrica: copia literal de los textos que hoy están en el código. */
export const DEFAULT_HOME_CONTENT: HomeContent = { /* requirements.md §7 */ };

/** Máximo de caracteres por campo, con la misma forma que HomeContent. */
export const LIMITES = { /* requirements.md §7 */ } as const;
```

Notas:

- **`DEFAULT_HOME_CONTENT` pasa a ser la única fuente de los textos de
  fábrica.** Los textos se *mueven* aquí desde `HeroCarousel.tsx`,
  `services.tsx`, `page.tsx` y `BlogSection.tsx`; no se copian. Así no quedan
  dos versiones del mismo texto que puedan divergir.
- Los servicios van como `Record` por id, no como arreglo: la mezcla con los
  valores de fábrica es por clave y un servicio no se "corre" de posición.
- `LIMITES` tiene la misma forma que el contenido para que el formulario lea de
  ahí los contadores (R2.3) y el validador los máximos (R3.2), sin duplicarlos.
- Regla de obligatoriedad, para no anotar campo por campo: **todo string es
  obligatorio salvo `prefijo` y `sufijo` de las métricas.**

### 3.3 Tope de tamaño

En producción `Setting.value` es `@db.Text`: **65 535 bytes**. Y como documenta
`scripts/verificar-schemas.mjs`, el MySQL de Hostinger **corta en silencio** lo
que no cabe (así se rompieron las portadas del blog, commit `8f8442b`).

Un JSON cortado no se puede parsear → `getHomeContent()` devuelve los textos de
fábrica → el home vuelve a los textos originales y el administrador cree que
sus cambios "se borraron solos", sin ningún error a la vista.

Por eso la acción mide el JSON **en bytes UTF-8**, no en caracteres (una
tilde ocupa 2 bytes), y rechaza por encima de **60 000** (R3.6), dejando
margen. *Al implementar:* se mide con `bytesJson()` del módulo puro
(`TextEncoder`), no con `Buffer.byteLength`, para que navegador, servidor y
pruebas usen la misma función. Con los máximos de §7 el peor caso
ronda los 17 KB, así que este control es la última barrera, no la primera.

---

## 4. Módulos

### 4.1 `lib/home-content-validate.ts` — puro, compartido

Dos funciones con **rigor distinto a propósito**:

```ts
export type ErroresCampo = Record<string, string>;  // "hero.frases.1" → "Máximo 90 caracteres"

/** Escritura: estricta. Lo que use la acción para decidir si guarda. */
export function validarHomeContent(input: unknown):
  | { ok: true;  value: HomeContent }
  | { ok: false; errores: ErroresCampo };

/** Lectura: tolerante. Lo que use getHomeContent para no romper nunca el home. */
export function mezclarConDefaults(guardado: unknown): HomeContent;

export function normalizarTexto(s: string): string;
```

**`normalizarTexto`** (R3.5): quita caracteres de control (`\u0000-\u001F`,
`\u007F`), reduce cualquier secuencia de espacios en blanco —incluidos saltos de
línea— a un espacio, y recorta los extremos.

**`validarHomeContent`** recorre el esquema, **no la entrada**: construye un
objeto nuevo tomando de `input` solo las rutas que existen en
`DEFAULT_HOME_CONTENT`. Cualquier clave extra se ignora (R3.7) y nunca se hace
`{ ...input }`. Por cada string: normaliza, comprueba obligatorio (R3.1) y
máximo (R3.2). Comprueba las cardinalidades: frases 1–5 (R2.4), métricas 4
(R2.5), destacados 2, servicios exactamente los 5 ids (R2.6). Métricas:
`Number.isInteger(valor) && 0 <= valor <= 999_999` (R3.3). Devuelve **todos**
los errores, no solo el primero, para que el formulario los marque de una vez.

**`mezclarConDefaults`** nunca lanza ni rechaza. Campo por campo: si lo
guardado es un string no vacío tras normalizar, lo usa; si no, toma el de
fábrica (R6.3). Si un string guardado excede el máximo actual (porque se bajó
un límite después), **lo recorta** en vez de descartarlo. Arreglos:
`frases` → filtra las válidas, si queda vacío usa las de fábrica; `metricas` y
`destacados` → mezcla por índice contra los de fábrica, siempre devuelve la
cantidad fija. Así un campo nuevo añadido en el futuro aparece con su valor de
fábrica sin tocar lo guardado (R6.4).

### 4.2 `lib/home-content.ts` — servidor

```ts
import { cache } from 'react';

const CLAVE = 'home_content';

export const getHomeContent = cache(async (): Promise<HomeContent> => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: CLAVE } });
    if (setting?.value) return mezclarConDefaults(JSON.parse(setting.value));
  } catch (e) {
    console.error('[home-content] lectura fallida, se usan los textos de fábrica:', e);
  }
  return DEFAULT_HOME_CONTENT;
});

export async function saveHomeContent(c: HomeContent): Promise<void>  // upsert, igual que saveShippingConfig
```

- `cache()` de React deduplica dentro de un mismo request: `generateMetadata`,
  el `Navbar` y `Home` piden los textos, y sale **una sola consulta** (R6.5).
- Por el botón del menú (R8), **toda página con `Navbar`** hace ahora esa
  consulta: una búsqueda por clave primaria en `Setting`, una vez por request.
- A diferencia de `getShippingConfig`, el `catch` **sí registra** el error
  (R6.2): un home con textos de fábrica cuando hay textos guardados es un fallo
  que hay que poder ver en los logs de Hostinger.

*Al implementar:* `getHomeContent` se apoya en
`leerHomeContent(): { contenido, estado }`, que es lo que usa el panel. El
estado distingue dos fallos que la propuesta trataba igual:

| `estado` | Causa | Panel |
|---|---|---|
| `'ok'` | leído, o no hay nada guardado | normal |
| `'sin-conexion'` | la base no respondió | **bloquea Guardar**: lo guardado puede estar intacto, y mostrar los textos de fábrica como si fueran los vigentes haría que guardar un solo cambio pisara todo |
| `'danado'` | hay algo guardado pero no es JSON (p. ej. cortado por MySQL) | avisa y **deja guardar**: lo guardado ya se perdió y guardar es justamente cómo se repara |

### 4.3 `serviciosConTextos` — en `app/data/services.tsx`

`SERVICES` pierde `title`, `desc` y `cta`, y gana `id: ServicioId`. Conserva lo
que no es texto: `icon`, `iconColor`, `image`, `href`.

```ts
export function serviciosConTextos(textos: HomeContent['servicios']) {
  return SERVICES.map((s) => ({ ...s, ...textos[s.id] }));
  // → { id, icon, iconColor, image, href, titulo, descripcion, cta }
}
```

Lo usan `app/page.tsx` y `app/servicios/page.tsx`. En ambos la `key` del `map`
pasa de `s.title` a `s.id` (R7.2): con títulos editables, dos iguales
producirían claves duplicadas.

---

## 5. Panel — `app/admin/(panel)/inicio/`

| Archivo | Papel |
|---|---|
| `page.tsx` | `getHomeContent()` y renderiza el formulario con `initial` |
| `HomeContentForm.tsx` | cliente: edición, contadores, validación previa, restaurar |
| `actions.ts` | `requireAdmin()` + validar + tope de bytes + guardar + revalidar |

### 5.1 La acción

```ts
'use server';
export async function saveHomeContentAction(input: unknown): Promise<
  | { ok: true; contenido: HomeContent }             // lo que quedó guardado, ya normalizado
  | { ok: false; error: string; errores?: ErroresCampo }
> {
  await requireAdmin();                              // R1.2, copia de envios/actions.ts
  const r = validarHomeContent(input);               // R3.4: el servidor manda
  if (!r.ok) return { ok: false, error: 'Hay campos por corregir', errores: r.errores };

  if (bytesJson(r.value) > TOPE_BYTES)               // R3.6
    return { ok: false, error: 'El contenido es demasiado largo para guardarse' };

  try {
    await saveHomeContent(r.value);
  } catch (e) {
    console.error('[admin/inicio] no se pudo guardar:', e);
    return { ok: false, error: 'No se pudo guardar. Intenta de nuevo.' };   // R4.4
  }
  revalidatePath('/', 'layout');                     // R4.2, R4.3, R8.3: todo el sitio (§6.5)
  return { ok: true, contenido: r.value };
}
```

El parámetro es `unknown`, no `HomeContent`: una Server Action es un endpoint
público y su tipo TypeScript no protege nada en tiempo de ejecución.

### 5.2 El formulario

Estructura de la pantalla:

```
┌─ Cabecera ──────────────────────────────────────────────────────────┐
│ Textos del inicio                          [Restaurar todo] [Guardar] │
│ Índice: SEO · Hero · Servicios · Catálogo · Tienda · Clientes · …   │
├─ SEO ──────────────────────────────────── [Restaurar originales] ───┤
│ Título de la pestaña                                       42 / 70  │
│ [Cesgar | Impresión 3D Industrial en Bogotá                       ] │
│ …                                                                   │
├─ Hero ─────────────────────────────────── [Restaurar originales] ───┤
│ Título  [Precisión industrial a tu alcance           ]     33 / 60  │
│ Frases que rotan                                                    │
│  1 [Impresión 3D, diseño, escaneo y prototipado…  ] [🗑]   57 / 90  │
│  + Agregar frase  (máx. 5)                                          │
│ Métricas   [+][500][  ] Proyectos completados   × 4 filas fijas     │
├─ Servicios ─  ⓘ Estos textos también se ven en /servicios ──────────┤
│ …                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                     ┌─ Barra flotante (fixed, abajo a la derecha) ──┐
                     │ Cambios sin guardar               [Guardar]   │
                     │ ✓ Textos guardados · Ver el home ↗            │
                     └───────────────────────────────────────────────┘
```

*Al implementar:* la propuesta era una barra superior `sticky`. No funciona en
este panel: `AdminShell` pone `overflow-auto` en `<main>`, pero `<main>` crece
con el contenido y quien hace scroll es la ventana, y un `sticky` no se pega
fuera de un ancestro con `overflow`. En vez de cambiar el layout de todo el
panel, la cabecera queda normal y el estado («Cambios sin guardar», los avisos
y un segundo botón Guardar) va en una barra `fixed` que solo aparece cuando hay
algo que decir. La página lleva `pb-32` para que no tape los últimos campos.

- **Componentes de estilo**: los mismos `Card` (con `aside`, para el botón
  "Restaurar originales") y `Campo`, y la misma clase `inputCls`, que
  `envios/ShippingConfigForm.tsx`. Hoy ya hay dos copias divergentes:
  `cotizador/QuoterConfigForm.tsx` tiene su propio `Card` sin `aside` y su
  propio `inputCls`. Al ser la tercera pantalla, conviene moverlos a
  `app/admin/(panel)/_ui.tsx`; si se prefiere no tocar las otras pantallas en
  este cambio, se copian de envíos y se deja para después. *Al implementar:*
  se copiaron; extraerlos queda pendiente.
- **Campos**: `<input>` para todo lo de hasta 90 caracteres, `<textarea rows=3>`
  para descripciones y párrafos. Cada uno con su contador `n / máx` (R2.3), que
  se pone rojo al pasarse. El atributo `maxLength` **no** se usa: cortaría en
  silencio al pegar un texto largo; es mejor dejar escribir y marcar el error.
- **Validación previa**: al pulsar Guardar se corre `validarHomeContent` en el
  navegador. Si falla, no se llama a la acción: se marcan los campos y se hace
  scroll al primero con error. Si la acción devuelve `errores`, se marcan igual.
- **Etiquetas en lenguaje del negocio**, no claves: "Título de la pestaña del
  navegador" en vez de `seo.titulo`, con una pista debajo cuando ayude ("Lo que
  Google muestra como título del resultado").
- **Estado sucio** (R2.8): se compara `JSON.stringify(estado)` con el último
  valor guardado. Un `useEffect` registra `beforeunload` mientras haya cambios
  (R2.9).
- **Restaurar** (R5): por sección, reemplaza esa clave del estado por la de
  `DEFAULT_HOME_CONTENT`; "Restaurar todo" pide `confirm()` y reemplaza todo.
  Ninguno guarda.
- **Tras guardar** (R4.1): aviso verde "Textos guardados" con enlace
  `<a href="/" target="_blank">Ver el home</a>`, y el estado guardado pasa a ser
  el actual. Si falla (R4.4) el aviso es rojo y el formulario no se toca.

### 5.3 Menú

En el arreglo `NAV` de `AdminShell.tsx`, como **primera** entrada (es la página
que el visitante ve primero):

```ts
{ href: '/admin/inicio', icon: LayoutTemplate, label: 'Inicio' },
```

`LayoutTemplate` existe en el `lucide-react` instalado (verificado). `Home` ya
lo usa "Ver tienda".

---

## 6. Integración en el home

### 6.1 `app/page.tsx`

- `export const metadata` se reemplaza por `generateMetadata()`:

  ```ts
  export async function generateMetadata(): Promise<Metadata> {
    const { seo } = await getHomeContent();
    return {
      title: { absolute: seo.titulo },
      description: seo.descripcion,
      openGraph: { title: seo.titulo, description: seo.ogDescripcion,
                   url: 'https://cesgar.com.co', type: 'website' },
    };
  }
  ```

  `absolute` deja explícito que la plantilla `'%s | Cesgar'` de
  `app/layout.tsx:17` no se aplica. Hoy ya no se aplica (la plantilla solo
  afecta a segmentos hijos), pero con `absolute` no depende de esa regla.
- `const textos = await getHomeContent()` **fuera** del `try` de las consultas:
  si falla la consulta de productos no debe arrastrar los textos, y
  `getHomeContent` nunca lanza.
- Cada texto fijo se reemplaza por su campo (`textos.catalogo.titulo`, etc.).
  Los íconos, clases, `href` e imágenes no cambian.
- La tarjeta final de `ChromaGrid` toma `textos.proyectos.tarjetaFinal`.
- El `export const dynamic = 'force-dynamic'` se mantiene: el home ya consulta
  la base en cada request, así que un texto guardado se ve en la siguiente
  carga sin más (R4.2).

### 6.2 `app/components/HeroCarousel.tsx`

Recibe `textos: HomeContent['hero']` por props (es componente de cliente, no
puede leer la base). Desaparece la constante `METRICS`. La `key` de las
métricas pasa a ser el índice: son 4 fijas y la etiqueta ya no es única por
garantía.

`SplitText` incluye `text` en sus dependencias y `TextType` memoriza sobre
`text`, así que ambos aceptan texto dinámico sin cambios (R7.1).

### 6.3 `app/components/BlogSection.tsx`

Recibe `textos: HomeContent['blog']` junto a `posts`. Sin más cambios.

### 6.4 `app/servicios/page.tsx`

Llama a `getHomeContent()` y usa `serviciosConTextos`. Esta página **es
estática** (no declara `dynamic`), así que se genera en el build y se
regenera cuando la acción llama a `revalidatePath('/servicios')`. Eso funciona
en `next start`, que es como corre en Hostinger. Si en la verificación en
producción (tasks.md T9) no se refrescara, la salida es declarar
`export const dynamic = 'force-dynamic'` como el home.

### 6.5 Sobre `revalidatePath('/')`

Como `/` es `force-dynamic`, no hay caché de servidor que invalidar. La llamada
igual sirve: según `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`,
dentro de una Server Function también refresca la caché del router del
navegador, de modo que si el administrador navega al home desde el panel no ve
una versión vieja.

*Con la ampliación del menú (R8.3)* las tres llamadas se reemplazan por una
sola, `revalidatePath('/', 'layout')`: el botón está en 15 páginas, tres de
ellas estáticas (`/servicios`, `/sobre-nosotros`, el 404), y enumerarlas a mano
se rompería con la próxima página que use `Navbar`. Según la misma
documentación, esa forma invalida todo y vacía la caché del router; para una
acción que se usa de vez en cuando es el precio correcto.

### 6.6 `app/components/Navbar.tsx` — botón «Cotizar» (R8)

`Navbar` es componente de cliente (estado del scroll, la rotación, el carrito),
así que no puede leer la base. Las 15 páginas que lo usan son componentes de
servidor (verificado), lo que permite partirlo sin tocarlas:

| Archivo | Papel |
|---|---|
| `app/components/Navbar.tsx` | **pasa a ser de servidor**: `getHomeContent()` y renderiza `NavbarClient` con `menu.cta` |
| `app/components/NavbarClient.tsx` | el componente actual, renombrado con `git mv`; recibe `cta` por props |

Los imports `import Navbar from './components/Navbar'` siguen iguales.

En `NavbarClient`:

- Desaparecen `CTA_LABELS` y `CTA_LABELS_SHORT`; sus textos pasan a
  `DEFAULT_HOME_CONTENT.menu.cta` como pares.
- El índice se toma con módulo (`cta[i % cta.length]`): si una navegación
  trae menos pares que el índice actual, no se sale de la lista.
- Con un solo par no se arranca el intervalo (R8.4).
- La `key` de las etiquetas apiladas pasa de `label` al índice (R8.5).

---

## 7. Seguridad

- **XSS**: los textos se renderizan como hijos de JSX, que React escapa. Nada de
  esto pasa por `dangerouslySetInnerHTML`. La normalización (R3.5) además quita
  caracteres de control.
- **Autorización**: `proxy.ts` protege la página; `requireAdmin()` protege la
  acción, que es invocable directamente por POST.
- **Inyección de claves**: el validador construye el objeto desde el esquema
  (§4.1); un `__proto__` o un campo inventado no llega a la base.
- **Tamaño**: las Server Actions ya limitan el cuerpo a 1 MB por defecto; el
  tope propio de 60 000 bytes se aplica después.

---

## 8. Pruebas — `scripts/verify-home-content.ts`

Mismo molde que `scripts/verify-shipping.ts`; script `verify:home` en
`package.json` con las mismas opciones de `ts-node`. Importa solo los módulos
puros (`home-content-types`, `home-content-validate`).

| # | Caso | Criterio |
|---|---|---|
| 1 | `DEFAULT_HOME_CONTENT` pasa `validarHomeContent` sin errores | R6.1 |
| 2 | Cada string de fábrica cabe en su `LIMITES` | R6.1 |
| 3 | Campo obligatorio vacío o solo espacios → error en esa ruta | R3.1 |
| 4 | Un carácter sobre el máximo → error; justo en el máximo → pasa | R3.2 |
| 5 | Métrica negativa, decimal, `"500"` string o 1 000 000 → error | R3.3 |
| 6 | Saltos de línea, tabs y `\u0000` se normalizan | R3.5 |
| 7 | 0 frases y 6 frases → error; 1 y 5 → pasa | R2.4 |
| 8 | 3 o 5 métricas → error | R2.5 |
| 9 | Servicio faltante o id inventado → error | R2.6 |
| 10 | Clave extra y `__proto__` en la entrada no aparecen en la salida | R3.7 |
| 11 | Varios errores a la vez → se reportan todos | §4.1 |
| 12 | `mezclarConDefaults(null)`, `("x")`, `({})` → fábrica, sin lanzar | R6.2 |
| 13 | Guardado con un solo campo cambiado → ese campo nuevo, el resto de fábrica | R6.3, R6.4 |
| 14 | Guardado con campo de tipo incorrecto → ese campo de fábrica | R6.3 |
| 15 | Guardado más largo que un límite reducido → se recorta, no se descarta | §4.1 |
| 16 | Contenido al máximo en todos los campos con caracteres de 3 bytes → < 60 000 bytes | R3.6 |
| 17 | Botón del menú: 0 y 7 pares → error; 1 y 6 → pasa; un par sin texto corto → error en esa ruta | R8.1, R8.2 |
| 18 | Al leer, un par incompleto se descarta y los completos quedan; sin pares válidos → los de fábrica | R6.3 |

---

## 9. Límites conocidos

Ninguno bloquea; conviene aceptarlos explícitamente.

- **Gana el último que guarda.** Si dos personas editan a la vez, la segunda
  pisa a la primera sin aviso. Igual que cotizador y envíos hoy. Arreglarlo
  pide comparar `Setting.updatedAt` al guardar; no se justifica con uno o dos
  administradores.
- **Sin historial.** Un texto sobrescrito no se recupera, salvo volviendo al de
  fábrica. Si se necesita, el siguiente paso natural es guardar las últimas N
  versiones en otra clave de `Setting`.
- **`beforeunload` no cubre la navegación interna.** Ir a otra sección del
  panel por el menú lateral descarta los cambios sin preguntar. Cubrirlo exige
  interceptar los clics de `Link`, que Next no ofrece de forma oficial.
- **Los máximos son aproximados al diseño.** Respetarlos evita desbordes
  graves, pero un título de 60 caracteres puede ocupar tres líneas en móvil.
  Por eso existe "Ver el home" tras guardar.
- **No hay vista previa** antes de publicar: guardar es publicar.
- **Sesión vencida a mitad de edición.** No se guarda nada (el proxy corta la
  acción), pero el navegador no puede distinguir ese caso de un fallo de red:
  el aviso dice «No se pudo guardar. Si tu sesión venció, inicia sesión en otra
  pestaña…» y conserva lo escrito.
- **El título SEO afecta a Google**, que tarda días en reflejar el cambio. La
  pista bajo el campo debe decirlo.

---

## 10. Archivos

**Nuevos**

```
lib/home-content-types.ts                        tipos, SERVICIO_IDS, DEFAULT_HOME_CONTENT, LIMITES
lib/home-content-validate.ts                     validarHomeContent, mezclarConDefaults, normalizarTexto (puro)
lib/home-content.ts                              getHomeContent (cache) / saveHomeContent
app/admin/(panel)/inicio/page.tsx                panel
app/admin/(panel)/inicio/HomeContentForm.tsx     panel
app/admin/(panel)/inicio/actions.ts              panel
scripts/verify-home-content.ts                   pruebas
```

**Modificados**

```
app/page.tsx                          generateMetadata + textos desde getHomeContent
app/components/HeroCarousel.tsx       textos por props, sin METRICS
app/components/BlogSection.tsx        textos por props
app/data/services.tsx                 id por servicio, sin textos, serviciosConTextos()
app/servicios/page.tsx                usa serviciosConTextos, key por id
app/admin/(panel)/AdminShell.tsx      entrada "Inicio" en NAV
app/components/Navbar.tsx             pasa a ser de servidor: lee menu.cta (R8)
app/components/NavbarClient.tsx       el Navbar anterior, renombrado; cta por props (R8)
package.json                          script verify:home
```

**Opcional** (§5.2): `app/admin/(panel)/_ui.tsx` con `Card`, `Campo` e
`inputCls`, y que `envios/` y `cotizador/` los importen.
