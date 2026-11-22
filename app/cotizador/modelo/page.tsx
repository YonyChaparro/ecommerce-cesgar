export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { MessageSquarePlus } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Quoter from '../../components/Quoter';
import QuoteRequestForm from '../../components/QuoteRequestForm';
import { getQuoterPricing } from '@/lib/quoter-config';
import VentajasCotizador from '../_components/VentajasCotizador';

export const metadata: Metadata = {
  title: 'Cotizar con archivo STL',
  description: 'Cotiza tu impresión 3D industrial al instante. Carga tu archivo STL y obtén precio, materiales y tiempos en segundos.',
};

// El cotizador de siempre, movido desde /cotizador sin cambios de diseño.
export default async function CotizadorModeloPage() {
  const pricing = await getQuoterPricing();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#16234d] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-36 pb-12 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {/* Left copy */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold mb-6 text-[#4dbdcc]">
                Cotiza tu impresión 3D industrial al instante
              </h1>
              <p className="text-slate-300 mb-10 text-base sm:text-lg">
                Carga tu archivo STL 3D y obtén el precio al instante. Nuestro sistema calcula materiales, tiempos y costos para que avances sin perder tiempo. Configura cada modelo con tus preferencias exactas.
              </p>
              <VentajasCotizador tono="oscuro" />
            </div>

            {/* Right: quoter */}
            <Quoter pricing={pricing} />
          </div>
        </div>

        {/* ── Cotización personalizada ── */}
        <div id="cotizacion-personalizada" className="scroll-mt-24 border-t border-white/8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

              {/* Left copy */}
              <div className="lg:sticky lg:top-28">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-bold uppercase tracking-widest font-headline mb-6">
                  <MessageSquarePlus size={14} />
                  Cotización personalizada
                </div>
                <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-5 leading-tight">
                  ¿Tu proyecto necesita más que una cotización automática?
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  Envíanos tu archivo STL junto con fotos o videos de referencia y te respondemos con una propuesta detallada adaptada a tu necesidad exacta.
                </p>
                <ul className="space-y-4 text-slate-400 text-sm">
                  {[
                    'Piezas con tolerancias críticas o geometrías complejas',
                    'Proyectos que requieren asesoría en material o tecnología',
                    'Series cortas con requisitos industriales específicos',
                    'Repuestos automotrices o componentes descatalogados',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: form */}
              <div className="bg-white/4 border border-white/8 rounded-2xl p-8">
                <QuoteRequestForm />
              </div>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
