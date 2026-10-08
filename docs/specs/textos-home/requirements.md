# Requisitos — Editar los textos del home desde el panel

Estado: **implementado, pendiente de desplegar**. Fecha: 2026-10-03.
Ampliación del mismo día: textos del botón «Cotizar» del menú superior (R8).
Documentos hermanos: [`design.md`](design.md) (cómo) · [`tasks.md`](tasks.md) (en qué orden).

---

## 1. Problema

Todos los textos de la página principal (`/`) están escritos a mano en el código,
repartidos en cuatro archivos:

| Archivo | Qué textos tiene |
|---|---|
| `app/page.tsx` | metadatos SEO, secciones tienda, catálogo, clientes, proyectos |
| `app/components/HeroCarousel.tsx` | título del hero, frases rotativas, 4 métricas |
| `app/data/services.tsx` | las 5 tarjetas de servicios (compartidas con `/servicios`) |
| `app/components/BlogSection.tsx` | encabezado del blog y tarjeta "ver todos" |

Cambiar una coma exige editar código, hacer build y desplegar a Hostinger. El
negocio no puede ajustar su propio mensaje (métricas, llamados a la acción,
temporadas) sin pasar por desarrollo.

## 2. Objetivo

Una pantalla nueva **`/admin/inicio`** donde un usuario con sesión del panel
edita los textos del home, guarda, y los ve publicados en `/` en la siguiente
carga, sin desplegar.

## 3. Alcance

### Dentro

Solo **texto plano** que hoy está fijo en el home. El inventario completo, campo
por campo, está en el §7.

- Metadatos SEO del home (título y descripciones).
- **Menú superior (todas las páginas):** los textos que rotan en el botón
  «Cotizar», en su versión larga (tablet y escritorio) y corta (celular).
- Hero: título, frases rotativas, las 4 métricas (número, prefijo, sufijo, etiqueta).
- Las 5 tarjetas de servicios: título, descripción, texto del botón.
- Sección catálogo: etiqueta, título, párrafo, los 2 destacados, botón.
- Sección tienda: miga de pan, título, subtítulo, enlaces y botones.
- Sección clientes: el título.
- Sección proyectos: etiqueta, título, subtítulo, tarjeta final "ver más".
- Sección blog: etiqueta, título, subtítulo, enlaces, tarjeta final "ver todos".

### Fuera (no-objetivos)

Cada uno de estos es razonable, pero tiene su propio diseño y no entra aquí:

- **Imágenes, videos, íconos y colores.** El video del hero, las imágenes de los
  servicios y el video del catálogo siguen en código.
- **Enlaces (`href`).** Un texto de botón se puede cambiar; a dónde lleva, no.
- **Agregar, quitar o reordenar secciones o tarjetas.** La cantidad de servicios
  (5) y de métricas (4) es fija: cada servicio tiene imagen, ícono y página
  propia, y la grilla de métricas es de 4 columnas.
- **Los logos de clientes.** Son SVG dibujados a mano con el nombre al lado;
  editar solo el nombre dejaría el ícono de otra empresa. Requiere gestión de
  imágenes.
- **El resto del menú superior y el Footer.** Los enlaces del menú (Inicio,
  Tienda…) y el pie de página no se editan. Del menú, solo los textos del botón
  «Cotizar» (R8).
- **Contenido que ya viene de la base:** productos, artículos y proyectos.
- **Texto enriquecido** (negritas, enlaces dentro del texto, saltos de línea).
- **Borradores, programación de publicación, historial de versiones e idiomas.**

---

## 4. Historias de usuario

**H1.** Como administrador, quiero ver en una sola pantalla todos los textos del
home agrupados por sección, en el mismo orden en que aparecen en la página, para
encontrar rápido el que quiero cambiar.

**H2.** Como administrador, quiero cambiar un texto, guardar y verlo publicado
en el home sin pedirle nada a desarrollo.

