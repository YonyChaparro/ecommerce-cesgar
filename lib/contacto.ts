// Datos de contacto que se repiten en el sitio. El número de WhatsApp estaba
// escrito a mano en cada página de servicios; lo nuevo lo toma de aquí.

export const WHATSAPP_NUMERO = '573057956352';

/** Enlace de WhatsApp con el mensaje ya escrito: el cliente decide si lo envía. */
export function enlaceWhatsApp(texto?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMERO}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}
