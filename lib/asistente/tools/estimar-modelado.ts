import { tool } from 'ai';
import { claseModelado, precioModelado } from '../clasificador';
import { esquemas } from '../esquemas';
import { FICHA_VACIA, type Operacion } from '../ficha';
import { snapshotModelado } from '../parametros-tipos';
import type { ContextoTools } from './contexto';
import { MENSAJE_VOLUMEN, NO_INCLUYE_MODELADO } from '../mensajes-derivacion';

const OPERACION: Record<Operacion, string> = {
  EXTRUDE: 'extrusión',
  REVOLVE: 'revolución',
  SHELL: 'vaciado (shell)',
  PATTERN: 'patrón repetido',
  LOFT: 'secciones (loft)',
  FREEFORM_SURFACE: 'superficies curvas libres',
  ASSEMBLY: 'ensamble de varias piezas',
  FIT_TOLERANCE: 'ajuste y tolerancias',
  KINEMATICS: 'mecanismo con movimiento',
};
const CONFIANZA = { HIGH: 'alta', MEDIUM: 'media', LOW: 'baja' } as const;

/**
 * Estimado preliminar de modelado 3D por texto (R5). La clase sale de la ficha
 * guardada, no de la entrada: el modelo no puede pedir «C1» para abaratar.
 */
export function estimarModelado(ctx: ContextoTools) {
  return tool({
    description:
      'Da la clase de complejidad C1–C6, las horas de diseño y, si está publicado, un rango de precio preliminar para diseñar una pieza en 3D. ' +
      'Antes registra los seis factores y las operaciones probables con actualizar_ficha. Devuelve un código M-XXXX. Nunca se paga en línea.',
    inputSchema: esquemas.estimar_modelado.entrada,
    outputSchema: esquemas.estimar_modelado.salida,
    execute: async ({ descripcion }) => {
      const ficha = (await ctx.leerFicha()) ?? FICHA_VACIA;
      const c = claseModelado(ficha.modeling, ctx.parametros.horasPorClase);
      if (ficha.part.has_file === true && ficha.part.file_needs_changes === false) return { tipo: 'no-requiere' as const, descripcion };
      if (!c) throw new Error('Primero registra los factores con actualizar_ficha.');

      const resultado = precioModelado(c, ctx.parametros, ficha);
      if (resultado.tipo === 'no-requiere') return { tipo: 'no-requiere' as const, descripcion };

      const codigo = await ctx.guardarCotizacion({
        tipo: 'modelado',
        datos: { descripcion, modeling: ficha.modeling, resultado, parametros: snapshotModelado(ctx.parametros) },
      });
      const base = {
        codigo,
        descripcion,
        claseMin: c.class_min,
        claseMax: c.class_max,
        horasMin: c.hours_min,
        confianza: CONFIANZA[c.confidence],
      };
      if (resultado.tipo === 'en-propuesta') {
        return { tipo: 'en-propuesta' as const, ...base, horasMax: c.hours_max, mensaje: MENSAJE_VOLUMEN };
      }
      const detalle = {
        operaciones: ficha.modeling.operations.map((o) => OPERACION[o]),
        podriaCambiar: ficha.derived.missing.slice(0, 2).map((m) => m.pregunta),
        noIncluye: NO_INCLUYE_MODELADO,
      };
      if (resultado.tipo === 'revision') {
        return { tipo: 'revision' as const, ...base, ...detalle, horasMax: c.hours_max, motivo: resultado.motivo };
      }
      return {
        tipo: 'estimado' as const,
        ...base,
        ...detalle,
        horasMax: c.hours_max!,
        min: resultado.min,
        max: resultado.max,
        revisionRecomendada: resultado.revisionRecomendada,
      };
    },
  });
}
