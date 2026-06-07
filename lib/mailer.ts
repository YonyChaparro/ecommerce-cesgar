import nodemailer from 'nodemailer';
import type { Order, OrderItem } from '@prisma/client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const NOTIFY_TO = 'cesangarciar@gmail.com';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

type OrderWithItems = Order & { items: OrderItem[] };

const TYPE_LABEL: Record<string, string> = {
  product:   'Producto',
  cotizador: 'Cotizador 3D',
  mixed:     'Mixto',
};

function formatCOP(amount: number) {
  return `$${amount.toLocaleString('es-CO')} COP`;
}

function buildHtml(order: OrderWithItems): string {
  const orderId    = order.id.slice(-8).toUpperCase();
  const adminUrl   = `${APP_URL}/admin/orders/${order.id}`;
  const orderDate  = order.createdAt.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const typeLabel  = TYPE_LABEL[order.type] ?? order.type;

  const itemRows = order.items
    .map((item) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;">
          ${item.name}
          ${item.note ? `<br><span style="font-size:12px;color:#94a3b8;font-family:monospace;">${item.note}</span>` : ''}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;text-align:right;white-space:nowrap;">${formatCOP(item.price)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:#16234d;text-align:right;white-space:nowrap;">${formatCOP(item.price * item.quantity)}</td>
      </tr>`)
    .join('');

  const shippingBlock = (order.shippingName || order.shippingAddress)
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td style="padding-bottom:12px;">
          <h3 style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Datos de envío</h3>
        </td>
      </tr>
      <tr><td style="background:#f8fafc;border-radius:12px;padding:16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${order.shippingName      ? `<tr><td style="padding:3px 0;font-size:13px;color:#64748b;width:140px;">Destinatario</td><td style="padding:3px 0;font-size:13px;font-weight:600;color:#1e293b;">${order.shippingName}</td></tr>` : ''}
          ${order.shippingEmail     ? `<tr><td style="padding:3px 0;font-size:13px;color:#64748b;">Email</td><td style="padding:3px 0;font-size:13px;color:#1e293b;">${order.shippingEmail}</td></tr>` : ''}
          ${order.shippingPhone     ? `<tr><td style="padding:3px 0;font-size:13px;color:#64748b;">Teléfono</td><td style="padding:3px 0;font-size:13px;color:#1e293b;">${order.shippingPhone}</td></tr>` : ''}
          ${order.shippingAddress   ? `<tr><td style="padding:3px 0;font-size:13px;color:#64748b;">Dirección</td><td style="padding:3px 0;font-size:13px;color:#1e293b;">${order.shippingAddress}${order.shippingNeighborhood ? `, ${order.shippingNeighborhood}` : ''}${order.shippingAddressExtra ? ` (${order.shippingAddressExtra})` : ''}</td></tr>` : ''}
          ${order.shippingCity      ? `<tr><td style="padding:3px 0;font-size:13px;color:#64748b;">Ciudad</td><td style="padding:3px 0;font-size:13px;color:#1e293b;">${order.shippingCity}${order.shippingDepartment ? `, ${order.shippingDepartment}` : ''}</td></tr>` : ''}
          ${order.shippingPostalCode ? `<tr><td style="padding:3px 0;font-size:13px;color:#64748b;">Código postal</td><td style="padding:3px 0;font-size:13px;color:#1e293b;">${order.shippingPostalCode}</td></tr>` : ''}
          ${order.shippingInstructions ? `<tr><td style="padding:3px 0;font-size:13px;color:#64748b;vertical-align:top;">Instrucciones</td><td style="padding:3px 0;font-size:13px;color:#1e293b;">${order.shippingInstructions}</td></tr>` : ''}
          ${(order.shippingDocType || order.shippingDocNumber) ? `<tr><td style="padding:3px 0;font-size:13px;color:#64748b;">Documento</td><td style="padding:3px 0;font-size:13px;color:#1e293b;">${order.shippingDocType ?? ''} ${order.shippingDocNumber ?? ''}</td></tr>` : ''}
        </table>
      </td></tr>
    </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

        <!-- Header -->
        <tr><td style="background:#16234d;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;">CESGAR</p>
          <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Nuevo pedido recibido</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;">

          <!-- Order meta -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#f8fafc;border-radius:12px;padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:13px;color:#64748b;">Orden</td>
                    <td style="font-size:14px;font-weight:700;color:#16234d;text-align:right;font-family:monospace;">#${orderId}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#64748b;padding-top:6px;">Fecha</td>
                    <td style="font-size:13px;color:#334155;text-align:right;padding-top:6px;">${orderDate}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#64748b;padding-top:6px;">Tipo</td>
                    <td style="font-size:13px;color:#334155;text-align:right;padding-top:6px;">${typeLabel}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Items -->
          <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Ítems del pedido</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f1f5f9;border-radius:12px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:left;">Producto</th>
                <th style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:center;">Cant.</th>
                <th style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:right;">Precio</th>
                <th style="padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <!-- Total -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
            <tr>
              <td style="padding:14px 16px;background:#16234d;border-radius:12px;text-align:right;">
                <span style="font-size:13px;color:#94a3b8;">Total pagado&nbsp;&nbsp;</span>
                <span style="font-size:18px;font-weight:800;color:#ffffff;">${formatCOP(order.total)}</span>
              </td>
            </tr>
          </table>

          ${shippingBlock}

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
            <tr>
              <td align="center">
                <a href="${adminUrl}"
                   style="display:inline-block;background:#4dbdcc;color:#16234d;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
                  Ver pedido en el panel →
                </a>
              </td>
            </tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Este correo es automático — generado por el sistema Cesgar.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const SERVICE_LABELS: Record<string, string> = {
  'repuestos-impresoras': 'Repuestos para Impresoras',
  'escaneo-3d': 'Escaneo 3D',
  'diseno-3d': 'Diseño 3D',
  'prototipado-fabricacion': 'Prototipado y Fabricación',
};

export async function sendServiceInquiryEmail(data: {
  service: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  extra?: string | null;
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP_USER / SMTP_PASS no configurados — correo omitido.');
    return;
  }

  const serviceLabel = SERVICE_LABELS[data.service] ?? data.service;
  let extraRows = '';
  if (data.extra) {
    try {
      const parsed = JSON.parse(data.extra) as Record<string, string>;
      extraRows = Object.entries(parsed)
        .map(([k, v]) => `<tr><td style="padding:3px 0;font-size:13px;color:#64748b;width:160px;text-transform:capitalize;">${k.replace(/([A-Z])/g, ' $1').trim()}</td><td style="padding:3px 0;font-size:13px;color:#1e293b;">${v}</td></tr>`)
        .join('');
    } catch { /* ignore */ }
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

        <tr><td style="background:#16234d;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;">CESGAR</p>
          <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Nueva solicitud de servicio</p>
        </td></tr>

        <tr><td style="background:#ffffff;padding:32px;">

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#f8fafc;border-radius:12px;padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#64748b;">Servicio</td>
                  <td style="font-size:14px;font-weight:700;color:#16234d;text-align:right;">${serviceLabel}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Datos de contacto</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <tr><td style="padding:3px 0;font-size:13px;color:#64748b;width:160px;">Nombre</td><td style="padding:3px 0;font-size:13px;font-weight:600;color:#1e293b;">${data.name}</td></tr>
            <tr><td style="padding:3px 0;font-size:13px;color:#64748b;">Email</td><td style="padding:3px 0;font-size:13px;color:#1e293b;"><a href="mailto:${data.email}" style="color:#4dbdcc;">${data.email}</a></td></tr>
            ${data.phone ? `<tr><td style="padding:3px 0;font-size:13px;color:#64748b;">Teléfono</td><td style="padding:3px 0;font-size:13px;color:#1e293b;">${data.phone}</td></tr>` : ''}
            ${extraRows}
          </table>

          <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Mensaje</h3>
          <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;font-size:14px;color:#334155;line-height:1.6;white-space:pre-line;">${data.message}</div>

        </td></tr>

        <tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Este correo es automático — generado por el sistema Cesgar.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Cesgar Web" <${process.env.SMTP_USER}>`,
      to: NOTIFY_TO,
      replyTo: data.email,
      subject: `📋 Nueva solicitud: ${serviceLabel} — ${data.name}`,
      html,
    });
    console.log(`[mailer] Correo de solicitud enviado (${data.service})`);
  } catch (err) {
    console.error('[mailer] Error al enviar correo de solicitud:', err);
  }
}

