// Cifras en formato es-CO, como las muestran las vistas del cotizador:
// $10.983 · 42,6 cm³ · 1.000 · 1,2 MB · 40 %.
//
// Lo usan el navegador y el servidor (el mensaje de WhatsApp, por ejemplo), así
// que no depende de nada más.

const enteros = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

/** Pesos colombianos sin decimales: `$10.983`. */
export function pesos(valor: number): string {
  return `$${enteros.format(Math.round(valor))}`;
}

/** Número con separadores es-CO y, como mucho, `decimales` decimales: `42,6`. */
export function numero(valor: number, decimales = 0): string {
  return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: decimales }).format(valor);
}

/** Porcentaje con el espacio que usa es-CO: `40 %`. */
export function porcentaje(valor: number): string {
  return `${numero(valor)} %`;
}

/** Medidas de una pieza: `84 × 40 × 62 mm`. */
export function medidasMm(d: { x: number; y: number; z: number }): string {
  return `${numero(d.x, 1)} × ${numero(d.y, 1)} × ${numero(d.z, 1)} mm`;
}

/** Volumen: `42,6 cm³`. */
export function volumenCm3(cm3: number): string {
  return `${numero(cm3, 1)} cm³`;
}

/** Tamaño de archivo: `1,2 MB`, `850 KB`. */
export function tamanoArchivo(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${numero(bytes / (1024 * 1024), 1)} MB`;
  return `${numero(Math.max(1, Math.round(bytes / 1024)))} KB`;
}
