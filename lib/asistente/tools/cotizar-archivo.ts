import { tool } from 'ai';
import { calcCost } from '../../quoter-calc';
import { detectGeometry, checkOversize } from '../../quoter-rules';
import { isOurModelUrl, quoteVerifiedModel } from '../../quoter-verify';
import { esquemas } from '../esquemas';
import { etiquetaConfiguracion, etiquetaOpcion } from '../etiquetas';
import type { ContextoTools } from './contexto';
import { descuentoPct, errorDeConfiguracion, validarColor, validarMaterial } from './comun';

const ladoMayorCm = (d: { x: number; y: number; z: number }) => Math.round(Math.max(d.x, d.y, d.z)) / 10;

/**
 * Precio exacto de un STL subido en el chat. Usa el STLData medido en el servidor
 * al subirlo y las mismas reglas que /api/checkout, así el precio que
 * dice el agente es el que se cobra.
 */
export function cotizarArchivo(ctx: ContextoTools) {
  return tool({
    description:
      'Calcula el precio exacto de un archivo STL que el cliente adjuntó en el chat. Devuelve un código de cotización (Q-XXXX). ' +
      'Si la pieza pasa de 30 cm o no se pudo medir el volumen, no hay precio: deriva a un asesor.',
    inputSchema: esquemas.cotizar_archivo.entrada,
    outputSchema: esquemas.cotizar_archivo.salida,
    execute: async (e) => {
      if (!isOurModelUrl(e.modelUrl)) {
        throw new Error('Ese modelUrl no es de un archivo subido en este chat. Usa el modelUrl del archivo adjunto.');
      }
      const stl = await ctx.medirArchivo(e.modelUrl);
      if (!stl || stl.unreadable) throw new Error('No se pudo leer ese archivo. Pídele al cliente que lo vuelva a subir.');

      const archivo = decodeURIComponent(e.modelUrl.split('/').pop() ?? 'modelo.stl').replace(/^\d+-/, '');
      const oversize = checkOversize(stl, 1);
      if (oversize?.oversize || stl.volumeUnreliable) {
        return {
          tipo: 'no-cotizable' as const,
          archivo,
          motivo: oversize?.oversize ? 'grande' as const : 'volumen' as const,
          medidasMm: stl.dimensions,
          ladoMayorCm: ladoMayorCm(stl.dimensions),
        };
      }

      validarMaterial(e.tecnologia, e.material, ctx.pricing);
      const colorId = validarColor(e.tecnologia, e.material, e.color);
      const choices = {
        tech: e.tecnologia,
        materialId: e.material,
        layerHeight: e.capa,
        infillDensity: e.relleno,
        factorEscalado: 1,
        postProcessing: e.postProcesado === true,
      };
      const q = quoteVerifiedModel(choices, stl, ctx.pricing, e.cantidad);
      if (!q.ok) throw errorDeConfiguracion(q.reason);

      const eleccion = {
        tech: q.config.tech,
        materialId: q.config.materialId,
        colorId,
        layerHeight: q.config.layerHeight,
        infillDensity: q.config.infillDensity,
      };
      const codigo = await ctx.guardarCotizacion({
        tipo: 'archivo',
        datos: {
          archivo,
          modelUrl: e.modelUrl,
          stl,
          eleccion: { ...eleccion, postProcessing: q.config.postProcessing },
          cantidad: e.cantidad,
          preciosMostrados: { [e.cantidad]: q.cost.billableUnit },
        },
      });

      // Peso y tiempo de una unidad, medidos sobre una sola: calcCost redondea el
      // total, y dividirlo después corre el decimal (86,6 g / 4 = 21,65 → 21,7).
      const unidad = calcCost({ ...q.config, quantity: 1 }, ctx.pricing);
      const geometria = detectGeometry(stl);
      return {
        tipo: 'cotizacion' as const,
        codigo,
        archivo,
        opcion: etiquetaOpcion(eleccion, ctx.pricing),
        configuracion: etiquetaConfiguracion(eleccion, ctx.pricing),
        medidasMm: stl.dimensions,
        volumenCm3: Math.round(q.config.meshVolCm3 * 10) / 10,
        pesoGPorUnidad: unidad.weightG,
        horasPorUnidad: unidad.timeH,
        cantidad: e.cantidad,
        precioUnitario: q.cost.billableUnit,
        descuentoPct: descuentoPct(e.cantidad, ctx.pricing),
        total: q.cost.total,
        rellenoFijado: geometria === 'hollow' ? 'hueca' as const : geometria === 'thin' ? 'laminar' as const : null,
      };
    },
  });
}