**H3.** Como administrador, quiero que el sistema me impida guardar algo que
rompa la página (un título vacío, un texto tan largo que desborda la tarjeta),
y que me diga exactamente qué campo está mal.

**H4.** Como administrador, quiero poder volver a los textos originales de una
sección, o de todo el home, si algo quedó mal.

**H5.** Como visitante, quiero que el home cargue siempre, aunque la
configuración de textos esté vacía, dañada o la base no responda.

**H6.** Como desarrollador, quiero que desplegar esta función no cambie nada de
lo que ve el visitante hasta que alguien edite un texto.

---

## 5. Criterios de aceptación

Formato EARS. Cada criterio es verificable y tiene id para trazarlo desde
`tasks.md`.

### R1 — Acceso

- **R1.1** La ruta `/admin/inicio` **debe** estar protegida igual que el resto
  del panel: sin sesión, `proxy.ts` redirige a `/admin/login`.
- **R1.2** La acción de guardar **debe** verificar la sesión por sí misma
  (`requireAdmin()`), sin confiar en que el proxy ya lo hizo.
- **R1.3** El menú lateral del panel **debe** mostrar una entrada "Inicio" que
  lleve a `/admin/inicio`.

### R2 — Edición

- **R2.1** La pantalla **debe** cargar con los textos vigentes: los guardados
  si existen, los originales si no.
- **R2.2** Los campos **deben** estar agrupados por sección, en el orden en que
  aparecen en el home: SEO, Menú, Hero, Servicios, Catálogo, Tienda, Clientes,
  Proyectos, Blog.
- **R2.3** Cada campo **debe** mostrar un contador `actual / máximo` de
  caracteres.
- **R2.4** Las frases rotativas del hero **deben** poder agregarse y quitarse,
  con un mínimo de 1 y un máximo de 5.
- **R2.5** Las métricas del hero **deben** ser exactamente 4; se editan, no se
  agregan ni se quitan.
- **R2.6** Los servicios **deben** ser exactamente 5, identificados por un
  nombre interno estable, no por su título.
- **R2.7** El grupo Servicios **debe** avisar que esos textos también se
  muestran en `/servicios`.
- **R2.8** **Mientras** el formulario tenga cambios sin guardar, la barra
  superior **debe** mostrar "Cambios sin guardar".
- **R2.9** **Si** el formulario tiene cambios sin guardar **y** el usuario
  recarga o cierra la pestaña, **entonces** el navegador **debe** pedir
  confirmación. (La navegación interna por el menú del panel no queda cubierta;
  ver `design.md` §9.)

### R3 — Validación

- **R3.1** **Si** un campo obligatorio queda vacío tras recortar espacios,
  **entonces** no se guarda nada y se señala ese campo.
- **R3.2** **Si** un campo supera su largo máximo, **entonces** no se guarda
  nada y se señala ese campo.
- **R3.3** Una métrica **debe** ser un entero entre 0 y 999 999.
- **R3.4** La misma validación **debe** correr en el navegador (para avisar
  antes de enviar) y en el servidor (para decidir). El servidor manda: lo que
  diga el navegador no cuenta.
- **R3.5** Los textos se guardan **como texto plano**: se recortan, los saltos
  de línea y espacios repetidos se reducen a un espacio, y se eliminan
  caracteres de control. Nunca se interpreta HTML.
- **R3.6** **Si** el contenido completo serializado supera **60 000 bytes**
  (UTF-8), **entonces** no se guarda. Ver `design.md` §3.3: la columna de
  producción es `TEXT` (65 535 bytes) y MySQL corta en silencio.
- **R3.7** El servidor **debe** ignorar cualquier campo que no esté en el
  esquema (no se guarda basura enviada a mano).

### R4 — Guardado y publicación

- **R4.1** **Cuando** el guardado tiene éxito, la pantalla **debe** mostrar
  "Textos guardados" y un enlace "Ver el home" que abre `/` en otra pestaña.
- **R4.2** **Cuando** el guardado tiene éxito, la siguiente carga de `/` **debe**
  mostrar los textos nuevos.
