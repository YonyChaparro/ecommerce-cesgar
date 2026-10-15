// Tabla de §9 de la propuesta: para cada tool, el texto de su ficha mientras
// corre y al terminar, y la tarjeta que pinta su salida. MensajeAsistente
// recorre las partes del mensaje y busca aquí; no hay un switch por tool.
// Agregar una tool es sumar su esquema, su implementación y una entrada aquí.

import type { MensajeChat, NombreTool, SalidaTool } from '@/lib/asistente/esquemas';
import ListaProductos from './ListaProductos';
import TablaOpciones from './TablaOpciones';
import TarjetaAsesor from './TarjetaAsesor';
import TarjetaConfirmacion from './TarjetaConfirmacion';
import TarjetaCotizacion, { CabeceraCotizacion } from './TarjetaCotizacion';
import TarjetaEnvio from './TarjetaEnvio';
import TarjetaEstimacion from './TarjetaEstimacion';
import TarjetasMaterial from './TarjetasMaterial';

export type ParteTool<K extends NombreTool> = Extract<MensajeChat['parts'][number], { type: `tool-${K}` }>;

export interface ContextoTarjeta {
  /** La parte es del último mensaje y no hay una respuesta en curso. */
  interactiva: boolean;
  /** comparar_opciones del mismo mensaje, por código: va dentro de la tarjeta de cotización. */
  comparaciones: Map<string, SalidaTool<'comparar_opciones'>>;
  /** Códigos que ya tienen una tarjeta de cotización en este mensaje. */
  cotizados: Set<string>;
}

interface Entrada<K extends NombreTool> {
  /** Ficha mientras corre. Sin texto, no hay ficha. */
  enCurso?: string;
  /** Ficha al terminar. */
  hecho?: (salida: SalidaTool<K>) => string;
  /** La tarjeta. Las que solo muestran la salida la reciben ya lista. */
  tarjeta?: (parte: ParteTool<K>, ctx: ContextoTarjeta) => React.ReactNode;
}

const conSalida = <K extends NombreTool>(pintar: (salida: SalidaTool<K>, ctx: ContextoTarjeta) => React.ReactNode) =>
  (parte: ParteTool<K>, ctx: ContextoTarjeta) => {
    // Con K genérico TypeScript no reduce la unión de partes; aquí ya es una parte de tool.
    const p = parte as unknown as { state: string; output?: unknown };
    return p.state === 'output-available' ? pintar(p.output as SalidaTool<K>, ctx) : null;
  };

export const REGISTRO: { [K in NombreTool]: Entrada<K> } = {
  listar_materiales: {
    enCurso: 'Consultando materiales…',
    hecho: () => 'Consultó los materiales disponibles',
  },
  mostrar_materiales: {
    tarjeta: conSalida<'mostrar_materiales'>((s) => <TarjetasMaterial salida={s} />),
  },
  cotizar_archivo: {
    enCurso: 'Midiendo tu archivo…',
    hecho: () => 'Midió tu archivo',
    tarjeta: conSalida<'cotizar_archivo'>((s, ctx) => (
      <TarjetaCotizacion salida={s} comparacion={s.tipo === 'cotizacion' ? ctx.comparaciones.get(s.codigo) : undefined} />
    )),
  },
  comparar_opciones: {
    enCurso: 'Calculando precio…',
    hecho: (s) => `Comparó ${s.filas.length} opciones`,
    // Si su cotización está en el mismo mensaje, la tabla ya va dentro de esa tarjeta.
    tarjeta: conSalida<'comparar_opciones'>((s, ctx) =>
      ctx.cotizados.has(s.codigo) ? null : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <CabeceraCotizacion archivo={s.archivo} codigo={s.codigo} configuracion={s.configuracion} />
          <div className="border-t border-slate-200"><TablaOpciones salida={s} /></div>
        </div>
      ),
    ),
  },
  estimar_rango: {
    enCurso: 'Calculando precio…',
    hecho: () => 'Calculó un rango orientativo',
    tarjeta: conSalida<'estimar_rango'>((s) => <TarjetaEstimacion salida={s} />),
  },
  estimar_envio: {
    enCurso: 'Calculando el envío…',
    hecho: () => 'Calculó el envío',
    tarjeta: conSalida<'estimar_envio'>((s) => <TarjetaEnvio salida={s} />),
  },
  buscar_productos: {
    enCurso: 'Buscando en la tienda…',
    hecho: () => 'Buscó en la tienda',
    tarjeta: conSalida<'buscar_productos'>((s) => <ListaProductos salida={s} />),
  },
  agregar_al_carrito: {
    tarjeta: (parte, ctx) => <TarjetaConfirmacion parte={parte} interactiva={ctx.interactiva} />,
  },
  derivar_a_asesor: {
    tarjeta: conSalida<'derivar_a_asesor'>((s) => <TarjetaAsesor salida={s} />),
  },
};

export function nombreDeParte(type: string): NombreTool | null {
  if (!type.startsWith('tool-')) return null;
  const nombre = type.slice(5);
  return nombre in REGISTRO ? (nombre as NombreTool) : null;
}
