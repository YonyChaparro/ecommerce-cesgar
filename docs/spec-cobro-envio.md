# Spec — Cobrar el envío dentro del pago

Estado: **propuesta, sin implementar**. Fecha: 2026-07-26.

Objetivo: que el cliente vea el costo de envío antes de pagar, que ese costo se
cobre en la pasarela junto con los productos, y que quede guardado y desglosado
en la orden, el correo y el panel.

Hoy no se cobra nada por envío: el checkout muestra la línea "Envío — A
confirmar", el total que se manda a MercadoPago es solo la suma de los ítems, y
en la base no existe ninguna columna donde guardar un costo de envío.

---

## 1. Principios que hereda del código existente

Estas no son decisiones nuevas: son las convenciones que ya sigue el cotizador y
que este trabajo debe respetar para no introducir un patrón distinto.

1. **El servidor es la única fuente de verdad del precio.** El navegador calcula
   para *mostrar*; `/api/checkout` recalcula para *cobrar*. Es literalmente lo
   que dice el encabezado de `lib/quoter-rules.ts`.
2. **La lógica de cálculo vive en un módulo compartido**, no dentro del
   componente, para que la cuenta del navegador y la del servidor sean la misma
   función. Precedente: `lib/quoter-calc.ts` + `lib/quoter-rules.ts`.
3. **La configuración editable vive en la tabla `Setting`** como un JSON, con un
   módulo `get*/save*` que mezcla con los valores por defecto para que un campo
   nuevo nunca llegue `undefined`. Precedente exacto: `lib/quoter-config.ts`
   (`key: 'quoter_pricing'`).
4. **Lo que el navegador manda como precio solo sirve para detectar
   manipulación**, nunca para cobrar. Ver el campo `price` en `CartItemInput` de
   `app/api/checkout/route.ts`.
5. **Todo cambio de esquema va en los dos archivos de Prisma** — `schema.prisma`
   (SQLite local) y `schema.production.prisma` (MySQL) — y
   `scripts/verificar-schemas.mjs` falla el build si se olvida uno.

---

## 2. Modelo de datos

### 2.1 Cambios en `Order`

En **ambos** esquemas, con los mismos atributos:

```prisma
model Order {
  // ...campos actuales...
  subtotal        Int     @default(0)   // ítems, sin envío
  shippingCost    Int     @default(0)   // lo que se cobró por envío
  shippingMethod  String? @default("domicilio")  // "domicilio" | "recogida"
  total           Int                   // ya existe: subtotal + shippingCost
}
```

Notas:

- `total` **mantiene su significado actual**: lo que se le cobró al cliente. No
  se toca su uso en el listado del panel (`orders/page.tsx:81,140`), el detalle
  (`orders/[id]/page.tsx:174`) ni el asunto del correo (`mailer.ts:423`).
- `subtotal` es redundante con la suma de `items`, pero se guarda igual: evita
  que el desglose dependa de recalcular ítems históricos cuyos precios pudieron
  cambiar, y hace que el panel no tenga que sumar nada.
- Son enteros (pesos colombianos, sin decimales), como el resto del proyecto.
- `shippingMethod` es corto: `VARCHAR(191)` está bien, no necesita `@db.Text`.

### 2.2 Relleno de órdenes existentes

Las órdenes ya creadas quedarían con `subtotal = 0`, lo que mostraría un
desglose falso en el panel. Hace falta un script idempotente con `--dry-run`,
siguiendo el molde de `scripts/reparar-portadas.mjs`:

**`scripts/backfill-envio.mjs`** — para cada orden con `subtotal = 0` y
`total > 0`: `subtotal = total`, `shippingCost = 0`,
`shippingMethod = 'domicilio'`. No toca ninguna orden que ya tenga `subtotal`
distinto de cero.

Debe correrse **después** del despliegue que aplica el `db push`.

---

## 3. Configuración de tarifas

### 3.1 Dónde vive

`Setting` con `key: 'shipping_config'`, y un módulo nuevo
**`lib/shipping-config.ts`** calcado de `lib/quoter-config.ts`:

```ts
export async function getShippingConfig(): Promise<ShippingConfig>
export async function saveShippingConfig(c: ShippingConfig): Promise<void>
export const DEFAULT_SHIPPING_CONFIG: ShippingConfig
```

Igual que el cotizador, `get` mezcla lo guardado con los valores por defecto y
nunca lanza: si el JSON está corrupto, devuelve los defaults.

### 3.2 Forma de la configuración

**`lib/shipping-types.ts`**:

