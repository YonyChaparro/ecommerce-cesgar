# Diseño: el asistente como asesor comercial y técnico (spec v5.1)

Estado: **construido** (T0–T8), con las decisiones D1–D8 de requirements §7. Fecha: 2026-11-22. Lo que cambió al construir está en §11.
Documentos hermanos: [`requirements.md`](requirements.md) (qué) · [`tasks.md`](tasks.md) (en qué orden).
Fuente: [`fuente-v5_1.pdf`](fuente-v5_1.pdf).
Base: la arquitectura de [`../agente-cotizador/propuesta.md`](../agente-cotizador/propuesta.md) §6 y §8,
y sus cambios en [`../agente-cotizador/design.md`](../agente-cotizador/design.md).

Este documento describe solo lo que cambia. Lo que no se nombra sigue igual:
streaming, `fusion.ts`, límites por IP, carrito con confirmación, envío,
retención de 90 días y OpenRouter con respaldos.

---

## 1. Idea central

Hoy el modelo conversa y las tools calculan precios. La Fase 4 aplica el mismo
principio a la **clasificación**:

```
cliente ──texto──▶ modelo ──lecturas del texto──▶ actualizar_ficha (servidor)
                                                     │
                     ┌───────────────────────────────┤ funciones puras
                     ▼                               ▼
          ruta comercial (25/50/100)     clase C1–C6, horas, confianza
          uso crítico (palabras)         faltantes en orden
                     └──────────────┬────────────────┘
                                    ▼
                    ficha guardada en ChatSession + next_action
                                    │
       ┌──────────────┬─────────────┼──────────────┬───────────────┐
       ▼              ▼             ▼              ▼               ▼
   preguntar     cotizar_archivo  estimar_modelado  consultar_escaneo  derivar_a_asesor
   (1 faltante)  estimar_rango    (M-XXXX)          («desde»)          (resumen desde la ficha)
```

El modelo nunca elige la ruta, la clase ni el precio. Aporta las lecturas del
texto: perfil, recurrencia, canal, factores y operaciones. El servidor las
convierte en decisiones con reglas que `verify:clasificador` prueba sin modelo.

## 2. Módulos nuevos

Todos en `lib/asistente/`. Los que dicen **puro** no importan `prisma`,
`server-only` ni `next/*`: los usan los scripts.

| Módulo | Qué hace |
|---|---|
| `parametros-tipos.ts` (**puro**) | `ParametrosComerciales`, `DEFAULT_PARAMETROS`, `validarParametros()`. |
| `parametros.ts` | `getParametros()` y `saveParametros()` sobre `Setting` (clave `agente_parametros`), con el patrón de `config.ts`: nunca lanza y mezcla con los defaults. |
| `ficha.ts` (**puro**) | El tipo `Ficha`, `FICHA_VACIA`, `mezclarFicha(guardada, parcial)` y `faltantes(ficha)`. |
| `clasificador.ts` (**puro**) | `rutaComercial()`, `claseModelado()`, `precioModelado()`, `esUsoCritico()` y `siguienteAccion()`. |
| `resumen-asesor.ts` (**puro**) | `armarResumenAsesor(ficha, cotizaciones, motivo)`: arma el mensaje de WhatsApp de R10 con el tope de 1.500 caracteres. Reemplaza el uso de `armarMensajeAsesor` en la tool. Lo usa también el navegador. |
| `tools/actualizar-ficha.ts` | Tool nueva. |
| `tools/estimar-modelado.ts` | Tool nueva. |
| `tools/consultar-escaneo.ts` | Tool nueva. |

`mensaje-asesor.ts` conserva `detalleCotizacion`, `detalleEstimacion` y
`lineasDesdeConversacion`, que el resumen reutiliza para las líneas con precio.

## 3. Ficha

### 3.1 Tipo

Toma los contratos de §17.1 y §27 en un solo objeto, con los valores en inglés
de la v5.1 para que el CSV y el asesor vean los mismos códigos que la spec.