- **R4.3** **Cuando** el guardado tiene éxito, la siguiente carga de
  `/servicios` **debe** mostrar los textos nuevos de los servicios.
- **R4.4** **Si** el guardado falla, **entonces** la pantalla **debe** mostrar
  el error y conservar lo que el usuario escribió.

### R5 — Restaurar

- **R5.1** Cada sección **debe** tener "Restaurar originales", que devuelve esa
  sección del formulario a los textos de fábrica **sin guardar**.
- **R5.2** Debe existir "Restaurar todo" con el mismo comportamiento para el
  home completo, con confirmación previa.
- **R5.3** Restaurar solo cambia el formulario; publicar requiere guardar.

### R6 — Resiliencia del home público

- **R6.1** **Si** no hay nada guardado, el home **debe** verse exactamente igual
  que antes de esta función (textos de fábrica = textos actuales del código).
- **R6.2** **Si** el JSON guardado está corrupto o la base falla, el home
  **debe** renderizar con los textos de fábrica y registrar el error en el
  log, nunca mostrar una página de error.
- **R6.3** **Si** un campo guardado falta, está vacío o tiene un tipo
  incorrecto, ese campo — y solo ese — **debe** caer al texto de fábrica.
- **R6.4** **Si** se agrega un campo nuevo en una versión futura, las
  configuraciones ya guardadas **deben** seguir funcionando (el campo nuevo
  toma su valor de fábrica).
- **R6.5** Leer los textos **no debe** añadir más de una consulta a la base por
  carga del home.

### R7 — No regresión

- **R7.1** Las animaciones existentes (`SplitText` del título, `TextType` de las
  frases, `CountUp` de las métricas, `AnimateIn`) **deben** seguir funcionando
  con textos dinámicos.
- **R7.2** Dos servicios con el mismo título no **deben** producir claves de
  React duplicadas.

### R8 — Botón del menú superior

- **R8.1** Los textos del botón **deben** editarse como **pares**: un texto
  largo (pantallas desde 640 px) y uno corto (celular), que rotan juntos.
- **R8.2** Debe haber entre 1 y 6 pares; se pueden agregar y quitar.
- **R8.3** **Cuando** se guarda, toda página que muestra el menú **debe**
  mostrar los textos nuevos en su siguiente carga, también las estáticas
  (`/servicios`, `/sobre-nosotros`, la página de error 404).
- **R8.4** **Si** hay un solo par, el botón **no debe** rotar ni parpadear.
- **R8.5** Dos textos iguales no **deben** producir claves de React duplicadas.
- **R8.6** El grupo **debe** avisar que el botón se ve en todas las páginas, no
  solo en el inicio.

---

## 6. Decisiones pendientes

Tienen recomendación; se implementa la recomendación salvo que se diga lo
contrario.

1. **¿Solo rol `ADMIN` o cualquier sesión?** El esquema tiene roles `ADMIN` y
   `EDITOR`, pero ninguna pantalla del panel los distingue hoy.
   *Recomendado:* cualquier sesión, igual que `/admin/envios` y
   `/admin/cotizador`. Restringir por rol es un cambio transversal aparte.
2. **Servicios compartidos con `/servicios`.** *Recomendado:* una sola fuente;
   editar el título de "Escaneo 3D" lo cambia en ambas páginas (hoy ya es así
   en código). La alternativa —textos separados por página— duplica 15 campos.
3. **Nombre de la ruta.** *Recomendado:* `/admin/inicio`, en español como
   `/admin/envios` y `/admin/proyectos`.
4. **Dónde viven los textos del botón del menú.** El menú es de todo el sitio,
   no del home. *Decidido:* en la misma pantalla y el mismo `home_content`, para
   que haya un solo lugar donde editar textos; el grupo lo advierte (R8.6).

---

## 7. Inventario de textos

Esta tabla es la fuente de los **valores de fábrica**: cada uno debe copiarse
literal del código actual. Los máximos están pensados para el diseño actual
(el texto más largo de hoy cabe con holgura).

