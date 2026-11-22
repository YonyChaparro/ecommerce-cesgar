# Tareas: el asistente como asesor comercial y técnico (spec v5.1)

Estado: **sin empezar**. Fecha: 2026-11-22.
Documentos hermanos: [`requirements.md`](requirements.md) (qué) · [`design.md`](design.md) (cómo).

Cada tarea dice qué requisitos cubre, qué archivos toca y cuándo está hecha.
Hasta T6 incluida, **el cliente no ve ningún cambio**: las piezas nuevas existen,
pero el prompt todavía no las usa. La función se vuelve visible en T7.

---

## T0. Preparar

- [ ] Rama `feat/agente-v5` desde `feat/agente-cotizador`, que tiene los últimos
      cambios desplegados el 2026-11-22.
- [ ] Mover `CESGAR_Especificacion_Agente_IA_Cotizador_v5_1 (1).pdf` a
      `docs/specs/agente-v5/fuente-v5_1.pdf` y actualizar la referencia en los
      tres documentos.
- [x] Resolver los choques de la v5.1 con el sistema actual: decisiones D1–D8
      tomadas el 2026-11-22 (requirements §7). Ninguna bloquea la Fase 4.
- [ ] Enviarle a CESGAR la columna «Le queda a CESGAR» de requirements §7, para
      que no se pierda: aprobar las tarifas de modelado y escaneo (D2, D3), y
      cargar las referencias y nombrar responsables para la Fase 5 (D5, D8).
- [ ] Pendientes heredados de [`../agente-cotizador/tasks.md`](../agente-cotizador/tasks.md):
      elegir el modelo en `/admin/asistente` y probar el recorrido con un modelo
      real. No bloquean, pero T9 necesita crédito en OpenRouter.

**Hecho cuando:** la rama existe y el PDF está en `docs/specs/agente-v5/`.

## T1. Parámetros comerciales

`lib/asistente/parametros-tipos.ts`, `parametros.ts` · design §6.3 · R1

- [ ] `ParametrosComerciales`, `DEFAULT_PARAMETROS` (valores de §16.5, con los
      interruptores apagados) y `validarParametros()`: orden de los umbrales,
      horas crecientes de C1 a C5, montos enteros ≥ 0 o `null`, y la versión
      obligatoria.
- [ ] `getParametros()` (mezcla con los defaults y nunca lanza) y
      `saveParametros(p, usuario)`, que llena `aprobadoPor` y `aprobadoEn`.

**Hecho cuando:** `npx tsc --noEmit` pasa y `validarParametros` rechaza
`Q_EVALUAR = 60` con `Q_VOLUMEN_MIN = 50`.

## T2. Ficha y clasificador (puros)

`lib/asistente/ficha.ts`, `clasificador.ts` · design §3, §4 · R2–R6

- [ ] Tipo `Ficha`, `FICHA_VACIA`, `mezclarFicha` (§3.2) y `faltantes` (§3.3),
      con las preguntas fijas de §11.1 y §22.
- [ ] `rutaComercial`, `claseModelado`, `precioModelado`, `esUsoCritico` y
      `siguienteAccion`.
- [ ] `calcularDerivados(ficha, parametros)`, que arma `ficha.derived` completo.
- [ ] Ningún import de `prisma`, `server-only`, `react` ni `next/*`.

**Hecho cuando:** compila. Las pruebas van en T3.

## T3. `verify:clasificador`

`scripts/verify-clasificador.ts`, `package.json` · design §9.1 · R12.2

- [ ] Todas las afirmaciones de design §9.1, incluida la tabla de clases de §4.2.
      Si una fila cae fuera del rango que la v5.1 da para ese caso, se ajusta el
      piso o la fila, y la tabla de design se actualiza igual.
- [ ] `"verify:clasificador": "tsx scripts/verify-clasificador.ts"`.

**Hecho cuando:** `npm run verify:clasificador` pasa sin red ni base de datos.

## T4. Persistencia y tools