```ts
// lib/asistente/ficha.ts
export type Desconocido = 'UNKNOWN';
export type Punto = 0 | 1 | 2 | Desconocido;

export interface Ficha {
  version: 1;
  customer_profile: 'INDIVIDUAL' | 'WORKSHOP_CONSUMER' | 'RESELLER' | 'COMPANY' | 'UNKNOWN';
  business_name: string | null;            // solo si el cliente lo dice (D6)
  intent: 'REPLACE_PART' | 'REPRODUCE_PART' | 'BUY_CATALOG_PART' | 'RECURRING_SUPPLY'
        | 'CUSTOM_MANUFACTURING' | 'MODELING' | 'SCAN' | 'MAINTENANCE' | 'OTHER' | 'UNKNOWN';
  part: {
    description: string | null;            // con palabras del cliente
    application: string | null;            // dónde va instalada, qué hace
    vehicle_or_equipment: { make: string | null; model: string | null; year: string | null; version: string | null };
    physical_sample: 'COMPLETE' | 'FRAGMENTS' | 'SIMILAR_PART' | 'NONE' | 'UNKNOWN' | null;
    has_file: boolean | null;              // STL/CAD listo
    file_needs_changes: boolean | null;
    dimensions_text: string | null;        // "unos 12 x 8 cm", o 'UNKNOWN'
  };
  demand: {
    initial_quantity: number | Desconocido | null;   // de UNA referencia
    monthly_quantity_estimate: number | Desconocido | null;
    recurrence: 'ONE_TIME' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'VARIABLE' | 'UNKNOWN' | null;
    channel: 'OWN_USE' | 'RESALE' | 'BOTH' | 'UNKNOWN' | null;
    multiple_references: boolean | null;
    shared_demand_signal: boolean;         // otros talleres o clientes la piden (R4.6)
    city: string | null;                   // solo si afecta la logística
  };
  technical: {
    function: string | null;
    requirements: string | null;           // material, carga, temperatura, acabado…
    critical_use: boolean;                 // modelo OR palabras (R6.1)
    ip_request: boolean;                   // CAD editable, exclusividad, cesión (R6.4)
  };
  modeling: {
    factors: { geometria: Punto; detalles: Punto; ensamble: Punto; referencias: Punto; precision: Punto; desarrollo: Punto } | null;
    operations: Array<'EXTRUDE' | 'REVOLVE' | 'SHELL' | 'PATTERN' | 'LOFT' | 'FREEFORM_SURFACE' | 'ASSEMBLY' | 'FIT_TOLERANCE' | 'KINEMATICS'>;
  };
  // ── Lo calcula el servidor. El modelo no lo escribe ──────────────────────
  derived: {
    volume_route: 'INDIVIDUAL' | 'SMALL_BATCH' | 'EVALUATE' | 'VOLUME' | 'INDUSTRIAL_PRIORITY';
    catalog_opportunity: boolean;
    critical_by_keywords: boolean;
    class_min: Clase | null; class_max: Clase | null;
    hours_min: number | null; hours_max: number | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
    requires_human_review: boolean;
    whatsapp: 'REQUIRED' | 'OFFER' | 'NO';
    next_action: 'ASK' | 'SEARCH_CATALOG' | 'QUOTE' | 'TECHNICAL_REVIEW' | 'COMMERCIAL_WHATSAPP';
    missing: Faltante[];                   // en orden; el modelo pregunta el primero
    parameters_version: string;
  };
}
type Clase = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
interface Faltante { campo: string; pregunta: string }  // la pregunta sale de §22 o §11.1
```

`null` significa que no se preguntó y `UNKNOWN`, que el cliente no lo sabe
(R2.4). Solo `null` genera un faltante.

### 3.2 Mezcla (R2.2)

`mezclarFicha(guardada, parcial)` recorre el esquema, nunca la entrada.

- Un campo **ausente** en `parcial` conserva el valor guardado. Un `null`
  explícito no borra un valor: el modelo no puede «olvidar» un dato. Para
  corregirlo manda el valor nuevo.
- `operations` se une, sin duplicados. Si el cliente cambia de pieza, el modelo
  manda `reset_modeling: true` y las operaciones empiezan de cero.
- `critical_use` y `ip_request`, una vez en `true`, no vuelven a `false` en la
  misma conversación. Si el cliente se corrige («no, es una tapa decorativa»),
  el asesor lo verá en la transcripción. Para el agente, lo seguro es seguir
  escalando.
- `derived` se recalcula siempre, entero, después de mezclar.

### 3.3 Faltantes (R2.3)

`faltantes(ficha)` devuelve la lista según la intención. El orden refleja la
v5.1 (§13, §14, §25): primero lo que cambia la ruta y después lo que cambia el
precio.

| Intención | Orden |
|---|---|
| cualquiera | `customer_profile` (si es `UNKNOWN` y no hay señal) |
| `REPLACE_PART` / `REPRODUCE_PART` | `part.description` → `vehicle_or_equipment` (marca, modelo, año) → `part.application` → `physical_sample` → `demand.initial_quantity` → `technical.function` |
| `RECURRING_SUPPLY` o perfil B1/B2/B3 | `part.description` → `demand.initial_quantity` → `demand.recurrence` → `demand.channel` → `technical.requirements` |
| `MODELING` | `part.description` → `part.has_file` → factor desconocido con más peso (precisión → referencias → ensamble → geometría → detalles → desarrollo) → `part.dimensions_text` |
| `SCAN` | `part.description` → `part.dimensions_text` → si necesita CAD editable |
| `MAINTENANCE` | marca → modelo → síntoma (`part.description`) → cambios recientes (`technical.requirements`) |

Cada faltante trae la pregunta mínima en el tono de la v5.1. Por ejemplo, el
factor `ensamble` de un engranaje usa la de §22: «¿Con qué pieza engrana y
conoces el módulo?». Las preguntas son fijas, en `ficha.ts`. El modelo puede
reformularlas, pero no cambiar el dato que piden.

## 4. Clasificador (`clasificador.ts`)

### 4.1 Ruta comercial (R4)

```ts
export function rutaComercial(d: Ficha['demand'], p: Umbrales): Ruta {
  const q = typeof d.initial_quantity === 'number' ? d.initial_quantity : 0;
  const mes = typeof d.monthly_quantity_estimate === 'number' ? d.monthly_quantity_estimate : 0;
  if (q >= p.Q_INDUSTRIAL_PRIORITY || mes >= p.Q_INDUSTRIAL_PRIORITY) return 'INDUSTRIAL_PRIORITY';
  if (q >= p.Q_VOLUMEN_MIN) return 'VOLUME';
  const recurrente = d.recurrence === 'WEEKLY' || d.recurrence === 'MONTHLY' || d.recurrence === 'QUARTERLY';
  if (q >= p.Q_EVALUAR || recurrente || d.multiple_references === true || d.channel === 'RESALE' || d.channel === 'BOTH') return 'EVALUATE';
  if (q >= 10) return 'SMALL_BATCH';
  return 'INDIVIDUAL';
}
```

