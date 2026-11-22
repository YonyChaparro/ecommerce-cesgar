// Líneas con precio del mensaje de WhatsApp para un asesor (propuesta §10.3).
//
// El mensaje completo lo arma resumen-asesor.ts con la ficha (agente v5). Aquí
// quedan las líneas por pieza, que usan la tool derivar_a_asesor y el
// navegador ("Hablar con una persona" sin pasar por el modelo). Los precios y rangos salen siempre de las
// cotizaciones y estimaciones, nunca del texto del modelo.

import { medidasMm, numero, pesos } from '../formato';
import { enlaceWhatsApp } from '../contacto';
import type { MensajeChat } from './esquemas';

export const SALUDO_ASESOR = 'Hola, vengo del asistente de cotización de Cesgar. Necesito:';

export interface LineaPieza {
  descripcion: string;
  detalle?: string;
}

const limpiar = (s: string) => s.replace(/\s+/g, ' ').trim().replace(/[.·,;:]+$/, '');

export function armarMensajeAsesor(lineas: LineaPieza[]): string {
  if (lineas.length === 0) return SALUDO_ASESOR;
  const cuerpo = lineas
    .map((l) => `• ${limpiar(l.descripcion)}${l.detalle ? ` (${limpiar(l.detalle)})` : ''}.`)
    .join('\n');
  return `${SALUDO_ASESOR}\n${cuerpo}`;
}

export function enlaceAsesor(lineas: LineaPieza[]): { mensaje: string; enlace: string } {
  const mensaje = armarMensajeAsesor(lineas);
  return { mensaje, enlace: enlaceWhatsApp(mensaje) };
}

/** "cotización Q-7F3K: 4 × $10.983" */
export function detalleCotizacion(codigo: string, cantidad: number, precioUnitario: number): string {
  return `cotización ${codigo}: ${numero(cantidad)} × ${pesos(precioUnitario)}`;
}

/** "estimado: $10.600 – $18.300 c/u" */
export function detalleEstimacion(min: number, max: number): string {
  return `estimado: ${pesos(min)} – ${pesos(max)} c/u`;
}

/** Una pieza estimada sin archivo: "Caja para circuito…, sin archivo". */
export function descripcionSinArchivo(descripcion: string): string {
  const d = limpiar(descripcion);
  return /sin archivo/i.test(d) ? d : `${d}, sin archivo`;
}

/**
 * Sin el modelo: las líneas salen de lo que el navegador ya tiene en la
 * conversación (cotizaciones, estimaciones y archivos subidos). Si no hay nada,
 * el mensaje queda en el saludo.
 */
export function lineasDesdeConversacion(mensajes: MensajeChat[]): LineaPieza[] {
  const lineas: LineaPieza[] = [];
  const archivosCotizados = new Set<string>();
  const vistos = new Set<string>();

  for (const m of mensajes) {
    for (const p of m.parts) {
      if (p.type === 'tool-cotizar_archivo' && p.state === 'output-available') {
        const o = p.output;
        archivosCotizados.add(o.archivo);
        if (o.tipo === 'cotizacion') {
          if (vistos.has(o.codigo)) continue;
          vistos.add(o.codigo);
          lineas.push({
            descripcion: `Impresión de ${o.archivo}, ${o.configuracion}`,
            detalle: detalleCotizacion(o.codigo, o.cantidad, o.precioUnitario),
          });
        } else if (o.tipo === 'no-cotizable') {
          lineas.push({
            descripcion: `Impresión de ${o.archivo}, de ${medidasMm(o.medidasMm)}`,
            detalle: o.motivo === 'grande' ? `pasa de 30 cm` : 'no se pudo medir el volumen',
          });
        } else if (o.tipo === 'volumen') {
          lineas.push({ descripcion: `Impresión de ${o.archivo}, de ${medidasMm(o.medidasMm)}`, detalle: `${numero(o.cantidad)} unidades` });
        } else {
          lineas.push({ descripcion: `Impresión de ${o.archivo}`, detalle: 'uso crítico, revisión técnica' });
        }
      }
      if (p.type === 'tool-estimar_modelado' && p.state === 'output-available' && p.output.tipo !== 'no-requiere') {
        const o = p.output;
        if (vistos.has(o.codigo)) continue;
        vistos.add(o.codigo);
        const clase = o.claseMin === o.claseMax ? o.claseMin : `${o.claseMin}–${o.claseMax}`;
        lineas.push({
          descripcion: `Diseño 3D: ${o.descripcion}`,
          detalle: o.tipo === 'estimado'
            ? `modelado ${o.codigo}: ${clase}, estimado ${pesos(o.min)} – ${pesos(o.max)}`
            : `modelado ${o.codigo}: ${clase}, sin precio`,
        });
      }
      if (p.type === 'tool-estimar_rango' && p.state === 'output-available' && p.output.tipo === 'estimacion') {
        const o = p.output;
        if (vistos.has(o.codigo)) continue;
        vistos.add(o.codigo);
        lineas.push({ descripcion: descripcionSinArchivo(`${o.descripcion} en ${o.material}`), detalle: detalleEstimacion(o.min, o.max) });
      }
    }
  }

  // Archivos que se subieron pero nunca se cotizaron.
  for (const m of mensajes) {
    for (const p of m.parts) {
      if (p.type === 'data-archivo' && !archivosCotizados.has(p.data.nombre)) {
        archivosCotizados.add(p.data.nombre);
        lineas.push({ descripcion: `Pieza del archivo ${p.data.nombre}, de ${medidasMm(p.data.medidasMm)}` });
      }
    }
  }
  return lineas;
}
