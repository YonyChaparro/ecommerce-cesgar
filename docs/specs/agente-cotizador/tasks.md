# Tareas — Asistente de IA en el cotizador

Fases 0 y 1 de [propuesta.md](propuesta.md) §16. Las decisiones de §15 se tomaron
con la recomendación de la propia propuesta (ver el final de este archivo).

## Fase 0 — Preparación

- [x] Subrutas: `/cotizador` (selector), `/cotizador/modelo` (cotizador actual) y `/cotizador/asistente`; sitemap, revalidación de `/cotizador/modelo` y migas.
- [x] Selector (vista 1) con `TarjetaCamino` y sus tres variantes; "No tengo modelo" con el asistente apagado.
- [x] Primitivas de IA en `components/ia/` y sus tokens y utilidades en `app/globals.css`, apagadas con `prefers-reduced-motion`.
- [x] A `lib/`: `quoter-catalog.ts` (colores, calidades, rellenos), `quoter-cart-item.ts`, `stl-upload.ts`, `formato.ts`, `contacto.ts`.
- [x] `Card`, `Campo` e `inputCls` en `app/admin/(panel)/_ui.tsx` (las otras tres pantallas siguen con su copia: opcional).
- [x] `parseSTL`: `unreadable` separa "No es un archivo STL" de "No pudimos medir el volumen".
- [x] Dependencias: `ai@7`, `@ai-sdk/react@4`, `@openrouter/ai-sdk-provider@3`, `zod` explícito; `tsx` para los scripts nuevos.
- [ ] **Crear la key de OpenRouter** con tope de crédito y cargarla como `OPENROUTER_API_KEY` en las variables de Hostinger.
- [ ] **Comprobar que Hostinger corre Node 22 o más**: AI SDK 7 no funciona en Node 20.
- [ ] **Prueba de streaming en Hostinger**: desplegar y correr `curl -N https://cesgar.com.co/api/cotizador/prueba-streaming`. Las 5 líneas tienen que salir de a una, una por segundo. Después, borrar esa ruta.

## Fase 1 — MVP

- [x] Chat en `/cotizador/asistente` (vistas 2 a 5): conversación retomable, subida de STL con progreso y cancelar, fichas y tarjetas por registro, avisos de tope, errores y límite.
- [x] Tools: `buscar_productos`, `listar_materiales`, `mostrar_materiales`, `cotizar_archivo`, `comparar_opciones`, `estimar_rango`, `agregar_al_carrito` (navegador), `derivar_a_asesor`.
- [x] `POST /api/cotizador/chat` (y `GET` para retomar), `archivo`, `carrito` y `eventos`.
- [x] `/admin/asistente` (vista 6): interruptor, modelo, respaldos, topes y validación. Guardar rechaza en el servidor un modelo sin aprobar.
- [x] Límite por IP en memoria, `ChatSession` y `ChatQuote` en los dos schemas, costo y tokens por conversación, borrado a los 90 días.
- [x] `npm run verify:asistente`: las cifras de las vistas 3 y 4 con las tools reales, sin modelo ni BD.
- [x] `npm run verify:agente`: 10 situaciones × las 5 reglas de la vista 6; escribe `lib/asistente/validaciones.json`.
- [ ] **Elegir el modelo inicial** (decisión 3): correr `npm run verify:agente -- <modelo> <modelo> …` con 2 o 3 candidatos, hacer commit de `validaciones.json`, desplegar y elegirlo en `/admin/asistente`.
- [ ] Probar el recorrido completo con un modelo real: vistas 3 y 4, y los estados de la vista 5 que dependen del modelo.
- [ ] Opcional: página interna del admin que pinte cada tarjeta y aviso con datos de ejemplo. `VistaConfirmacion`, `Aviso` y `AdjuntoStl` ya reciben todo por props.

## Fase 2

- [x] `estimar_envio`: costo puesto en la ciudad con `calcShipping` y las tarifas de `/admin/envios` (lo mismo que cobra el checkout). Ubica la ciudad con `app/data/colombia.ts`; nunca pide dirección. Tarjeta `TarjetaEnvio`.
- [x] `/admin/asistente/conversaciones` (vista 7): indicadores, tabla paginada con filtros en la URL, costo por modelo, detalle con recorrido y transcripción, y "Exportar CSV".
- [x] Conversión: `CartItem.chatSessionId` → `/api/checkout` → `Order.chatSessionId` (con índice). Los indicadores cuentan las órdenes pagadas (`approved`) que vienen del chat.
- [x] `verify:agente` con 15 situaciones (otra cantidad, envío, producto por la tarjeta, envío sin dirección, letrero de 60 cm). Un modelo deja de estar aprobado si le faltan situaciones de la lista vigente.
- [x] Fase 1 opcional: `/admin/asistente/estados` pinta cada tarjeta y aviso con datos de ejemplo.

## Fase 3

Sin empezar; cada punto necesita una decisión antes de construirse:

- [ ] Fotos de piezas: elegir y validar un modelo con visión; definir dónde se guardan (Cloudinary) y si cuentan como dato personal.
- [ ] Modelos de repositorios externos (decisión 2): elegir fuente (Printables, Thingiverse) y su API/key, y filtrar por licencia comercial.
- [ ] El asistente en `/cotizador/modelo`, con el STL ya cargado como contexto.

## Decisiones de §15 al implementar

| # | Qué se hizo |
|---|---|
| 1 | 25–45 % de la caja en `OCUPACION_SUPUESTA` (`lib/asistente/estimacion.ts`). **Sigue por calibrar** con STL reales de `/admin/modelos`. |
| 2 | Fuera del MVP. |
| 3 | 2026-10-15: aprobaron 10/10 `openai/gpt-5.6-luna` (≈ US$0,0013/conv.), `anthropic/claude-haiku-5.5` (≈ US$0,002) y `qwen/qwen3.8-flash` (≈ US$0,0008). `google/gemini-3.8-flash` quedó sin validar: la key se quedó sin crédito. Falta elegir en `/admin/asistente`. |
| 4 | 90 días (`RETENCION_DIAS` en `lib/asistente/sesion.ts`), limpieza al crear conversaciones, como mucho una vez por hora. |
| 5 | La zona de arrastre es un dibujo; toda la tarjeta enlaza a `/cotizador/modelo`. |
| 6 | `lib/asistente/validaciones.json` en el repo, escrito por el script; lo leen el admin, la acción de guardar y los endpoints. |
| 7 | Sin "una foto" en la tabla "¿Cuál elijo?". |