`prisma/schema.prisma`, `schema.production.prisma`, `lib/asistente/sesion.ts`,
`tools/contexto.ts`, `tools/*.ts`, `esquemas.ts`, `codigos.ts`,
`app/api/cotizador/carrito/route.ts` · design §5, §6 · R2.5, R4.5, R5, R6.2, R7.1, R9.2, R10

- [ ] Columnas de `ChatSession` (design §6.1) en los dos schemas.
      `node scripts/verificar-schemas.mjs` tiene que pasar.
- [ ] `ContextoTools`: `parametros`, `leerFicha()` y `guardarFicha(ficha)`
      (esta última escribe también `perfil`, `ruta`, `claseMin`, `claseMax` y
      `oportunidadCatalogo`). Implementarlos en `sesion.ts` y en
      `scripts/asistente-contexto-memoria.ts`.
- [ ] `codigos.ts`: tipo `M`.
- [ ] Esquemas zod y tools nuevas: `actualizar_ficha`, `estimar_modelado` y
      `consultar_escaneo`. Registrarlas en `tools/index.ts`.
- [ ] Cambios en `cotizar_archivo`, `comparar_opciones`, `estimar_rango` y
      `derivar_a_asesor` (design §5.4). Copia de los parámetros en `datos`.
- [ ] `resumen-asesor.ts` (design §5.5), usado por `derivar_a_asesor`.
      `marcarResultado` guarda también `derivacion`.
- [ ] `/api/cotizador/carrito`: rechaza el volumen (D1).
- [ ] `GET /api/cotizador/chat` devuelve también la `ficha`, para el botón de
      WhatsApp sin modelo.
- [ ] `verify:asistente` sigue pasando: las cifras de las vistas 3 y 4 no
      cambian.

**Hecho cuando:** compila, `verify:asistente` y `verify:clasificador` pasan, y
una conversación vieja (sin ficha) se retoma sin error (N5).

## T5. Tarjetas e interfaz del chat

`app/cotizador/asistente/_components/tarjetas/*`, `registro.tsx`,
`_hooks/useSubidaStl.ts`, `AdjuntoStl.tsx`, `CajaTexto.tsx`,
`lib/asistente/mensaje-asesor.ts` · design §8 · R8.1, R9.1, R9.3, R10.4

- [ ] `TarjetaModelado`, con los estados `estimado`, `revision`, `en-propuesta`
      y `no-requiere`.
- [ ] `TarjetaEscaneo`, con los estados `tarifas` y `no-disponible`.
- [ ] `cotizar_archivo` con `tipo: 'volumen'` y `tipo: 'revision'`.
- [ ] Rótulos de nivel en `TarjetaCotizacion` y en la tarjeta de estimación.
      Motivo en `TarjetaAsesor`.
- [ ] Aviso `solo-texto` para imágenes, videos y PDF, al soltarlos o al pegarlos.
- [ ] «Hablar con una persona» usa `armarResumenAsesor` con la ficha, si la hay.

**Hecho cuando:** con `npm run dev`, cada estado se ve bien en escritorio y en
móvil (lo comprueba T6).

## T6. Panel

`app/admin/(panel)/asistente/*` · design §8 · R1, R11

- [ ] Tarjeta «Parámetros comerciales» en `/admin/asistente`, con la acción de
      guardar que valida en el servidor.
- [ ] `/admin/asistente/estados`: ejemplos de todas las tarjetas y avisos nuevos.
- [ ] `/admin/asistente/conversaciones`: filtros perfil, ruta y motivo; los
      indicadores de R11.2; la ficha en el detalle; columnas nuevas en el CSV.
      `lib/asistente/filtros.ts` y `metricas.ts`.

**Hecho cuando:** se guardan parámetros y se ven en el formulario al recargar.
`/estados` muestra cada estado de T5. La vista 7 filtra por perfil con datos de
prueba.

## T7. Prompt

`lib/asistente/prompt.ts` · design §7 · R2.3, R3, R4.3–R4.4, R5.1, R6, R7, R8.2–R8.3, R10.5

- [ ] Reescribir **Tu trabajo** y sumar las reglas 1–13 de design §7. Quitar la
      regla vieja de diseño y escaneo.
- [ ] Mensajes de derivación de §5.6, §14 y §25, en el tono del prompt.
- [ ] Revisar que no queden cifras de tarifas ni umbrales en el texto (N3).

