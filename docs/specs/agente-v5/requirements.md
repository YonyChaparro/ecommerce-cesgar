# Requisitos: el asistente como asesor comercial y técnico (spec v5.1)

Estado: **construida (T0–T8)**, pendiente de despliegue. Choques resueltos el 2026-11-22 (§7). Fecha: 2026-11-22.
Fuente: [`fuente-v5_1.pdf`](fuente-v5_1.pdf) (en esta carpeta; en este
documento, «la v5.1» y §N son sus secciones).
Documentos hermanos: [`design.md`](design.md) (cómo) · [`tasks.md`](tasks.md) (en qué orden).
Parte del asistente que ya existe: [`../agente-cotizador/`](../agente-cotizador/) (fases 0 a 2).

---

## 1. Problema

El asistente de `/cotizador/asistente` se diseñó para **una** necesidad: un
cliente que quiere imprimir una pieza y no sabe qué material elegir. Cotiza STL,
estima rangos sin archivo, busca en la tienda, calcula el envío y deriva a
WhatsApp.

La v5.1 lo amplía a **asesor comercial y técnico inicial** de todo CESGAR, y
ahí aparecen huecos:

| La v5.1 pide | Hoy |
|---|---|
| Distinguir cliente individual, taller, revendedor y empresa (§11) | No hay perfil. Una empresa que pide 120 piezas recibe el mismo trato que un particular. |
| Desviar los pedidos de volumen a una propuesta por WhatsApp sin cobrar el modelado aparte (§5, §12) | `cotizar_archivo` cotiza hasta 1.000 unidades con el descuento de la tabla (−30 % desde 50) y las ofrece para el carrito. |
| Preclasificar el modelado 3D en C1–C6 a partir del texto, con horas y rango de precio (§4, §22–§26) | «Diseño 3D: explica el servicio en una frase y ofrece un asesor». |
| Tarifas «desde» de escaneo (§16.2) | Lo mismo: una frase y el asesor. |
| Bloquear la cotización de piezas críticas (frenos, dirección, airbags…) (§17.2, T10) | No existe esa regla. |
| Pasarle al asesor un resumen estructurado: perfil, aplicación, cantidad, muestra, función, riesgos, clase y pendientes (§5.7, §25.1) | El mensaje de WhatsApp lleva una línea por pieza con su código y su precio. |
| Distinguir el estimado preliminar, la cotización calculada y la confirmada (§8.2) | Solo existe la etiqueta «Estimación · no se puede pagar». |
| Guardar parámetros versionados y una copia en cada cotización (§16.5, §17.2) | Las tarifas viven en `/admin/cotizador` sin versión; la cotización guarda el precio, pero no los parámetros con que se calculó. |
| Medir perfiles, rutas, motivos de derivación y oportunidades de volumen (§9.3, §15.2) | La vista 7 mide conversaciones, carrito, derivadas y órdenes pagadas. |
| Registro de piezas, búsqueda por vehículo/OEM y estados de referencia (§13, §15) | No existe. `Product` no tiene vehículo, OEM ni estado de referencia. |
| Precio de impresión desde el laminador (§6, §16.3) | El precio sale del volumen del STL (`calcCost`), sin laminador. |

## 2. Objetivo

Que el asistente **entienda quién escribe y qué necesita**, deje la ficha de la
solicitud lista y lleve cada caso por la ruta correcta:

- **pieza puntual** → cotizar;
- **volumen** → propuesta comercial por WhatsApp;
- **riesgo** → revisión técnica;
- **diseño o escaneo** → estimado preliminar y asesor.

Nunca inventa precios, compatibilidades ni plazos, y el cliente no tiene que
repetir nada al pasar a WhatsApp.

## 3. Alcance

La v5.1 recomienda empezar por «la conversación progresiva, el clasificador de
complejidad y la ruta empresarial a WhatsApp» (§10, recomendación final). Esta
spec se parte igual.

### Dentro: Fase 4 (esta spec, completa)

