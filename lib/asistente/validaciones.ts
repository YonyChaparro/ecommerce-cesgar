// Resultados de `npm run verify:agente` (decisión 6 de la propuesta).
//
// El script escribe validaciones.json en el repo; el admin y la acción de
// guardar lo leen de aquí. Aprobar un modelo nuevo es correr el script, hacer
// commit y desplegar: así cada aprobación queda registrada.

import datos from './validaciones.json';

/** Las cinco reglas de la vista 6. Cada situación de verify:agente comprueba una. */
export const REGLAS = [
  { id: 'precio-de-tool', titulo: 'Todo precio sale de una tool' },
  { id: 'deriva-grandes', titulo: 'Deriva piezas de más de 30 cm' },
  { id: 'sin-datos-personales', titulo: 'No pide datos personales' },
  { id: 'sin-descuentos', titulo: 'No promete descuentos fuera de tarifa' },
  { id: 'confirma-carrito', titulo: 'Pide confirmación antes del carrito' },
] as const;

export type ReglaId = (typeof REGLAS)[number]['id'];

export interface Situacion {
  id: string;
  regla: ReglaId;
  titulo: string;
}

export interface ResultadoModelo {
  fecha: string;
  aprobadas: number;
  total: number;
  /** Costo medio por conversación medido en las situaciones, en US$. */
  costoMedioUsd: number | null;
  /** situación → aprobó */
  resultados: Record<string, boolean>;
  fallos: { situacion: string; motivo: string }[];
}

export interface Validaciones {
  ultimaEjecucion: string | null;
  situaciones: Situacion[];
  modelos: Record<string, ResultadoModelo>;
}

export function leerValidaciones(): Validaciones {
  return datos as Validaciones;
}

/** Situaciones de la lista vigente que ese modelo no corrió (se agregaron después). */
function situacionesPendientes(r: ResultadoModelo, v: Validaciones): string[] {
  return v.situaciones.filter((s) => !(s.id in r.resultados)).map((s) => s.id);
}

/** Aprobado = pasó todas las situaciones que corrió y no le falta ninguna de la lista vigente. */
export function modeloAprobado(id: string, v: Validaciones = leerValidaciones()): boolean {
  const r = v.modelos[id];
  return !!r && r.total > 0 && r.aprobadas === r.total && situacionesPendientes(r, v).length === 0;
}

export type EstadoValidacion =
  | { estado: 'aprobado'; texto: string; nota: string }
  | { estado: 'fallo'; texto: string; nota: string }
  | { estado: 'sin-validar'; texto: string; nota: string };

/** Lo que la vista 6 muestra en cada fila del buscador de modelos. */
export function estadoValidacion(id: string, v: Validaciones = leerValidaciones()): EstadoValidacion {
  const r = v.modelos[id];
  if (!r || r.total === 0) {
    return { estado: 'sin-validar', texto: 'Sin validar', nota: 'Corre verify:agente para habilitarlo' };
  }
  const pendientes = situacionesPendientes(r, v);
  if (r.aprobadas === r.total && pendientes.length > 0) {
    return {
      estado: 'sin-validar',
      texto: `Faltan ${pendientes.length} situaciones`,
      nota: 'Se agregaron situaciones nuevas: corre verify:agente otra vez',
    };
  }
  if (r.aprobadas === r.total) {
    const costo = r.costoMedioUsd != null
      ? `≈ US$${r.costoMedioUsd.toLocaleString('es-CO', { maximumFractionDigits: 4 })} por conversación`
      : 'Costo sin medir';
    return { estado: 'aprobado', texto: `Aprobado ${r.aprobadas}/${r.total}`, nota: costo };
  }
  return {
    estado: 'fallo',
    texto: `Falló ${r.total - r.aprobadas} de ${r.total}`,
    nota: r.fallos[0]?.motivo ?? 'No aprobó todas las situaciones',
  };
}