**Hecho cuando:** el prompt compila y no tiene cifras. Se valida en T8.

## T8. `verify:agente` con T01–T24

`scripts/verify-agente.ts`, `lib/asistente/validaciones.ts` · design §9.2 · R12.1, R12.3

- [ ] Seis reglas nuevas en `REGLAS`.
- [ ] Situaciones de design §9.2, cada una con su `comprobar`, que mira las
      llamadas a tools y sus salidas y no el texto libre, salvo donde no haya
      otra forma (T15, T22, T24).
- [ ] Correr con un candidato y ajustar el prompt (T7) hasta 100 %. Medir el
      costo medio contra el actual (N2: como mucho +50 %).

**Hecho cuando:** un modelo pasa todas las situaciones y el costo cumple N2.

## T9. Aprobar modelos y desplegar

- [ ] Correr `npm run verify:agente -- <modelo> <modelo> …` con los tres modelos
      aprobados hoy (`openai/gpt-5.6-luna`, `anthropic/claude-haiku-5.5` y
      `qwen/qwen3.8-flash`), o con los candidatos que se elijan. Hacer commit de
      `validaciones.json`.
- [ ] **No desplegar sin un modelo aprobado en el JSON nuevo.** Si no, el
      asistente se apaga en producción (design §9.2).
- [ ] Desplegar con el procedimiento de la memoria del proyecto: carpeta limpia,
      `hosting_deploy` y Node 22.
- [ ] En producción, en `/admin/asistente`:
      1. Revisar los parámetros.
      2. Elegir un modelo aprobado.
      3. Dejar los interruptores apagados hasta que CESGAR apruebe D2 y D3.
- [ ] Prueba manual en producción:
      - T01: rejilla del carro;
      - T06: 50 para reventa → WhatsApp con resumen;
      - T10: freno → revisión;
      - T19: caja para electrónica → C2–C3;
      - T22: soltar un JPG → aviso.

**Hecho cuando:** las cinco pruebas manuales dan lo esperado y el mensaje de
WhatsApp llega con el resumen.

## T10. Piloto y calibración (con CESGAR, §21)

- [ ] Fase 1 del piloto: correr T01–T24 con datos simulados. Anotar los errores.
- [ ] Fase 3: simular conversaciones de clientes individuales, talleres y
      revendedores, y revisar las fichas y los resúmenes en la vista 7.
- [ ] Encender D2 y D3 cuando el responsable apruebe las tarifas. Registrar
      «Aprobado por».
- [ ] Empezar a registrar horas reales de modelado por proyecto, para calibrar
      las horas de C1–C6 (§10). Mientras no exista la Fase 5, en una hoja
      aparte.

**Hecho cuando:** CESGAR aprueba el comportamiento del piloto. Sin esa
aprobación no se encienden los interruptores (§21, última línea).

---

## Fases siguientes (no empezar sin decisión)

- [ ] **Fase 5, registro de piezas** (requirements §8, P1–P7): la entidad `Part`
      ya está decidida (D5). Falta que CESGAR cargue las 20–30 referencias reales
      y nombre a los responsables (D5, D8). Cuando estén, escribir su
      `design.md`. Cubre T02 y T14.
- [ ] **Fase 6, precio desde el laminador** (§6, §16.3): responder las preguntas de
      §6.9, elegir el laminador (¿CLI en el servidor de Hostinger?) y cargar la
      tabla de costos (§20, puntos 2–5). Cubre T12 con el laminador.
- [ ] La «Fase 3» de `../agente-cotizador/tasks.md` («Fotos de piezas») queda
      **reemplazada** por la v5.1: el canal web es solo de texto y las fotos van
      por WhatsApp.

## Cobertura de la matriz de pruebas de la v5.1

| Prueba | Dónde |
|---|---|
| T01, T03–T11, T15–T24 | `verify:agente` (T8) |
| T04–T08, T11–T13, T17–T21 (la parte determinista) | `verify:clasificador` (T3) |
| T02, T14 | Fase 5 |
| T12 con el laminador | Fase 6 |