Casos de la v5.1:

| Caso | Ruta |
|---|---|
| T04: taller, 15 al mes | `EVALUATE` (por la recurrencia) |
| T05: 30 sin recurrencia | `EVALUATE` |
| T06: almacén, 50 para reventa | `VOLUME` |
| T07: 120 | `INDUSTRIAL_PRIORITY` |
| T11: 3 unidades | `INDIVIDUAL` |

`VARIABLE` no se cuenta como recurrente. Los umbrales de lanzamiento solo
nombran semanal, mensual y trimestral.

### 4.2 Clase de modelado (R5.2–R5.4)

```ts
const CORTES: Array<[number, Clase]> = [[2,'C1'],[4,'C2'],[6,'C3'],[8,'C4'],[10,'C5'],[12,'C6']]; // §4.2
const PISO: Partial<Record<Operacion, Clase>> = {
  KINEMATICS: 'C4', FREEFORM_SURFACE: 'C4', ASSEMBLY: 'C3', FIT_TOLERANCE: 'C3', LOFT: 'C3',
};

export function claseModelado(m: Ficha['modeling'], horas: HorasPorClase) {
  if (!m.factors) return null;
  const vals = Object.values(m.factors);
  const desconocidos = vals.filter((v) => v === 'UNKNOWN').length;
  const base = vals.reduce<number>((s, v) => s + (v === 'UNKNOWN' ? 0 : v), 0);
  const piso = máximaClase(m.operations.map((o) => PISO[o]).filter(Boolean));
  const min = máx(clasePorSuma(base), piso);
  const max = máx(clasePorSuma(base + 2 * desconocidos), min);
  return {
    class_min: min, class_max: max,
    hours_min: horas[min].min, hours_max: max === 'C6' ? null : horas[max].max,
    confidence: desconocidos === 0 ? 'HIGH' : desconocidos <= 2 ? 'MEDIUM' : 'LOW',
  };
}
```

Comprobaciones con §4.3, §26 y §28 (van en `verify:clasificador`):

| Entrada | Factores (g, d, e, r, p, dev) | Operaciones | Resultado |
|---|---|---|---|
| Buje de 10 × 20 mm (§26) | 0, 0, 0, 1, 1, 0 | REVOLVE | C1, alta |
| Piñón de 24 dientes, módulo 2, eje 8 (T18) | 1, 1, ?, 0, 1, 0 | PATTERN, REVOLVE | C2–C3, media |
| Caja para electrónica (T19) | 0, 1, 1, ?, 1, 0 | SHELL, EXTRUDE | C2–C3, media |
| Cuatro elementos atornillados (T20) | 1, 1, 2, ?, 1, ? | ASSEMBLY | C3–C5, media |
| Tapa lateral de Hilux 2015 (T17) | 2, 1, 1, ?, 1, ? | FREEFORM_SURFACE, FIT_TOLERANCE | C4–C5, media |
| Dos piezas que encajan y una desliza (T21) | 1, 1, 2, ?, 1, ? | FIT_TOLERANCE, ASSEMBLY | C3–C5, media |
| Hélice de 5 aspas (§26) | 2, 2, 1, ?, ?, ? | FREEFORM_SURFACE, PATTERN | C4–C6, baja → revisión |

La tabla se ajusta al escribir el script. Cada fila debe caer dentro del rango
que la v5.1 da para ese caso: el piñón y la caja en C2–C3; la tapa curva en
C3–C5; la hélice debe llegar a C6.

### 4.3 Precio de modelado (R5.5–R5.9)

```ts
export function precioModelado(c: ResultadoClase, p: ParametrosComerciales, f: Ficha): EstimadoModelado {
  if (f.part.has_file && f.part.file_needs_changes === false) return { tipo: 'no-requiere' };
  if (f.derived.volume_route === 'VOLUME' || f.derived.volume_route === 'INDUSTRIAL_PRIORITY') return { tipo: 'en-propuesta', ...c };
  const motivo = f.derived.requires_human_review ? (f.technical.critical_use ? 'critica' : c.class_max === 'C6' ? 'c6' : 'tolerancia')
               : p.MODEL_HOURLY_RATE_COP == null || p.MODEL_MIN_PRICE_COP == null ? 'sin-tarifa'
               : !p.publicarPrecioModelado ? 'no-publicado' : null;
  if (motivo) return { tipo: 'revision', motivo, ...c };     // clase y horas sí; precio no
  const precio = (h: number) => redondear100(Math.max(p.MODEL_MIN_PRICE_COP, h * p.MODEL_HOURLY_RATE_COP));
  return { tipo: 'estimado', ...c, min: precio(c.hours_min), max: precio(c.hours_max!), revisionRecomendada: c.class_max === 'C5' };
}
```

`requires_human_review` = `critical_use` o `critical_by_keywords`, o
`class_max === 'C6'`, o precisión `2`.

### 4.4 Uso crítico (R6.1)

`esUsoCritico(texto)` normaliza el texto (minúsculas, sin tildes) y busca
patrones de palabra completa:

