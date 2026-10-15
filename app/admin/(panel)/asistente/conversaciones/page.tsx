export const dynamic = 'force-dynamic';
import { Download } from 'lucide-react';
import { getAsistenteConfig } from '@/lib/asistente/config';
import {
  costoPorModelo,
  detalleConversacion,
  indicadores,
  leerFiltros,
  modelosDelPeriodo,
  paginaConversaciones,
} from '@/lib/asistente/metricas';
import CabeceraAsistente from '../_components/CabeceraAsistente';
import CostoPorModelo from './_components/CostoPorModelo';
import DetalleConversacion from './_components/DetalleConversacion';
import FiltrosConversaciones, { SelectorPeriodo } from './_components/FiltrosConversaciones';
import Indicadores from './_components/Indicadores';
import TablaConversaciones from './_components/TablaConversaciones';
import { urlConversaciones, urlCsv } from './_components/url';

// Vista 7. Periodo, filtros, página y conversación abierta van en la URL.
export default async function ConversacionesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filtros = leerFiltros(sp);
  const idDetalle = typeof sp.id === 'string' ? sp.id.slice(0, 64) : undefined;

  const [datos, pagina, costos, modelos, detalle, config] = await Promise.all([
    indicadores(filtros),
    paginaConversaciones(filtros),
    costoPorModelo(filtros),
    modelosDelPeriodo(filtros),
    idDetalle ? detalleConversacion(idDetalle) : Promise.resolve(null),
    getAsistenteConfig(),
  ]);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl space-y-5">
        <CabeceraAsistente
          pestana="conversaciones"
          descripcion="Conversaciones anónimas, resultado y costo de cada una."
          acciones={
            <>
              <SelectorPeriodo periodo={filtros.periodo} />
              <a
                href={urlCsv(filtros)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Download size={14} /> Exportar CSV
              </a>
            </>
          }
        />
        <Indicadores datos={datos} periodo={filtros.periodo} />
        <div className={detalle ? 'grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] items-start' : ''}>
          <div className="space-y-5 min-w-0">
            <TablaConversaciones
              filas={pagina.filas}
              total={pagina.total}
              filtros={filtros}
              idActivo={detalle?.id}
              filtrosUi={<FiltrosConversaciones q={filtros.id} resultado={filtros.resultado} modelo={filtros.modelo} modelos={modelos} />}
            />
            <CostoPorModelo costos={costos} />
          </div>
          {detalle && <DetalleConversacion d={detalle} maxTurnos={config.maxTurnos} cerrar={urlConversaciones(filtros)} />}
        </div>
      </div>
    </div>
  );
}