- Parámetros comerciales configurables y versionados (§16.5).
- Clasificación del cliente (A/B1/B2/B3/pendiente) y de la ruta por volumen
  (25/50/100, recurrencia, reventa) (§11, §12).
- Ficha estructurada de la solicitud, que se completa a lo largo de la
  conversación (§17.1, §27).
- Preclasificación del modelado C1–C6 por texto, con operaciones CAD probables,
  horas y rango de precio (§4, §16.1, §22–§27).
- Tarifas «desde» de escaneo (§16.2).
- Escalado obligatorio de piezas críticas y de C6 (§8.3, §17.2).
- Derivación a WhatsApp con un resumen estructurado y su motivo (§5.7, §14, §25.1).
- Los tres niveles de precio en las tarjetas (§8.2).
- Canal solo de texto: sin fotos en el chat web (adenda v5.1, T22).
- Flujos conversacionales: pieza dañada, taller/empresa, modelado,
  mantenimiento, escaneo e ingeniería inversa (§7, §13, §14, §25).
- Indicadores nuevos en la vista 7 (§9.3, §15.2).
- Situaciones T01–T24 en `verify:agente` (§18, §28), salvo las que dependen de
  la Fase 5 o la 6.

### Después: Fase 5, registro de piezas (requisitos en §8, sin diseño)

Entidades PIEZA, DESARROLLO y SKU, búsqueda por OEM y vehículo, posibles
duplicados, estados de referencia e indicadores de demanda por pieza (§13, §15).
Necesita que CESGAR cargue 20–30 referencias reales (§21, fase 2) y decida
quién las mantiene (**D5**).

### Después: Fase 6, precio desde el laminador (sin diseño)

Simulación de laminado, masa de relleno y de soportes, y la tabla de costos por
material, máquina y mano de obra (§6, §16.3). Antes hay que responder las
preguntas técnicas de §6.9 (**D4**).

### Fuera

- **Fotos, videos o imágenes en el chat web.** La v5.1 lo prohíbe en esta versión.
- **Pedir datos personales en el chat** (nombre, teléfono, correo). La decisión
  del asistente actual se mantiene: el contacto ocurre cuando el cliente escribe
  por WhatsApp (**D6**).
- **Cambiar `/cotizador/modelo`** (el cotizador manual) o sus descuentos por
  cantidad. Este trabajo cambia solo lo que hace el agente (**D1**).
- **Descuentos geométricos por tamaño o relleno** (§6.7). Ya no existen y no se
  agregan: el cotizador fija el relleno al 100 % en piezas huecas o laminares
  (`effectiveInfill`), así que cumple T13.
- **Bonificación del modelado.** El agente nunca la promete. La aprobación con
  responsable, costo y recuperación (§12.1) es parte de la Fase 5.

---

## 4. Historias de usuario

**H1.** Como cliente con una pieza rota, quiero contar mi problema con mis
palabras y que me pregunten de a una cosa, sin que me hablen de CAD o STL.

**H2.** Como taller que consume una pieza todos los meses, quiero que me
ofrezcan una propuesta de suministro y no solo el precio de una unidad.

**H3.** Como empresa que necesita 120 unidades y no tiene el archivo, no quiero
ver primero un cobro aparte por diseño. Quiero que revisen el proyecto completo.

**H4.** Como cliente que necesita un diseño, quiero saber más o menos qué tan
complejo es, cuánto podría costar y qué dato cambiaría el precio.

**H5.** Como asesor de CESGAR, quiero recibir por WhatsApp un resumen con
perfil, pieza, cantidad, muestra, función, riesgos, clase y pendientes, para no
volver a preguntarle todo al cliente.

**H6.** Como responsable de CESGAR, quiero cambiar los umbrales y las tarifas de
referencia desde el panel y saber con qué versión se calculó cada estimado.

**H7.** Como responsable de CESGAR, quiero ver cuántas conversaciones son de
talleres o empresas, por qué se derivan y cuántas oportunidades de volumen
llegan.

