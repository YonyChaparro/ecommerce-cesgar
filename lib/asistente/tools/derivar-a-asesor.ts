import { tool } from 'ai';
import { esquemas } from '../esquemas';
import { descripcionSinArchivo, detalleCotizacion, detalleEstimacion, enlaceAsesor, type LineaPieza } from '../mensaje-asesor';
import type { ContextoTools } from './contexto';

const TIENE_PRECIO = /\$\s?\d|\d\s?(pesos|cop)\b/i;

/**
 * Arma el mensaje de WhatsApp para un asesor. Las descripciones las escribe el
 * modelo; los precios y rangos salen de las cotizaciones guardadas (§10.3).
 */
export function derivarAAsesor(ctx: ContextoTools) {
  return tool({
    description:
      'Pasa la conversación a un asesor por WhatsApp: diseño 3D, escaneo, repuestos que no están en la tienda, piezas de más de 30 cm ' +
      'o cuando el cliente lo pide. Incluye una línea por pieza pendiente, con su código Q- o E- si lo tiene. Sin precios en el texto.',
    inputSchema: esquemas.derivar_a_asesor.entrada,
    outputSchema: esquemas.derivar_a_asesor.salida,
    execute: async ({ piezas }) => {
      const lineas: LineaPieza[] = [];
      for (const p of piezas) {
        if (TIENE_PRECIO.test(p.descripcion) || (p.nota && TIENE_PRECIO.test(p.nota))) {
          throw new Error('No pongas precios en la descripción ni en la nota: se toman de la cotización con su código.');
        }
        if (!p.codigo) {
          lineas.push({ descripcion: p.descripcion, detalle: p.nota });
          continue;
        }
        const cot = await ctx.leerCotizacion(p.codigo);
        if (!cot) throw new Error(`No hay una cotización ${p.codigo} en esta conversación.`);
        const detalle = cot.tipo === 'archivo'
          ? detalleCotizacion(cot.codigo, cot.datos.cantidad, cot.datos.preciosMostrados[cot.datos.cantidad])
          : detalleEstimacion(cot.datos.min, cot.datos.max);
        lineas.push({
          descripcion: cot.tipo === 'estimacion' ? descripcionSinArchivo(p.descripcion) : p.descripcion,
          detalle: p.nota ? `${p.nota}; ${detalle}` : detalle,
        });
      }
      return enlaceAsesor(lineas);
    },
  });
}