```ts
export interface ZonaEnvio {
  id: string;              // "bogota" | "principales" | "resto"
  nombre: string;          // lo que ve el cliente: "Bogotá"
  costo: number;           // COP
  departamentos: string[]; // nombres tal cual están en app/data/colombia.ts
  ciudades?: string[];     // opcional: afina dentro de un departamento
  diasEntrega?: string;    // "1–2 días hábiles", informativo
}

export interface ShippingConfig {
  /** Apagado = comportamiento actual: no se cobra envío. */
  habilitado: boolean;
  zonas: ZonaEnvio[];
  /** Zona que se aplica si el destino no cae en ninguna. */
  costoPorDefecto: number;
  /** Subtotal desde el cual el envío es gratis. 0 = nunca. */
  envioGratisDesde: number;
  /** Recogida en punto: sin dirección y sin costo. */
  recogida: { habilitada: boolean; etiqueta: string; direccion: string };
  /** Tope de seguridad; un cálculo por encima de esto se rechaza. */
  costoMaximo: number;
}
```

**Valor por defecto: `habilitado: false`.** Es deliberado — ver §8.

### 3.3 Panel de administración

Página nueva **`/admin/envios`** con la misma estructura de tres archivos que
`/admin/cotizador`:

| Archivo | Papel |
|---|---|
| `app/admin/(panel)/envios/page.tsx` | carga la config y renderiza el formulario |
| `app/admin/(panel)/envios/ShippingConfigForm.tsx` | cliente: editar zonas, costos, umbral |
| `app/admin/(panel)/envios/actions.ts` | `requireAdmin()` + `saveShippingConfig` + `revalidatePath` |

`actions.ts` copia el patrón de auth de `app/admin/(panel)/cotizador/actions.ts`
(`getSession()` → `redirect('/admin/login')`). Debe revalidar `/checkout`.

El selector de departamentos se alimenta de `COLOMBIA` (`app/data/colombia.ts`,
34 departamentos con sus ciudades) para que no haya nombres escritos a mano que
luego no crucen.

Añadir una entrada al arreglo de navegación de `AdminShell.tsx` (líneas 8–15),
después de "Cotizador": `{ href: '/admin/envios', icon: Truck, label: 'Envíos' }`
— `Truck` ya se usa en `app/cotizador/page.tsx`, viene de `lucide-react`.

---

## 4. El cálculo

**`lib/shipping-calc.ts`** — módulo puro, sin acceso a base de datos, importable
desde el navegador y desde el servidor:

```ts
export interface DestinoEnvio {
  metodo: 'domicilio' | 'recogida';
  departamento?: string;
  ciudad?: string;
}

export interface ResultadoEnvio {
  costo: number;
  zona: string | null;      // id de la zona aplicada
  etiqueta: string;         // "Bogotá · 1–2 días hábiles" | "Envío gratis" | "Recogida"
  gratisPorMonto: boolean;
}

export function calcShipping(
  destino: DestinoEnvio,
  subtotal: number,
  config: ShippingConfig,
): ResultadoEnvio
```

Reglas, en este orden:

1. `config.habilitado === false` → costo 0, etiqueta "A confirmar". (Idéntico a
   hoy.)
2. `metodo === 'recogida'` y la recogida está habilitada → costo 0.
3. `subtotal >= envioGratisDesde` (con `envioGratisDesde > 0`) → costo 0,
   `gratisPorMonto: true`.
4. Busca la zona: primero por coincidencia de `ciudades`, luego por
   `departamentos`. La primera que coincida gana.
5. Sin coincidencia → `costoPorDefecto`.
6. El resultado se acota a `[0, costoMaximo]` y se redondea a entero.

El umbral de envío gratis se evalúa contra el **subtotal ya con los descuentos
por cantidad del cotizador aplicados** — es decir, sobre lo que realmente se va
a cobrar por los ítems.

---

## 5. Cambios en el flujo de compra

### 5.1 Checkout (`app/checkout/page.tsx`)

- Trae la config con un `GET /api/shipping-config` (endpoint público nuevo,
  copia exacta del patrón de `app/api/quoter-pricing/route.ts`: solo expone lo
  que la UI necesita mostrar de todos modos).
- Recalcula el envío con `calcShipping` cada vez que cambian departamento,
  ciudad, método o el subtotal.
- El panel de resumen (hoy líneas 428–448) pasa a:

```
Subtotal              $XXX
Envío  <etiqueta>     $XXX     ← "Gratis" si aplica; "A confirmar" si está apagado
─────────────────────────
Total                 $XXX
```

- Mientras no haya departamento elegido: "Selecciona el departamento para
  calcular el envío", y el botón de pagar deshabilitado. Departamento y ciudad
  ya son campos obligatorios (`validate()`, líneas 84–85), así que no se agrega
  fricción nueva.
- Si `recogida.habilitada`, añadir arriba del formulario un par de radios
  *Envío a domicilio / Recoger en punto*. Con recogida elegida se ocultan y
  dejan de exigirse los campos de dirección, y se muestra `recogida.direccion`.