---

## 5. Requisitos

Formato: *R.n* es el requisito y, debajo, cómo se comprueba. «El agente» es el
modelo con su prompt; «el servidor» son las tools y los endpoints. Lo que diga
«el servidor» no depende de que el modelo obedezca.

### R1. Parámetros comerciales (§16.5, §20)

- **R1.1** Los valores de §16.5 se editan en `/admin/asistente`, no en el
  código: `MODEL_HOURLY_RATE_COP` (45.000), `MODEL_MIN_PRICE_COP` (25.000),
  `SCAN_SMALL/MEDIUM/LARGE_FROM_COP` (80.000 / 130.000 / 220.000),
  `MESH_CLEANUP_FROM_COP` (30.000), `CAD_RECONSTRUCTION_FROM_COP` (250.000),
  `Q_EVALUAR` (25), `Q_VOLUMEN_MIN` (50), `Q_INDUSTRIAL_PRIORITY` (100) y
  `PRICE_LIST_VERSION` («v5.0-pilot»). También las horas guía de C1–C6 (§16.1).
- **R1.2** Cada valor de tarifa se puede dejar **vacío**. Vacío significa
  «falta» y la tool correspondiente responde *derivar*, como pide la columna
  «Si falta» de §16.5. Nunca se usa un valor de fábrica en silencio.
- **R1.3** Dos interruptores, apagados de fábrica: «Mostrar precio de modelado
  al cliente» y «Mostrar tarifas de escaneo al cliente». Apagados, el agente da
  la clase y las horas, pero no el precio, y deriva (**D2**, **D3**).
- **R1.4** Guardar exige `PRICE_LIST_VERSION` y registra quién y cuándo (el
  usuario del panel y la fecha). El servidor rechaza umbrales que no cumplan
  `Q_EVALUAR < Q_VOLUMEN_MIN ≤ Q_INDUSTRIAL_PRIORITY` y horas guía que no
  crezcan de C1 a C5.
- **R1.5** El enlace de WhatsApp sigue en `lib/contacto.ts`: ya es el número
  real que usa el sitio, así que T15 no puede ocurrir. No se agrega un campo
  para editarlo.

### R2. Ficha de la solicitud (§3, §17.1, §27)

- **R2.1** Cada conversación tiene **una ficha**, con los campos de los
  contratos §17.1 y §27 (adaptados en design §3): perfil, intención, pieza,
  aplicación (vehículo o equipo), muestra, dimensiones en texto, demanda
  (cantidad inicial de una referencia, consumo mensual, recurrencia, canal,
  varias referencias), requisitos técnicos, uso crítico, evaluación de
  modelado y ruta comercial.
- **R2.2** El agente actualiza la ficha con una tool cada vez que el cliente
  aporta un dato que cambia la clasificación. El servidor **mezcla** lo nuevo
  con lo guardado: un campo que no viene se conserva (T16).
- **R2.3** La tool devuelve los **datos faltantes** en orden de importancia
  para la intención. El agente pregunta solo el primero: una pregunta por turno
  (§25.1).
- **R2.4** Un dato que el cliente no sabe se registra como `UNKNOWN` y deja de
  figurar como faltante. No bloquea el flujo (T23).
- **R2.5** La ficha se guarda en la conversación y sobrevive a recargar la
  página. El navegador no puede escribirla: solo la tool, en el servidor.
- **R2.6** La ficha **no** guarda nombre, teléfono, correo, dirección ni
  documento. El tipo de negocio y el nombre de la empresa sí, si el cliente los
  dice (**D6**).

### R3. Perfil del cliente (§11)

- **R3.1** Perfiles: `INDIVIDUAL` (A), `WORKSHOP_CONSUMER` (B1), `RESELLER`
  (B2), `COMPANY` (B3) y `UNKNOWN`. Los asigna el agente a partir de las
  señales de §11.1.