```
freno|frenos|pastilla de freno|caliper|mordaza de freno
caja de direccion|columna de direccion|cremallera|terminal de direccion|rotula|direccion hidraulica
suspension|amortiguador|espiral de suspension|tijera
airbag|bolsa de aire|cinturon|pretensor
estructural|estructura portante|chasis
presion|alta presion|valvula de presion|cilindro de gas|tanque de gas
combustible|gasolina|diesel|inyector|bomba de gasolina
sistema de seguridad|dispositivo de seguridad|proteccion personal|casco
```

«Dirección» sola **no** cuenta, porque también es una dirección postal. Una
falsa alarma solo cuesta una derivación; un caso no detectado lo sigue cubriendo
el modelo con `critical_use`. Por eso la lista prefiere el exceso.

### 4.5 Siguiente acción

En orden, gana la primera condición que se cumple:

| Condición | `next_action` |
|---|---|
| `requires_human_review` o `ip_request` | `TECHNICAL_REVIEW` (`whatsapp: 'REQUIRED'`) |
| ruta `VOLUME` o `INDUSTRIAL_PRIORITY` | `COMMERCIAL_WHATSAPP` (`'REQUIRED'`) |
| hay faltantes | `ASK` (`'OFFER'` si la ruta es `EVALUATE`; si no, `'NO'`) |
| intención `BUY_CATALOG_PART` o `MAINTENANCE` | `SEARCH_CATALOG` |
| todo lo demás | `QUOTE` (`'OFFER'` si la ruta es `EVALUATE`) |

## 5. Tools

### 5.1 `actualizar_ficha` (nueva)

- **Entrada.** El parcial de la ficha, sin `derived`, más `reset_modeling?`. Todos
  los campos son opcionales, con zod y `.describe()` cortos (el esquema completo
  pesa en tokens; ver N2). Tope: textos de 140 caracteres y
  `dimensions_text` de 80.
- **Ejecución.**
  1. Lee la ficha guardada.
  2. `mezclarFicha`.
  3. `critical_by_keywords = esUsoCritico(descripción + aplicación + función + requisitos)`.
  4. Calcula `derived` con los parámetros vigentes.
  5. Guarda en `ChatSession`: `ficha` y las columnas de métricas (§6).
- **Salida al modelo.** Solo lo que necesita para conversar: `perfil`, `ruta`,
  `whatsapp`, `next_action`, `primerFaltante` (`{campo, pregunta}` o `null`),
  `requiereRevision` y su motivo, y la clase en texto («C2–C3, confianza
  media») si existe. Nunca devuelve tarifas.
- **Sin tarjeta.** La ficha no se le muestra al cliente. En el chat aparece como
  `FichaTool` gris («Anotado»), igual que las tools sin tarjeta. En
  `/admin/asistente/conversaciones/[id]` se ve la ficha completa.

Cuándo la llama el agente (prompt §7): en cuanto el cliente da un dato de perfil,
pieza, cantidad, recurrencia, canal, muestra, función o geometría. Una llamada
por turno, con todo lo nuevo de ese turno.

### 5.2 `estimar_modelado` (nueva)

- **Entrada:** `{ descripcion: string }`. La clase sale de la ficha guardada y no
  de la entrada: el modelo no puede pedir «C1» para abaratar.
- **Ejecución.** Si la ficha no tiene factores, falla con el mensaje «Primero
  registra los factores con actualizar_ficha». Si los tiene, llama
  `claseModelado` y `precioModelado`, y guarda `ChatQuote` con `tipo: 'modelado'`,
  código `M-XXXX` y `datos = { descripcion, ficha.modeling, clase, horas,
  resultado, parametros: snapshot }`.
- **Salida (discriminada por `tipo`):**
  - `estimado`: `codigo`, `claseMin`, `claseMax`, `horasMin`, `horasMax`,
    `confianza`, `min`, `max`, `revisionRecomendada`, `operaciones` (en
    español), `podriaCambiar` (los dos primeros faltantes) y `noIncluye`.
  - `revision`: lo mismo, sin precio y con `motivo`.
  - `en-propuesta`: clase y horas, con el texto de §5.6.
  - `no-requiere`.
- **Tarjeta `TarjetaModelado`.**
  - Chip «C2–C3».
  - Rótulo «Estimado preliminar · por texto».
  - Horas de diseño.
  - Rango de precio, o «Lo cotiza un asesor» con el botón de WhatsApp.
  - «Puede cambiar si…», con los faltantes.
  - «No incluye impresión, escaneo ni impuestos».

### 5.3 `consultar_escaneo` (nueva)

- **Entrada:** `{ tamano?: 'pequeno' | 'mediano' | 'grande', necesitaCad?: boolean }`.
- **Salida:**
  - `tarifas`: filas `{servicio, desde, condicion}`, más la `aclaracion`
    («El escaneo entrega una malla; el CAD editable se cotiza aparte»).
  - `no-disponible`: falta un valor o el interruptor está apagado.
- **Tarjeta `TarjetaEscaneo`:** una lista con «desde $80.000» y el rótulo
  «Tarifas de referencia · confirmar con un asesor».
- No guarda cotización: no hay nada que citar con código, porque una tarifa
  «desde» no es un precio.

### 5.4 Cambios en tools existentes

