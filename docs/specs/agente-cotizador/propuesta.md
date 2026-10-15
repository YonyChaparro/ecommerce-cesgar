# Propuesta — Asistente de IA en el cotizador

Estado: **propuesta, con decisiones pendientes** (ver §15). Fecha: 2026-10-03;
actualizada el 2026-10-15 con las vistas y su implementación en React.
Este documento recoge la idea de implementación acordada hasta ahora. La interfaz
toma como referencia las vistas de `Cesgar — Asistente del cotizador.html` (§5) y
se construye con componentes React modulares (§6). Cuando se cierren las
decisiones pendientes se parte en `requirements.md`, `design.md` y `tasks.md`,
con el mismo formato que `docs/specs/textos-home/`.

---

## 1. Objetivo

Dar acompañamiento personalizado a los clientes que llegan a `/cotizador` **sin
un modelo 3D**. Un agente de IA conversa con ellos, les recomienda material y
tecnología, les da precios reales del sistema de cotización automática y, con
su confirmación, agrega al carrito lo que se pueda comprar.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Proveedor de IA | **OpenRouter**, con modelo variable configurable (no se casa con un proveedor) |
| Acciones del agente | Propone configuraciones **y puede agregar al carrito, siempre con confirmación del cliente** |
| Datos personales | **El agente no pide datos.** Nombre, correo, dirección, etc. se piden solo en la pasarela de pagos |
| Ubicación | Dentro de la ruta `/cotizador` |
| Entrada | Al entrar a `/cotizador` el cliente elige entre dos tarjetas grandes: **"Tengo mi archivo"** → cotizador actual · **"Asistente con IA"** → chat. Con el asistente apagado, la segunda pasa a ser **"No tengo modelo"** → cotización personalizada |
| Interfaz | Las vistas de `Cesgar — Asistente del cotizador.html` son la **referencia** de estructura, textos y estados (§5). Se implementan como componentes React modulares, con los tokens y componentes del sitio; su HTML no se copia (§6) |
| Derivación a asesor | **WhatsApp** con el mensaje ya escrito: el cliente lo revisa y decide si lo envía. No se pide ningún dato (vista 4) |
| Precio sin archivo | **Rango orientativo** rotulado "Estimación · no se puede pagar", con botón para subir el STL (vista 4). Falta calibrar el supuesto (§15) |

## 3. Principios que hereda del código existente

1. **La IA conversa, pero no calcula precios.** Cada precio sale de las mismas
   funciones puras que usan la UI y el checkout: `calcCost`
   (`lib/quoter-calc.ts`), `buildVerifiedConfig` y `effectiveInfill`
   (`lib/quoter-rules.ts`). El precio que dice el agente es el que muestra la UI
   y el que cobra MercadoPago.
2. **El servidor decide.** `/api/checkout` y `/api/checkout/cotizador` vuelven a
   verificar todo (precio de productos contra la BD, STL vuelto a medir desde
   Cloudinary). Aunque alguien manipule el chat, no puede pagar menos.
3. **La configuración editable vive en `Setting` como JSON**, con un módulo
   `get*/save*` que mezcla lo guardado con valores por defecto (precedente:
   `lib/quoter-config.ts`, `lib/shipping-config.ts`).
4. **Las pruebas son scripts ejecutables** con el formato PASS/FALLA de los
   `verify:*` actuales.

---

## 4. Rutas

| Ruta | Contenido | Vista |
|---|---|---|
| `/cotizador` | Selector con las dos tarjetas | 1 |
| `/cotizador/modelo` | El cotizador actual (`Quoter`) + sección "Cotización personalizada" | — (conserva su diseño) |
| `/cotizador/asistente` | Chat con el agente | 2 a 5 |
| `/admin/asistente` | Configuración del asistente | 6 |
| `/admin/asistente/conversaciones` *(fase 2)* | Conversaciones y costos | 7 |

- Se usan subrutas en vez de cambiar de pantalla con estado: el botón "atrás"
  funciona, cada camino se mide por separado y el código del chat solo se carga
  en su ruta.
- Todos los enlaces actuales a `/cotizador` (Navbar, Footer, home, servicios,
  sobre-nosotros) caen en el selector sin cambios.
- Hay que agregar las subrutas públicas a `app/sitemap.ts`.
- La sección `#cotizacion-personalizada` (`app/cotizador/page.tsx`, enlazada
  desde `app/components/Quoter.tsx:824`) se mueve junto con el cotizador a
  `/cotizador/modelo`. Los enlaces de las vistas a la cotización personalizada
  apuntan a `/cotizador/modelo#cotizacion-personalizada`.
- `QuoteRequestForm` importa `@/app/cotizador/actions`: se conserva esa ruta o
  se actualiza la importación.
- `saveQuoterPricingAction` (`app/admin/(panel)/cotizador/actions.ts`) revalida
  `/cotizador`; hay que sumarle `/cotizador/modelo`.
- Si el asistente está apagado desde el admin: la tarjeta cambia (vista 1),
  `/cotizador/asistente` redirige a `/cotizador` y el endpoint del chat responde
  503.
- `AdminShell` suma "Asistente" a `NAV`, justo después de "Cotizador". `proxy.ts`
  ya protege `/admin/asistente` (`/admin/:path*`).

## 5. Vistas

`Cesgar — Asistente del cotizador.html` (raíz del repo) trae 7 tableros de
escritorio a 1440 px. Se abre en el navegador y necesita JavaScript. Las vistas 3
y 6 tienen estado (confirmar o no agregar; interruptor y elección de modelo).

Las vistas son una **referencia**: de ellas se toman estructura, jerarquía,
textos, estados y comportamiento. Su código no se copia; la interfaz se escribe
en React con los componentes y tokens del sitio (§6).

- Los precios de las vistas 3 y 4 salen de `calcCost` con las tarifas por
  defecto (`DEFAULT_QUOTER_PRICING`): sirven como casos de prueba (§14).
- Los modelos, cifras y conversaciones de las vistas 6 y 7 son de ejemplo.
- Las cifras van en formato es-CO: `$10.983`, `42,6 cm³`, `1.000`.

### 5.1 Lenguaje visual

- Es el mismo sitio: Navbar actual, Noto Sans, azul `inverse-surface`
  (`#16234d`) y `primary-container` (`#4dbdcc`). El selector y el chat son **claros**, a
  diferencia del `/cotizador` actual, que es azul oscuro. `/cotizador/modelo`
  conserva su diseño: las vistas no lo cubren.
- Lo que es IA lleva un degradado cónico que gira (`#4dbdcc`, `#7c6cf0`,
  `#38bdf8`, `#c084fc`): borde de la tarjeta del asistente y de la caja de texto,
  orbe del avatar y un **aura** difuminada detrás.
- **Regla del aura** (vista 5): marca lo que está haciendo la IA o lo que espera
  una decisión del cliente. La llevan la tarjeta "Asistente con IA", la caja de
  texto, el orbe mientras responde, la confirmación pendiente y la tarjeta de
  asesor. Se quita al confirmar o rechazar, y no aparece con el asistente apagado.