- **R3.2** Con el perfil en `UNKNOWN`, el primer faltante es el perfil. El
  agente hace una sola pregunta aclaratoria («¿Necesitas esta pieza para
  reparar algo puntual o trabajas en un taller o negocio donde la usas o la
  vendes?»). No la hace si el cliente ya lo dijo.
- **R3.3** Pedir muchas unidades **no** convierte al cliente en revendedor. El
  canal de reventa (`RESALE`) solo se registra si el cliente lo dice (§11.1,
  última línea).
- **R3.4** El perfil no cambia precios. Solo cambia la ruta (R4) y lo que se le
  pasa al asesor.

### R4. Ruta comercial por volumen (§12, §14)

- **R4.1** El servidor calcula la ruta. El modelo no la elige. Usa una función
  pura con la ficha y los umbrales de R1:

  | Ruta | Se activa con |
  |---|---|
  | `INDUSTRIAL_PRIORITY` | cantidad inicial ≥ `Q_INDUSTRIAL_PRIORITY`, o consumo mensual ≥ `Q_INDUSTRIAL_PRIORITY` |
  | `VOLUME` | cantidad inicial ≥ `Q_VOLUMEN_MIN` |
  | `EVALUATE` | cantidad inicial ≥ `Q_EVALUAR`, recurrencia semanal, mensual o trimestral, varias referencias, o canal de reventa |
  | `SMALL_BATCH` | cantidad inicial de 10 a `Q_EVALUAR − 1` |
  | `INDIVIDUAL` | todo lo demás, incluida la cantidad desconocida |

  Gana la primera fila que se cumple.
- **R4.2** La cantidad es **por referencia**. Referencias distintas no se suman
  para llegar a un umbral (§12). Varias referencias activan `EVALUATE` por sí
  mismas.
- **R4.3** `VOLUME` e `INDUSTRIAL_PRIORITY`: **WhatsApp obligatorio**. El agente
  no da precio de modelado aparte ni propone el carrito para esa referencia, y
  usa el mensaje de §5.6 o §14. El servidor lo hace cumplir (R4.5).
- **R4.4** `EVALUATE`: el agente puede cotizar si hay archivo, pero **ofrece**
  WhatsApp para una propuesta de suministro (T04, T05).
- **R4.5** `cotizar_archivo` y `comparar_opciones` con cantidad ≥ `Q_VOLUMEN_MIN`
  no devuelven precio: devuelven `tipo: 'volumen'`. Por eso no hay código Q- que
  agregar al carrito. `/api/cotizador/carrito` rechaza un ítem del asistente con
  cantidad ≥ `Q_VOLUMEN_MIN` (**D1**).
- **R4.6** `catalog_opportunity` (producto candidato, §12) es una marca aparte
  de la ruta. La pone el agente si el cliente menciona que otros talleres o
  clientes piden la misma pieza (T08). Solo se registra y se pasa al asesor; no
  cambia el precio.
- **R4.7** El agente nunca promete precio mayorista, modelado gratis ni
  descuentos que no estén en la tabla (§12, §8.4).

### R5. Preclasificación del modelado 3D (§4, §22–§27)

- **R5.1** El agente lee la descripción y registra en la ficha los **seis
  factores** de §4.2 (geometría, detalles, ensamble, referencias, precisión y
  desarrollo), cada uno con 0, 1, 2 o desconocido. También registra las
  **operaciones CAD probables** de §27: `EXTRUDE`, `REVOLVE`, `SHELL`,
  `PATTERN`, `LOFT`, `FREEFORM_SURFACE`, `ASSEMBLY`, `FIT_TOLERANCE` y
  `KINEMATICS`.
- **R5.2** El servidor calcula la clase. El modelo no la elige.
  - El factor desconocido se evalúa en 0 y en 2. De ahí salen `class_min` y
    `class_max`, con la tabla de suma de §4.2.
  - Las operaciones imponen un piso: `KINEMATICS` y `FREEFORM_SURFACE` → C4;
    `ASSEMBLY`, `FIT_TOLERANCE` y `LOFT` → C3 (sale de la tabla de §22).
  - Así, el rango se abre por falta de datos y no por el nombre de la pieza
    (§4, §23).