| Tool | Cambio |
|---|---|
| `cotizar_archivo` | Antes de tarifar, lee la ficha. Con `cantidad ≥ Q_VOLUMEN_MIN`, devuelve `{ tipo: 'volumen', archivo, cantidad, medidasMm }` (R4.5). Con uso crítico, `{ tipo: 'revision', motivo: 'critica' }`. Si no, cotiza como hoy y agrega `nivel: 'calculada'` y la copia de los parámetros en `datos`. Registra `part.has_file = true` en la ficha. |
| `comparar_opciones` | Una fila con cantidad ≥ `Q_VOLUMEN_MIN` sale con `volumen: true` y sin precio. |
| `estimar_rango` | Con uso crítico, `{ tipo: 'revision' }`. Agrega `nivel: 'preliminar'` y la copia de los parámetros. |
| `agregar_al_carrito` | Sin cambios: corre en el navegador. El control está en `/api/cotizador/carrito` (abajo). |
| `derivar_a_asesor` | La entrada agrega `motivo` (enum de R10.1). Las `piezas` siguen igual, pero el mensaje se arma con `armarResumenAsesor(ficha, cotizaciones, motivo)`. Marca `ChatSession.derivacion = motivo` además de `resultado = 'derivado'`. |
| `buscar_productos` | Sin cambios. |

Otros cambios:

- **`/api/cotizador/carrito`:** rechaza `cantidad ≥ Q_VOLUMEN_MIN` en ítems
  `cotizador-*` que tengan `chatSessionId`, con el código `volumen` y el texto
  «Para esta cantidad te preparamos una propuesta por WhatsApp». La tarjeta de
  confirmación ya sabe pintar un `no-disponible`.
- **`codigos.ts`:** `TipoCodigo = 'Q' | 'E' | 'M'`. `PATRON_CODIGO` acepta `M`.
  `PATRON_COTIZACION` sigue solo con `Q`, porque solo `Q-` va al carrito.
- **Registro del chat:** `tarjetas/registro.tsx` suma `estimar_modelado` →
  `TarjetaModelado` y `consultar_escaneo` → `TarjetaEscaneo`.
  `actualizar_ficha` queda sin tarjeta.

### 5.5 Resumen para el asesor (R10)

Plantilla del mensaje (las líneas vacías se omiten):

```
Hola, vengo del asistente de cotización de Cesgar.
Motivo: Producción por volumen (50 unidades de una referencia).
Perfil: Taller revendedor · Repuestos El Cruce
Pieza: rejilla de ventilación central — Chevrolet Spark GT 2016, tablero
Cantidad: 50 iniciales · mensual (≈ 20/mes) · para reventa
Muestra: fragmentos · Medidas: unos 12 x 6 cm
Requisitos: ABS negro, encaje a presión
Modelado: C3–C4 preliminar (confianza media)
Riesgos: —
Pendientes: año exacto; ¿conserva los clips?
Cotizaciones: • Impresión de rejilla.stl (cotización Q-7F3K: 4 × $10.983).
Envío fotos de la pieza por aquí.
```

- La última línea va solo con el motivo `PHOTOS_NEEDED`, o si la muestra es
  `FRAGMENTS` o `NONE`: le recuerda al cliente que debe mandar las fotos él
  mismo (§25.1).
- Los textos del modelo pasan por el filtro `TIENE_PRECIO` de hoy.
- Tope de 1.500 caracteres. Se recorta en este orden: pendientes, requisitos,
  cotizaciones (deja la cuenta: «y 3 cotizaciones más»). Nunca se recortan el
  motivo, la pieza ni la cantidad.

## 6. Persistencia

### 6.1 `ChatSession`: columnas nuevas (los dos schemas)

```prisma
  ficha        String?  @db.Text   // JSON de Ficha (última versión)
  perfil       String?             // customer_profile, para filtrar
  ruta         String?             // derived.volume_route
  derivacion   String?             // motivo de la última derivación
  claseMin     String?
  claseMax     String?
  oportunidadCatalogo Boolean @default(false)

  @@index([perfil])
  @@index([ruta])
```

Son columnas aparte, además del JSON, porque la vista 7 filtra y cuenta por
ellas. Leer el JSON de miles de filas para contar no escala en MySQL compartido.

### 6.2 `ChatQuote`

Sin columnas nuevas. `tipo` admite `'modelado'`. `datos.parametros` guarda la
copia:

```ts
{ version: 'v5.0-pilot', fecha: '2026-11-22T…', valores: { MODEL_HOURLY_RATE_COP: 45000, MODEL_MIN_PRICE_COP: 25000, horas: {...} } }
```

Las `Q-` y `E-` guardan `{ version, tarifasCotizador: <updatedAt del Setting quoter_pricing> }`
y no la tabla entera, que ya es auditable por fecha.

### 6.3 `Setting agente_parametros`

```ts
export interface ParametrosComerciales {
  PRICE_LIST_VERSION: string;                     // obligatorio
  MODEL_HOURLY_RATE_COP: number | null;           // null = falta → derivar
  MODEL_MIN_PRICE_COP: number | null;
  horasPorClase: Record<'C1'|'C2'|'C3'|'C4'|'C5', { min: number; max: number }> & { C6: { min: number } };
  SCAN_SMALL_FROM_COP: number | null;
  SCAN_MEDIUM_FROM_COP: number | null;
  SCAN_LARGE_FROM_COP: number | null;
  MESH_CLEANUP_FROM_COP: number | null;
  CAD_RECONSTRUCTION_FROM_COP: number | null;
  Q_EVALUAR: number; Q_VOLUMEN_MIN: number; Q_INDUSTRIAL_PRIORITY: number;
  publicarPrecioModelado: boolean;                // D2, false de fábrica
  publicarTarifasEscaneo: boolean;                // D3, false de fábrica
  aprobadoPor: string | null; aprobadoEn: string | null;   // lo pone saveParametros
}
```

