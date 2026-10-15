import { getSession } from '@/lib/session';
import { leerFiltros, RESULTADOS, todasLasConversaciones } from '@/lib/asistente/metricas';

const celda = (v: string | number) => {
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** "Exportar CSV" de la vista 7, con los mismos filtros de la tabla. */
export async function GET(req: Request) {
  // proxy.ts ya protege /admin; se comprueba igual por si cambia el matcher.
  if (!(await getSession())) return new Response('No autorizado', { status: 401 });

  const filtros = leerFiltros(Object.fromEntries(new URL(req.url).searchParams));
  const filas = await todasLasConversaciones(filtros);

  const encabezado = ['conversacion', 'inicio', 'modelo', 'respaldo', 'turnos', 'tokens_entrada', 'tokens_salida', 'costo_usd', 'resultado', 'orden', 'orden_pagada'];
  const lineas = filas.map((f) => [
    f.id,
    f.inicio.toISOString(),
    f.modelo?.modelo ?? '',
    f.modelo?.respaldo ? 'si' : 'no',
    f.turnos,
    f.tokensEntrada,
    f.tokensSalida,
    f.costoUsd.toFixed(6),
    RESULTADOS[f.resultado],
    f.orden?.id ?? '',
    f.orden ? (f.orden.pagada ? 'si' : 'no') : '',
  ].map(celda).join(','));

  // BOM: Excel abre el archivo en UTF-8 y respeta las tildes.
  const csv = `﻿${[encabezado.join(','), ...lineas].join('\n')}\n`;
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="conversaciones-asistente-${fecha}.csv"`,
    },
  });
}
