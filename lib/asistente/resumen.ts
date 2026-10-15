// Resúmenes de una conversación para /admin/asistente/conversaciones (vista 7):
// el recorrido (mensajes del cliente y tools con su resumen) y la transcripción.
// Puro: recibe los mensajes guardados en ChatSession.

import { medidasMm, numero, pesos, volumenCm3 } from '../formato';
import type { MensajeChat } from './esquemas';

export interface PasoRecorrido {
  /** 'cliente' o el nombre de la tool. */
  quien: string;
  texto: string;
}

const corto = (s: string, max = 120) => {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

function resumenTool(p: MensajeChat['parts'][number]): PasoRecorrido | null {
  if (!p.type.startsWith('tool-') || !('state' in p)) return null;
  const quien = p.type.slice(5);
  if (p.state === 'output-error') return { quien, texto: 'falló' };
  if (p.state !== 'output-available') {
    return { quien, texto: quien === 'agregar_al_carrito' ? 'sin respuesta del cliente' : 'sin terminar' };
  }
  switch (p.type) {
    case 'tool-listar_materiales':
      return { quien, texto: `${p.output.materiales.length} materiales disponibles` };
    case 'tool-mostrar_materiales': {
      const rec = p.output.materiales.find((m) => m.recomendado);
      return { quien, texto: rec ? `recomienda ${rec.nombre}` : p.output.materiales.map((m) => m.nombre).join(', ') };
    }
    case 'tool-cotizar_archivo': {
      const o = p.output;
      return o.tipo === 'cotizacion'
        ? { quien, texto: `${o.codigo} · ${volumenCm3(o.volumenCm3)} · ${pesos(o.precioUnitario)} c/u × ${numero(o.cantidad)}` }
        : { quien, texto: `${o.archivo}: ${o.motivo === 'grande' ? 'pasa de 30 cm' : 'volumen no fiable'}` };
    }
    case 'tool-comparar_opciones':
      return { quien, texto: p.output.filas.filter((f) => !f.elegida).map((f) => `${f.opcion} × ${f.cantidad}`).join(' · ') };
    case 'tool-estimar_rango': {
      const o = p.output;
      return o.tipo === 'estimacion'
        ? { quien, texto: `${o.codigo} · ${pesos(o.min)} – ${pesos(o.max)} c/u` }
        : { quien, texto: `${o.descripcion}: pasa de 30 cm` };
    }
    case 'tool-estimar_envio':
      return p.output.tipo === 'envio'
        ? { quien, texto: `${p.output.destino} · envío ${pesos(p.output.costoEnvio)}` }
        : { quien, texto: `${p.output.destino} · a confirmar` };
    case 'tool-buscar_productos':
      return { quien, texto: `${p.output.productos.length} productos para "${corto(p.input.consulta, 40)}"` };
    case 'tool-agregar_al_carrito': {
      const r = p.output.resultado;
      return { quien, texto: r === 'confirmado' ? 'confirmado por el cliente' : r === 'rechazado' ? 'rechazado por el cliente' : r };
    }
    case 'tool-derivar_a_asesor':
      return { quien, texto: `${p.input.piezas.length} pieza(s) para WhatsApp` };
    default:
      return { quien, texto: '' };
  }
}

export function recorrido(mensajes: MensajeChat[]): PasoRecorrido[] {
  const pasos: PasoRecorrido[] = [];
  for (const m of mensajes) {
    if (m.role === 'user') {
      for (const p of m.parts) {
        if (p.type === 'data-archivo') pasos.push({ quien: 'cliente', texto: `Adjunta ${p.data.nombre} (${medidasMm(p.data.medidasMm)})` });
        if (p.type === 'text' && p.text.trim()) pasos.push({ quien: 'cliente', texto: corto(p.text) });
      }
    } else {
      for (const p of m.parts) {
        const paso = resumenTool(p);
        if (paso) pasos.push(paso);
      }
    }
  }
  return pasos;
}

export interface LineaTranscripcion {
  rol: 'cliente' | 'asistente';
  texto: string;
}

/** Solo los textos: lo que se dijeron cliente y asistente, sin el detalle de las tools. */
export function transcripcion(mensajes: MensajeChat[]): LineaTranscripcion[] {
  return mensajes.flatMap((m) => {
    const texto = m.parts.flatMap((p) => (p.type === 'text' && p.text.trim() ? [p.text.trim()] : [])).join('\n\n');
    return texto ? [{ rol: m.role === 'user' ? 'cliente' as const : 'asistente' as const, texto }] : [];
  });
}

export interface ModeloRespondio {
  modelo: string;
  respaldo: boolean;
}

/** ChatSession.modelos es JSON; el primero que respondió es el que se muestra. */
export function modelosDe(json: string | null): ModeloRespondio[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((m) => typeof m?.modelo === 'string') : [];
  } catch {
    return [];
  }
}