- **R5.3** Confianza: alta sin factores desconocidos; media con 1 o 2; baja con 3
  o más (§4.5). Cada factor desconocido aparece como faltante, con la pregunta
  mínima de §22 que le corresponde.
- **R5.4** Horas: desde las horas mínimas de `class_min` hasta las máximas de
  `class_max` (tabla de §16.1, en los parámetros). Si el rango llega a C6, no
  hay horas máximas.
- **R5.5** Precio:
  `máx(MODEL_MIN_PRICE_COP, horas × MODEL_HOURLY_RATE_COP)` en cada extremo,
  redondeado a la centena. Ejemplos con los valores de fábrica: C1 → $25.000;
  C2 → $25.000–$45.000; C3 → $45.000–$90.000; C2–C3 → $25.000–$90.000;
  C4 → $90.000–$180.000; C5 → $180.000–$360.000.
- **R5.6** Sin precio (`tipo: 'revision'`) cuando:
  - el rango llega a C6;
  - hay uso crítico (R6);
  - la precisión es 2 («tolerancia crítica», §23);
  - falta la tarifa o el mínimo (R1.2);
  - o el interruptor de R1.3 está apagado. En este caso sí se muestran la clase
    y las horas.
- **R5.7** C5 lleva precio, con la nota «revisión técnica recomendada antes de
  confirmar precio y plazo» (§16.1, §24).
- **R5.8** Sin modelado (`tipo: 'no-requiere'`) si el cliente tiene un archivo
  listo y no pide cambios (§5.2, §16.1, T11).
- **R5.9** Con la ruta en `VOLUME` o `INDUSTRIAL_PRIORITY` no se muestra un
  precio de modelado aparte (`tipo: 'en-propuesta'`): el modelado entra en la
  propuesta de WhatsApp (§5.2, T07).
- **R5.10** Todo resultado se rotula «Estimado preliminar · por texto» y dice
  qué dato podría cambiarlo (§25.1). Ningún resultado se puede pagar.
- **R5.11** El estimado se guarda como cotización `M-XXXX`, con una copia de los
  parámetros usados (R9), y se puede citar al derivar.

### R6. Piezas críticas y revisión humana (§7.2, §8.3, §17.2)

- **R6.1** Uso crítico: frenos, dirección, suspensión, airbags, cinturones,
  estructuras, presión, combustible y sistemas de seguridad. Lo marca el agente
  (`critical_use`). Además, el servidor busca esas palabras en la descripción,
  la aplicación y la función, y lo marca aunque el modelo no lo haya hecho.
- **R6.2** Con uso crítico: no hay estimado de modelado ni rango sin archivo, y
  `next_action = TECHNICAL_REVIEW`. El agente explica que esa pieza necesita
  revisión técnica y deriva (T10). Si hay STL, `cotizar_archivo` responde
  `tipo: 'revision'`, sin precio.
- **R6.3** En reproducción o ingeniería inversa, el agente aclara que copiar la
  geometría no garantiza las mismas propiedades mecánicas que la pieza original
  (§7.2, punto 5).
- **R6.4** Si el cliente exige CAD editable, exclusividad o cesión de derechos,
  el agente lo registra (`ip_request`) y deriva: ese alcance se cotiza aparte
  (T09, §12.1).

### R7. Escaneo, mantenimiento e ingeniería inversa (§7)

- **R7.1** Escaneo: una tool devuelve las tarifas «desde» de R1 (pequeño,
  mediano, grande, limpieza de malla y reconstrucción CAD), siempre con la
  palabra «desde». También devuelve la condición de cada una (§16.2) y la
  aclaración de que el escaneo no incluye un CAD editable (§3.2). Si falta un
  valor o el interruptor está apagado, no da cifras y deriva.
