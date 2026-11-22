# Tareas — Editar los textos del home desde el panel

Estado: **todas las tareas hechas; desplegado en producción el 2026-10-03**. Fecha: 2026-10-03.
Documentos hermanos: [`requirements.md`](requirements.md) (qué) · [`design.md`](design.md) (cómo).

Cada tarea dice qué criterios cubre, qué archivos toca y cuándo está hecha. El
orden importa: hasta T5 incluida, **el sitio público no debe cambiar en nada**;
la función se vuelve visible recién en T8.

---

## T0 — Preparar la rama

- [x] Commitear o descartar los cambios pendientes de `app/page.tsx` y
      `components/ui/ChromaGrid.tsx` (tarjeta final "¿Quieres ver más?" en la
      grilla de proyectos). El inventario de `requirements.md` §7 ya cuenta con
      ellos.
- [x] Rama nueva: `feat/admin-textos-home`. *Hecho desde `fix/cotizador-volumen-real`, no
      desde `main`: esa rama tiene 9 commits sin fusionar (entre ellos el límite
      del blog y las portadas) de los que depende el home.*
- [x] Con `npm run dev` y la base local **sin** la clave `home_content`, guardar
      el texto visible de `/` y `/servicios` como referencia para T5:

      ```bash
      curl -s localhost:3000/          > /tmp/home-antes.html
      curl -s localhost:3000/servicios > /tmp/servicios-antes.html
      ```

**Hecho cuando:** la rama existe y los dos archivos de referencia están guardados.

---

## T1 — Tipos y textos de fábrica

`lib/home-content-types.ts` · design §3.2 · R6.1, R2.4–R2.6

- [x] `SERVICIO_IDS`, `ServicioId`, `MetricaHero`, `TextoServicio`,
      `TarjetaFinal`, `HomeContent`.
- [x] `DEFAULT_HOME_CONTENT` con **cada texto copiado literal** del código
      actual (inventario en requirements §7). Copiar, no reescribir: un acento
      o un punto distinto es una regresión visible.
- [x] `LIMITES` con la misma forma que `HomeContent`.

**Hecho cuando:** `npx tsc --noEmit` pasa.

---

## T2 — Validación y mezcla

`lib/home-content-validate.ts` · design §4.1 · R3.1–R3.7, R6.2–R6.4

- [x] `normalizarTexto`.
- [x] `validarHomeContent(input: unknown)`: construye desde el esquema, no
      desde la entrada; acumula **todos** los errores con su ruta
      (`"hero.frases.1"`).
- [x] `mezclarConDefaults(guardado: unknown)`: nunca lanza; campo por campo;
      recorta lo que exceda el límite actual.
- [x] El módulo no importa `prisma`, `react` ni nada de `next/*` (lo usa el
      script de pruebas con `ts-node`).

**Hecho cuando:** compila y se puede importar desde un script de Node.

---

## T3 — Pruebas

`scripts/verify-home-content.ts` + script `verify:home` en `package.json` ·
design §8

- [x] Los 16 casos de la tabla de design §8, con el formato PASS/FALLA de
      `scripts/verify-shipping.ts` y salida con código 1 si alguno falla.
- [x] `verify:home` copia las opciones de `ts-node` de `verify:envios`.

**Hecho cuando:** `npm run verify:home` pasa los 16 casos.

---

## T4 — Lectura y escritura en la base

`lib/home-content.ts` · design §4.2 · R6.2, R6.5

- [x] `getHomeContent` envuelto en `cache()` de React, con `console.error` en
      el `catch`.
- [x] `saveHomeContent` con `upsert` sobre `key: 'home_content'`.

**Hecho cuando:** compila. (Se ejercita en T5 y T6.)

---

## T5 — El home lee los textos de la base

design §4.3 y §6 · R4.2, R4.3, R6.1, R7.1, R7.2

- [x] `app/data/services.tsx`: `id` por servicio, quitar `title`/`desc`/`cta`,
      añadir `serviciosConTextos`.
