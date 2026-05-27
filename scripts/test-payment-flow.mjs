/**
 * Prueba de pago end-to-end en sandbox de MercadoPago
 * Flujo: checkout API → tokenización tarjeta → pago MP → webhook local → verificación BD
 *
 * Ejecutar con: node scripts/test-payment-flow.mjs
 * El servidor dev debe estar corriendo en localhost:3000
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE   = 'http://localhost:3000';
const MP_API = 'https://api.mercadopago.com';

// Leer credenciales del proceso o del archivo .env
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const PUBLIC_KEY   = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

// ─── Tarjetas de prueba Colombia (MCO) ────────────────────────────────────────
// Fuente: https://www.mercadopago.com.co/developers/es/docs/your-integrations/test/cards
const TEST_CARDS = [
  { number: '4013540682746260', type: 'visa',   name: 'APRO', cvv: '123', month: '11', year: '2030', desc: 'Visa → APROBADO' },
  { number: '5031755734530604', type: 'master',  name: 'APRO', cvv: '123', month: '11', year: '2030', desc: 'Mastercard → APROBADO' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHECK = '✅'; const FAIL = '❌'; const INFO = '  ·'; const WARN = '⚠️ ';
const pass = (m) => console.log(`${CHECK} ${m}`);
const fail = (m) => console.log(`${FAIL} ${m}`);
const info = (m) => console.log(`${INFO} ${m}`);
const warn = (m) => console.log(`${WARN} ${m}`);
const sep  = () => console.log('─'.repeat(60));

async function mpPost(path, body, token = ACCESS_TOKEN) {
  const r = await fetch(`${MP_API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Idempotency-Key': `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return { status: r.status, data };
}

async function mpGet(path, token = ACCESS_TOKEN) {
  const r = await fetch(`${MP_API}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return { status: r.status, data: await r.json() };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function runTest(card) {
  sep();
  console.log(`\n🧪 PRUEBA: ${card.desc}\n`);

  // ── 1. Crear orden + preferencia de pago ─────────────────────────────────────
  console.log('[1] Creando orden de cotizador 3D…\n');

  const checkoutRes = await fetch(`${BASE}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{
        id: `cotizador-test-${Date.now()}`,
        quantity: 2,
        name: 'Pieza_engranaje_prueba.stl',
        price: 14022,
        note: 'FDM · PLA · 0.2mm · 40% relleno · Escala ×1 · ~4.0g/u · ~1.5h/u · Sin post-proc.',
      }],
      shipping: {
        name: 'Carlos Comprador Prueba',
        email: 'TESTUSER8171857037341449652@testuser.com',
        docType: 'CC',
        docNumber: '1020304050',
        phone: '3001234567',
        address: 'Calle 45 # 23-10',
        neighborhood: 'Chapinero',
        department: 'Cundinamarca',
        city: 'Bogotá D.C.',
        postalCode: '110221',
      },
    }),
  });

  const checkoutData = await checkoutRes.json();

  if (!checkoutRes.ok || !checkoutData.order_id) {
    fail(`Checkout API falló: ${JSON.stringify(checkoutData)}`);
    return null;
  }

  const orderId      = checkoutData.order_id;
  const checkoutUrl  = checkoutData.url;
  pass(`Orden creada: #${orderId.slice(-8).toUpperCase()}`);
  info(`Total: $${(14022 * 2).toLocaleString('es-CO')} COP (2 piezas × $14.022)`);
  info(`URL sandbox: ${checkoutUrl.slice(0, 80)}…`);

  // Obtener el preference_id de la orden en BD
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  const prefId = order?.preferenceId;
  if (!prefId) { fail('No se encontró preferenceId en la BD'); return orderId; }
  info(`Preference ID: ${prefId}`);

  // ── 2. Tokenizar tarjeta de prueba ────────────────────────────────────────────
  console.log('\n[2] Tokenizando tarjeta de prueba con MP…\n');

  const tokenRes = await mpPost('/v1/card_tokens?public_key=' + PUBLIC_KEY, {
    card_number:      card.number,
    expiration_year:  card.year,
    expiration_month: card.month,
    security_code:    card.cvv,
    cardholder: {
      name: card.name,
      identification: { type: 'CC', number: '1020304050' },
    },
  }, PUBLIC_KEY);

  if (tokenRes.status !== 201 || !tokenRes.data.id) {
    fail(`Tokenización falló (${tokenRes.status}): ${JSON.stringify(tokenRes.data).slice(0, 200)}`);
    info('Continuando con webhook simulado…');
  } else {
    pass(`Tarjeta tokenizada: ${tokenRes.data.id.slice(0, 8)}…`);
    info(`Tipo: ${card.type} · últimos 4: ${tokenRes.data.last_four_digits}`);
  }

  const cardToken = tokenRes.data?.id;

  // ── 3. Crear el pago en MP ────────────────────────────────────────────────────
  let paymentId = null;
  let paymentStatus = null;

  if (cardToken) {
    console.log('\n[3] Creando pago en MercadoPago sandbox…\n');

    const payRes = await mpPost('/v1/payments', {
      transaction_amount: 28044,   // 2 × 14022
      token:              cardToken,
      description:        'Cesgar — Impresión 3D: Pieza_engranaje_prueba.stl ×2',
      installments:       1,
      payment_method_id:  card.type,
      issuer_id:          null,
      payer: {
        email: 'TESTUSER8171857037341449652@testuser.com',
        identification: { type: 'CC', number: '1020304050' },
      },
      external_reference:  orderId,
      statement_descriptor: 'CESGAR',
    });

    if (payRes.status === 201 && payRes.data.id) {
      paymentId     = payRes.data.id;
      paymentStatus = payRes.data.status;
      pass(`Pago creado en MP: ID ${paymentId}`);
      info(`Status MP: ${paymentStatus} (${payRes.data.status_detail})`);
      info(`Monto: $${payRes.data.transaction_amount?.toLocaleString('es-CO')} ${payRes.data.currency_id}`);
      info(`Método: ${payRes.data.payment_method_id} · últimos 4: ${payRes.data.card?.last_four_digits ?? '—'}`);
    } else {
      warn(`Pago con tarjeta falló (${payRes.status}): ${payRes.data?.message ?? JSON.stringify(payRes.data).slice(0, 200)}`);
      info('Puede ser por límites de cuenta de prueba. Continuando con webhook simulado…');
    }
  }

  // ── 4. Disparar webhook (real si hay paymentId, simulado si no) ───────────────
  console.log('\n[4] Enviando notificación al webhook local…\n');

  // Si no obtuvimos un pago real, buscamos el último pago de prueba en MP
  if (!paymentId) {
    info('Buscando pagos recientes de esta preferencia…');
    const searchRes = await mpGet(`/v1/payments/search?external_reference=${orderId}&status=approved`);
    if (searchRes.data?.results?.length > 0) {
      paymentId     = searchRes.data.results[0].id;
      paymentStatus = searchRes.data.results[0].status;
      info(`Pago encontrado via search: ${paymentId}`);
    }
  }

  // Payload exacto que envía MercadoPago
  const webhookPayload = paymentId
    ? { action: 'payment.updated', api_version: 'v1', data: { id: String(paymentId) }, type: 'payment' }
    : { action: 'payment.updated', api_version: 'v1', data: { id: '999999999' }, type: 'payment' };

  const webhookRes = await fetch(`${BASE}/api/webhooks/mercadopago`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookPayload),
  });
  const webhookData = await webhookRes.json();

  if (webhookRes.ok && webhookData.received) {
    pass(`Webhook respondió 200: ${JSON.stringify(webhookData)}`);
  } else {
    fail(`Webhook respondió ${webhookRes.status}: ${JSON.stringify(webhookData)}`);
  }

  // ── 5. Verificar estado de la orden en BD ─────────────────────────────────────
  console.log('\n[5] Verificando actualización en BD…\n');

  await sleep(500); // dar tiempo al handler asíncrono

  const updatedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!updatedOrder) {
    fail('Orden no encontrada en BD');
    return orderId;
  }

  pass(`Orden #${orderId.slice(-8).toUpperCase()} encontrada en BD`);
  info(`Status: ${updatedOrder.status}`);
  info(`PaymentId en BD: ${updatedOrder.paymentId ?? '(sin pago real — esperado si MP rechazó tarjeta de prueba)'}`);
  info(`Total: $${updatedOrder.total.toLocaleString('es-CO')} COP`);
  info(`Ítems: ${updatedOrder.items.length}`);
  updatedOrder.items.forEach(item => {
    info(`  → ${item.name} | price=$${item.price.toLocaleString('es-CO')} × qty=${item.quantity} | note: ${(item.note ?? '').slice(0, 60)}`);
  });

  if (paymentId) {
    const expectedStatus = paymentStatus === 'approved' ? 'approved' : (paymentStatus === 'rejected' ? 'rejected' : 'pending');
    if (updatedOrder.status === expectedStatus) {
      pass(`Status de BD coincide con MP: "${expectedStatus}"`);
    } else if (updatedOrder.status === 'pending' && paymentStatus !== 'approved') {
      warn(`Status en BD: "${updatedOrder.status}" | MP: "${paymentStatus}" — correcto si el pago no fue aprobado`);
    } else {
      fail(`Status discrepante: BD="${updatedOrder.status}" MP="${paymentStatus}"`);
    }
  } else {
    warn('No hubo pago real — el status permanece "pending" (esperado)');
  }

  return orderId;
}

async function verifyCheckoutUrlFormat(url) {
  // Verificar que la URL de sandbox es válida y tiene el formato correcto
  const isSandbox = url.includes('sandbox.mercadopago') || url.includes('mercadopago.com.co/checkout');
  const hasPrefId = url.includes('pref_id=') || url.includes('redirect?');
  return isSandbox && hasPrefId;
}

async function main() {
  if (!ACCESS_TOKEN || !PUBLIC_KEY) {
    fail('Faltan MP_ACCESS_TOKEN o NEXT_PUBLIC_MP_PUBLIC_KEY en las variables de entorno');
    process.exit(1);
  }

  sep();
  console.log('PRUEBA DE PAGO — CESGAR COTIZADOR 3D × MERCADOPAGO SANDBOX');
  sep();

  info(`Access Token: ${ACCESS_TOKEN.slice(0, 20)}…`);
  info(`Public Key:   ${PUBLIC_KEY.slice(0, 20)}…`);
  info(`App ID:       1584810919069591`);
  console.log();

  const orderIds = [];

  // Ejecutar prueba con Visa
  const orderId1 = await runTest(TEST_CARDS[0]);
  if (orderId1) orderIds.push(orderId1);

  sep();
  console.log('\n[6] Verificando formato URL de checkout sandbox…\n');

  // Crear una orden extra solo para verificar la URL
  const extraRes = await fetch(`${BASE}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: `cotizador-url-test-${Date.now()}`, quantity: 1, name: 'Pieza_url_test.stl', price: 14022, note: 'Test URL' }],
      shipping: { name: 'URL Test', email: 'test@test.com', docType: 'CC', docNumber: '123456', phone: '3001234567', address: 'Calle 1', department: 'Cundinamarca', city: 'Bogotá D.C.' },
    }),
  });
  const extraData = await extraRes.json();
  if (extraData.url) {
    const isValid = await verifyCheckoutUrlFormat(extraData.url);
    if (isValid) {
      pass(`URL de checkout sandbox tiene formato correcto`);
      info(`URL: ${extraData.url.slice(0, 100)}…`);
    } else {
      warn(`URL inesperada: ${extraData.url.slice(0, 100)}`);
    }
    if (extraData.order_id) orderIds.push(extraData.order_id);
  }

  sep();
  console.log('\n[7] Resumen y limpieza…\n');

  // Verificar el webhook handler con un pago inexistente (debe responder 200 sin crashear)
  const badWebhookRes = await fetch(`${BASE}/api/webhooks/mercadopago`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'payment', data: { id: '00000000001' } }),
  });
  if (badWebhookRes.ok) {
    pass(`Webhook maneja pago inexistente correctamente (siempre 200 para evitar reintentos de MP)`);
  } else {
    fail(`Webhook devolvió ${badWebhookRes.status} para pago inexistente`);
  }

  // Verificar que webhook ignora topics distintos a "payment"
  const otherTopicRes = await fetch(`${BASE}/api/webhooks/mercadopago`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'merchant_order', data: { id: '123' } }),
  });
  if (otherTopicRes.ok) {
    pass(`Webhook ignora topics distintos a "payment" → 200 sin procesar`);
  }

  // Limpiar órdenes de prueba de la BD
  if (orderIds.length > 0) {
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } }).catch(() => {});
    info(`${orderIds.length} orden(es) de prueba eliminada(s) de la BD`);
  }

  sep();
  console.log(`
📋 RESUMEN DEL FLUJO COMPLETO:

  1. Checkout API       → crea orden + preferencia MP     ✅
  2. Tokenización       → tarjeta de prueba → token MP
  3. Pago en MP         → payment_id + status
  4. Webhook local      → recibe notificación → actualiza BD
  5. Verificación BD    → status coincide con MP

🔗 Para completar el pago manualmente en el browser:
   → Ir a la URL sandbox generada
   → Ingresar con usuario de prueba:
     Usuario: TESTUSER8171857037341449652
     (contraseña visible en: https://mercadopago.com.co/developers/panel/app/1584810919069591/test-users)
   → Tarjeta de prueba:
     Número:   4013 5406 8274 6260
     CVV:      123  |  Vence: 11/2030
     Nombre:   APRO  (para pago aprobado)
`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error fatal:', e);
  prisma.$disconnect();
  process.exit(1);
});
