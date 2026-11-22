import { tool } from 'ai';
import { getAvailableColors } from '../../quoter-catalog';
import { numero } from '../../formato';
import { esquemas } from '../esquemas';
import type { ContextoTools } from './contexto';

// La vista 3 muestra solo lo que el agente recomienda para ese uso. Nombre,
// descripción y colores salen del catálogo; ventajas y límites son texto corto
// del modelo, que no puede llevar precios.
const TIENE_PRECIO = /\$\s?\d|\d\s?(pesos|cop)\b/i;

export function mostrarMateriales(ctx: ContextoTools) {
  return tool({
    description:
      'Muestra al cliente de 1 a 3 materiales en tarjetas, con uno marcado como recomendado. ' +
      'Usa ids de listar_materiales. Ventajas y límites son para el uso que describió el cliente y no llevan precios.',
    inputSchema: esquemas.mostrar_materiales.entrada,
    outputSchema: esquemas.mostrar_materiales.salida,
    execute: async ({ materiales }) => {
      if (materiales.filter((m) => m.recomendado).length > 1) {
        throw new Error('Marca como recomendado un solo material.');
      }
      return {
        materiales: materiales.map((m) => {
          const cat = (ctx.pricing.materiales[m.tecnologia] ?? []).find((x) => x.id === m.id && !x.disabled);
          if (!cat) throw new Error(`El material "${m.id}" no está disponible en ${m.tecnologia}. Usa un id de listar_materiales.`);
          const textos = [...m.ventajas, ...m.limites];
          if (textos.some((t) => TIENE_PRECIO.test(t))) {
            throw new Error('Las ventajas y los límites no llevan precios; los precios salen de cotizar_archivo o estimar_rango.');
          }
          const colores = getAvailableColors(m.tecnologia, m.id).map((c) => c.nombre);
          return {
            tecnologia: m.tecnologia,
            id: m.id,
            nombre: cat.nombre,
            descripcion: cat.desc,
            // "13 colores disponibles" cuando son muchos (vista 3).
            colores: colores.length > 6 ? [`${numero(colores.length)} colores disponibles`] : colores,
            recomendado: m.recomendado,
            ventajas: m.ventajas,
            limites: m.limites,
          };
        }),
      };
    },
  });
}
