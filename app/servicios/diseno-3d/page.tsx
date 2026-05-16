import type { Metadata } from 'next';
import {
  PenTool, Shapes, ScanLine, Car, Cog, Wrench, Layers, ArrowRight, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

export const metadata: Metadata = {
  title: 'Diseño 3D | Cesgar',
  description:
    'Diseño 3D funcional e industrial a medida: repuestos automotrices descatalogados, componentes mecánicos complejos, ingeniería inversa y optimización de maquinaria.',
};

const FEATURES = [
  {
    icon: <Shapes size={28} />,
    color: 'bg-purple-500/10 text-purple-400',
    title: 'Diseño funcional e industrial a medida',
    body: 'Creamos soluciones tangibles para necesidades específicas: carcasas protectoras para pantallas HMI, bandejas de goteo dimensionadas a máquinas expendedoras, soportes industriales y piezas de uso continuo. El foco siempre es la funcionalidad, no solo la estética.',
  },
  {
    icon: <ScanLine size={28} />,
    color: 'bg-teal-500/10 text-teal-400',
    title: 'Sinergia con escaneo e ingeniería inversa',
    body: 'El diseño es el paso natural después del escaneo 3D. A partir de los datos digitalizados, limpiamos la malla, corregimos imperfecciones y aplicamos modificaciones paramétricas. Clave para intervenir moldes industriales existentes antes de su reproducción física.',
  },
  {
    icon: <Car size={28} />,
    color: 'bg-orange-500/10 text-orange-400',
    title: 'Repuestos automotrices descatalogados',
    body: 'Cuando una pieza ya no se fabrica, la diseñamos desde cero o a partir de fragmentos. Logramos modelos exactos de componentes como rejillas de ventilación para autos clásicos, garantizando que el ensamble encaje a la perfección en tableros y carrocerías originales.',
  },
  {
    icon: <Cog size={28} />,
    color: 'bg-blue-500/10 text-blue-400',
    title: 'Componentes mecánicos complejos',
    body: 'Modelamos mecanismos funcionales que interactúan con fluidos o sistemas en movimiento. Un ejemplo es el diseño de bombas dosificadoras para sistemas de bioetanol, donde las tolerancias milimétricas son críticas para el funcionamiento del producto final.',
  },
  {
    icon: <Wrench size={28} />,
    color: 'bg-yellow-500/10 text-yellow-400',
    title: 'Optimización y upgrades de maquinaria',
    body: 'Diseñamos modificaciones, soportes y piezas personalizadas para repotenciar hardware existente. Entre los proyectos más recurrentes están adaptaciones y mejoras para impresoras 3D (como la serie Ender 3) que extienden su vida útil y precisión.',
  },
  {
    icon: <Layers size={28} />,
    color: 'bg-pink-500/10 text-pink-400',
    title: 'Diseño orientado a manufactura aditiva',
    body: 'Cada proyecto se construye considerando las físicas del material: ángulos de voladizo, tolerancias de retracción y orientación de capas. El diseño virtual se traduce directamente en una pieza física resistente, funcional y con acabado de alta calidad.',
  },
];

const WORKFLOW = [
  { step: '01', label: 'Brief del proyecto', desc: 'Defines la necesidad, referencia o fragmento disponible.' },
  { step: '02', label: 'Escaneo o referencia', desc: 'Digitalizamos la pieza o partimos de planos y medidas.' },
  { step: '03', label: 'Modelado CAD', desc: 'Diseñamos el modelo con parámetros de manufactura.' },
  { step: '04', label: 'Revisión contigo', desc: 'Ajustamos geometrías hasta que el diseño sea el correcto.' },
  { step: '05', label: 'Archivo listo para producción', desc: 'Entregamos STL/STEP optimizado o pasamos a impresión.' },
];

export default function Diseno3DPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-inverse-surface pt-18">

        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 pt-14 pb-20">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Link href="/servicios" className="hover:text-primary-container transition-colors">Servicios</Link>
            <ChevronRight size={13} />
            <span className="text-slate-300">Diseño 3D</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold uppercase tracking-widest font-headline mb-6">
                <PenTool size={14} />
                Diseño 3D
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-white leading-tight mb-6">
                Diseño funcional pensado para fabricar
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">
                No solo modelado estético: diseño técnico orientado a la manufactura aditiva. Desde repuestos automotrices descatalogados hasta componentes industriales de tolerancia crítica.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/cotizador"
                  className="inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-full font-headline font-bold text-sm tracking-wide hover:brightness-110 transition-all"
                >
                  Cotizar diseño
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/servicios/escaneo-3d"
                  className="inline-flex items-center gap-2 border border-slate-600 text-slate-300 px-6 py-3 rounded-full font-headline font-semibold text-sm hover:border-slate-400 hover:text-white transition-all"
                >
                  Ver Escaneo 3D
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:flex items-center justify-center">
              <div className="w-full aspect-square max-w-md rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                <PenTool size={120} className="text-purple-400/40" strokeWidth={1} />
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl bg-purple-500/10 blur-2xl" />
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="bg-white/4 border-y border-white/6 py-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-4">
                ¿Qué abarca el servicio?
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Diseño técnico con enfoque en la resolución de problemas industriales, comerciales y automotrices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="bg-white/5 border border-white/8 rounded-2xl p-7 hover:bg-white/8 transition-colors"
                >
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
                    ¿Tienes un proyecto?
                  </p>
                  <h3 className="font-headline font-bold text-white text-lg mb-3">
                    Cotiza tu diseño ahora
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Cuéntanos la necesidad y te respondemos con una propuesta en menos de 24 horas.
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

        {/* ── Sinergia con otros servicios ── */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-4">
                Un servicio que trabaja en equipo
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                El Diseño 3D potencia y es potenciado por el resto de capacidades de Cesgar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Link
                href="/servicios/escaneo-3d"
                className="group bg-white/5 border border-white/8 rounded-2xl p-7 hover:bg-white/8 hover:border-teal-500/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                  <ScanLine size={22} />
                </div>
                <h3 className="font-headline font-bold text-white text-base mb-2">Escaneo 3D</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  El escaneo entrega los datos en bruto; el diseño los convierte en un modelo listo para producción.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-teal-400 text-xs font-bold uppercase tracking-widest group-hover:gap-2 transition-all">
                  Ver servicio <ArrowRight size={12} />
                </span>
              </Link>

              <div className="bg-white/5 border border-white/8 rounded-2xl p-7">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                  <Cog size={22} />
                </div>
                <h3 className="font-headline font-bold text-white text-base mb-2">Impresión 3D</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  El modelo diseñado se fabrica directamente con nuestras impresoras, sin intermediarios ni pérdida de precisión.
                </p>
              </div>

              <div className="bg-white/5 border border-white/8 rounded-2xl p-7">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
                  <Car size={22} />
                </div>
                <h3 className="font-headline font-bold text-white text-base mb-2">Repuestos automotrices</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  El diseño es la clave para recuperar piezas descatalogadas con exactitud dimensional y funcional.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Workflow ── */}
        <section className="bg-white/4 border-y border-white/6 py-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-4">
                Cómo es el proceso
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto">
                De la necesidad al archivo listo para producción en cinco pasos.
              </p>
            </div>

            <div className="relative">
              <div className="hidden md:block absolute top-8 left-[calc(10%+1rem)] right-[calc(10%+1rem)] h-px bg-white/10" />
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {WORKFLOW.map((w) => (
                  <div key={w.step} className="flex flex-col items-center text-center relative">
                    <div className="w-16 h-16 rounded-full bg-inverse-surface border-2 border-purple-500/40 flex items-center justify-center mb-4 relative z-10">
                      <span className="font-headline font-bold text-purple-400 text-sm">{w.step}</span>
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
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-5">
              ¿Tienes una pieza que ya no se consigue?
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Comparte los detalles de tu proyecto y te entregamos un modelo 3D funcional, listo para fabricar.
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
