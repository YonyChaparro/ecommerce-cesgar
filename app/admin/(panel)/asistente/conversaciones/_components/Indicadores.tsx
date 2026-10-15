import { PERIODOS, type Indicadores as Datos, type Periodo } from '@/lib/asistente/metricas';
import { numero } from '@/lib/formato';
import { usd } from './formato';

const pct = (n: number, de: number) => `${numero(de ? (n / de) * 100 : 0, 1)} %`;

export default function Indicadores({ datos: d, periodo }: { datos: Datos; periodo: Periodo }) {
  const tarjetas = [
    { titulo: 'Conversaciones', valor: numero(d.conversaciones), nota: PERIODOS[periodo].toLowerCase() },
    { titulo: 'Llegaron al carrito', valor: numero(d.carrito), nota: `${pct(d.carrito, d.conversaciones)} de las conversaciones` },
    { titulo: 'Órdenes pagadas', valor: numero(d.pagadas), nota: `${pct(d.pagadas, d.conversaciones)} · chat → pago` },
    { titulo: 'Derivadas a asesor', valor: numero(d.derivadas), nota: `${pct(d.derivadas, d.conversaciones)} por WhatsApp` },
    {
      titulo: 'Costo de IA',
      valor: usd(d.costoUsd),
      nota: `${usd(d.conversaciones ? d.costoUsd / d.conversaciones : 0)} por conversación`,
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {tarjetas.map((t) => (
        <div key={t.titulo} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.titulo}</span>
          <strong className="text-2xl text-inverse-surface tabular-nums">{t.valor}</strong>
          <span className="text-xs text-slate-500">{t.nota}</span>
        </div>
      ))}
    </div>
  );
}
