// Códigos que el asistente usa para citar una cotización (Q-7F3K) o una
// estimación sin archivo (E-2M9P). Son únicos dentro de la conversación y el
// servidor solo resuelve los de la conversación en curso.

// Sin 0/O ni 1/I/L: el cliente puede tener que dictarlo o copiarlo a mano.
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export const PATRON_CODIGO = /^[QE]-[2-9A-HJKMNP-Z]{4}$/;
export const PATRON_COTIZACION = /^Q-[2-9A-HJKMNP-Z]{4}$/;

export type TipoCodigo = 'Q' | 'E';

export function generarCodigo(tipo: TipoCodigo, aleatorio: () => number = Math.random): string {
  let cuerpo = '';
  for (let i = 0; i < 4; i++) cuerpo += ALFABETO[Math.floor(aleatorio() * ALFABETO.length)];
  return `${tipo}-${cuerpo}`;
}
