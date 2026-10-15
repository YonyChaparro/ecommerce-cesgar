import { tool } from 'ai';
import { quoteVerifiedModel } from '../../quoter-verify';
import { esquemas } from '../esquemas';
import { etiquetaConfiguracion, etiquetaOpcion } from '../etiquetas';
import type { ContextoTools } from './contexto';
import { descuentoPct, errorDeConfiguracion, validarColor, validarMaterial } from './comun';

/**
 * Variaciones sobre una cotización: "PLA vs PETG", "con 5 unidades bajas al
 * tramo del 15 %". La primera fila es siempre la cotización tal cual ("Tu elección").
 */
export function compararOpciones(ctx: ContextoTools) {
  return tool({
    description:
      'Compara variaciones de una cotización de archivo (material, color, capa, relleno o cantidad). ' +
      'Lo que no indiques se toma de la cotización. La primera fila es la cotización original.',
    inputSchema: esquemas.comparar_opciones.entrada,
    outputSchema: esquemas.comparar_opciones.salida,
    execute: async ({ codigo, opciones }) => {
      const cot = await ctx.leerCotizacion(codigo);
      if (!cot) throw new Error(`No hay una cotización ${codigo} en esta conversación.`);
      if (cot.tipo !== 'archivo') throw new Error(`${codigo} es una estimación sin archivo: no se puede comparar.`);

      const base = cot.datos.eleccion;
      const variantes = [{}, ...opciones].map((o: (typeof opciones)[number]) => {
        const tech = o.tecnologia ?? base.tech;
        const materialId = o.material ?? (tech === base.tech ? base.materialId : '');
        if (!materialId) throw new Error('Si cambias la tecnología, indica también el material.');
        validarMaterial(tech, materialId, ctx.pricing);
        // Si el color de la cotización no existe en el material nuevo, validarColor
        // le devuelve al modelo las opciones para que elija uno.
        const colorId = validarColor(tech, materialId, o.color ?? base.colorId);
        return {
          eleccion: {
            tech,
            materialId,
            colorId,
            layerHeight: o.capa ?? (tech === base.tech ? base.layerHeight : ''),
            infillDensity: o.relleno ?? base.infillDensity,
          },
          cantidad: o.cantidad ?? cot.datos.cantidad,
        };
      });

      const preciosMostrados = { ...cot.datos.preciosMostrados };
      const filas = variantes.map(({ eleccion, cantidad }, i) => {
        if (!eleccion.layerHeight) throw new Error('Si cambias la tecnología, indica también la capa.');
        const q = quoteVerifiedModel(
          { ...eleccion, factorEscalado: 1, postProcessing: base.postProcessing },
          cot.datos.stl,
          ctx.pricing,
          cantidad,
        );
        if (!q.ok) throw errorDeConfiguracion(q.reason);

        const misma =
          eleccion.tech === base.tech && eleccion.materialId === base.materialId &&
          eleccion.colorId === base.colorId && q.config.layerHeight === base.layerHeight &&
          q.config.infillDensity === base.infillDensity;
        // Solo cambió la cantidad: es la misma impresión, así que este precio se le
        // mostró para esa cantidad y la tarjeta de confirmación puede compararlo.
        if (misma) preciosMostrados[cantidad] = q.cost.billableUnit;

        return {
          opcion: etiquetaOpcion(eleccion, ctx.pricing),
          cantidad,
          precioUnitario: q.cost.billableUnit,
          descuentoPct: descuentoPct(cantidad, ctx.pricing),
          total: q.cost.total,
          elegida: i === 0,
        };
      });
      await ctx.actualizarPreciosMostrados(codigo, preciosMostrados);

      return {
        codigo,
        archivo: cot.datos.archivo,
        configuracion: etiquetaConfiguracion(base, ctx.pricing),
        filas,
      };
    },
  });
}
