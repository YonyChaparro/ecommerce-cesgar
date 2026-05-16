import type { Metadata } from 'next';
import {
  ScanLine, RotateCcw, Car, Layers, TrendingDown, ArrowRight, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

export const metadata: Metadata = {
  title: 'Escaneo 3D | Cesgar',
  description:
    'Digitalización de alta precisión, ingeniería inversa y fabricación de repuestos. El servicio de escaneo 3D de Cesgar para la industria automotriz e ingeniería.',
};

const FEATURES = [
  {
    icon: <ScanLine size={28} />,
    color: 'bg-teal-500/10 text-teal-400',
    title: 'Digitalización de alta precisión',
    body: 'Capturamos objetos físicos en extremo detalle con escáneres de mano y láser. El resultado es una nube de puntos exacta que actúa como puente perfecto entre el mundo físico y el entorno digital, lista para ser editada o reproducida.',
  },
  {
    icon: <RotateCcw size={28} />,
    color: 'bg-blue-500/10 text-blue-400',
    title: 'Ingeniería inversa',
    body: 'Ideal para piezas dañadas, rotas o descatalogadas. Escaneamos el objeto original, reconstruimos y ajustamos las geometrías digitalmente para devolverle su forma óptima, dejándola lista para fabricación.',
  },
  {
    icon: <Car size={28} />,
    color: 'bg-orange-500/10 text-orange-400',
    title: 'Especialización automotriz',
    body: 'Fabricamos repuestos vehiculares personalizados que mantienen las mismas características de durabilidad, resistencia y calidad que las partes originales, incluso cuando ya no existen en el mercado.',
  },
  {
    icon: <Layers size={28} />,
    color: 'bg-purple-500/10 text-purple-400',
    title: 'Flujo integrado: escaneo + impresión',
    body: 'En Cesgar el escaneo es el primer paso de un proceso completo. El modelo 3D resultante se modifica y optimiza para ser reproducido con gran precisión a través de nuestros servicios de impresión, pasando de una pieza rota a un reemplazo funcional en un solo lugar.',
  },
  {
    icon: <TrendingDown size={28} />,
    color: 'bg-green-500/10 text-green-400',
    title: 'Reducción de costos',
    body: 'Al combinar el escaneo 3D con manufactura aditiva, fabricamos repuestos y soluciones personalizadas de forma mucho más económica y eficiente que los métodos tradicionales, sin sacrificar acabado ni funcionalidad.',
  },
];

const WORKFLOW = [
  { step: '01', label: 'Recepción de la pieza', desc: 'Recibes o envías la pieza física a escanear.' },
  { step: '02', label: 'Escaneo de alta precisión', desc: 'Captura con escáner de mano o láser.' },
  { step: '03', label: 'Procesamiento del modelo', desc: 'Limpieza, reconstrucción y ajuste de geometrías.' },
  { step: '04', label: 'Validación contigo', desc: 'Revisamos el modelo digital antes de fabricar.' },
  { step: '05', label: 'Impresión y entrega', desc: 'Fabricamos la pieza y la entregamos lista para usar.' },
];

export default function EscaneoPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-inverse-surface pt-18">

        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 pt-14 pb-20">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Link href="/servicios" className="hover:text-primary-container transition-colors">Servicios</Link>
            <ChevronRight size={13} />
            <span className="text-slate-300">Escaneo 3D</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 text-teal-400 rounded-full text-xs font-bold uppercase tracking-widest font-headline mb-6">
                <ScanLine size={14} />
                Escaneo 3D
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-white leading-tight mb-6">
                Del objeto físico al modelo digital exacto
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">
                Capturamos tu pieza con escáneres de alta precisión y la convertimos en un modelo digital listo para ingeniería inversa, modificación y fabricación. Todo en un solo lugar.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/cotizador"
                  className="inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-full font-headline font-bold text-sm tracking-wide hover:brightness-110 transition-all"
                >
                  Cotizar escaneo
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/servicios"
                  className="inline-flex items-center gap-2 border border-slate-600 text-slate-300 px-6 py-3 rounded-full font-headline font-semibold text-sm hover:border-slate-400 hover:text-white transition-all"
                >
                  Ver todos los servicios
                </Link>
              </div>
            </div>

            {/* Visual placeholder — reemplazar con imagen real */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="w-full aspect-square max-w-md rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                <ScanLine size={120} className="text-teal-400/40" strokeWidth={1} />
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl bg-teal-500/10 blur-2xl" />
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="bg-white/4 border-y border-white/6 py-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-4">
                ¿Qué incluye el servicio?
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Una solución integral orientada a la recuperación de piezas, personalización y eficiencia industrial.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-white/5 border border-white/8 rounded-2xl p-7 hover:bg-white/8 transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                    {f.icon}
                  </div>
                  <h3 className="font-headline font-bold text-white text-lg mb-3 leading-snug">
                    {f.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {f.body}
                  </p>
                </div>
              ))}

              {/* CTA card */}
              <div className="bg-primary-container/15 border border-primary-container/30 rounded-2xl p-7 flex flex-col justify-between">
                <div>
                  <p className="text-primary-container text-xs font-bold uppercase tracking-widest mb-4">
                    ¿Listo para empezar?
                  </p>
                  <h3 className="font-headline font-bold text-white text-lg mb-3">
                    Cotiza tu proyecto de escaneo ahora
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Sin compromisos. Recibe una propuesta en menos de 24 horas.
                  </p>
                </div>
                <Link
                  href="/cotizador"
                  className="mt-6 inline-flex items-center gap-2 bg-primary-container text-white px-5 py-3 rounded-xl font-headline font-bold text-sm hover:brightness-110 transition-all w-fit"
                >
                  Cotizar ahora
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Workflow ── */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-4">
                Cómo funciona
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto">
                De la pieza física al reemplazo funcional en cinco pasos.
              </p>
            </div>

            <div className="relative">
              {/* Línea conectora */}
              <div className="hidden md:block absolute top-8 left-[calc(10%+1rem)] right-[calc(10%+1rem)] h-px bg-white/10" />

              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {WORKFLOW.map((w) => (
                  <div key={w.step} className="flex flex-col items-center text-center relative">
                    <div className="w-16 h-16 rounded-full bg-inverse-surface border-2 border-teal-500/40 flex items-center justify-center mb-4 relative z-10">
                      <span className="font-headline font-bold text-teal-400 text-sm">{w.step}</span>
                    </div>
                    <p className="font-headline font-bold text-white text-sm mb-1">{w.label}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{w.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="border-t border-white/8 py-20">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-5">
              ¿Tienes una pieza que necesitas recuperar?
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Escríbenos con los detalles de tu pieza y te respondemos con una propuesta personalizada en menos de 24 horas.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/cotizador"
                className="inline-flex items-center gap-2 bg-primary-container text-white px-7 py-3.5 rounded-full font-headline font-bold text-sm tracking-wide hover:brightness-110 transition-all"
              >
                Solicitar cotización
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/servicios"
                className="inline-flex items-center gap-2 border border-slate-600 text-slate-300 px-7 py-3.5 rounded-full font-headline font-semibold text-sm hover:border-slate-400 hover:text-white transition-all"
              >
                Ver otros servicios
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
