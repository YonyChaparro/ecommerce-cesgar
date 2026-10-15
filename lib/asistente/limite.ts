import 'server-only';

// Límite de peticiones por IP (propuesta §13). Hostinger corre un solo proceso
// de Node por sitio, así que basta un mapa en memoria; si algún día corre
// varios, cada proceso tendría su propia cuenta y habría que pasarlo a la BD.

const LIMITES = {
  chat: { maximo: 12, ventanaMs: 60_000 },
  archivo: { maximo: 6, ventanaMs: 60_000 },
  carrito: { maximo: 30, ventanaMs: 60_000 },
  eventos: { maximo: 30, ventanaMs: 60_000 },
} as const;

export type TipoLimite = keyof typeof LIMITES;

const ventanas = new Map<string, number[]>();

export function ipDe(req: Request): string {
  const reenviada = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return reenviada || req.headers.get('x-real-ip') || 'sin-ip';
}

export function limitar(tipo: TipoLimite, req: Request): { ok: true } | { ok: false; reintentarEnS: number } {
  const { maximo, ventanaMs } = LIMITES[tipo];
  const ahora = Date.now();
  const clave = `${tipo}:${ipDe(req)}`;
  const recientes = (ventanas.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);

  if (recientes.length >= maximo) {
    ventanas.set(clave, recientes);
    return { ok: false, reintentarEnS: Math.ceil((recientes[0] + ventanaMs - ahora) / 1000) };
  }
  recientes.push(ahora);
  ventanas.set(clave, recientes);

  // Que el mapa no crezca sin fin con IPs que ya no vuelven.
  if (ventanas.size > 5000) {
    for (const [k, ts] of ventanas) if (ts.every((t) => ahora - t >= 60_000)) ventanas.delete(k);
  }
  return { ok: true };
}

/** Respuesta 429 que el chat convierte en el aviso "Un momento" (vista 5). */
export function respuestaLimite(reintentarEnS: number): Response {
  return Response.json(
    { codigo: 'limite', detalle: 'Demasiadas peticiones' },
    { status: 429, headers: { 'Retry-After': String(reintentarEnS) } },
  );
}