- En el `POST /api/checkout` se agrega al cuerpo:
  `deliveryMethod` y `shippingCostShown` (lo que el cliente tenía en pantalla).

### 5.2 Carrito

`app/components/CartDrawer.tsx:163` y `app/carrito/page.tsx:124` dicen "Envío
calculado al finalizar compra". Hoy es una promesa que el checkout no cumple;
con esta spec pasa a ser cierta, así que **el texto se queda como está**. Si la
opción queda apagada (§8), hay que cambiarlo por "El envío se cotiza aparte".

### 5.3 Servidor (`app/api/checkout/route.ts`)

Después de validar los ítems y antes de crear la orden:

```ts
const subtotal = allMPItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);

const config = await getShippingConfig();
const envio = calcShipping(
  { metodo: deliveryMethod, departamento: shipping?.department, ciudad: shipping?.city },
  subtotal,
  config,
);
const total = subtotal + envio.costo;
```

Puntos que no se pueden saltar:

- **El costo lo calcula el servidor con su propia config.** `shippingCostShown`
  jamás se usa para cobrar.
- **Discrepancia con lo mostrado → HTTP 409**, no cobro silencioso. Si
  `shippingCostShown` existe y difiere de `envio.costo`, se responde
  `409 { error, breakdown: { subtotal, envio, total } }` para que el checkout
  vuelva a pintar el resumen y el cliente confirme. Es el caso de que un
  administrador cambie las tarifas con el cliente a medio llenar el formulario:
  cobrar de más sin avisar sería peor que un reintento.
- **Sin dirección no hay domicilio.** Hoy `shipping` es opcional
  (`route.ts:64`). Pasa a ser obligatorio salvo que `deliveryMethod ===
  'recogida'` con la recogida habilitada en la config.
- La validación de `total <= 0` (línea 218) se mantiene, ahora sobre el total
  con envío.
- Se guardan `subtotal`, `shippingCost` y `shippingMethod` en el `order.create`.

### 5.4 MercadoPago

**Recomendación: usar el campo nativo `shipments`, no un ítem falso.**

```ts
shipments: {
  mode: 'not_specified',
  cost: envio.costo,
  receiver_address: {
    zip_code: shipping.postalCode ?? '',
    street_name: [shipping.address, shipping.neighborhood].filter(Boolean).join(', '),
  },
},
```

Verificado que el SDK instalado lo soporta: `Shipments = { mode?, cost?,
free_shipping?, receiver_address?, ... }` en
`node_modules/mercadopago/dist/clients/commonTypes.d.ts:28`.

Por qué esto y no un ítem más en `items`:

- MP lo presenta como "Envío" en su propia pantalla, separado de los productos.
- `items` sigue reflejando exactamente los `OrderItem` de nuestra base; si el
  envío entra como ítem, ambas listas dejan de cuadrar y cualquier conciliación
  futura tiene que acordarse de restar esa línea.
- El `transaction_amount` del pago incluye el envío en los dos casos, así que no
  se pierde nada.

**Si prefieres el ítem** (por ejemplo, porque tu facturación necesita el envío
como línea de producto), es intercambiable: se añade a `allMPItems` un ítem con
`id: 'envio'`, `category_id: 'services'`, `quantity: 1`,
`unit_price: envio.costo`, y se omite `shipments`. La decisión afecta solo a ese
bloque; todo lo demás de la spec es igual. **Pendiente de que lo confirmes.**

### 5.5 Webhook

`app/api/webhooks/mercadopago/route.ts` no necesita cambios: no compara montos,
solo mapea estados. Vale la pena **añadir un log** comparando
`paymentData.transaction_amount` con `order.total` para detectar
descuadres — sin bloquear nada, solo dejar rastro.

---

## 6. Dónde más aparece el dinero

| Sitio | Cambio |
|---|---|
| `lib/mailer.ts:130-138` | el bloque "Total pagado" pasa a tres filas: Subtotal / Envío / Total. Si `shippingMethod === 'recogida'`, decirlo en vez de mostrar $0 |
| `lib/mailer.ts:423` | el asunto sigue con `order.total`, sin cambios |
| `app/admin/(panel)/orders/[id]/page.tsx:170-176` | mismo desglose de tres líneas, y mostrar el método junto a la dirección |
| `app/admin/(panel)/orders/page.tsx:81,140` | sin cambios: sigue mostrando el total cobrado |
| `app/pago/exito/page.tsx` | sin cambios: comprobado que no muestra ningún importe |

---

## 7. Pruebas

Script **`scripts/verify-shipping.ts`** con el molde de
`scripts/verify-quoter-pricing.ts` (ya existe, corre con `npm run
verify:cotizador` y usa el mismo formato de PASS por caso). Añadir
`"verify:envios"` a `package.json`.