- **R7.2** Mantenimiento: el agente pregunta marca, modelo, síntoma y cambios
  recientes, de a uno. No diagnostica una falla definitiva (§7.3). Después
  busca repuestos en la tienda si aplica, o deriva.
- **R7.3** Repuestos: solo muestra referencias, precios, stock y enlaces que
  devolvió `buscar_productos`. No afirma compatibilidad (§7.4).

### R8. Canal solo de texto (adenda v5.1, §25)

- **R8.1** El chat acepta texto y archivos STL. El STL lo mide el servidor, no
  el modelo (**D7**). Si el cliente suelta una imagen, un video o un PDF, el
  chat no lo sube. Muestra «Este chat recibe texto y archivos STL. Las fotos
  envíalas por WhatsApp», con el botón de WhatsApp y el resumen ya armado
  (T22).
- **R8.2** El agente no pide fotos en el chat. Cuando las necesita, ofrece
  WhatsApp. Si el cliente no quiere usar WhatsApp, sigue con una preevaluación
  textual y aclara que sin evidencia no confirma geometría, compatibilidad ni
  precio final (§25.1).
- **R8.3** El agente nunca dice que vio, analizó o reconoció una imagen.

### R9. Niveles de precio y versión (§8.2, §17.2)

- **R9.1** Cada tarjeta con precio dice su nivel:
  - «Estimado preliminar»: rango sin archivo y modelado;
  - «Desde»: escaneo;
  - «Cotización calculada»: STL cotizado.

  La «Cotización confirmada» solo la emite un asesor: el agente nunca usa ese
  rótulo.
- **R9.2** Cada cotización guardada (`Q-`, `E-` y `M-`) incluye
  `PRICE_LIST_VERSION` y una copia de los parámetros con que se calculó. Las
  `Q-` y `E-` guardan además la fecha de las tarifas del cotizador.
- **R9.3** Las tarjetas dicen qué incluye y qué no. Por ejemplo, una impresión
  no incluye diseño, y el modelado no incluye impresión, escaneo ni impuestos
  (§8.4, §9.1).

### R10. Derivación con resumen (§5.5–§5.7, §14, §25.1)

- **R10.1** `derivar_a_asesor` lleva un **motivo**: `VOLUME`, `RECURRING`,
  `RESALE`, `CRITICAL`, `MODELING_REVIEW`, `PHOTOS_NEEDED`, `OVERSIZE`, `SCAN`,
  `MAINTENANCE`, `IP_REQUEST`, `CUSTOMER_ASKED` u `OTHER`.
- **R10.2** El mensaje de WhatsApp lo arma el servidor con la ficha y las
  cotizaciones:
  - el tipo de oportunidad;
  - el perfil y la empresa, si la dijo;
  - la pieza y su aplicación;
  - la cantidad y la recurrencia;
  - las referencias o la muestra disponible;
  - las dimensiones y los requisitos;
  - la clase preliminar y la confianza;
  - los riesgos;
  - los pendientes;
  - el motivo.

  Los precios salen de los códigos, como hoy.
- **R10.3** El mensaje no pasa de 1.500 caracteres. Si no cabe, se recortan
  primero los pendientes y luego los requisitos, nunca el motivo ni la pieza.
- **R10.4** «Hablar con una persona», sin pasar por el modelo, también usa la
  ficha guardada si existe.
- **R10.5** El agente acompaña el enlace con el mensaje de §5.6 (volumen sin
  modelo), el de §14 (suministro) o el de §25 (fotos), según el motivo.

### R11. Indicadores (§9.3, §15.2)

- **R11.1** En la vista 7, nuevos filtros: perfil, ruta y motivo de derivación.
- **R11.2** Indicadores nuevos por periodo:
  - el porcentaje de conversaciones con perfil identificado;
  - la distribución por perfil;
  - las oportunidades de volumen (`VOLUME` + `INDUSTRIAL_PRIORITY`) y cuántas
    terminaron derivadas;
  - las derivaciones por motivo;
  - la distribución de clases de modelado;
  - los estimados de modelado emitidos.
