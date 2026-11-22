import type { Ficha } from '@/lib/asistente/ficha';
import { MOTIVOS_ETIQUETA, PERFILES_ETIQUETA, RUTAS_ETIQUETA } from '@/lib/asistente/filtros';
import { numero } from '@/lib/formato';

const v = (x: string | number | boolean | null | undefined) =>
  x === null || x === undefined || x === '' ? '—' : x === 'UNKNOWN' ? 'no sabe' : typeof x === 'boolean' ? (x ? 'sí' : 'no') : typeof x === 'number' ? numero(x) : x;
const unir = (...xs: (string | null | undefined)[]) => xs.filter((x) => x && x !== 'UNKNOWN').join(' ') || '—';

/** La ficha completa de la conversación (design §5.1): tabla de dos columnas sobre el recorrido. */
export default function FichaConversacion({ ficha: f, derivacion }: { ficha: Ficha | null; derivacion: string | null }) {
  if (!f) return <p className="text-sm text-slate-400">Sin ficha: la conversación es anterior al agente v5 o no llegó a anotar datos.</p>;
  const d = f.derived;
  const veh = f.part.vehicle_or_equipment;
  const filas: [string, string][] = [
    ['Perfil', `${PERFILES_ETIQUETA[f.customer_profile]}${f.business_name ? ` · ${f.business_name}` : ''}`],
    ['Intención', f.intent],
    ['Ruta', `${RUTAS_ETIQUETA[d.volume_route]} · WhatsApp ${d.whatsapp === 'REQUIRED' ? 'obligatorio' : d.whatsapp === 'OFFER' ? 'ofrecido' : 'no'}`],
    ['Siguiente acción', d.next_action],
    ['Pieza', v(f.part.description)],
    ['Vehículo o equipo', unir(veh.make, veh.model, veh.year, veh.version)],
    ['Aplicación', v(f.part.application)],
    ['Muestra', v(f.part.physical_sample)],
    ['Archivo', f.part.has_file == null ? '—' : f.part.has_file ? (f.part.file_needs_changes ? 'sí, con cambios' : 'sí') : 'no'],
    ['Medidas', v(f.part.dimensions_text)],
    ['Cantidad inicial', v(f.demand.initial_quantity)],
    ['Consumo mensual', v(f.demand.monthly_quantity_estimate)],
    ['Recurrencia', v(f.demand.recurrence)],
    ['Canal', v(f.demand.channel)],
    ['Varias referencias', v(f.demand.multiple_references)],
    ['Producto candidato', v(d.catalog_opportunity)],
    ['Función', v(f.technical.function)],
    ['Requisitos', v(f.technical.requirements)],
    ['Uso crítico', f.technical.critical_use ? 'sí (modelo)' : d.critical_by_keywords ? 'sí (palabras)' : 'no'],
    ['CAD o derechos', v(f.technical.ip_request)],
    ['Clase', d.class_min && d.class_max ? `${d.class_min === d.class_max ? d.class_min : `${d.class_min}–${d.class_max}`} · confianza ${d.confidence?.toLowerCase() ?? '—'}` : '—'],
    ['Horas', d.hours_min == null ? '—' : d.hours_max == null ? `desde ${numero(d.hours_min, 2)} h` : `${numero(d.hours_min, 2)}–${numero(d.hours_max, 2)} h`],
    ['Operaciones', f.modeling.operations.join(', ') || '—'],
    ['Pendientes', d.missing.map((m) => m.campo).join(', ') || '—'],
    ['Derivación', derivacion ? MOTIVOS_ETIQUETA[derivacion as keyof typeof MOTIVOS_ETIQUETA] ?? derivacion : '—'],
    ['Parámetros', d.parameters_version || '—'],
  ];
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {filas.filter(([, x]) => x !== '—').map(([dt, dd]) => (
        <div key={dt} className="contents">
          <dt className="text-slate-400">{dt}</dt>
          <dd className="text-slate-800 min-w-0 break-words">{dd}</dd>
        </div>
      ))}
    </dl>
  );
}