- Los colores nuevos van como tokens en `app/globals.css`, no sueltos en los
  componentes (§6.2).
- Las animaciones se apagan con `prefers-reduced-motion` (las vistas ya traen la
  regla). Se conservan los `aria-label` y roles de las vistas: enviar, adjuntar,
  carrito, "El asistente está escribiendo", `role="switch"` del interruptor y
  `radiogroup` de modelos.

### 5.2 Vista 1 · `/cotizador` — Selector de camino

- Encabezado: "Cotizador de impresión 3D" · "¿Cómo quieres cotizar tu pieza?".
- **"Tengo mi archivo"** (camino rápido): dibujo de zona de arrastre, "Sube tu
  STL y obtén el precio al instante", tres ventajas y "Subir mi STL". Toda la
  tarjeta enlaza a `/cotizador/modelo` (decisión 5, §15).
- **"Asistente con IA"** (insignia "Nuevo", borde y aura): mini conversación de
  ejemplo, "¿Solo tienes una idea? Cuéntasela al asistente", tres ventajas,
  "Hablar con el asistente" y "No te pedimos datos personales en el chat".
  Enlaza a `/cotizador/asistente`.
- **Asistente apagado:** en su lugar va "No tengo modelo · Te ayudamos con una
  cotización personalizada · Solicitar cotización", sin aura, hacia la
  cotización personalizada. La página lee `AsistenteConfig.activo` en el
  servidor.
- Tabla "¿Cuál elijo?" (qué necesitas, quién decide, qué obtienes). Con el
  asistente apagado se oculta, porque su tercera columna es el asistente *(la
  vista no muestra ese caso)*. Su texto "Una idea, una foto o las medidas
  aproximadas" promete fotos, que llegan en la fase 3 (decisión 7, §15).
- "¿Necesitas diseño 3D, escaneo o piezas de más de 30 cm? Solicita una
  cotización personalizada" y, al pie, las cuatro ventajas que hoy están en
  `app/cotizador/page.tsx`.

### 5.3 Vista 2 · `/cotizador/asistente` — Inicio del chat

- Barra superior: "← Cotizador" (a `/cotizador`) y "Nueva conversación".
- Orbe con aura, "¿Qué pieza necesitas?" y la promesa: recomendación, precios
  reales y "nada entra a tu carrito sin que lo confirmes".
- Caja de texto con un ejemplo en el placeholder, "Adjuntar STL", contador
  `0 / 1.000` (tope de `maxCaracteresMensaje`) y enviar.
