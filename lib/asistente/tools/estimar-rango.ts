import { tool } from 'ai';
import { numero } from '../../formato';
import { esquemas } from '../esquemas';
import { ELECCION_POR_DEFECTO, estimarRango as calcularRango, OCUPACION_SUPUESTA } from '../estimacion';
import { nombreMaterial } from '../etiquetas';
import type { ContextoTools } from './contexto';

/** Rango orientativo sin archivo, no pagable (propuesta §7.3, vista 4). */
export function estimarRango(ctx: ContextoTools) {
  return tool({
    description:
      'Da un rango de precio orientativo por unidad cuando el cliente NO tiene archivo, a partir de medidas aproximadas en cm. ' +
      'No se puede pagar ni agregar al carrito. Si el cliente no dice más, se supone FDM, PLA, capa 0.2 y relleno 40. ' +
      'Devuelve un código E-XXXX para citarlo al derivar.',
    inputSchema: esquemas.estimar_rango.entrada,
    outputSchema: esquemas.estimar_rango.salida,
    execute: async (e) => {
      const tech = e.tecnologia ?? ELECCION_POR_DEFECTO.tech;
      const usaDefectos = tech === ELECCION_POR_DEFECTO.tech;
      const eleccion = {
        tech,
        materialId: e.material ?? (usaDefectos ? ELECCION_POR_DEFECTO.materialId : ''),
        layerHeight: e.capa ?? (usaDefectos ? ELECCION_POR_DEFECTO.layerHeight : ''),
        infillDensity: e.relleno ?? ELECCION_POR_DEFECTO.infillDensity,
      };
      if (!eleccion.materialId || !eleccion.layerHeight) {
        throw new Error('Con resina indica material y capa (usa listar_materiales).');
      }

      const r = calcularRango({ largoCm: e.largoCm, anchoCm: e.anchoCm, altoCm: e.altoCm, ...eleccion }, ctx.pricing);
      if (!r.ok && r.motivo === 'grande') {
        return { tipo: 'grande' as const, descripcion: e.descripcion, ladoMayorCm: r.ladoMayorCm };
      }
      if (!r.ok) throw new Error(`No se pudo estimar: ${r.error}.`);

      const medidasCm = { x: e.largoCm, y: e.anchoCm, z: e.altoCm };
      const codigo = await ctx.guardarCotizacion({
        tipo: 'estimacion',
        datos: { descripcion: e.descripcion, medidasCm, eleccion, min: r.min, max: r.max },
      });
      return {
        tipo: 'estimacion' as const,
        codigo,
        descripcion: e.descripcion,
        medidasCm,
        cajaCm3: Math.round(r.cajaCm3 * 10) / 10,
        tecnologia: tech === 'fdm' ? 'FDM' : 'Resina',
        material: nombreMaterial(tech, eleccion.materialId, ctx.pricing),
        capa: `${numero(parseFloat(eleccion.layerHeight), 2)} mm`,
        relleno: `${eleccion.infillDensity} %`,
        ocupacionMinPct: OCUPACION_SUPUESTA.min * 100,
        ocupacionMaxPct: OCUPACION_SUPUESTA.max * 100,
        min: r.min,
        max: r.max,
      };
    },
  });
}
