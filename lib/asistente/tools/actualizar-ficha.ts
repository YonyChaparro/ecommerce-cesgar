import { tool } from 'ai';
import { calcularDerivados, esCritica, motivoRevision, textoClase } from '../clasificador';
import { esquemas, type SalidaTool } from '../esquemas';
import { FICHA_VACIA, mezclarFicha, type Ficha, type FichaParcial } from '../ficha';
import type { ContextoTools } from './contexto';

const CONFIANZA = { HIGH: 'alta', MEDIUM: 'media', LOW: 'baja' } as const;

/** Lee, mezcla, clasifica y guarda (design §5.1). La usa también cotizar_archivo. */
export async function actualizarFichaGuardada(ctx: ContextoTools, parcial: FichaParcial): Promise<Ficha> {
  return (await actualizarYComparar(ctx, parcial)).ficha;
}

async function actualizarYComparar(ctx: ContextoTools, parcial: FichaParcial): Promise<{ ficha: Ficha; previa: Ficha | null }> {
  const previa = await ctx.leerFicha();
  const ficha = calcularDerivados(mezclarFicha(previa ?? FICHA_VACIA, parcial), ctx.parametros);
  await ctx.guardarFicha(ficha);
  return { ficha, previa };
}

/**
 * La instrucción concreta para este turno (design §4.5). La decide el servidor
 * para que la ruta no dependa de que el modelo interprete bien los códigos.
 */
export function siguientePaso(f: Ficha, previa: Ficha | null = null): string {
  const d = f.derived;
  const pregunta = d.missing[0] ? ` Luego pregunta, con tus palabras: «${d.missing[0].pregunta}»` : '';
  // §25: sin muestra completa hacen falta fotos, y las fotos van por WhatsApp. Solo
  // en el turno en que se supo, para no repetirlo en cada respuesta.
  const muestra = f.part.physical_sample;
  const fotos = muestra && ['FRAGMENTS', 'SIMILAR_PART', 'NONE'].includes(muestra) && previa?.part.physical_sample !== muestra
    ? 'Como no hay pieza completa, ofrece en una frase enviar fotos por WhatsApp (el asesor recibe el resumen). '
    : '';
  return fotos + pasoSegunAccion(f, pregunta);
}

function pasoSegunAccion(f: Ficha, pregunta: string): string {
  const d = f.derived;
  switch (d.next_action) {
    case 'TECHNICAL_REVIEW': {
      const motivo = esCritica(f) ? 'CRITICAL' : f.technical.ip_request ? 'IP_REQUEST' : 'MODELING_REVIEW';
      return `Revisión técnica: no des precio ni rango. Explica por qué en una frase y deriva ahora con derivar_a_asesor (motivo ${motivo}).`;
    }
    case 'COMMERCIAL_WHATSAPP':
      return 'Volumen: no des precio de modelado aparte ni propongas el carrito. Explica que lo mejor es una propuesta de producción y deriva ahora con derivar_a_asesor (motivo VOLUME).';
    case 'ASK':
      return d.whatsapp === 'OFFER'
        ? `En esta respuesta ofrece en una frase pasar a WhatsApp para una propuesta de suministro.${pregunta}`
        : `Tu única pregunta en esta respuesta es esta, con tus palabras: «${d.missing[0]?.pregunta ?? ''}». No preguntes otra cosa antes.`;
    case 'SEARCH_CATALOG':
      return 'Busca en la tienda con buscar_productos o, si no aplica, deriva.';
    default:
      return d.whatsapp === 'OFFER'
        ? 'Cotiza o estima con la tool que corresponda y ofrece en una frase pasar a WhatsApp para una propuesta de suministro.'
        : 'Ya hay datos suficientes: cotiza o estima con la tool que corresponda.';
  }
}

/** Lo justo para conversar: nunca tarifas ni umbrales (N3). */
export function salidaFicha(f: Ficha, previa: Ficha | null = null): SalidaTool<'actualizar_ficha'> {
  const d = f.derived;
  return {
    perfil: f.customer_profile,
    ruta: d.volume_route,
    whatsapp: d.whatsapp,
    next_action: d.next_action,
    primerFaltante: d.missing[0] ?? null,
    requiereRevision: d.next_action === 'TECHNICAL_REVIEW',
    motivoRevision: motivoRevision(f),
    clase: d.class_min && d.class_max
      ? `${textoClase(d.class_min, d.class_max)}, confianza ${CONFIANZA[d.confidence ?? 'LOW']}`
      : null,
    siguientePaso: siguientePaso(f, previa),
  };
}

/**
 * La ficha de la solicitud (spec v5.1 §17.1, §27). El modelo manda solo lo
 * nuevo de este turno; el servidor mezcla, calcula ruta, clase, faltantes y
 * siguiente acción, y guarda. Sin tarjeta para el cliente.
 */
export function actualizarFicha(ctx: ContextoTools) {
  return tool({
    description:
      'Anota en la ficha de la solicitud lo nuevo que dijo el cliente en este turno (perfil, pieza, vehículo, cantidad, recurrencia, canal, muestra, función, factores y operaciones de modelado). ' +
      'Manda solo lo nuevo: lo anterior se conserva. Si dijo si conserva la pieza (entera, pedazos, ya no la tiene), mándalo en part.physical_sample. ' +
      'Si el cliente no sabe un dato, mándalo como "UNKNOWN". ' +
      'Devuelve la ruta, si WhatsApp es obligatorio u ofrecido, el primer dato que falta y siguientePaso: haz lo que diga siguientePaso.',
    inputSchema: esquemas.actualizar_ficha.entrada,
    outputSchema: esquemas.actualizar_ficha.salida,
    execute: async (parcial) => {
      const { ficha, previa } = await actualizarYComparar(ctx, parcial as FichaParcial);
      return salidaFicha(ficha, previa);
    },
  });
}
