// Mensajes de derivación de la v5.1 (§5.6, §14, §25), en el tono del prompt.
// Las tarjetas y las tools los muestran tal cual; el prompt los resume.

/** §5.6: volumen sin modelo. */
export const MENSAJE_VOLUMEN =
  'Por el volumen que necesitas, lo mejor es revisar tu proyecto como una solución de producción y no cotizar el diseño por separado. ' +
  'Nuestro equipo puede evaluar el lote y la posibilidad de incluir el desarrollo del modelo dentro de la propuesta.';

/** §14: suministro recurrente, reventa o varias referencias. */
export const MENSAJE_SUMINISTRO =
  'Por el tipo de solicitud, podemos revisar una propuesta de suministro y no solo el precio de una pieza: ' +
  'cantidades, frecuencia y la posibilidad de incorporar esta referencia al catálogo de Cesgar.';

/** §25: fotos por WhatsApp. */
export const MENSAJE_FOTOS =
  'Para revisar la forma y los puntos de fijación, envíanos las fotos por WhatsApp. Te pasamos el resumen para que no tengas que repetir nada.';

/** R8.1: el chat no recibe imágenes. */
export const AVISO_SOLO_TEXTO = 'Este chat recibe texto y archivos STL. Las fotos envíalas por WhatsApp.';

/** R9.3: qué no incluye un estimado de modelado. */
export const NO_INCLUYE_MODELADO = 'No incluye impresión, escaneo ni impuestos.';
