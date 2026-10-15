import { tool } from 'ai';
import { esquemas } from '../esquemas';
import type { ContextoTools } from './contexto';

export function buscarProductos(ctx: ContextoTools) {
  return tool({
    description:
      'Busca productos en stock en la tienda de Cesgar (repuestos, boquillas, filamentos, etc.). ' +
      'Devuelve hasta 4 con su precio. El cliente puede agregarlos con el botón +; si tú los propones, usa agregar_al_carrito.',
    inputSchema: esquemas.buscar_productos.entrada,
    outputSchema: esquemas.buscar_productos.salida,
    execute: async ({ consulta }) => ({ productos: await ctx.buscarProductos(consulta) }),
  });
}