Los defaults son los de §16.5, con los dos interruptores apagados.

## 7. Prompt

El prompt sigue fijo (N3). Se reescriben **Tu trabajo** y se suman reglas. No
lleva cifras de tarifas ni umbrales: el agente ve la ruta y el faltante en la
salida de `actualizar_ficha`. Lo nuevo, en resumen:

1. **Rol.** «Asesor comercial y técnico inicial de Cesgar: diseño 3D, escaneo,
   ingeniería inversa, impresión, mantenimiento de impresoras y repuestos». Lo
   primero es entender la necesidad y el uso, no vender impresión (§1.2).
2. **Método.** Entender → orientar → proceso y entregable → estimar con tools →
   siguiente paso (§1.3).
3. **Ficha.** «Cuando el cliente dé un dato de perfil, pieza, cantidad,
   recurrencia, canal, muestra, función o geometría, llama actualizar_ficha con
   todo lo nuevo de ese turno. Pregunta solo el primerFaltante que devuelva, con
   tus palabras. Si el cliente no sabe un dato, regístralo como UNKNOWN y
   sigue.»
4. **Perfil.** La pregunta de §11.1, una sola vez. «Muchas unidades no significa
   que revenda.»
5. **Rutas.**
   - Con `whatsapp: REQUIRED`, deriva con `derivar_a_asesor`, con el motivo y el
     mensaje de §5.6 (volumen sin modelo) o de §14 (suministro). No des precio
     de modelado aparte ni propongas el carrito.
   - Con `OFFER`, cotiza si puedes y ofrece WhatsApp en una frase.
6. **Modelado.** Registra los seis factores y las operaciones probables con
   `actualizar_ficha` y luego llama `estimar_modelado`. Di la clase como
   preliminar y qué dato la cambiaría. No la conviertas en C5 o C6 solo porque
   la pieza suena técnica (§22).
7. **Críticas.** Para frenos, dirección, suspensión, airbags, cinturones,
   estructuras, presión, combustible o seguridad, marca `critical_use`. No des
   precio ni rango: deriva por revisión técnica.
8. **Reproducción.** Aclara que copiar la forma no garantiza las mismas
   propiedades mecánicas.
9. **CAD y derechos.** Si piden CAD editable, exclusividad o cesión, marca
   `ip_request` y deriva: se cotiza aparte.
10. **Solo texto.**
    - Este chat recibe texto y STL. No pidas fotos aquí: ofrécele al cliente
      enviarlas por WhatsApp.
    - Nunca digas que viste una imagen.
    - Si el cliente no quiere WhatsApp, sigue con una preevaluación y aclara
      que sin evidencia no confirmas geometría, compatibilidad ni precio
      final.
11. **Escaneo.** `consultar_escaneo`. Di «desde» y aclara que el CAD editable va
    aparte.
12. **Mantenimiento.** Marca, modelo, síntoma y cambios recientes, de a uno. No
    diagnostiques una falla definitiva. Busca repuestos o deriva.
13. **Niveles de precio.** Llama «estimado» a un rango y «cotización» al
    resultado de `cotizar_archivo`. Nunca digas «precio final» ni «cotización
    confirmada».
14. **Se elimina** la regla vieja «Diseño 3D, escaneo 3D y repuestos que no
    estén en la tienda: explica el servicio en una frase y ofrece pasar con un
    asesor».

Se conserva todo lo demás: precios solo de tools, sin descuentos, sin plazos,
sin datos personales, carrito con tarjeta y piezas de más de 30 cm derivadas.
La regla de datos personales suma una línea: «El tipo de negocio y el nombre de
la empresa no son datos personales; regístralos si el cliente los dice».

**Riesgo de longitud.** El prompt crece unas 450 palabras. Se mide su costo en
`verify:agente` (N2). Si sube demasiado, las reglas de mantenimiento y escaneo
pasan a la `description` de sus tools.

## 8. Interfaz