- [x] `app/page.tsx`: `generateMetadata` con `title: { absolute }`;
      `getHomeContent()` fuera del `try`; reemplazar cada texto fijo; `key` de
      servicios por `s.id`; tarjeta final de proyectos desde
      `textos.proyectos.tarjetaFinal`.
- [x] `app/components/HeroCarousel.tsx`: prop `textos`, quitar `METRICS`,
      `key` por índice.
- [x] `app/components/BlogSection.tsx`: prop `textos`.
- [x] `app/servicios/page.tsx`: `serviciosConTextos`, `key` por `s.id`.

**Hecho cuando**, todavía sin nada guardado en `home_content`:

- [x] El texto visible de `/` y `/servicios` es idéntico al de T0. Comparar
      solo el texto, sin `<script>` ni etiquetas: el payload RSC sí cambia
      (ahora lleva los textos como props) y no es una regresión:

      ```bash
      solo_texto() { perl -0pe 's/<script\b.*?<\/script>//gs; s/<[^>]*>/\n/g' "$1" | grep -v '^[[:space:]]*$'; }
      curl -s localhost:3000/          > /tmp/home-despues.html
      curl -s localhost:3000/servicios > /tmp/servicios-despues.html
      diff <(solo_texto /tmp/home-antes.html)      <(solo_texto /tmp/home-despues.html)
      diff <(solo_texto /tmp/servicios-antes.html) <(solo_texto /tmp/servicios-despues.html)
      ```

      Ambos `diff` deben salir vacíos.

- [x] `<title>` y `<meta name="description">` del home son los mismos que antes.
- [x] El título del hero se anima letra por letra, las frases se escriben y
      borran, las métricas cuentan desde 0 (R7.1).
- [x] La consola del navegador no muestra avisos de claves duplicadas (R7.2).
- [x] Insertar a mano un `home_content` corrupto (`'{"hero":'`) → el home carga
      con los textos de fábrica y el log del servidor muestra el error (R6.2).
      Borrar la fila después.

---

## T6 — Acción de guardado

`app/admin/(panel)/inicio/actions.ts` · design §5.1 · R1.2, R3.4, R3.6, R4.3, R4.4

- [x] `requireAdmin()` copiado de `envios/actions.ts`.
- [x] Parámetro `unknown`; validación en el servidor; tope de 60 000 bytes con
      `Buffer.byteLength`.
- [x] `revalidatePath` de `/`, `/servicios` y `/admin/inicio`.
- [x] Errores de base: `console.error` y mensaje genérico al cliente.

**Hecho cuando:** compila. (Se ejercita en T9.)

---

## T7 — Formulario del panel

`app/admin/(panel)/inicio/page.tsx` + `HomeContentForm.tsx` · design §5.2 ·
R2.1–R2.9, R3.4, R4.1, R4.4, R5.1–R5.3

- [x] Decidir: extraer `Card`/`Campo`/`inputCls` a `app/admin/(panel)/_ui.tsx`
      o copiarlos de envíos (design §5.2). *Copiados.*
- [x] Cabecera con "Restaurar todo" y "Guardar", y barra flotante con
      "Cambios sin guardar", el aviso de resultado con "Ver el home" y otro
      "Guardar". *Flotante y no `sticky`: ver design §5.2.*
- [x] Índice con anclas a cada sección.
- [x] Una tarjeta por sección en el orden de R2.2, cada una con "Restaurar
      originales".
- [x] Contador `n / máx` por campo, en rojo al pasarse. Sin `maxLength`.
- [x] Frases: agregar (hasta 5) y quitar (mínimo 1). Métricas: 4 filas fijas
      con valor numérico, prefijo, sufijo y etiqueta.
- [x] Aviso en Servicios: "Estos textos también se muestran en /servicios".
- [x] Pista en el título SEO sobre la demora de Google.
- [x] Validación previa con `validarHomeContent`; marcar campos y hacer scroll
      al primer error; mostrar también los `errores` que devuelva la acción.