Líneas de `app/page.tsx` según el árbol de trabajo actual, que incluye la
tarjeta final de proyectos aún sin commit.

### SEO — `app/page.tsx:7-16`

| Clave | Texto actual | Máx. | Oblig. |
|---|---|---|---|
| `seo.titulo` | Cesgar \| Impresión 3D Industrial en Bogotá | 70 | sí |
| `seo.descripcion` | Impresión 3D industrial bajo demanda en Bogotá. Fabricamos repuestos, prototipos y piezas técnicas con FDM y resina. Cotiza en segundos. | 170 | sí |
| `seo.ogDescripcion` | Fabricamos repuestos, prototipos y piezas técnicas con FDM y resina. Cotiza en segundos. | 200 | sí |

### Menú — `app/components/Navbar.tsx:11-25`

| Par | Texto (≥ 640 px) | Texto corto (celular) |
|---|---|---|
| `menu.cta[0]` | Cotización Instantánea | ¡Cotizar! |
| `menu.cta[1]` | Sin tiempos de espera | Sin esperas |
| `menu.cta[2]` | Precio en segundos | Precio ya |
| `menu.cta[3]` | Cotiza sin registrarte | Sin cuenta |
| `menu.cta[4]` | ¡Empieza ahora! | ¡Ahora! |

Por par: `texto` máx. 24 · `textoCorto` máx. **11**, los dos obligatorios.
Entre 1 y 6 pares. El corto es estrecho a propósito: en celular el botón mide
96 px fijos y corta lo que sobra («Sin esperas», 11, cabe justo). El largo fija
el ancho del botón en escritorio; hoy el más largo tiene 22.

### Hero — `app/components/HeroCarousel.tsx`

| Clave | Texto actual | Máx. | Oblig. |
|---|---|---|---|
| `hero.titulo` (l. 36) | Precisión industrial a tu alcance | 60 | sí |
| `hero.frases[0]` (l. 51) | Impresión 3D, diseño, escaneo y prototipado de precisión. | 90 | sí |
| `hero.frases[1]` (l. 52) | Todo lo que necesitas para llevar tus ideas a la realidad. | 90 | — |
| `hero.frases[2]` (l. 53) | Fabricación industrial de precisión en Bogotá. | 90 | — |
| `hero.metricas[0]` (l. 8) | `+` 500 · Proyectos completados | — | sí |
| `hero.metricas[1]` (l. 9) | `+` 150 · Clientes satisfechos | — | sí |
| `hero.metricas[2]` (l. 10) | `+` 15 · Materiales disponibles | — | sí |
| `hero.metricas[3]` (l. 11) | 48 `h` · Tiempo de entrega | — | sí |

Cada métrica: `valor` entero 0–999 999 · `prefijo` máx. 3 · `sufijo` máx. 3 ·
`etiqueta` máx. 30, obligatoria.

### Servicios — `app/data/services.tsx`

| Id interno | Título | Botón |
|---|---|---|
| `cotizador` | Cotizar al instante | Subir STL y cotizar |
| `repuestos` | Repuestos para tus impresoras | Cotizar repuesto |
| `escaneo` | Escaneo 3D | Cotizar escaneo |
| `diseno` | Diseño 3D | Cotizar diseño |
| `prototipado` | Prototipado y fabricación | Cotizar fabricación |

Por servicio: `titulo` máx. 50 · `descripcion` máx. 220 · `cta` máx. 30. Los
tres obligatorios. Las descripciones actuales se copian literal del archivo.

### Catálogo — `app/page.tsx:165-190`