- "O empieza con una de estas": cuatro sugerencias que se envían como primer
  mensaje del cliente ("¿Qué material aguanta humedad y peso?", "Tengo una idea,
  pero no el archivo", "Repuestos para mi impresora 3D", "Pieza de más de 30 cm").
- Pie: "¿Ya tienes el STL? Ir al cotizador" (`/cotizador/modelo`), "Hablar con
  una persona" (§10.3) y "No compartas datos personales en el chat".
- El chat es una columna angosta: 760 px en la vista, `max-w-3xl` (768 px) en
  Tailwind.

### 5.4 Vista 3 · Cotizar STL y confirmar carrito

Recorrido: el cliente describe el uso, el agente recomienda material, el cliente
sube el STL, el agente cotiza y compara, y el cliente confirma.

- Barra superior: se suma una píldora de carrito ("Carrito vacío" o "Carrito ·
  1 ítem · $43.932"). La píldora y "Ver carrito" abren el `CartDrawer`.
- Mensajes del cliente a la derecha. Un adjunto se ve como ficha con nombre,
  tamaño y estado ("1,2 MB · subido").
- Mensajes del agente con el orbe como avatar. Arriba, una **ficha por tool
  usada** ("Consultó los materiales disponibles", "Midió tu archivo", "Comparó 3
  opciones"); debajo, texto y tarjetas en el orden en que llegan. Las fichas de
  cada tool están en §9.
- **Tarjetas de material** (`mostrar_materiales`): nombre, "Recomendado",
  tecnología, descripción (`MaterialConfig.desc`), ventajas y límites para ese
  uso, y colores (de `COLORES`; "13 colores disponibles" cuando son muchos).
- **Tarjeta de cotización** (`cotizar_archivo`): archivo, "Cotización Q-7F3K ·
  medido en el servidor", configuración ("FDM · PETG Negro · Capa 0,2 mm ·
  Relleno 40 %"), medidas, volumen, peso y tiempo **por unidad** (`calcCost`
  devuelve `weightG` y `timeH` ya multiplicados por la cantidad).
- Si en el mismo mensaje se llamó `comparar_opciones`, la tabla va dentro de esa
  tarjeta: opción, unidades, precio c/u con su descuento por cantidad y total; la
  fila cotizada lleva "Tu elección". Nota: "El descuento por cantidad ya está
  aplicado. No incluye envío." Si llega en otro mensaje, va como tarjeta propia
  con el encabezado de la cotización.
- **Tarjeta de confirmación** (`agregar_al_carrito`, §10.1): "¿Agregar al
  carrito?", ítem, configuración, "4 × $10.983" y total; "Confirmar y agregar" /
  "No agregar"; "Datos de la cotización Q-7F3K. El precio se vuelve a verificar
  al pagar." Después el agente sigue según lo elegido ("Listo, los 4 soportes
  quedaron en tu carrito…" / "Sin problema, no agregué nada…").
- Al final: caja de texto, "Hablar con una persona" y "No compartas datos
  personales; solo se piden al pagar."

### 5.5 Vista 4 · Sin archivo, tienda y asesor

- **Tarjeta de estimación** (`estimar_rango`): "Estimación · no se puede pagar",
  "Entre $10.600 y $18.300 por unidad, en PLA", el supuesto en una línea (caja,
  tecnología, material, capa, relleno y "entre el 25 % y el 45 % de esa caja") y
  "Para el precio exacto y poder comprar, necesitamos el archivo STL" con "Subir
  STL", que abre el selector de archivos del chat. No tiene botón de carrito.
- **Lista de productos** (`buscar_productos`): foto, nombre, precio, "En stock"
  y un botón "+" por producto (§10.2).
- **Tarjeta de asesor** (`derivar_a_asesor`, §10.3): "Te abrimos WhatsApp con
  este mensaje. Tú decides si lo envías.", vista previa del mensaje, "Continuar
  en WhatsApp" / "Seguir en el chat" y "No te pedimos ningún dato para
  continuar". El mensaje resume todo lo pendiente de la conversación,
  estimaciones incluidas.

### 5.6 Vista 5 · Estados y avisos

| Grupo | Estado | Cuándo |
|---|---|---|
| Subida de STL | "Subiendo… 64 %", con barra y cancelar | Subida en curso. Necesita `XMLHttpRequest`: `fetch` no informa el progreso de subida |
| | "Midiendo volumen y medidas…" | El servidor mide la malla (§8) |
| | "84 × 40 × 62 mm · 42,6 cm³" | Medición lista |
| | "No es un archivo STL" | El archivo no se pudo leer |
| | "Pieza hueca": relleno fijo en 100 %, ya incluido en el precio | `effectiveInfill` impone `LOCKED_INFILL` (geometría `hollow` o `thin`) |
| | "Mide más de 30 cm" + "Hablar con un asesor" | `checkOversize` |
| | "No pudimos medir el volumen con seguridad" | `STLData.volumeUnreliable` |
| Carrito | Pendiente (con aura) · Confirmado ("Agregado a tu carrito · Ver carrito") · Rechazado ("No se agregó nada a tu carrito.") | §10.1 |
| | "El precio cambió" | §10.1 |
| Respuesta | Tres puntos ("El asistente está escribiendo") | Antes del primer texto |
| | "Calculando precio…", "Buscando en la tienda…", "Midiendo tu archivo…" | Tool en curso |
| Errores y topes | "No pude responder esta vez." + "Reintentar" | Falló el modelo (con sus respaldos) o la red |
| | "Un momento · Estás enviando mensajes muy rápido…" | Límite por IP (HTTP 429) |
| | "Te quedan 3 mensajes en esta conversación." | Faltan 3 turnos o menos para `maxTurnos` |
| | "Llegaste al máximo de mensajes…" + "Hablar con un asesor" / "Empezar otra" | Se llegó a `maxTurnos`: la caja se bloquea y lo de arriba sigue visible |
| | "Acorta tu mensaje para enviarlo. 1.084 / 1.000" | Mensaje sobre `maxCaracteresMensaje`; enviar se desactiva |
| Asistente apagado | Tarjeta "No tengo modelo", sin aura | `AsistenteConfig.activo = false` |

No están en las vistas y se resuelven con el mismo estilo de aviso: archivo de
más de 50 MB (tope de `/api/stl-upload`), producto agotado o con otro precio al
confirmar, y la variante laminar (`thin`) del aviso de pieza hueca (el cotizador
la llama "Lámina / Tapa").

### 5.7 Vista 6 · `/admin/asistente` — Configuración

- "Asistente de IA" con "Descartar" y "Guardar cambios", y pestañas
  "Configuración" / "Conversaciones y costos (fase 2)".
- **"Asistente activo"**: interruptor con su estado ("Visible en /cotizador" /
  "Apagado") y el aviso de que, apagado, la tarjeta lleva a la cotización
  personalizada.
- **Modelo principal**: buscador sobre los modelos de OpenRouter que soportan
  tools. Cada fila: id, proveedor y contexto, estado de validación ("Aprobado
  10/10", "Falló 1 de 10", "Sin validar") y una nota (costo por conversación o
  motivo del fallo). Los no aprobados se ven, pero no se pueden elegir.
- **Respaldos**: lista ordenada, solo con modelos aprobados, con quitar y
  "Agregar respaldo".
- **Topes por conversación**: máx. turnos (30) y máx. caracteres por mensaje
  (1.000), con el recordatorio de que el tope de gasto vive en la key de
  OpenRouter y el límite por IP en el servidor.
- **Validación por modelo** (`npm run verify:agente`): tabla situación × modelo,
  "10 situaciones · última ejecución …" y "Ver reporte completo". De dónde salen
  esos datos: decisión 6 (§15).

### 5.8 Vista 7 · `/admin/asistente/conversaciones` — Fase 2

- Periodo (últimos 30 días, últimos 7 días, este mes) y "Exportar CSV".
- Indicadores: conversaciones, llegaron al carrito, órdenes pagadas (chat →
  pago), derivadas a asesor y costo de IA (total y por conversación).
- Tabla paginada, con filtros por id, resultado y modelo: id, inicio, modelo
  ("respaldo de …" si respondió un respaldo), turnos, tokens de entrada y
  salida, costo, resultado (Carrito, Derivado, Abandonado) y orden ("#1043 ·
  pagada", "Sin pagar" o "—").
- "Costo por modelo": conversaciones, costo total, costo por conversación y % que
  llegó al carrito, separando principal y respaldo.
- Detalle: datos de la conversación, **recorrido** (mensajes del cliente y tools
  con su resumen), "Ver transcripción completa" y "Conversación anónima, sin
  datos personales. Se borra automáticamente a los 90 días."
- Todo sale de `ChatSession`, `ChatQuote` y `Order` (§14).

### 5.9 Móvil

Las vistas son de escritorio. En móvil las tarjetas del selector se apilan, la
tabla "¿Cuál elijo?" pasa a una columna por debajo de `sm` (640 px, el mismo
corte que trae la vista) y el chat ocupa todo el ancho, con la caja de texto
fija abajo.

---

## 6. Implementación en React

Las vistas no se traducen etiqueta por etiqueta. El HTML exportado trae estilos
en línea, colores sueltos, íconos dibujados a mano y el runtime de la maqueta
(`<x-dc>`, `sc-if`, `sc-for`, `DCLogic`), y nada de eso pasa al código. Se toma
lo que la vista decide (estructura, textos, estados y comportamiento) y se arma
con los componentes y tokens del sitio.

### 6.1 Reglas

1. **Un componente por pieza, no por vista.** Un archivo por componente, con
   nombre de dominio (`TarjetaCotizacion`, `FichaTool`). Cada pantalla compone
   piezas que se reutilizan: la tarjeta de confirmación sale en las vistas 3 y
   5, y un mismo `Aviso` cubre todos los avisos de la vista 5. Un archivo que
   pase de unas 200 líneas se parte; `Quoter.tsx` (866 líneas) es justo lo que
   se evita.
2. **Servidor por defecto.** Los `page.tsx` leen configuración y datos en el
   servidor, y `'use client'` va solo en las hojas con estado o eventos. El
   selector entero es de servidor: sus animaciones son CSS.
3. **Presentación separada del estado.** Tarjetas y avisos reciben todo por
   props y no llaman a la red; el estado vive en hooks (`useAsistente`,
   `useSubidaStl`, `useItemVigente`). Así cada estado de la vista 5 se puede
   pintar con datos de ejemplo, sin abrir una conversación.
4. **Lógica pura en `lib/`, sin React:** formato de cifras, ítem del carrito,
   mensaje de WhatsApp, rango sin archivo y códigos `Q-`/`E-`. La comparten
   navegador y servidor, como hoy `lib/quoter-rules.ts`, y se prueba con los
   scripts `verify:*`.
5. **Un contrato por tool.** La entrada y la salida de cada tool se definen una
   vez con zod, en un archivo sin código de servidor. El servidor valida con ese
   esquema y las tarjetas usan el tipo inferido: si cambia un campo, la
   compilación falla en los dos lados. El código de servidor lleva
   `import 'server-only'`.
6. **Tokens, no valores sueltos.** Tailwind con los tokens de `app/globals.css`
   (el azul `#16234d` ya es `inverse-surface`; `#4dbdcc`, `primary-container`).
   Sin `style={{…}}` salvo valores que cambian en vivo, como el ancho de la
   barra de subida, y sin colores hex en los componentes. Las medidas salen de
   la escala de Tailwind, no de los px de la vista, y todo es responsive (§5.9).
7. **Íconos de `lucide-react`**, como en el resto del sitio; las vistas dibujan
   esos mismos íconos. La excepción es la estrella de cuatro puntas de la IA.
8. **Lo que ya existe no se rehace.** `Navbar`, `AdminShell`, `CartDrawer` y
   `useCart` salen en las vistas solo como contexto.
9. **Nombres en español**, como el vocabulario de este documento y los
   componentes recientes (`Campo`, `CampoTexto`). Lo que se mueve o se extrae
   de código existente conserva su nombre (`quoter-*`, `stl-upload`).

Las reglas 2 y 5 siguen la guía de Server y Client Components de Next 16; las
carpetas `_components` y `_hooks`, la de estructura del proyecto (carpetas
privadas).

### 6.2 Lenguaje visual compartido — `components/ia/`

Lo usan el selector, el chat y, en la fase 3, `/cotizador/modelo`.

| Archivo | Qué hace |
|---|---|
| `Orbe.tsx` | Avatar del asistente; con `activo` gira y lleva aura (respuesta en curso) |
| `Aura.tsx` | Pone el aura detrás de su hijo; `activa` aplica la regla de §5.1 |
| `BordeIA.tsx` | Borde degradado que gira, para la tarjeta del asistente y la caja de texto |
| `IconoIA.tsx` | La estrella de cuatro puntas |

El CSS se escribe una sola vez, en `app/globals.css`: tokens `--color-ia-*` en
`@theme`, `@property --giro`, los `@keyframes` y las utilidades `borde-ia` y
`aura-ia` (`@utility` de Tailwind 4), todo apagado con `prefers-reduced-motion`.
Los componentes solo usan esas clases.

### 6.3 Selector — `app/cotizador/`

```
app/cotizador/
  page.tsx                      servidor: lee AsistenteConfig y elige la segunda tarjeta
  actions.ts                    sin cambios (lo importa QuoteRequestForm)
  _components/
    TarjetaCamino.tsx           molde de las tres: insignia, ilustración, título, texto,
                                ventajas y botón
    TarjetaArchivo.tsx          "Tengo mi archivo"
    TarjetaAsistente.tsx        "Asistente con IA", con BordeIA y Aura
    TarjetaPersonalizada.tsx    "No tengo modelo", con el asistente apagado
    ComparacionCaminos.tsx      tabla "¿Cuál elijo?"
    VentajasCotizador.tsx       las cuatro ventajas; también la usa modelo/page.tsx
  modelo/
    page.tsx                    el cotizador actual, movido sin cambios de diseño
  asistente/                    §6.4
```

Las tres tarjetas solo le pasan contenido a `TarjetaCamino`; lo que cambia de
estilo entre ellas es una prop `variante`.

### 6.4 Chat — `app/cotizador/asistente/`

```
app/cotizador/asistente/
  page.tsx                      servidor: apagado → redirect('/cotizador'); topes a <Chat>
  _components/
    Chat.tsx                    cliente: useAsistente(), Inicio o Conversacion, AccionesChat
    AccionesChat.tsx            contexto: adjuntar(), enviar(texto) y abrirWhatsApp()
    BarraChat.tsx               "← Cotizador", PildoraCarrito y "Nueva conversación"
    PildoraCarrito.tsx          useCart(): total y apertura del CartDrawer
    Inicio.tsx                  vista 2: Orbe, CajaTexto y Sugerencias
    Sugerencias.tsx             las cuatro sugerencias
    Conversacion.tsx            mensajes, avisos de tope y caja de texto
    MensajeCliente.tsx          burbuja y adjuntos
    MensajeAsistente.tsx        orbe, fichas y partes (texto y tarjetas) en orden
    FichaTool.tsx               una ficha; su estado sale del de la parte de la tool
    Escribiendo.tsx             los tres puntos
    CajaTexto.tsx               texto, contador, adjuntar y enviar (dos tamaños)
    AdjuntoStl.tsx              ficha del archivo con los estados de subida (vista 5)
    Aviso.tsx                   tono (info, advertencia, error), título, texto y acción
    PieChat.tsx                 "Hablar con una persona" y el aviso de datos
    tarjetas/
      registro.ts               tool → tarjeta y textos de ficha (tabla de §9)
      TarjetasMaterial.tsx
      TarjetaCotizacion.tsx
      TablaOpciones.tsx         tabla de comparar_opciones, dentro o fuera de la cotización
      TarjetaEstimacion.tsx
      ListaProductos.tsx
      TarjetaConfirmacion.tsx
      TarjetaAsesor.tsx
  _hooks/
    useAsistente.ts             envuelve useChat: id guardado, turnos y topes, eventos
    useSubidaStl.ts             XMLHttpRequest con progreso y cancelar
    useItemVigente.ts           ítem de /api/cotizador/carrito para la confirmación
```

- **Sin `switch` por tool.** `MensajeAsistente` recorre las partes del mensaje
  y, para cada parte de tool, busca en `registro.ts` su ficha y su tarjeta.
  Agregar una tool es sumar su esquema, su implementación y una entrada en el
  registro. El texto de una ficha puede depender de la salida ("Comparó 3
  opciones").
- **Estado de la parte → interfaz.** Entrada en camino o lista: ficha "en
  curso". Salida lista: ficha "hecho" y tarjeta. Error: `Aviso` de error.
- Si `comparar_opciones` llega en el mismo mensaje que su cotización,
  `MensajeAsistente` pone la `TablaOpciones` dentro de esa `TarjetaCotizacion`
  (§5.4).
- Las tarjetas que disparan algo del chat (la de estimación abre el selector de
  archivos; la de asesor, WhatsApp) lo toman de `AccionesChat`, en vez de recibir
  callbacks por cuatro niveles de props. El proveedor va dentro de `Chat`, lo más
  abajo posible.
- `TarjetaConfirmacion` es la única tarjeta que usa la red (`useItemVigente`) y
  la única que le devuelve un resultado al agente. Sus estados (pendiente,
  confirmado, rechazado, precio cambiado, sin stock) entran por props.
- La lista de mensajes lleva `aria-live="polite"` para que un lector de pantalla
  anuncie las respuestas *(no está en las vistas)*.

### 6.5 Admin — `app/admin/(panel)/asistente/`

```
app/admin/(panel)/
  _ui.tsx                           Card, Campo e inputCls compartidos
  asistente/
    page.tsx                        servidor: config, validaciones y modelos de OpenRouter
    AsistenteConfigForm.tsx         cliente: estado del formulario, Descartar y Guardar
    actions.ts                      requireAdmin() + validar + guardar + revalidar
    _components/
      CabeceraAsistente.tsx         título, acciones y pestañas; la usan las dos páginas
      InterruptorActivo.tsx
      SelectorModelo.tsx            buscador y radiogroup; los no aprobados, deshabilitados
      ListaRespaldos.tsx
      TopesConversacion.tsx
      TablaValidacion.tsx
    conversaciones/                 fase 2
      page.tsx                      servidor: periodo, filtros, página y detalle en la URL
      csv/route.ts                  "Exportar CSV"
      _components/
        Indicadores.tsx
        FiltrosConversaciones.tsx   cliente: solo cambia la URL
        TablaConversaciones.tsx
        CostoPorModelo.tsx
        DetalleConversacion.tsx     se abre con ?id=
```

- Mismo molde que las otras pantallas del panel (`page.tsx`, `*Form.tsx`,
  `actions.ts`), con las secciones del formulario en `_components/`.
- Sería la cuarta pantalla con su propia copia de `Card`, `Campo` e `inputCls`
  (textos-home dejó pendiente extraerlos): se extraen primero a
  `app/admin/(panel)/_ui.tsx`. Pasar las otras tres pantallas a ese archivo es
  opcional.
- En la vista 7, periodo, filtros, página y conversación abierta viven en la URL
  (`searchParams`): la página es de servidor y un enlace abre exactamente la
  misma tabla y el mismo detalle.

### 6.6 Módulos de `lib/` y endpoints

```
lib/asistente/
  tipos.ts                      AsistenteConfig y DEFAULT_ASISTENTE_CONFIG
  config.ts                     get/saveAsistenteConfig sobre Setting (patrón quoter-config)
  esquemas.ts                   zod de entrada y salida de cada tool, sin código de servidor
  tools/                        una tool por archivo + index.ts (server-only)
  prompt.ts                     prompt de sistema fijo
  estimacion.ts                 rango sin archivo (puro)
  mensaje-asesor.ts             texto de WhatsApp (puro: lo usan la tool y el navegador)
  codigos.ts                    códigos Q- y E- (puro)
  openrouter.ts                 proveedor y modelos con tools (server-only)
  limite.ts                     límite por IP (server-only)
  sesion.ts                     ChatSession y ChatQuote (server-only)
  validaciones.ts               resultados de verify:agente (decisión 6)
lib/formato.ts                  pesos y números es-CO
lib/quoter-catalog.ts           COLORES y calidades, movidos de Quoter.tsx
lib/quoter-cart-item.ts         ítem del carrito del cotizador, movido de Quoter.tsx
lib/stl-upload.ts               subida a Cloudinary, extraída de /api/stl-upload
app/api/cotizador/
  chat/route.ts                 streaming del agente
  archivo/route.ts              subir y medir el STL
  carrito/route.ts              ítem vigente para la confirmación
  eventos/route.ts              "+" de productos y WhatsApp (§14)
```

### 6.7 De la vista al componente

| Vista | Componentes |
|---|---|
| 1 | `TarjetaArchivo`, `TarjetaAsistente` o `TarjetaPersonalizada`, `ComparacionCaminos`, `VentajasCotizador` |
| 2 | `BarraChat`, `Inicio` (`Orbe`, `CajaTexto`, `Sugerencias`), `PieChat` |
| 3 | `PildoraCarrito`, `MensajeCliente` y `AdjuntoStl`, `MensajeAsistente` y `FichaTool`, `TarjetasMaterial`, `TarjetaCotizacion` y `TablaOpciones`, `TarjetaConfirmacion` |
| 4 | `TarjetaEstimacion`, `ListaProductos`, `TarjetaAsesor` |
| 5 | Los estados de `AdjuntoStl`, `TarjetaConfirmacion`, `FichaTool` y `Escribiendo`, y `Aviso` |
| 6 | `CabeceraAsistente`, `InterruptorActivo`, `SelectorModelo`, `ListaRespaldos`, `TopesConversacion`, `TablaValidacion` |
| 7 | `Indicadores`, `FiltrosConversaciones`, `TablaConversaciones`, `CostoPorModelo`, `DetalleConversacion` |

Al implementar, cada componente se revisa contra su tablero. Las diferencias a
propósito (tokens, responsive, accesibilidad) se anotan en `design.md` como
"*Al implementar:*", igual que en textos-home.

---

## 7. Qué puede hacer el agente sin STL

El precio del cotizador sale del volumen de la malla, y el checkout rechaza
cualquier ítem del cotizador sin un STL verificado (`lib/quoter-verify.ts:70`).
Por eso el agente solo puede llenar el carrito con algo que el servidor pueda
verificar:

1. **Productos de la tienda.** Busca en `Product` y los agrega. El checkout ya
   verifica precio y stock contra la BD (`app/api/checkout/route.ts:99`).
2. **El cliente consigue el archivo y lo sube en el chat.** El servidor lo mide
   con el mismo `parseSTL` del checkout: el precio que dice el agente es justo
   el que se va a cobrar y el ítem puede ir al carrito.
3. **Precio orientativo sin archivo.** Con medidas aproximadas, `calcCost`
   calcula un rango por unidad suponiendo que la pieza ocupa entre el 25 % y el
   45 % de su caja envolvente, redondeado a $100 y marcado como **no pagable**
   (vista 4). Si el cliente no dice más, se supone FDM, PLA, capa 0,2 mm y
   relleno 40 %. *(El 25–45 % está por calibrar, §15.)*
4. **Diseño 3D, escaneo, repuestos que no estén en la tienda o piezas de más de
   30 cm.** El agente explica el servicio y deriva a un asesor (§10.3). Si una
   medida pasa de 30 cm no hay rango: se deriva directo.

---

## 8. Arquitectura

```
Navegador (/cotizador/asistente)               Servidor
┌───────────────────────────────┐              ┌───────────────────────────────────────┐
│ useChat (AI SDK)              │   mensajes   │ POST /api/cotizador/chat              │
│  ├─ texto en streaming ◄──────┼──────────────│  ├─ lee AsistenteConfig (Setting)     │
│  ├─ fichas y tarjetas (§6.4)  │              │  ├─ límite por IP y topes             │
│  │                            │              │  ├─ streamText + OpenRouter           │
│  │                            │              │  ├─ tools → calcCost / Product /      │
│  │                            │              │  │          calcShipping              │
│  │                            │              │  └─ guarda conversación y costo       │
│  ├─ adjuntar STL ─────────────┼─────────────►│ POST /api/cotizador/archivo           │
│  │   (con progreso)           │              │  └─ mide con parseSTL y sube          │
│  └─ confirmar (tool cliente) ─┼─────────────►│ POST /api/cotizador/carrito           │
│      └─ addItem ◄─────────────┼──────────────│  └─ ítem con el precio vigente        │
└───────────────────────────────┘              └───────────────────────────────────────┘
```

**Stack propuesto**

- `ai` + `@ai-sdk/react` (Vercel AI SDK): `useChat` con streaming, tools que se
  ejecutan en el servidor y tools que se ejecutan en el navegador con
  confirmación del usuario.
- `@openrouter/ai-sdk-provider`: el modelo pasa a ser un texto configurable.
- `zod` como dependencia **explícita**: hoy `app/cotizador/actions.ts` lo usa,
  pero llega solo de forma indirecta (v4.3.6). Los esquemas de las tools lo
  necesitan.
- Credencial: `OPENROUTER_API_KEY`, solo en las variables de Hostinger y en
  código `server-only`.

**Subida y medición del STL** (vista 5)

- `POST /api/cotizador/archivo` recibe el archivo y el id de la conversación.
  Valida extensión y tamaño (50 MB, como `/api/stl-upload`) y mide con
  `parseSTL` **antes** de subir, así un archivo ilegible se rechaza sin gastar
  Cloudinary. Lo sube a la misma carpeta `modelos-3d` (así `isOurModelUrl` lo
  acepta en el checkout) y devuelve `modelUrl`, medidas, volumen y avisos (pieza
  hueca, más de 30 cm, volumen no fiable).
- La subida a Cloudinary de `/api/stl-upload` se extrae a `lib/` y la usan las
  dos rutas.
- `parseSTL` hoy devuelve un archivo ilegible igual que un volumen no fiable
  (`UNPARSEABLE` lleva `volumeUnreliable: true`). Para separar "No es un archivo
  STL" de "No pudimos medir el volumen" hace falta un indicador propio.
- El `STLData` medido queda en memoria por `modelUrl`, así `cotizar_archivo` no
  vuelve a descargar el archivo. Si el proceso se reinició, se descarga con
  `fetchModel`.

**Conversación**: el navegador guarda el id (localStorage) y, al recargar,
retoma los mensajes de `ChatSession`. "Nueva conversación" empieza otra.

Antes de escribir los Route Handlers hay que leer la guía de
`node_modules/next/dist/docs/` (Next 16, ver `AGENTS.md`).

## 9. Herramientas del agente

| Tool | Dónde corre | Reutiliza | Para qué |
|---|---|---|---|
| `buscar_productos` | Servidor | `prisma.product` (stock > 0, `salePrice ?? price`) | Piezas que ya están en la tienda |
| `listar_materiales` | Servidor | `getQuoterPricing` (sin materiales bloqueados) + catálogo de colores y calidades | Saber qué hay antes de recomendar |
| `mostrar_materiales` | Servidor | El catálogo de `listar_materiales` | Mostrar de 1 a 3 materiales en tarjetas, uno marcado como recomendado |
| `cotizar_archivo` | Servidor | `isOurModelUrl` + `STLData` medido al subir + `buildVerifiedConfig` + `calcCost` | Precio exacto de un STL subido en el chat. Avisa si es pieza hueca (relleno fijado al 100 %), si pasa de 30 cm o si el volumen no es fiable. Devuelve un código de cotización (`Q-XXXX`) |
| `comparar_opciones` | Servidor | `calcCost` varias veces | Sobre una cotización, variar material, color, calidad, relleno o cantidad: "PLA vs PETG", "con 5 unidades bajas al tramo del 15 %" |
| `estimar_rango` | Servidor | `calcCost` con volumen supuesto | Rango orientativo sin archivo, no pagable (§7). Devuelve un código (`E-XXXX`) para citarlo al derivar |
| `agregar_al_carrito` | **Navegador** | `CartContext.addItem` | Solo acepta un código de cotización o un id de producto, y una cantidad. Muestra la tarjeta de confirmación (§10.1) |
| `derivar_a_asesor` | Servidor | — | Arma el mensaje de WhatsApp (§10.3) |
| `estimar_envio` *(fase 2)* | Servidor | `calcShipping` (`lib/shipping-calc.ts`) | Costo total puesto en la ciudad del cliente |

**En la interfaz** (vistas 3 a 5):

| Tool | Ficha mientras corre | Ficha al terminar | Tarjeta |
|---|---|---|---|
| `listar_materiales` | *"Consultando materiales…"* | "Consultó los materiales disponibles" | — |
| `mostrar_materiales` | — | — | Tarjetas de material |
| `cotizar_archivo` | "Midiendo tu archivo…" | "Midió tu archivo" | Tarjeta de cotización |
| `comparar_opciones` | "Calculando precio…" | "Comparó N opciones" | Tabla dentro de la tarjeta de cotización |
| `estimar_rango` | "Calculando precio…" | "Calculó un rango orientativo" | Tarjeta de estimación |
| `buscar_productos` | "Buscando en la tienda…" | "Buscó en la tienda" | Lista de productos |
| `agregar_al_carrito` | — | — | Tarjeta de confirmación |
| `derivar_a_asesor` | — | — | Tarjeta de asesor |

En cursiva, un texto que las vistas no traen.

Notas:

- `mostrar_materiales` existe porque las tarjetas de la vista 3 muestran solo lo
  que el agente recomienda para ese uso, mientras que `listar_materiales`
  devuelve todo el catálogo para que el agente elija. El servidor valida los ids
  contra el catálogo disponible. Nombre, descripción y colores salen del
  catálogo; las ventajas y límites son texto corto del modelo (no son precios).
- `verifyQuoterItem` hoy solo devuelve precio. `cotizar_archivo` necesita
  también la geometría y la configuración ya verificada, así que conviene una
  variante que devuelva `STLData` + `PrintConfig` + `CostResult`, reutilizando
  `isOurModelUrl` y `fetchModel` (hoy privados en `lib/quoter-verify.ts`).
- Los códigos `Q-` y `E-` son únicos dentro de la conversación, y el servidor
  solo resuelve los de la conversación en curso.
- El descuento de cada fila de `comparar_opciones` (`−10 %`, `−15 %`) sale de
  `multiplicadorCantidad`; `CostResult` no lo trae hoy.
- Las tools validan sus argumentos con zod en el servidor. Un modelo débil puede
  mandar argumentos inválidos: se responde con un error claro para que lo
  corrija, nunca con un valor por defecto.

## 10. Carrito y asesor

### 10.1 Confirmación de lo que propone el agente

1. El agente llama `agregar_al_carrito` con un código de cotización (de
   `cotizar_archivo`) o un id de producto (de `buscar_productos`) y una
   cantidad.
2. La tarjeta pide al servidor el ítem vigente (`POST /api/cotizador/carrito`):
   para una cotización recalcula el precio con las tarifas actuales y esa
   cantidad; para un producto lee precio y stock de la BD. **Lo que muestra la
   tarjeta sale de esa respuesta, nunca del texto del modelo.**
3. Si el precio que se le mostró al cliente para esa cantidad ya no es el
   vigente, la tarjeta avisa "El precio cambió" con el precio nuevo antes de que
   confirme (vista 5). Sin stock, avisa y no ofrece confirmar.
4. Solo si el cliente pulsa "Confirmar y agregar" se ejecuta `addItem`; el
   resultado (confirmado o rechazado) vuelve al agente, que sigue la
   conversación (vista 3).
5. Una impresión usa el id `cotizador-<id de la cotización>`. Si ya está en el
   carrito, se cambia la cantidad con `updateQty`, que vuelve a tarifar: `addItem`
   suma cantidades sin mover el tramo de descuento.
6. El checkout vuelve a verificar todo, como hoy.

**Cambio previo:** la lógica que arma el ítem del carrito del cotizador (id
`cotizador-*`, nota, `printConfig`, `modelUrl`) está dentro de
`app/components/Quoter.tsx:476-546`. Se mueve a `lib/` para que el cotizador y
el chat generen ítems idénticos. Lo mismo con `COLORES` y
`getAvailableQualities` (`Quoter.tsx:24` y `:107`), que el servidor necesita para
`listar_materiales` y `mostrar_materiales`.

### 10.2 Botón "+" de la lista de productos

Es una acción del propio cliente, como `AddToCartButton` en la tienda: agrega una
unidad sin tarjeta de confirmación (la regla de confirmar aplica a lo que propone
el agente). El navegador le cuenta al agente en el siguiente turno qué se agregó,
para que no lo vuelva a ofrecer.

### 10.3 Derivación a un asesor

- **La pide el agente:** llama `derivar_a_asesor` y aparece la tarjeta de la
  vista 4.
- **La pide el cliente:** "Hablar con una persona" (vistas 2 a 4) y "Hablar con
  un asesor" (avisos de pieza grande y de tope, vista 5) abren WhatsApp
  directamente, sin llamar al modelo, para que funcionen aunque el chat esté
  fallando o haya llegado al tope.
- El mensaje empieza con un saludo fijo ("Hola, vengo del asistente de
  cotización de Cesgar. Necesito:") y sigue con una línea por pieza. Las
  descripciones las escribe el modelo; **los precios y rangos salen de las
  cotizaciones y estimaciones guardadas**. Sin el modelo, el navegador arma las
  líneas con los resultados de tools que ya tiene (cotizaciones, estimaciones,
  archivos subidos) o deja solo el saludo. Las dos entradas usan la misma función
  de `lib/`.
- Enlace: `https://wa.me/573057956352?text=…`, el número de
  `app/servicios/diseno-3d/page.tsx` (está repetido tres veces ahí; conviene una
  constante compartida).
- La conversación cuenta como "derivada" cuando el cliente abre WhatsApp, no
  cuando aparece la tarjeta.

---

## 11. Privacidad y datos

- El agente no pide nombre, correo, teléfono ni dirección. Ninguna tool guarda
  datos personales. Va como regla en el prompt de sistema y en el diseño de las
  tools.
- La conversación se guarda de forma anónima, con un id de sesión.
- Avisos a la vista del cliente: "No te pedimos datos personales en el chat"
  (selector), "No compartas datos personales en el chat" (inicio), "No compartas
  datos personales; solo se piden al pagar" (conversación) y "No te pedimos
  ningún dato para continuar" (asesor).
- Derivación: WhatsApp con el mensaje ya escrito (§10.3); el cliente decide si lo
  envía.
- Retención: la vista 7 asume borrado automático a los 90 días (Ley 1581)
  *(por confirmar, §15)*.

## 12. OpenRouter con modelos variables

**Configuración desde el admin** (`/admin/asistente`, vista 6, en `Setting`, con
el patrón de `/admin/cotizador`). Borrador:

```ts
interface AsistenteConfig {
  activo: boolean;              // apagado → la tarjeta lleva a cotización personalizada
  modelo: string;               // id de OpenRouter; solo modelos aprobados por verify:agente
  respaldos: string[];          // en orden; se envían en el arreglo `models`
  maxTurnos: number;            // por conversación (la vista usa 30)
  maxCaracteresMensaje: number; // la vista usa 1.000
}
```

- **Solo modelos con tools:** el buscador del admin pide a OpenRouter, desde el
  servidor, la lista filtrada por `supported_parameters=tools`, con proveedor y
  contexto de cada modelo.
- **Solo modelos validados:** los que no aprobaron `verify:agente` (§14)
  aparecen deshabilitados, y la acción de guardar también los rechaza: decide el
  servidor, no solo la UI.
- **Respaldo automático:** con el arreglo `models`, si el modelo principal falla
  (caída, límite de peticiones, contexto), OpenRouter intenta el siguiente. Se
  cobra el modelo que respondió, y la respuesta indica cuál fue.
- **Costos:** OpenRouter devuelve `usage.cost` (y tokens, caché, razonamiento)
  en cada respuesta, también en streaming. Se guarda por conversación. El "≈ US$…
  por conversación" de la vista 6 es el costo medio medido en `verify:agente`.
- **Caché:** depende del proveedor. OpenAI, DeepSeek y Gemini cachean solos;
  Anthropic y Qwen necesitan marcas `cache_control`. El prompt de sistema se
  mantiene fijo (sin fechas ni datos variables) y se envía un `session_id` por
  conversación para que OpenRouter mande las peticiones al mismo proveedor.
- **Precios y catálogo fuera del prompt:** las tarifas y los materiales se
  consultan siempre por tools, así un cambio en `/admin/cotizador` no invalida la
  caché ni deja al agente con datos viejos.

## 13. Seguridad y abuso

- **Límite de peticiones por IP:** hoy no existe ninguno (`proxy.ts` solo cubre
  `/admin`). Cubre el chat y la subida de STL; al pasarlo se responde 429 y el
  chat muestra "Un momento" (vista 5). Si Hostinger corre un solo proceso de
  Node basta un mapa en memoria; si no, hay que guardarlo en la BD.
- **Topes:** turnos por conversación, longitud de cada mensaje y tamaño de
  respuesta. El servidor los aplica; la UI solo avisa (contador, "Te quedan 3
  mensajes", bloqueo al llegar al máximo).
- **Tope de crédito en la key de OpenRouter**, como última barrera de costo.
- **Alcance:** el agente solo habla de Cesgar e impresión 3D. No negocia
  descuentos fuera de la tabla de tarifas ni promete plazos que no estén
  definidos.
- **Inyección de instrucciones:** los nombres de archivo y el texto del cliente
  se tratan como datos, no como instrucciones.

## 14. Persistencia y medición (borrador)

```prisma
model ChatSession {
  id            String      @id @default(cuid())
  mensajes      String      // JSON de la conversación (recorrido y transcripción de la vista 7)
  turnos        Int         @default(0)
  modelos       String?     // modelos que respondieron, marcando si fue un respaldo
  costoUsd      Float       @default(0)
  tokensEntrada Int         @default(0)
  tokensSalida  Int         @default(0)
  resultado     String?     // "carrito" | "derivado" | "abandonado"
  cotizaciones  ChatQuote[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

// tipo: "archivo" | "estimacion"
model ChatQuote {
  id        String      @id @default(cuid())
  sessionId String
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  codigo    String      // "Q-7F3K" | "E-2M9P"; único dentro de la conversación
  tipo      String
  datos     String      // JSON: modelUrl, STLData, PrintConfig y precios mostrados | medidas, supuesto y rango
  createdAt DateTime    @default(now())

  @@unique([sessionId, codigo])
}
```

- Las dos tablas van en `prisma/schema.prisma` **y** en
  `prisma/schema.production.prisma`: `verify:schemas` exige paridad y corre en el
  build.
- En MySQL un `String` es VARCHAR(191): `mensajes` y `datos` necesitan
  `@db.LongText` y `@db.Text` en el schema de producción, o se cortan sin error.
  Sus nombres no caen en `PATRONES_LARGOS` de `scripts/verificar-schemas.mjs`,
  así que hay que sumarlos ahí para que el build los vigile.
- `resultado`: si una conversación tiene carrito y derivación, queda "carrito";
  "abandonado" es la que terminó sin ninguno de los dos.
- Se marca "carrito" al confirmar una tarjeta o al usar el "+" de un producto, y
  "derivado" al abrir WhatsApp. El "+" y WhatsApp no pasan por el modelo, así que
  el navegador los avisa a `POST /api/cotizador/eventos` (`sendBeacon` si la
  página se cierra).
- Fase 2: el ítem del carrito guarda el id de la conversación y `/api/checkout`
  lo copia a `Order` (campo nuevo `chatSessionId`), para medir chat → orden
  pagada (vista 7).
- Borrado a los 90 días (decisión 4): Hostinger puede no ofrecer tareas
  programadas, así que la limpieza puede correr al crear conversaciones nuevas.

**`verify:agente`**: script con situaciones de prueba que comprueba, por modelo,
las cinco reglas de la vista 6: todo precio sale de una tool, deriva las piezas
de más de 30 cm, no pide datos personales, no promete descuentos fuera de tarifa
y pide confirmación antes del carrito. Empieza con unas 10 situaciones en la
fase 1 y crece en la fase 2.

Las cifras de las vistas 3 y 4 sirven además como casos fijos de las tools, sin
modelo (tarifas por defecto):

| Caso | Esperado |
|---|---|
| 42,6 cm³ en una caja de 84 × 40 × 62 mm; FDM, PETG, capa 0,2 mm, relleno 40 %, 4 u. | $10.983 c/u (−10 %), total $43.932; 21,6 g y 6,4 h por unidad |
| Lo mismo, 5 u. | $10.373 c/u (−15 %), total $51.865 |
| Lo mismo en PLA, 4 u. | $9.066 c/u, total $36.264 |
| Estimación de una caja de 10 × 6 × 3 cm; FDM, PLA, capa 0,2 mm, relleno 40 % | Entre $10.600 y $18.300 por unidad |

---

## 15. Decisiones pendientes

| # | Decisión | Recomendación |
|---|---|---|
| 1 | Supuesto del rango sin archivo | La vista 4 usa del 25 % al 45 % de la caja envolvente. Contrastarlo con la relación volumen/caja de STL reales (los de `OrderItem.modelUrl` que lista `/admin/modelos`) antes de la fase 1 |
| 2 | Sugerir modelos de repositorios externos (Printables, Thingiverse) | Fase 3 y solo con licencias que permitan uso comercial: muchos modelos son no comerciales |
| 3 | Modelo inicial | Elegir 2–3 candidatos con soporte de tools y decidir con `verify:agente` y costo por conversación. Los modelos de la vista 6 son de ejemplo |
| 4 | Retención de transcripciones | La vista 7 asume 90 días con borrado automático; confirmarlo |
| 5 | Zona de arrastre de "Tengo mi archivo" | Dejarla como dibujo: la tarjeta entera es un enlace. Para que reciba el archivo hay que pasar el `File` a `/cotizador/modelo` dentro del navegador; puede venir después |
| 6 | Cómo llegan los resultados de `verify:agente` al admin | Que el script escriba un JSON en el repo (por ejemplo `lib/asistente/validaciones.json`) que leen el admin y la acción de guardar. Correrlo no necesita la BD de producción y cada aprobación queda en un commit |
| 7 | "Una foto" en la tabla "¿Cuál elijo?" (vista 1) | Quitarlo mientras el chat no acepte fotos (fase 3) |

## 16. Fases

**Fase 0 — Preparación**
- Subrutas y selector (§6.3, vista 1), con la tarjeta "No tengo modelo" para el asistente apagado.
- Primitivas de IA en `components/ia/`, con sus tokens y utilidades en `app/globals.css` (§6.2).
- Mover a `lib/` el catálogo (colores, calidades), el ítem del carrito y la subida de STL; crear `lib/formato.ts`.
- Extraer `Card`, `Campo` e `inputCls` del panel a `app/admin/(panel)/_ui.tsx`.
- `parseSTL`: separar archivo ilegible de volumen no fiable.
- Instalar `ai`, `@ai-sdk/react`, `@openrouter/ai-sdk-provider` y `zod`; crear la key de OpenRouter.
- **Prueba rápida de streaming en Hostinger** (principal riesgo técnico).

**Fase 1 — MVP**
- Chat en `/cotizador/asistente` (§6.4, vistas 2 a 5), con subida de STL.
- Tools: `buscar_productos`, `listar_materiales`, `mostrar_materiales`, `cotizar_archivo`, `comparar_opciones`, `estimar_rango`, `agregar_al_carrito`, `derivar_a_asesor`.
- `POST /api/cotizador/archivo` y `POST /api/cotizador/carrito`.
- `/admin/asistente` (§6.5, vista 6): interruptor, modelo, respaldos, topes y validación.
- Límite de peticiones, `ChatSession`, `ChatQuote` y costo por conversación.
- `verify:agente` inicial para elegir el modelo.
- Opcional: una página interna del admin que pinte cada tarjeta y aviso con datos de ejemplo, como el tablero 5, para revisar los estados difíciles de provocar (límite por IP, precio cambiado).

**Fase 2**
- `estimar_envio`.
- `/admin/asistente/conversaciones` (§6.5, vista 7).
- Conversión: id de conversación en `Order`.
- Ampliar `verify:agente`.

**Fase 3**
- Fotos de piezas (solo con modelos con visión).
- Sugerencia de modelos de repositorios externos (según decisión 2).
- El asistente también disponible en `/cotizador/modelo`, con el STL ya cargado como contexto.

## 17. Riesgos

| Riesgo | Mitigación |
|---|---|
| El proxy de Hostinger acumula la respuesta y rompe el streaming | Probarlo en la fase 0, antes de construir la UI |
| Modelos débiles inventan datos o fallan al llamar tools | Reglas en tools y servidor, validación zod, `verify:agente` por modelo antes de activarlo |
| Abuso que dispare el costo | Límite por IP, topes por conversación, tope de crédito en la key |
| Desfase entre lo que dice el agente y lo que se cobra | El precio solo sale de tools, la tarjeta de confirmación lo pide al servidor y el checkout re-verifica |
| Las animaciones de las vistas (degradado que gira, aura con `blur`) pesan en móviles de gama baja | Solo donde manda la regla del aura, apagadas con `prefers-reduced-motion` y probadas en un móvil real |
| Las vistas se pasan tal cual: estilos en línea, colores sueltos, un archivo por vista | Reglas de §6.1; cada componente se revisa contra su tablero y las diferencias a propósito se anotan en `design.md` |
| Licencias de modelos de terceros | Fuera del MVP; solo licencias comerciales (decisión 2) |

## 18. Referencias

- Vistas: `Cesgar — Asistente del cotizador.html` (raíz del repo).
- Next 16, en `node_modules/next/dist/docs/01-app/01-getting-started/`: `02-project-structure.md` (colocación y carpetas privadas `_`) y `05-server-and-client-components.md` (menos JS en el cliente, `server-only`).
- OpenRouter: [tool calling](https://openrouter.ai/docs/guides/features/tool-calling) · [model fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks) · [prompt caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching) · [usage accounting](https://openrouter.ai/docs/guides/guides/usage-accounting)
- AI SDK: [tools en chatbots](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage) · [human-in-the-loop](https://ai-sdk.dev/cookbook/next/human-in-the-loop) · [proveedor OpenRouter](https://ai-sdk.dev/v4/providers/community-providers/openrouter)