- **R11.3** El CSV agrega perfil, ruta, motivo, clase mínima y máxima, y
  `catalog_opportunity`.
- **R11.4** Lo que necesita pedidos o datos reales queda para la Fase 5:
  - horas estimadas contra reales;
  - preliminar contra confirmado;
  - rentabilidad por servicio;
  - recuperación de desarrollo.

### R12. Pruebas de aceptación

- **R12.1** `verify:agente` agrega las situaciones T01, T03–T11 y T15–T24 de §18
  y §28, con las reglas nuevas de la vista 6:
  - «Segmenta al cliente»;
  - «Ruta de volumen»;
  - «Escala piezas críticas»;
  - «Modelado preliminar»;
  - «Solo texto»;
  - «No repite preguntas».

  T02 y T14 necesitan la Fase 5. T12 y T13 se cumplen sin modelo; las cubre
  `verify:clasificador`.
- **R12.2** Un script nuevo, `npm run verify:clasificador`, prueba sin modelo
  ni base de datos las funciones puras: ruta por volumen, clase C1–C6, precio
  de modelado, palabras críticas, mezcla de la ficha, faltantes y armado del
  resumen.
- **R12.3** Ningún modelo queda aprobado sin pasar la lista nueva. Como la lista
  vigente cambia, **los modelos aprobados hoy dejan de estarlo** hasta volver a
  correr el script (design §9).

---

## 6. Requisitos no funcionales

- **N1. La IA conversa, el servidor decide.** Ruta, clase, horas, precio,
  escalado crítico y armado del resumen son funciones puras y deterministas. El
  modelo solo aporta lecturas del texto: factores, operaciones, perfil,
  recurrencia y canal.
- **N2. Costo.** La ficha no puede duplicar el costo por conversación. Medido con
  `verify:agente`, el costo medio sube como mucho un 50 % sobre el actual
  (≈ US$0,0013–0,002).
- **N3. Prompt cacheable.** El prompt sigue fijo, sin tarifas ni umbrales: esos
  valores llegan por las tools.
- **N4. Sin migraciones manuales.** Las columnas nuevas entran por `db push` en
  la build, en los dos schemas, y pasan `verificar-schemas`.
- **N5. Retrocompatible.** Una conversación guardada antes del cambio se retoma
  sin error: sin ficha, todo arranca en `UNKNOWN`.

## 7. Decisiones tomadas (2026-11-22)

Los choques entre la v5.1 y el sistema actual se resolvieron con las
recomendaciones de esta spec. La columna de la derecha dice qué le queda a
CESGAR: son datos o aprobaciones de negocio, no cambios de diseño. Los
interruptores de R1.3 permiten cambiar D2 y D3 sin desplegar.

