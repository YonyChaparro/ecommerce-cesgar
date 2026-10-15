# Diseño — Asistente de IA en el cotizador

La estructura es la de [propuesta.md](propuesta.md) §6. Aquí van solo las
diferencias a propósito con las vistas y con la propuesta, y lo que la propuesta
no detallaba.

## Flujo de un mensaje

1. El navegador guarda solo el id de la conversación (`localStorage`,
   `cesgar-asistente-id`) y al recargar pide los mensajes con
   `GET /api/cotizador/chat?id=`.
2. Al enviar, viaja **solo el último mensaje** (`prepareSendMessagesRequest`).
   `lib/asistente/fusion.ts` decide qué se acepta: un mensaje nuevo del cliente
   (texto, `data-archivo`, `data-agregados`) o la respuesta a una tarjeta de
   confirmación. Todo lo demás sale de `ChatSession`, así que el navegador no
   puede meter en el historial una cotización inventada.
3. El servidor guarda el mensaje antes de llamar al modelo, cuenta turnos (un
   turno = un mensaje del cliente) y llama a `streamText` con las tools.
4. Al terminar guarda la conversación (sin mensajes del asistente vacíos) y el
   costo y los tokens que informa OpenRouter.

## Al implementar

- *Al implementar:* `tarjetas/registro.tsx` en vez de `registro.ts`: el registro
  devuelve JSX.
- *Al implementar:* `TarjetaConfirmacion` se parte en `VistaConfirmacion` (todos
  los estados por props) y el contenedor que usa `useItemVigente` y el carrito.
- *Al implementar:* una propuesta de carrito que no es del último mensaje deja
  de ser interactiva ("Esta propuesta quedó sin confirmar"). Si el cliente
  escribe otra cosa sin responderla, el servidor la omite al llamar al modelo
  (`ignoreIncompleteToolCalls`).
- *Al implementar:* la salida de `agregar_al_carrito` lleva `detalle`, `cantidad`
  y `total`, para pintar el estado final al recargar sin volver a pedir el ítem.
- *Al implementar:* las tools reciben un `ContextoTools`
  (`lib/asistente/tools/contexto.ts`). En el chat lo implementa
  `lib/asistente/sesion.ts` (Prisma); en los scripts, un contexto en memoria.
  Así `verify:asistente` corre las tools reales sin BD ni red.
- *Al implementar:* módulos que la propuesta no listaba: `fusion.ts`,
  `archivos.ts` (STLData en memoria por `modelUrl`), `etiquetas.ts` ("FDM · PETG
  Negro · Capa 0,2 mm · Relleno 40 %"), `item-vigente.ts` (respuesta de
  `/api/cotizador/carrito`) y `lib/contacto.ts` (número de WhatsApp; las páginas
  de servicios todavía lo tienen escrito a mano).
- *Al implementar:* `buscar_productos` devuelve también `categoria`, que pide el
  ítem del carrito.
- *Al implementar:* el ítem de una impresión usa `cotizador-<ChatQuote.id>`, no
  el código Q-: dos conversaciones pueden repetir código y chocarían en el
  mismo carrito.
- *Al implementar:* el peso y el tiempo "c/u" se calculan sobre una unidad;
  dividir el total ya redondeado daba 21,7 g donde la vista dice 21,6 g.
- *Al implementar:* en el mensaje de WhatsApp, una estimación sale como "…,
  sin archivo (estimado: $10.600 – $18.300 c/u)", igual que la vista 4.
- *Al implementar:* colores de las vistas a tokens: `#00727f` (enlaces) →
  `primary`; `#4dbdcc`, `#7c6cf0`, `#38bdf8`, `#c084fc`, `#3b3f9e`, `#5b4bd6`,
  `#f6f4ff` → `--color-ia-*`; ámbar y rojo de los avisos → `amber-*` y
  `red-*` de Tailwind. Tamaños de 13 y 15 px → `text-sm` y `text-base`.
- *Al implementar:* las páginas del selector y del chat llevan
  `overflow-x-clip`: el aura se sale unos píxeles de su tarjeta y en móvil abría
  un scroll horizontal. Con `clip` (no `hidden`) la caja de texto sigue fija.
- *Al implementar:* en móvil la tabla "¿Cuál elijo?" pasa a una columna y cada
  celda lleva su encabezado ("Tengo mi archivo · …").
- *Al implementar:* la píldora del carrito solo aparece con conversación (la
  vista 2 no la tiene).
- *Al implementar:* "Hablar con un asesor" de los avisos y "Hablar con una
  persona" abren WhatsApp con las líneas que el navegador arma de las tools
  (`lineasDesdeConversacion`), sin pasar por el modelo.
- *Al implementar:* OpenRouter recibe `models: [principal, ...respaldos]`, con
  hasta 2 respaldos, y `session_id` en el cuerpo.
- *Al implementar:* límites por IP por minuto: chat 12, archivo 6, carrito 30,
  eventos 30 (`lib/asistente/limite.ts`).
- *Al implementar:* el asistente está disponible solo si está activo, tiene
  modelo, el modelo sigue aprobado en `validaciones.json` y existe
  `OPENROUTER_API_KEY` (`estadoAsistente`). Si algo falla, el selector muestra
  "No tengo modelo" y los endpoints responden 503.
- *Al implementar:* AI SDK 7 solo es ESM y pide Node 22 o más. Los scripts
  nuevos usan `tsx --conditions=react-server` (para importar módulos con
  `server-only`) en vez de `ts-node`.

## Fase 2 — al implementar

- *Al implementar:* `estimar_envio` recibe la ciudad (y el departamento solo si no la ubica) y los códigos Q- o productos del pedido. El subtotal se recalcula con las tarifas vigentes; el modelo no lo pasa. Con el envío apagado en `/admin/envios` responde "a confirmar", igual que el checkout.
- *Al implementar:* `/api/checkout/cotizador` no lo usa el checkout actual, así que `chatSessionId` solo se copia en `/api/checkout`.
- *Al implementar:* en la vista 7 los indicadores van por periodo, sin los filtros de la tabla. "Órdenes pagadas" son las órdenes `approved` con `chatSessionId` creadas en el periodo.
- *Al implementar:* una conversación cuenta en "Costo por modelo" para el primer modelo que la atendió; la tabla muestra "respaldo" sin decir de cuál, porque `ChatSession.modelos` guarda solo si lo fue.
- *Al implementar:* `lib/asistente/filtros.ts` (puro) separa periodo y filtros de `metricas.ts` (server-only), porque los filtros del navegador los necesitan.
- *Al implementar:* "Estados del chat" es una tercera pestaña del panel (`/admin/asistente/estados`) y reutiliza los componentes del chat con acciones vacías.
