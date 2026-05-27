import type { Metadata } from 'next';
import {
  Hammer, Zap, Package, Car, Cpu, Wrench, FlaskConical,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

export const metadata: Metadata = {
  title: 'Prototipado y Fabricación | Cesgar',
  description:
    'Manufactura aditiva ágil: prototipado rápido, piezas de uso final, repuestos automotrices y herramentales industriales con materiales técnicos seleccionados.',
};

const FEATURES = [
  {
    icon: <Zap size={28} />,
    color: 'bg-yellow-500/10 text-yellow-400',
    title: 'Prototipado rápido y validación funcional',
    body: 'Materializa tus diseños en horas o días. Creamos modelos de prueba para evaluar ergonomía, ensamblaje y funcionalidad —tolerancias en mecanismos, encajes de carcasas— antes de comprometer recursos en moldes o producción final.',
  },
  {
    icon: <Package size={28} />,
    color: 'bg-blue-500/10 text-blue-400',
    title: 'Fabricación de piezas de uso final',
    body: 'Más allá del prototipo: infraestructura lista para manufactura aditiva de piezas que operan en entornos reales. Tirajes cortos y medianos de piezas especializadas que serían demasiado costosas por inyección tradicional.',
  },
  {
    icon: <Car size={28} />,
    color: 'bg-orange-500/10 text-orange-400',
    title: 'Repuestos automotrices',
    body: 'Fabricamos componentes vehiculares que reemplazan originales descatalogados o difíciles de importar, garantizando resistencia al impacto, la temperatura y el desgaste continuo que exige el sector automotriz.',
  },
  {
    icon: <Cpu size={28} />,
    color: 'bg-teal-500/10 text-teal-400',
    title: 'Equipamiento optimizado',
    body: 'La calidad de fabricación está respaldada por máquinas meticulosamente mantenidas y repotenciadas. Tolerancias más estrictas, acabados superficiales superiores y perfiles de impresión altamente técnicos.',
  },
  {
    icon: <Wrench size={28} />,
    color: 'bg-green-500/10 text-green-400',
    title: 'Soluciones industriales y herramentales',
    body: 'Imprimimos herramientas personalizadas (jigs & fixtures), guías de ensamblaje, carcasas HMI y adaptaciones para maquinaria. Mejora la eficiencia operativa sin largas cadenas de suministro.',
  },
  {
    icon: <FlaskConical size={28} />,
    color: 'bg-pink-500/10 text-pink-400',
    title: 'Selección estratégica de materiales',
    body: 'No usamos un único material genérico. Según si la pieza enfrenta altas temperaturas, fricción continua o necesita flexibilidad, seleccionamos el termoplástico técnico adecuado para garantizar las propiedades mecánicas requeridas.',
  },
];

const MATERIALS = [
  { name: 'PLA Industrial', use: 'Prototipos, visualización y modelos de baja carga mecánica.' },
  { name: 'PETG', use: 'Piezas de uso final con buena resistencia química y al impacto.' },
  { name: 'ABS / ASA', use: 'Exposición a UV, calor y entornos automotrices exteriores.' },
  { name: 'TPU Flexible', use: 'Juntas, sellos, grips y piezas que requieren elasticidad.' },
  { name: 'Nylon PA12', use: 'Alta resistencia mecánica y fricción — engranes y mecanismos.' },
  { name: 'Fibra de carbono', use: 'Máxima rigidez y peso mínimo en piezas estructurales.' },
];

const WORKFLOW = [
  { step: '01', label: 'Revisión del diseño', desc: 'Validamos el archivo STL/STEP para manufactura.' },
  { step: '02', label: 'Selección de material', desc: 'Elegimos el termoplástico según el entorno de uso.' },
  { step: '03', label: 'Laminado y configuración', desc: 'Parámetros de impresión ajustados a la geometría.' },
  { step: '04', label: 'Fabricación', desc: 'Impresión con control de calidad por capas.' },
  { step: '05', label: 'Post-proceso y entrega', desc: 'Limpieza, acabado y envío de la pieza lista.' },
];

export default function PrototipadoPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-inverse-surface pt-18">

        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 pt-14 pb-20">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Link href="/servicios" className="hover:text-primary-container transition-colors">Servicios</Link>
            <ChevronRight size={13} />
            <span className="text-slate-300">Prototipado y Fabricación</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-widest font-headline mb-6">
                <Hammer size={14} />
                Prototipado y Fabricación
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-white leading-tight mb-6">
                De la idea al objeto en el menor tiempo posible
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">
                Manufactura aditiva ágil para validar conceptos y producir piezas listas para operar. Desde prototipos de un día hasta series cortas de uso industrial.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="https://wa.me/573057956352" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-full font-headline font-bold text-sm tracking-wide hover:brightness-110 transition-all"
                >
                  Cotizar fabricación
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

            <div className="relative hidden lg:flex items-center justify-center">
              <div className="w-full aspect-square max-w-md rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                <Image src="/PrototipadoYfabricacion.png" alt="Prototipado y fabricación" width={400} height={400} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl bg-yellow-500/10 blur-2xl" />
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
                Una solución de manufactura ágil, pensada desde la validación hasta la pieza de uso final.
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
                    Cotiza tu fabricación ahora
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Sin compromisos. Te respondemos con tiempos y costos en menos de 24 horas.
                  </p>
                </div>
                <Link
                  href="https://wa.me/573057956352" target="_blank" rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 bg-primary-container text-white px-5 py-3 rounded-xl font-headline font-bold text-sm hover:brightness-110 transition-all w-fit"
                >
                  Cotizar ahora
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Materiales ── */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-4">
                Materiales disponibles
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Seleccionamos el termoplástico técnico adecuado según las exigencias mecánicas y ambientales de cada pieza.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MATERIALS.map((m, i) => (
                <div
                  key={m.name}
                  className="flex items-start gap-4 bg-white/5 border border-white/8 rounded-2xl p-5 hover:bg-white/8 transition-colors"
                >
                  <span className="font-headline font-bold text-primary-container/50 text-xs mt-0.5">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-headline font-bold text-white text-sm mb-1">{m.name}</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{m.use}</p>
                  </div>
                </div>
              ))}
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
                Del archivo digital a la pieza físicamente entregada en cinco pasos.
              </p>
            </div>

            <div className="relative">
              <div className="hidden md:block absolute top-8 left-[calc(10%+1rem)] right-[calc(10%+1rem)] h-px bg-white/10" />
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {WORKFLOW.map((w) => (
                  <div key={w.step} className="flex flex-col items-center text-center relative">
                    <div className="w-16 h-16 rounded-full bg-inverse-surface border-2 border-yellow-500/40 flex items-center justify-center mb-4 relative z-10">
                      <span className="font-headline font-bold text-yellow-400 text-sm">{w.step}</span>
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
              ¿Listo para fabricar tu primera pieza?
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Sube tu archivo o cuéntanos la necesidad y te entregamos tiempos, materiales y costos en menos de 24 horas.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="https://wa.me/573057956352" target="_blank" rel="noopener noreferrer"
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
