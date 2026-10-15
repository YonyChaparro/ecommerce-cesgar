import { tool } from 'ai';
import { COLOMBIA } from '../../../app/data/colombia';
import { quoteVerifiedModel } from '../../quoter-verify';
import { calcShipping } from '../../shipping-calc';
import { esquemas } from '../esquemas';
import type { ContextoTools } from './contexto';

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

/** Ubica la ciudad en app/data/colombia.ts, que es la lista que usa el checkout. */
function ubicar(ciudad: string, departamento?: string): { ciudad: string; departamento: string } | null {
  const c = normalizar(ciudad);
  const d = departamento ? normalizar(departamento) : null;
  const deptos = d ? COLOMBIA.filter((x) => normalizar(x.name) === d) : COLOMBIA;
  for (const depto of deptos) {
    const encontrada = depto.cities.find((x) => normalizar(x) === c);
    if (encontrada) return { ciudad: encontrada, departamento: depto.name };
  }
  // Una ciudad que no está en la lista: con el departamento basta para la zona.
  const soloDepto = d && COLOMBIA.find((x) => normalizar(x.name) === d);
  return soloDepto ? { ciudad: ciudad.trim(), departamento: soloDepto.name } : null;
}

/**
 * Costo total puesto en la ciudad del cliente (fase 2). Usa calcShipping con
 * las tarifas de /admin/envios, la misma función con la que cobra el checkout.
 * El subtotal sale de las cotizaciones y productos que se citan, nunca del modelo.
 */
export function estimarEnvio(ctx: ContextoTools) {
  return tool({
    description:
      'Calcula el envío a una ciudad de Colombia y el total del pedido con las cotizaciones Q- y productos que indiques. ' +
      'Solo necesita la ciudad (y el departamento si no se ubica): nunca pidas la dirección ni otros datos.',
    inputSchema: esquemas.estimar_envio.entrada,
    outputSchema: esquemas.estimar_envio.salida,
    execute: async (e) => {
      const lugar = ubicar(e.ciudad, e.departamento);
      if (!lugar) {
        throw new Error(`No ubiqué la ciudad "${e.ciudad}". Pregúntale al cliente el departamento y vuelve a llamar con él.`);
      }
      const destino = `${lugar.ciudad}, ${lugar.departamento}`;

      const lineas: { descripcion: string; cantidad: number; total: number }[] = [];
      for (const codigo of e.codigos ?? []) {
        const cot = await ctx.leerCotizacion(codigo);
        if (!cot) throw new Error(`No hay una cotización ${codigo} en esta conversación.`);
        if (cot.tipo !== 'archivo') throw new Error(`${codigo} es una estimación sin archivo: no entra en un pedido.`);
        const { eleccion, stl, archivo, cantidad } = cot.datos;
        const q = quoteVerifiedModel({ ...eleccion, factorEscalado: 1 }, stl, ctx.pricing, cantidad);
        if (!q.ok) throw new Error(`No se pudo recalcular ${codigo}: ${q.reason}.`);
        lineas.push({ descripcion: `Impresión 3D · ${archivo}`, cantidad, total: q.cost.total });
      }
      for (const { productoId, cantidad } of e.productos ?? []) {
        const p = await ctx.leerProducto(productoId);
        if (!p) throw new Error(`El producto ${productoId} no está en la tienda. Usa un id de buscar_productos.`);
        lineas.push({ descripcion: p.nombre, cantidad, total: p.precio * cantidad });
      }
      const subtotal = lineas.reduce((s, l) => s + l.total, 0);

      // Apagado en /admin/envios: el checkout tampoco cobra envío, lo confirma el equipo.
      if (!ctx.envio.habilitado) return { tipo: 'a-confirmar' as const, destino, subtotal };

      const r = calcShipping({ metodo: 'domicilio', departamento: lugar.departamento, ciudad: lugar.ciudad }, subtotal, ctx.envio);
      const recogida = ctx.envio.recogida.habilitada
        ? [ctx.envio.recogida.etiqueta, ctx.envio.recogida.direccion].filter(Boolean).join(': ')
        : null;
      return {
        tipo: 'envio' as const,
        destino,
        etiqueta: r.etiqueta,
        costoEnvio: r.costo,
        gratisPorMonto: r.gratisPorMonto,
        lineas,
        subtotal,
        total: subtotal + r.costo,
        recogida,
      };
    },
  });
}