- [x] `beforeunload` solo mientras haya cambios sin guardar.

**Hecho cuando:** la pantalla se ve y se usa bien en escritorio y a 375 px de
ancho, sin scroll horizontal.

---

## T8 — Entrada en el menú

`app/admin/(panel)/AdminShell.tsx` · design §5.3 · R1.3

- [x] `{ href: '/admin/inicio', icon: LayoutTemplate, label: 'Inicio' }` como
      primera entrada de `NAV`.

**Hecho cuando:** el enlace aparece en el menú lateral y en el menú móvil.

---

## T9 — Verificación completa en local

- [x] `npm run lint`, `npx tsc --noEmit`, `npm run verify:home`,
      `npm run verify:schemas`, `npm run build` — todo en verde. *Se corrió
      `npx next build` en vez de `npm run build` para no regenerar el cliente de
      Prisma con un `next dev` abierto. `npm run lint` **no** sale en verde: el
      proyecto ya tenía 37 errores en otros archivos. De los archivos de este
      cambio, solo `app/page.tsx` marca algo, y son los 3 `no-explicit-any` que
      ya tenía antes.*
- [x] Sin sesión, `/admin/inicio` redirige a `/admin/login` (R1.1).
- [x] La pantalla carga con los textos de fábrica (R2.1).
- [x] Cambiar un texto de cada sección, guardar, recargar `/`: se ven los
      nuevos (R4.2). `/servicios` también, con `npm run build && npm start`
      — en `dev` no se nota la diferencia entre estática y dinámica (R4.3).
- [x] Vaciar un campo obligatorio → no guarda y marca el campo (R3.1).
- [x] Pegar 500 caracteres en un título → no guarda y marca el campo (R3.2).
- [x] Métrica `-1` o `12.5` → no guarda (R3.3).
- [x] Pegar texto con saltos de línea → se guarda en una sola línea (R3.5).
- [x] Escribir `<b>hola</b>` → el home muestra literalmente `<b>hola</b>`.
- [x] Llamar a la acción sin sesión (por ejemplo, desde otra ventana tras
      cerrar sesión) → redirige a login y no guarda (R1.2).
- [x] "Restaurar originales" de una sección y "Restaurar todo" → cambian el
      formulario, no el home, hasta guardar (R5).
- [x] Recargar con cambios sin guardar → el navegador pregunta (R2.9).

---

## T11 — Textos del botón del menú (ampliación)

requirements R8 · design §3.2, §6.5, §6.6, §8 · va antes del despliegue

- [x] `lib/home-content-types.ts`: `TextoCta`, `menu` en `HomeContent` (después
      de `seo`), `CTA_MIN`/`CTA_MAX`, `LIMITES.menu`, los 5 pares de fábrica
      copiados literal de `Navbar.tsx`.
- [x] `lib/home-content-validate.ts`: `menu` en el recorrido, estricto (1–6
      pares, los dos textos obligatorios) y tolerante (descarta pares
      incompletos).
- [x] `scripts/verify-home-content.ts`: casos 17 y 18; `menu` en el recorrido
      de límites.
- [x] `git mv app/components/Navbar.tsx app/components/NavbarClient.tsx`; nuevo
      `Navbar.tsx` de servidor.
- [x] `NavbarClient`: `cta` por props, módulo en el índice, sin intervalo con un
      par, `key` por índice.
- [x] Acción: `revalidatePath('/', 'layout')` en vez de las tres rutas.
- [x] Panel: grupo «Menú» después de SEO, con pares que se agregan y quitan y el
      aviso de que se ve en todas las páginas.

**Hecho cuando:**

- [x] Sin nada guardado, el texto visible de `/` y `/servicios` sigue idéntico
      al de T0.
