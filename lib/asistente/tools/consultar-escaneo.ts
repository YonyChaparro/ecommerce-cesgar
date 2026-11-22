import { tool } from 'ai';
import { esquemas } from '../esquemas';
import type { ContextoTools } from './contexto';

export const ACLARACION_ESCANEO = 'El escaneo entrega una malla 3D; el CAD editable se cotiza aparte.';

/**
 * Tarifas «desde» de escaneo (R7.1, §16.2). No guarda cotización: una tarifa
 * «desde» no es un precio. Si falta un valor o el interruptor está apagado,
 * no hay cifras y el agente deriva (D3).
 */
export function consultarEscaneo(ctx: ContextoTools) {
  return tool({
    description:
      'Devuelve las tarifas de referencia «desde» del escaneo 3D (pequeño, mediano, grande), la limpieza de malla y la reconstrucción CAD, con su condición. ' +
      'Di siempre «desde». Si no hay tarifas disponibles, deriva a un asesor.',
    inputSchema: esquemas.consultar_escaneo.entrada,
    outputSchema: esquemas.consultar_escaneo.salida,
    execute: async ({ tamano, necesitaCad }) => {
      const p = ctx.parametros;
      const tamanos = [
        { id: 'pequeno', servicio: 'Escaneo pequeño', desde: p.SCAN_SMALL_FROM_COP, condicion: 'Confirmar tamaño, superficie y acceso.' },
        { id: 'mediano', servicio: 'Escaneo mediano', desde: p.SCAN_MEDIUM_FROM_COP, condicion: 'Se cotizan captura y procesamiento.' },
        { id: 'grande', servicio: 'Escaneo grande', desde: p.SCAN_LARGE_FROM_COP, condicion: 'Requiere revisión de logística y equipo.' },
      ].filter((t) => !tamano || t.id === tamano);
      const filas = [
        ...tamanos,
        { servicio: 'Limpieza adicional de malla', desde: p.MESH_CLEANUP_FROM_COP, condicion: 'Según el estado de la malla y el tiempo.' },
        ...(necesitaCad === false ? [] : [{
          servicio: 'Reconstrucción CAD editable', desde: p.CAD_RECONSTRUCTION_FROM_COP, condicion: 'Aparte del escaneo; depende de la complejidad (C1–C6).',
        }]),
      ];
      if (!p.publicarTarifasEscaneo) return { tipo: 'no-disponible' as const, motivo: 'no-publicado' as const, aclaracion: ACLARACION_ESCANEO };
      if (filas.some((f) => f.desde == null)) return { tipo: 'no-disponible' as const, motivo: 'sin-tarifa' as const, aclaracion: ACLARACION_ESCANEO };
      return {
        tipo: 'tarifas' as const,
        filas: filas.map((f) => ({ servicio: f.servicio, desde: f.desde!, condicion: f.condicion })),
        aclaracion: ACLARACION_ESCANEO,
      };
    },
  });
}