| Clave | Texto actual | Máx. | Oblig. |
|---|---|---|---|
| `catalogo.etiqueta` | Catálogo técnico especializado | 40 | sí |
| `catalogo.titulo` | Explora nuestra tienda técnica | 60 | sí |
| `catalogo.parrafo` | Desde boquillas de alta precisión hasta placas de control industriales… *(l. 171, literal)* | 400 | sí |
| `catalogo.destacados[0].titulo` | Partes mecánicas | 30 | sí |
| `catalogo.destacados[0].subtitulo` | Correas, poleas y extrusores | 50 | sí |
| `catalogo.destacados[1].titulo` | Electrónica | 30 | sí |
| `catalogo.destacados[1].subtitulo` | Drivers y placas de control | 50 | sí |
| `catalogo.boton` | VER CATÁLOGO COMPLETO | 30 | sí |

### Tienda — `app/page.tsx:205-262`

| Clave | Texto actual | Máx. | Oblig. |
|---|---|---|---|
| `tienda.migaPan` | Tienda | 30 | sí |
| `tienda.titulo` | Tienda | 40 | sí |
| `tienda.subtitulo` | Insumos industriales y electrónicos especializados. | 160 | sí |
| `tienda.enlaceVerTodos` | Ver todos los productos | 40 | sí |
| `tienda.botonTarjeta` | Ver producto | 20 | sí |
| `tienda.botonFinal` | Ir a la tienda completa | 40 | sí |

La palabra "Cesgar" de la miga de pan (l. 205) es la marca y no se edita.

### Clientes — `app/page.tsx:272`

| Clave | Texto actual | Máx. | Oblig. |
|---|---|---|---|
| `clientes.titulo` | Empresas e instituciones que confían en nosotros | 80 | sí |

### Proyectos — `app/page.tsx:305-332`

| Clave | Texto actual | Máx. | Oblig. |
|---|---|---|---|
| `proyectos.etiqueta` | Proyectos | 30 | sí |
| `proyectos.titulo` | Proyectos realizados | 60 | sí |
| `proyectos.subtitulo` | Casos reales de clientes resueltos con impresión 3D, escaneo e ingeniería a medida. | 200 | sí |
| `proyectos.tarjetaFinal.etiqueta` | Proyectos | 30 | sí |
| `proyectos.tarjetaFinal.titulo` | ¿Quieres ver más? | 50 | sí |
| `proyectos.tarjetaFinal.texto` | Explora todos los proyectos que hemos resuelto con impresión 3D, escaneo e ingeniería. | 160 | sí |
| `proyectos.tarjetaFinal.boton` | Ver todos los proyectos | 30 | sí |

### Blog — `app/components/BlogSection.tsx`

| Clave | Texto actual | Máx. | Oblig. |
|---|---|---|---|
| `blog.etiqueta` (l. 37) | Blog | 30 | sí |
| `blog.titulo` (l. 40) | Recursos y artículos | 60 | sí |
| `blog.subtitulo` (l. 43) | Conocimiento técnico sobre impresión 3D, materiales y fabricación digital. | 200 | sí |
| `blog.enlaceVerTodos` (l. 50) | Ver todos → | 30 | sí |
| `blog.enlaceArticulo` (l. 110) | Leer artículo → | 30 | sí |
| `blog.tarjetaFinal.etiqueta` (l. 129) | Blog | 30 | sí |
| `blog.tarjetaFinal.titulo` (l. 132) | ¿Quieres seguir leyendo? | 50 | sí |
| `blog.tarjetaFinal.texto` (l. 135) | Explora todos los artículos sobre impresión 3D, materiales y fabricación digital. | 160 | sí |
| `blog.tarjetaFinal.boton` (l. 138) | Ver todos los artículos | 30 | sí |

**Total: 79 campos** (3 SEO · 10 menú: 5 pares · 20 hero: título, 3 frases y
4 × 4 de métricas · 15 servicios · 8 catálogo · 6 tienda · 1 clientes ·
7 proyectos · 9 blog — sin contar las frases 4 y 5 ni el sexto par). Con todos los campos al máximo y cada
carácter en 3 bytes, el JSON ronda los 17 KB: los máximos por campo ya impiden
llegar al tope de 60 000 bytes. R3.6 es la última barrera por si algún día se
suben esos máximos.