- [x] `npm run verify:home` y `npx tsc --noEmit` pasan.
- [x] Guardar un par nuevo → aparece en el botón de `/` y de una página dinámica
      (`/tienda`) en `next dev`, y de `/sobre-nosotros` (estática) con
      `next start`. *También en `/servicios` y en la 404, las otras dos
      estáticas.*
- [x] Con un solo par, el botón no rota.
- [x] La prueba de interfaz completa sigue pasando.

---

## T10 — Despliegue

No hay cambios de esquema, así que no depende del `db push`.

- [x] ~~Zip con el `.env` de producción dentro~~. *Cambiado: ese zip quedaba
      descargable en public_html. Las variables se cargaron en Hostinger y el zip
      va sin secretos; se borra tras el deploy. Además la build pasó a webpack
      porque Turbopack ya no compila en Hostinger. Detalle en la memoria del
      proyecto y en el registro de abajo.*
- [x] Antes de editar nada en producción: `/` y `/servicios` se ven igual que
      antes del despliegue (R6.1).
- [x] Cambiar un texto del hero y uno de un servicio en `/admin/inicio` →
      se ven en `/` **y** en `/servicios` en la siguiente carga. Si
      `/servicios` no se refresca, aplicar la salida de design §6.4 y
      redesplegar.
- [x] Devolver ambos textos a su valor original (o dejar los que el negocio
      quiera).

---

## Registro de verificación (2026-10-03, local)

- `verify:home` 16/16 grupos; `verify:envios`, `verify:cotizador`,
  `verify:youtube`, `verify:schemas` siguen en verde.
- Sin nada guardado, el texto visible de `/` y `/servicios` y sus metadatos son
  idénticos a los de antes del cambio.
- La acción, llamada por POST directo: sin sesión → el proxy redirige y no se
  guarda; datos inválidos → errores por campo, sin guardar; claves extra y
  `__proto__` → descartadas.
- Prueba de interfaz con Chrome sin cabeza (37 comprobaciones): validación,
  guardado, normalización, frases, métricas, restaurar, `beforeunload`, barra
  flotante, home y `/servicios` actualizados, animaciones, sin claves
  duplicadas ni errores en consola, 375 px sin scroll horizontal, sesión
  vencida sin guardar.
- Con `next start`: `/servicios` (estática) se regenera tras guardar; un JSON
  dañado deja el home en 200 con los textos de fábrica, se registra en el log
  y el panel lo avisa; una sola lectura por request.

### Ampliación T11 (botón del menú)

- `verify:home` 18/18 grupos (casos 17 y 18 nuevos).
- Los 10 textos de fábrica coinciden literal con el `Navbar.tsx` anterior.
- Sin nada guardado, el texto del botón en `/` y `/servicios` no cambia; las
  15 páginas con menú responden (la 404 con 404).
- Prueba de interfaz: 47 comprobaciones, incluidos editar y agregar pares,
  máximo de 6, texto corto de 12 rechazado, botón nuevo en `/`, `/servicios` y
  `/tienda`, y con un solo par el botón no cambia ni parpadea en 4,5 s.
- Con `next start`: tras guardar, `/sobre-nosotros`, `/servicios` y la 404
  (estáticas) muestran el botón nuevo; el home sigue haciendo una sola lectura
  por request con `generateMetadata`, `Navbar` y la página pidiendo los textos.
- Una configuración guardada antes de existir `menu` se lee bien: el botón toma
  los textos de fábrica y el resto lo guardado (R6.4).

### T10 — Despliegue (2026-10-03)

- Build `01a10501` en Hostinger: webpack, Node 20, completada y publicada.
- Producción: todas las rutas responden; el home muestra los textos de fábrica
  (no hay `home_content` en MySQL), la tarjeta «¿Quieres ver más?» y el botón
  del menú; `/admin/inicio` existe y pide sesión; la app lee MySQL con las
  variables de Hostinger.
- Pendiente fuera de esta spec: rotar las credenciales expuestas; páginas
  estáticas que leen la base durante el prerender (ver memoria del proyecto).