interface QuoteFile { name: string; url: string; type?: string }

export async function sendQuoteRequestEmail(data: {
  name: string;
  email: string;
  phone?: string | null;
  serviceType: string;
  message: string;
  stlFiles: QuoteFile[];
  mediaFiles: QuoteFile[];
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP_USER / SMTP_PASS no configurados — correo omitido.');
    return;
  }

  const stlRows = data.stlFiles.length
    ? data.stlFiles.map(f =>
        `<tr><td style="padding:6px 0;font-size:13px;">
          <a href="${f.url}" style="color:#4dbdcc;font-weight:600;text-decoration:none;">📦 ${f.name}</a>
        </td></tr>`
      ).join('')
    : '<tr><td style="padding:6px 0;font-size:13px;color:#94a3b8;">Sin archivos STL adjuntos</td></tr>';

  const imageFiles = data.mediaFiles.filter(f => f.type === 'image');
  const videoFiles = data.mediaFiles.filter(f => f.type === 'video');

  const imageGrid = imageFiles.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr>
          ${imageFiles.map(f => `
            <td style="padding:4px;width:${Math.min(50, Math.floor(100 / imageFiles.length))}%;vertical-align:top;">
              <a href="${f.url}" target="_blank">
                <img src="${f.url}" alt="${f.name}"
                  style="width:100%;max-width:260px;border-radius:8px;border:1px solid #e2e8f0;display:block;" />
              </a>
              <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-align:center;">${f.name}</p>
            </td>`).join('')}
        </tr>
      </table>`
    : '';

  const videoList = videoFiles.length
    ? videoFiles.map(f =>
        `<tr><td style="padding:6px 0;font-size:13px;">
          <a href="${f.url}" style="color:#4dbdcc;font-weight:600;text-decoration:none;">🎬 ${f.name}</a>
        </td></tr>`
      ).join('')
    : '';

  const mediaSection = (imageFiles.length || videoFiles.length)
    ? `<h3 style="margin:24px 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Material audiovisual</h3>
       ${imageGrid}
       ${videoFiles.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">${videoList}</table>` : ''}`
    : `<p style="font-size:13px;color:#94a3b8;margin-top:16px;">Sin material audiovisual adjunto.</p>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;">

        <tr><td style="background:#16234d;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;">CESGAR</p>
          <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Nueva cotización personalizada</p>
        </td></tr>

        <tr><td style="background:#ffffff;padding:32px;">

          <!-- Badge servicio -->
          <div style="margin-bottom:24px;">
            <span style="display:inline-block;background:#4dbdcc15;color:#4dbdcc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:6px 14px;border-radius:20px;border:1px solid #4dbdcc40;">
              ${data.serviceType}
            </span>
          </div>

          <!-- Contacto -->
          <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Datos de contacto</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <tr>
              <td style="padding:3px 0;font-size:13px;color:#64748b;width:140px;">Nombre</td>
              <td style="padding:3px 0;font-size:13px;font-weight:600;color:#1e293b;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:13px;color:#64748b;">Email</td>
              <td style="padding:3px 0;font-size:13px;color:#1e293b;">
                <a href="mailto:${data.email}" style="color:#4dbdcc;">${data.email}</a>
              </td>
            </tr>
            ${data.phone ? `<tr>
              <td style="padding:3px 0;font-size:13px;color:#64748b;">Teléfono</td>
              <td style="padding:3px 0;font-size:13px;color:#1e293b;">${data.phone}</td>
            </tr>` : ''}
          </table>

          <!-- Descripción -->
          <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Descripción del proyecto</h3>
          <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;font-size:14px;color:#334155;line-height:1.7;white-space:pre-line;margin-bottom:24px;">${data.message}</div>

          <!-- Archivos STL -->
          <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Archivos STL</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:12px 20px;">
            ${stlRows}
          </table>

          <!-- Media -->
          ${mediaSection}

          <!-- Reply CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
            <tr><td align="center">
              <a href="mailto:${data.email}"
                 style="display:inline-block;background:#4dbdcc;color:#16234d;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
                Responder a ${data.name} →
              </a>
            </td></tr>
          </table>

        </td></tr>

        <tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Este correo es automático — generado por el sistema Cesgar.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Cesgar Web" <${process.env.SMTP_USER}>`,
      to: NOTIFY_TO,
      replyTo: data.email,
      subject: `📐 Cotización personalizada: ${data.serviceType} — ${data.name}`,
      html,
    });
    console.log(`[mailer] Correo de cotización enviado (${data.name})`);
  } catch (err) {
    console.error('[mailer] Error al enviar correo de cotización:', err);
  }
}

export async function sendNewOrderEmail(order: OrderWithItems): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP_USER / SMTP_PASS no configurados — correo omitido.');
    return;
  }

  const orderId = order.id.slice(-8).toUpperCase();

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Cesgar Tienda" <${process.env.SMTP_USER}>`,
      to: NOTIFY_TO,
      subject: `🛒 Nuevo pedido #${orderId} — ${formatCOP(order.total)}`,
      html: buildHtml(order),
    });
    console.log(`[mailer] Correo enviado para orden #${orderId}`);
  } catch (err) {
    // Never block the main flow — log and continue
    console.error('[mailer] Error al enviar correo:', err);
  }
}