| Dónde | Cambio |
|---|---|
| `useSubidaStl` / `AdjuntoStl` | Antes del error `no-stl`, si la extensión o el MIME es de imagen, video o PDF, muestra el aviso `solo-texto`: «Este chat recibe texto y archivos STL. Las fotos envíalas por WhatsApp», con un botón que abre `enlaceWhatsApp(armarResumenAsesor(ficha…, 'PHOTOS_NEEDED'))`. La ficha llega en la respuesta del `GET` de la sesión. |
| `CajaTexto` | Al pegar una imagen en el textarea: mismo aviso. |
| `TarjetaCotizacion` | Rótulo «Cotización calculada» y la línea «No incluye diseño ni envío» (el envío tiene su tarjeta). |
| Tarjeta de estimación (`estimar_rango`) | El rótulo pasa de «Estimación · no se puede pagar» a «Estimado preliminar · no se puede pagar». |
| `TarjetaModelado`, `TarjetaEscaneo` | Nuevas (§5.2, §5.3). Usan `components/ia/` y los tokens `--color-ia-*`. |
| `TarjetaAsesor` | Muestra el motivo en una línea («Propuesta de suministro», «Revisión técnica»…). |
| Tarjeta `cotizar_archivo` con `tipo: 'volumen'` | «Para 50 unidades preparamos una propuesta de producción», con el botón de WhatsApp. Reutiliza `VistaConfirmacion` en el estado `no-disponible`. |
| `/admin/asistente` | Tarjeta nueva, «Parámetros comerciales»: los campos de §6.3 con `Campo` e `inputCls`, los dos interruptores, «Aprobado por … el …» y el botón Guardar. Se guarda con `actions.ts` → `validarParametros`. |
| `/admin/asistente/estados` | Ejemplos de `TarjetaModelado` (estimado, revisión, en propuesta), `TarjetaEscaneo`, el aviso `solo-texto` y la cotización con `volumen`. |
| `/admin/asistente/conversaciones` | Filtros perfil, ruta y motivo en la URL. Indicadores de R11.2. El detalle muestra la ficha (tabla de dos columnas) sobre la transcripción. Nuevas columnas en el CSV. |

## 9. Pruebas y despliegue

### 9.1 `verify:clasificador` (nuevo, sin red)

`scripts/verify-clasificador.ts`, con `tsx`. Afirmaciones sobre:

- `rutaComercial`: T04–T08 y T11, los bordes 9/10, 24/25, 49/50 y 99/100,
  `VARIABLE`, y referencias múltiples que no se suman.
- `claseModelado`: las filas de §4.2 de este documento, más el piso por
  operaciones y la confianza por número de desconocidos.
- `precioModelado`: los ejemplos de R5.5, C6 → `revision`, tarifa `null` →
  `revision/sin-tarifa`, interruptor apagado → `revision/no-publicado`, ruta
  `VOLUME` → `en-propuesta`, y archivo listo → `no-requiere`.
- `esUsoCritico`: positivos de la lista, más negativos («mi dirección es…»,
  «tapa decorativa», «soporte para celular»).
- `mezclarFicha`: conserva lo que no viene, `null` no borra, las operaciones se
  unen y `critical_use` no vuelve a `false`.
- `faltantes`: el orden por intención y que `UNKNOWN` no aparezca.
- `armarResumenAsesor`: la plantilla, el tope de 1.500 con su orden de recorte
  y sin precios del modelo.
- T13: STL hueco grande → `effectiveInfill = '100'`, sin descuento por caja.
- T12: con `MODEL_HOURLY_RATE_COP = null` no hay precio de modelado.

### 9.2 `verify:agente`

- `REGLAS` suma seis reglas (R12.1).
- Situaciones nuevas `s16`…, una por prueba de la v5.1, con su `comprobar`:

| Situación | Comprueba |
|---|---|
| T01 | `actualizar_ficha` con `INDIVIDUAL`; pregunta por el vehículo; no llama `estimar_modelado` en el primer turno |
| T03 | `physical_sample = FRAGMENTS`; ofrece WhatsApp para fotos |
| T04 | ruta `EVALUATE`; menciona WhatsApp |
| T05 | ruta `EVALUATE`; menciona WhatsApp |
| T06 | `RESELLER` + `VOLUME`; `derivar_a_asesor` con motivo `VOLUME`; sin precio |
| T07 | `COMPANY` + `INDUSTRIAL_PRIORITY`; no llama `estimar_modelado` con precio |
| T08 | `shared_demand_signal` |
| T09 | `ip_request`; deriva |
| T10 | `critical_use`; no llama `estimar_rango` ni `estimar_modelado` con precio; deriva con motivo `CRITICAL` |
| T11 | `cotizar_archivo` sin `estimar_modelado` |
| T15 | el enlace es `wa.me/573057956352` |
| T16 | no vuelve a preguntar la cantidad ni el vehículo ya dichos |
| T17–T21 | clase dentro del rango de §28 |
| T22 | cuando el cliente dice «te mando la foto», responde con WhatsApp y no pide adjuntarla |
| T23 | registra `UNKNOWN` y no se bloquea |
| T24 | no da precio definitivo; dice preliminar |

- **Consecuencia (R12.3).** Correr el script reescribe la lista vigente, así que
  los tres modelos aprobados dejan de estarlo hasta que se vuelvan a correr. En
  producción, el asistente se apaga solo (`modelo-no-aprobado`). El despliegue
  tiene que llevar el `validaciones.json` nuevo con al menos un modelo
  aprobado (tasks T9).

### 9.3 Orden de despliegue

1. Esquemas y parámetros. La build hace `db push`; las columnas son opcionales.
2. Código completo, con el `validaciones.json` ya regenerado.
3. En `/admin/asistente`: revisar los parámetros. Encender los interruptores
   solo cuando CESGAR apruebe D2 y D3.

## 10. Alternativas descartadas

- **Que el modelo devuelva la clase C1–C6 directamente.** Sería más simple,
  pero el resultado varía entre modelos y entre ejecuciones, no se puede probar
  sin red y contradice §23 («no sumar puntos de forma mecánica» se cumple con
  el piso por operaciones y el rango por desconocidos, no con el criterio
  libre del modelo).
