import {
  MOTIVOS_ETIQUETA, PERFILES_ETIQUETA,
  type IndicadoresComerciales as Datos,
} from '@/lib/asistente/metricas';
import { numero } from '@/lib/formato';
import { Card } from '../../../_ui';

const pct = (n: number, de: number) => `${numero(de ? (n / de) * 100 : 0, 1)} %`;
const etiqueta = (mapa: Record<string, string>, k: string) => mapa[k] ?? k;

function Barras({ titulo, filas, total, vacio }: { titulo: string; filas: { texto: string; total: number }[]; total: number; vacio: string }) {
  return (
    <div className="space-y-2 min-w-0">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{titulo}</h3>
      {filas.length === 0 ? <p className="text-sm text-slate-400">{vacio}</p> : (
        <ul className="space-y-1.5">
          {filas.map((f) => (
            <li key={f.texto} className="text-sm">
              <div className="flex justify-between gap-3 tabular-nums">
                <span className="text-slate-700 truncate">{f.texto}</span>
                <span className="text-slate-500 shrink-0">{numero(f.total)} · {pct(f.total, total)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                {/* El ancho es el dato: único estilo en línea. */}
                <div className="h-full rounded-full bg-ia-tinta" style={{ width: `${total ? (f.total / total) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Indicadores del agente v5 en la vista 7 (requirements R11.2), por periodo. */
export default function IndicadoresComerciales({ datos: d }: { datos: Datos }) {
  const tarjetas = [
    { titulo: 'Perfil identificado', valor: pct(d.conPerfil, d.conversaciones), nota: `${numero(d.conPerfil)} de ${numero(d.conversaciones)} conversaciones` },
    { titulo: 'Oportunidades de volumen', valor: numero(d.oportunidadesVolumen), nota: `${numero(d.oportunidadesDerivadas)} abrieron WhatsApp` },
    { titulo: 'Estimados de modelado', valor: numero(d.estimadosModelado), nota: 'códigos M- emitidos' },
    { titulo: 'Producto candidato', valor: numero(d.oportunidadesCatalogo), nota: 'otros talleres piden la pieza' },
  ];
  const sumaPerfiles = d.porPerfil.reduce((s, x) => s + x.total, 0);
  const sumaMotivos = d.porMotivo.reduce((s, x) => s + x.total, 0);
  const sumaClases = d.porClase.reduce((s, x) => s + x.total, 0);
  return (
    <Card title="Perfiles, rutas y derivaciones" desc="Agente comercial y técnico (v5): sale de la ficha de cada conversación.">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tarjetas.map((t) => (
            <div key={t.titulo} className="rounded-xl bg-slate-50 px-4 py-3 flex flex-col gap-0.5">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.titulo}</span>
              <strong className="text-xl text-inverse-surface tabular-nums">{t.valor}</strong>
              <span className="text-xs text-slate-500">{t.nota}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Barras
            titulo="Por perfil"
            total={sumaPerfiles}
            vacio="Sin fichas en el periodo."
            filas={d.porPerfil.map((x) => ({ texto: etiqueta(PERFILES_ETIQUETA, x.clave), total: x.total }))}
          />
          <Barras
            titulo="Derivaciones por motivo"
            total={sumaMotivos}
            vacio="Sin derivaciones en el periodo."
            filas={d.porMotivo.map((x) => ({ texto: etiqueta(MOTIVOS_ETIQUETA, x.clave), total: x.total }))}
          />
          <Barras
            titulo="Clases de modelado"
            total={sumaClases}
            vacio="Sin clasificaciones en el periodo."
            filas={d.porClase.map((x) => ({ texto: x.clave, total: x.total }))}
          />
        </div>
      </div>
    </Card>
  );
}