| # | Choque | Decisión | Le queda a CESGAR |
|---|---|---|---|
| **D1** | Hoy la tabla da −30 % desde 50 unidades y el carrito lo acepta. La v5.1 pide WhatsApp obligatorio y «sin descuento automático» desde `Q_VOLUMEN_MIN` (T06). | **En el agente**, desde `Q_VOLUMEN_MIN` (50) por referencia, no hay precio ni carrito: se deriva a WhatsApp (R4.3, R4.5). **`/cotizador/modelo` y su tabla de descuentos no cambian**: el cliente que sube su STL ahí sigue comprando como hoy. | Decidir aparte, si quiere, el tope del cotizador manual. |
| **D2** | §20 da el precio de modelado ($45.000/h, mínimo $25.000) por «cerrado para desarrollo», pero §16 pide aprobarlo antes de publicarlo. | Se construye completo. El interruptor «Mostrar precio de modelado» arranca **apagado**: el agente da la clase y las horas, y deriva (R1.3, R5.6). | Aprobar las tarifas y encender el interruptor desde `/admin/asistente`, que registra quién y cuándo. |
| **D3** | Las tarifas «desde» de escaneo son propuestas sujetas a validación (§7.1, §16.2). | Igual que D2: el interruptor «Mostrar tarifas de escaneo» arranca **apagado** (R1.3, R7.1). | Igual que D2. |
| **D4** | El cotizador cobra por volumen (`calcCost`). La v5.1 pide no emitir precio final automático sin la tabla de costos y el laminador (§16.3, T12). | **Las ventas no se apagan.** El precio actual sale de las tarifas que CESGAR ya configuró en `/admin/cotizador`, así que es una «Cotización calculada» (R9.1), no un «precio final». El laminador es la Fase 6. | Responder las preguntas de §6.9 y entregar la tabla de costos (§20, puntos 2–5) cuando quiera abrir la Fase 6. |
| **D5** | La v5.1 pide un registro de piezas (§15), y `Product` no tiene vehículo, OEM ni estados. | Para la Fase 5, **una entidad `Part` aparte**, que se liga a un `Product` cuando la referencia llega a `CATALOGO_ACTIVO`. La tienda no cambia. | Cargar las 20–30 referencias reales (§21, fase 2) y nombrar a quien valida las coincidencias. |
| **D6** | §5.5 y §14 piden nombre y contacto de empresas. El asistente actual no pide datos personales. | **No se piden en el chat**: el contacto llega cuando el cliente escribe por WhatsApp. La ficha guarda el tipo de negocio y el nombre de la empresa solo si el cliente los dice (R2.6). | Nada. |
| **D7** | La adenda dice «solo texto», pero §2.1 y T11 aceptan STL. | **Se mantiene el STL**: lo mide el servidor y el modelo nunca lo «ve», así que no contradice la adenda. Las imágenes, los videos y los PDF se rechazan con el aviso de WhatsApp (R8.1). | Nada. |
| **D8** | La v5.1 pide registrar quién aprueba bonificaciones e inversiones de desarrollo (§12.1, §20, punto 7). | **El agente nunca las promete** (R4.7), así que no bloquea la Fase 4. En la Fase 5, la aprobación se registra con el usuario del panel que la hace (P5). | Nombrar al responsable antes de la Fase 5. |

## 8. Fase 5: requisitos del registro de piezas (sin diseño)

La entidad ya está decidida (D5). Se diseñan cuando CESGAR cargue las
referencias y nombre a los responsables (D5, D8):

- **P1.** Entidades separadas, como pide §15: CLIENTE, SOLICITUD (la ficha de la
  Fase 4), PIEZA, DESARROLLO, SKU/CATÁLOGO, COTIZACIÓN y PEDIDO. Varias
  solicitudes apuntan a un mismo `part_id`.
- **P2.** Estados de referencia de §13.1: `NO_REGISTRADA`, `EN_EVALUACION`,
  `EN_DESARROLLO`, `VALIDADA`, `CATALOGO_ACTIVO`, `PAUSADA` y `DESCARTADA`. Solo
  `CATALOGO_ACTIVO` se ofrece como disponible.
- **P3.** Búsqueda (§15.1): primero por OEM verificado; si no hay, por marca,
  modelo, año, versión, ubicación y función. Una coincidencia incierta crea un
  candidato o un posible duplicado y nunca se fusiona sola (T14).
- **P4.** Una tool `buscar_referencia` distingue `CANDIDATE` de `VERIFIED` (T02).
- **P5.** Aprobación de inversión de desarrollo: responsable, costo, unidades de
  recuperación, precio objetivo, costo unitario, margen, plazo y derechos
  (§12.1).
- **P6.** Indicadores de demanda por pieza (§15.2): solicitudes a 30, 90 y 365
  días, clientes únicos, talleres interesados, demanda declarada contra real y
  recuperación del desarrollo.
- **P7.** Pantalla de administración para revisar candidatos, cambiar estados y
  ligar una pieza a un producto de la tienda.