- **Una ficha por pieza en vez de una por conversación.** La v5.1 la pide para
  la Fase 5 (PIEZA/SOLICITUD). Para la Fase 4, una conversación casi siempre
  trata una necesidad. Si el cliente cambia de pieza, `reset_modeling` alcanza,
  y las cotizaciones siguen siendo una por pieza.
- **Salida estructurada (`generateObject`) en cada turno, en vez de una tool.**
  Duplica las llamadas al modelo y el costo (N2). La tool se llama solo cuando
  hay datos nuevos.
- **Guardar las tarifas en `/admin/cotizador`.** Mezcla la impresión, que tiene
  checkout, con servicios que no se pagan en línea. Una tarjeta en
  `/admin/asistente` deja claro que son referencias del agente.

## 11. Cambios al construir (2026-11-22)

Lo que se apartó de este documento al implementarlo, y por qué. Las pruebas de
`verify:clasificador` y `verify:agente` ya reflejan estos cambios.

- **Ficha (§3.1).** Dos campos más:
  - `part.needs_cad`: el faltante «si necesita CAD editable» del escaneo
    (§3.3) necesitaba un campo. No se usa `ip_request`, que es exclusividad o
    derechos y deriva.
  - `modeling.customer_unknown`: los factores que el cliente dijo no saber.
    Siguen en `UNKNOWN` para la clase (se evalúan en 0 y 2), pero dejan de
    preguntarse. Sin esto, R5.3 («cada factor desconocido es un faltante») y
    R2.4 («UNKNOWN deja de ser faltante») chocaban y el agente repetía la
    pregunta (T23).
- **Mezcla (§3.2).** `UNKNOWN` no borra un perfil ni una intención ya
  conocidos (es su estado vacío). `shared_demand_signal` tampoco vuelve a
  `false`, como `critical_use` e `ip_request`.
- **Faltantes (§3.3).** El perfil no se pregunta en `MAINTENANCE` ni en
  `BUY_CATALOG_PART`: ahí no cambia la ruta. Un reemplazo pedido por un taller,
  revendedor o empresa usa primero el orden de suministro (cantidad,
  recurrencia, canal) y después el de la pieza.
- **Precio de modelado (§4.3).** El uso crítico va antes que la ruta de
  volumen: 200 piezas de freno siguen en revisión técnica, no «en propuesta».
- **Uso crítico (§4.4).** «Estructural» suelto no cuenta (el modelo describió
  un soporte de repisa como «soporte estructural»): cuenta con un vehículo o
  una construcción («estructural del chasis», «viga estructural»), además de
  «chasis» y «estructura portante». «Presión» precedida de «a», «al» o «por» no cuenta:
  «encaje a presión» y «cierre a presión» son encajes, y el ejemplo de la
  rejilla de §5.5 se escalaba por error. «Alta presión», «válvula de presión»,
  «tanque a presión» y similares sí cuentan.
- **`actualizar_ficha` (§5.1).** La salida suma `siguientePaso`: la
  instrucción concreta del turno (derivar con qué motivo, ofrecer WhatsApp,
  qué preguntar, ofrecer fotos cuando la muestra pasa a fragmentos o nada).
  La calcula el servidor con `next_action` y `whatsapp`. Sin ella, los modelos
  leían `whatsapp: OFFER` y no lo ofrecían (T05). La escala de los seis
  factores de §4.2 y los ejemplos de calibración de §4.3/§26 van en la
  `description` del esquema, no en el prompt (N3): sin ellos, el modelo
  marcaba casi todo `UNKNOWN` y los rangos llegaban a C6.
- **`derivar_a_asesor` (§5.4).** Guarda solo `ChatSession.derivacion`. El
  `resultado = 'derivado'` lo sigue marcando el clic en WhatsApp
  (`/api/cotizador/eventos`), para que «derivadas» y «oportunidades que
  terminaron derivadas» (R11.2) cuenten las que el cliente abrió y no las que
  el agente propuso. `piezas` puede ir vacía: el resumen ya sale de la ficha.
- **`comparar_opciones` (§5.4).** Las filas de volumen llevan
  `precioUnitario`, `descuentoPct` y `total` en `null`, y `volumen: true`.
- **Ficha en el navegador (§8).** `GET /api/cotizador/chat?id=…&solo=ficha`
  devuelve solo la ficha. El navegador la vuelve a pedir al terminar cada
  respuesta, para que «Hablar con una persona» use la ficha vigente.
- **Solo texto (§8).** Además de pegar, la caja de texto acepta soltar un
  archivo: un STL se sube como siempre; una imagen, un video o un PDF muestran
  el aviso.
- **`verify:agente` (§9.2).** `--solo s16,s20` corre solo esas situaciones y no
  escribe `validaciones.json`, para ajustar el prompt sin gastar la corrida
  completa. El script imprime aparte el costo medio de s01–s15 para comparar
  con el medido antes (N2).
- **Costo (N2).** El prompt va como mensaje de sistema con punto de caché
  (`INSTRUCCIONES_ASISTENTE` en `prompt.ts`): Anthropic cachea las tools y el
  prompt solo si se marcan. Sin la marca, las situaciones s01–s15 costaban
  ≈ US$0,0052 por conversación con claude-haiku-5.5 (antes de la v5, US$0,002:
  +160 %); con la marca, ≈ US$0,0016. Los modelos que cachean solos la ignoran.
