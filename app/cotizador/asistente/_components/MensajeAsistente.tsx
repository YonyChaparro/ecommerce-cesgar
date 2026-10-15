'use client';

import Orbe from '@/components/ia/Orbe';
import type { MensajeChat, NombreTool, SalidaTool } from '@/lib/asistente/esquemas';
import Aviso from './Aviso';
import FichaTool from './FichaTool';
import TextoAsistente from './TextoAsistente';
import { nombreDeParte, REGISTRO, type ContextoTarjeta, type ParteTool } from './tarjetas/registro';

type Parte = MensajeChat['parts'][number];
type ParteDeTool = ParteTool<NombreTool>;

const esTool = (p: Parte): p is ParteDeTool => nombreDeParte(p.type) !== null;

/**
 * Orbe, una ficha por tool usada y, debajo, texto y tarjetas en el orden en que
 * llegan (vista 3). El estado de cada parte decide la interfaz: entrada en
 * camino o lista → ficha "en curso"; salida lista → ficha "hecho" y tarjeta;
 * error → aviso.
 */
export default function MensajeAsistente({ mensaje, respondiendo, interactivo }: {
  mensaje: MensajeChat;
  respondiendo: boolean;
  interactivo: boolean;
}) {
  const tools = mensaje.parts.filter(esTool);

  const comparaciones = new Map<string, SalidaTool<'comparar_opciones'>>();
  const cotizados = new Set<string>();
  for (const p of tools) {
    if (p.type === 'tool-comparar_opciones' && p.state === 'output-available') comparaciones.set(p.output.codigo, p.output);
    if (p.type === 'tool-cotizar_archivo' && p.state === 'output-available' && p.output.tipo === 'cotizacion') cotizados.add(p.output.codigo);
  }
  // Una comparación sin su cotización en este mensaje va en una tarjeta propia.
  for (const codigo of comparaciones.keys()) if (!cotizados.has(codigo)) comparaciones.delete(codigo);
  const ctx: ContextoTarjeta = { interactiva: interactivo, comparaciones, cotizados };

  const fichas = tools.flatMap((p) => {
    const entrada = REGISTRO[nombreDeParte(p.type)!];
    if (p.state === 'output-available' && entrada.hecho) {
      return [<FichaTool key={p.toolCallId} enCurso={false} texto={(entrada.hecho as (s: unknown) => string)(p.output)} />];
    }
    if ((p.state === 'input-streaming' || p.state === 'input-available') && entrada.enCurso) {
      return [<FichaTool key={p.toolCallId} enCurso texto={entrada.enCurso} />];
    }
    return [];
  });

  const cuerpo = mensaje.parts.map((p, i) => {
    if (p.type === 'text') return p.text.trim() ? <TextoAsistente key={i} texto={p.text} /> : null;
    if (!esTool(p)) return null;
    if (p.state === 'output-error') {
      return <Aviso key={p.toolCallId} tono="error" titulo="No pude completar este paso." texto="El asistente lo va a intentar de otra forma." />;
    }
    const tarjeta = REGISTRO[nombreDeParte(p.type)!].tarjeta as ((parte: ParteDeTool, c: ContextoTarjeta) => React.ReactNode) | undefined;
    const nodo = tarjeta?.(p, ctx);
    return nodo ? <div key={p.toolCallId}>{nodo}</div> : null;
  });

  return (
    <div className="flex items-start gap-3.5">
      <Orbe activo={respondiendo} className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        {fichas.length > 0 && <div className="flex flex-wrap gap-4">{fichas}</div>}
        {cuerpo}
      </div>
    </div>
  );
}