Casos mínimos:

1. Config apagada → costo 0 y etiqueta "A confirmar", con y sin dirección.
2. Cada zona configurada devuelve su costo, por departamento y por ciudad.
3. Ciudad que está en una zona dentro de un departamento que está en otra: gana
   la ciudad.
4. Departamento que no está en ninguna zona → `costoPorDefecto`.
5. Umbral de envío gratis: un peso por debajo cobra, justo en el umbral no.
6. Umbral con `envioGratisDesde: 0` → nunca gratis.
7. Recogida habilitada → 0 y sin exigir dirección; recogida deshabilitada pero
   pedida por el cliente → se rechaza.
8. `costoMaximo` acota un costo mal configurado.
9. `subtotal + envío` coincide con el `total` guardado en la orden.
10. Discrepancia entre `shippingCostShown` y el cálculo del servidor → 409.
11. Orden solo con ítems del cotizador (sin productos de tienda) → también paga
    envío.

---

## 8. Puesta en marcha

El orden importa y hay un interruptor de seguridad.

1. **`habilitado: false` por defecto.** Desplegar el código no cambia nada de
   cara al cliente: el checkout sigue mostrando "A confirmar" y el cobro sigue
   siendo solo de los ítems. Esto evita que un despliegue empiece a cobrar
   tarifas que nadie revisó.
2. Desplegar. El build corre `db push` y crea las tres columnas. **Ojo:** el zip
   debe incluir `.env` o el `db push` no se ejecuta — ver
   `docs/` / la memoria del proyecto sobre el despliegue a Hostinger.
3. Correr `node scripts/backfill-envio.mjs --dry-run` y luego sin el flag.
4. Configurar las zonas en `/admin/envios` con el negocio delante.
5. Hacer una compra de prueba en sandbox y confirmar el desglose en la pantalla
   de MP, en el correo y en el panel.
6. Encender `habilitado` y cambiar el texto del carrito si hiciera falta.

---

## 9. Límites conocidos de esta propuesta

Vale la pena tenerlos claros antes de implementar; ninguno bloquea, pero
conviene decidir si se aceptan.

- **La tarifa es por orden y por destino, no por peso ni volumen.** Los
  productos de la tienda no tienen campo de peso, así que no hay con qué
  calcularlo. Un pedido de 30 kg de filamento paga lo mismo que un tornillo al
  mismo destino. Si esto importa, hace falta primero añadir peso a `Product` y
  aprovechar el peso que el cotizador ya estima para las impresiones.
- **No hay integración con transportadora.** Los costos son los que el
  administrador escriba. No hay guía, ni tracking, ni cotización en vivo.
- **Un pedido con varios destinos no existe:** una orden, una dirección.
- **El envío no se prorratea entre ítems.** Si en el futuro se necesita devolver
  parcialmente un pedido, habrá que decidir qué pasa con el envío.
- **El umbral de envío gratis se evalúa sobre el subtotal ya descontado.** Si el
  negocio prefiere evaluarlo antes de los descuentos por cantidad, es un cambio
  de una línea en `calcShipping`, pero hay que decidirlo.

---

## 10. Resumen de archivos

**Nuevos**

```
lib/shipping-types.ts                                  tipos + DEFAULT_SHIPPING_CONFIG
lib/shipping-calc.ts                                   calcShipping (puro, compartido)
lib/shipping-config.ts                                 get/save contra Setting
app/api/shipping-config/route.ts                       GET público para el checkout
app/admin/(panel)/envios/page.tsx                      panel
app/admin/(panel)/envios/ShippingConfigForm.tsx        panel
app/admin/(panel)/envios/actions.ts                    panel
scripts/backfill-envio.mjs                             relleno de órdenes viejas
scripts/verify-shipping.ts                             pruebas
```

**Modificados**

```
prisma/schema.prisma                    3 columnas en Order
prisma/schema.production.prisma         las mismas 3 columnas
app/checkout/page.tsx                   cálculo en vivo, desglose, método de entrega
app/api/checkout/route.ts               cálculo autoritativo, 409, guardado, shipments
lib/mailer.ts                           desglose en el correo
app/admin/(panel)/orders/[id]/page.tsx  desglose en el panel
app/admin/(panel)/AdminShell.tsx        enlace a /admin/envios
package.json                            script verify:envios
```

**Decisiones pendientes de confirmar antes de implementar**

1. `shipments` nativo (recomendado) vs. ítem extra en la pasarela — §5.4.
2. ¿Se ofrece recogida en punto? Si sí, con qué dirección.
3. Las zonas y sus costos: cuántas, qué departamentos entran en cada una.
4. ¿Hay umbral de envío gratis? ¿Desde cuánto?
