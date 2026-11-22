import { tool } from 'ai';
import { esquemas } from '../esquemas';
import { descripcionSinArchivo, detalleCotizacion, detalleEstimacion, type LineaPieza } from '../mensaje-asesor';
import { enlaceResumen } from '../resumen-asesor';
import { pesos } from '../../formato';
import type { ContextoTools, CotizacionGuardada } from './contexto';

const TIENE_PRECIO = /\$\s?\d|\d\s?(pesos|cop)\b/i;

/** "modelado C2–C3, estimado: $25.000 – $90.000 (M-4H8R)" o sin precio si no lo hubo. */
function detalleModelado(cot: Extract<CotizacionGuardada, { tipo: 'modelado' }>): string {
  const r = cot.datos.resultado;
  if (r.tipo === 'no-requiere') return `modelado ${cot.codigo}: no requiere`;
  const clase = r.class_min === r.class_max ? r.class_min : `${r.class_min}–${r.class_max}`;
  return r.tipo === 'estimado'
    ? `modelado ${cot.codigo}: ${clase}, estimado ${pesos(r.min)} – ${pesos(r.max)}`
    : `modelado ${cot.codigo}: ${clase}, sin precio`;
}

/**
 * Arma el mensaje de WhatsApp para un asesor con la ficha de la conversación
 * (design §5.5). Las descripciones las escribe el modelo; los precios salen
 * de las cotizaciones guardadas (§10.3).
 */
export function derivarAAsesor(ctx: ContextoTools) {
  return tool({
    description:
      'Pasa la conversación a un asesor por WhatsApp, con el motivo. El mensaje lleva un resumen de la ficha para que el cliente no repita nada. ' +
      'Incluye una línea por pieza pendiente, con su código Q-, E- o M- si lo tiene. Sin precios en el texto.',
    inputSchema: esquemas.derivar_a_asesor.entrada,
    outputSchema: esquemas.derivar_a_asesor.salida,
    execute: async ({ motivo, piezas }) => {
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
          : cot.tipo === 'estimacion' ? detalleEstimacion(cot.datos.min, cot.datos.max)
          : detalleModelado(cot);
        lineas.push({
          descripcion: cot.tipo === 'estimacion' ? descripcionSinArchivo(p.descripcion) : p.descripcion,
          detalle: p.nota ? `${p.nota}; ${detalle}` : detalle,
        });
      }
      const ficha = await ctx.leerFicha();
      await ctx.marcarDerivacion(motivo).catch(() => {});
      return { ...enlaceResumen(ficha, lineas, motivo), motivo };
    },
  });
}
