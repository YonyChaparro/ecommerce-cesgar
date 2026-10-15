import { tool } from 'ai';
import { getAvailableColors, getAvailableQualities, RELLENOS } from '../../quoter-catalog';
import { MAX_SINGLE_PIECE_MM } from '../../quoter-rules';
import { esquemas } from '../esquemas';
import type { ContextoTools } from './contexto';

/** Catálogo disponible (sin materiales bloqueados por el admin). Sin precios: esos salen de cotizar. */
export function listarMateriales(ctx: ContextoTools) {
  return tool({
    description:
      'Devuelve los materiales, colores, alturas de capa y rellenos disponibles, y los tramos de descuento por cantidad. ' +
      'Úsala antes de recomendar un material o de cotizar.',
    inputSchema: esquemas.listar_materiales.entrada,
    outputSchema: esquemas.listar_materiales.salida,
    execute: async () => {
      const { pricing } = ctx;
      const materiales = (['fdm', 'resina'] as const).flatMap((tecnologia) =>
        (pricing.materiales[tecnologia] ?? [])
          .filter((m) => !m.disabled)
          .map((m) => ({
            tecnologia,
            id: m.id,
            nombre: m.nombre,
            descripcion: m.desc,
            colores: getAvailableColors(tecnologia, m.id),
          })),
      );
      const capas = (tecnologia: 'fdm' | 'resina') =>
        getAvailableQualities(tecnologia)
          .filter((q) => q.val in (pricing.tarifas.multiplicadorCalidad[tecnologia] ?? {}))
          .map((q) => ({ capa: q.val, nombre: q.text }));

      return {
        materiales,
        capas: { fdm: capas('fdm'), resina: capas('resina') },
        rellenos: RELLENOS
          .filter((r) => r.val in pricing.tarifas.multiplicadorRelleno)
          .map((r) => ({ relleno: r.val, nombre: r.text })),
        descuentosPorCantidad: pricing.tarifas.multiplicadorCantidad
          .filter((d) => d.mult < 1)
          .map((d) => ({ desde: d.min, descuentoPct: Math.round((1 - d.mult) * 100) }))
          .sort((a, b) => a.desde - b.desde),
        ladoMaximoCm: MAX_SINGLE_PIECE_MM / 10,
      };
    },
  });
}
