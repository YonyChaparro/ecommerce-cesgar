import type { Metadata } from 'next';
import {
  Wrench, Cpu, Settings, Package, Shield, Flame, Hammer,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { LogoLoop } from '@/components/LogoLoop';
import { prisma } from '../../../lib/prisma';

export const metadata: Metadata = {
  title: 'Repuestos para Impresoras 3D | Cesgar',
  description:
    'Repuestos, upgrades y piezas fabricadas a medida para equipos de manufactura aditiva. Componentes probados en producción real para que tu impresora opere al máximo rendimiento.',
};

const FEATURES = [
  {
    icon: <Cpu size={28} />,
    color: 'bg-orange-500/10 text-orange-400',
    title: 'Modificaciones y upgrades de rendimiento',
    body: 'El foco no es solo reparar, sino mejorar. Proveemos y desarrollamos componentes para repotenciar impresoras populares como la serie Ender 3, optimizando su precisión, estabilidad y calidad de piezas resultantes más allá de los límites de fábrica.',
  },
  {
    icon: <Hammer size={28} />,
    color: 'bg-blue-500/10 text-blue-400',
    title: 'Piezas y soportes fabricados a medida',
    body: 'Aprovechando nuestra capacidad de diseño y manufactura propia, fabricamos repuestos en materiales técnicos: fan ducts optimizados, soportes para extrusión directa, tensores de correas y guías de filamento que solucionan fallos de diseño de las máquinas originales.',
  },
  {
    icon: <Settings size={28} />,
    color: 'bg-green-500/10 text-green-400',
    title: 'Mantenimiento preventivo y correctivo',
    body: 'Para que las líneas de producción no se detengan: boquillas de distintos diámetros y materiales, termistores, cartuchos calentadores, correas de distribución, bloques calentadores y superficies de impresión siempre disponibles.',
  },
  {
    icon: <Flame size={28} />,
    color: 'bg-red-500/10 text-red-400',
    title: 'Hardware para materiales técnicos',
    body: 'Para imprimir piezas industriales o automotrices con filamentos de alta exigencia, las impresoras estándar quedan cortas. Nuestros upgrades adaptan los equipos para soportar mayores temperaturas de extrusión y cama caliente, eliminando atascos al trabajar con materiales técnicos.',
  },
  {
    icon: <Shield size={28} />,
    color: 'bg-purple-500/10 text-purple-400',
    title: 'Respaldo basado en experiencia real',
    body: 'Los repuestos y modificaciones que ofrecemos son los mismos que nuestro equipo técnico usa para mantener nuestra propia infraestructura. Cada pieza y upgrade ha sido probado bajo estrés en producción real antes de llegar al cliente.',
  },
  {
    icon: <Package size={28} />,
    color: 'bg-yellow-500/10 text-yellow-400',
    title: 'Catálogo amplio y disponibilidad',
    body: 'Desde consumibles de uso diario hasta componentes electrónicos especializados: mantenemos disponibilidad de partes críticas para que tu equipo esté operativo sin esperas largas. Si no está en stock, lo fabricamos.',
  },
];

const COMPONENTS = [
  { name: 'Boquillas (Nozzles)', use: 'Latón, acero endurecido y bimetálicas en diámetros 0.2 – 1.0 mm.' },
  { name: 'Bloques calentadores', use: 'Compatibles con hot-ends estándar y all-metal para filamentos técnicos.' },
  { name: 'Termistores y termopares', use: 'Lectura precisa de temperatura para extrusión estable y segura.' },
  { name: 'Correas y poleas GT2', use: 'Distribución de movimiento con mínima holgura para mayor precisión.' },
  { name: 'Superficies de impresión', use: 'Vidrio, PEI, garolita y magnéticas para distintos materiales.' },
  { name: 'Extrusores directos', use: 'Upgrades para mejor control de filamentos flexibles y técnicos.' },
];

const WORKFLOW = [
  { step: '01', label: 'Diagnóstico', desc: 'Identificas el problema o la mejora que necesitas.' },
  { step: '02', label: 'Selección del repuesto', desc: 'Te asesoramos en el componente o upgrade correcto.' },
  { step: '03', label: 'Fabricación o despacho', desc: 'Enviamos desde stock o fabricamos la pieza a medida.' },
  { step: '04', label: 'Instalación asistida', desc: 'Guía técnica para montar el componente correctamente.' },
  { step: '05', label: 'Equipo operativo', desc: 'Tu impresora de vuelta en producción con mejor rendimiento.' },
];

export default async function RepuestosPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-inverse-surface pt-18">

        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 pt-14 pb-20">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Link href="/servicios" className="hover:text-primary-container transition-colors">Servicios</Link>
            <ChevronRight size={13} />
            <span className="text-slate-300">Repuestos para Impresoras</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/10 text-orange-400 rounded-full text-xs font-bold uppercase tracking-widest font-headline mb-6">
                <Wrench size={14} />
                Repuestos e Insumos
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-white leading-tight mb-6">
                Tu impresora, siempre en su mejor versión
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">
                Repuestos, upgrades y piezas fabricadas a medida para equipos de manufactura aditiva. Componentes probados en producción real — los mismos que usamos para mantener nuestra propia infraestructura.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/cotizador"
                  className="inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-full font-headline font-bold text-sm tracking-wide hover:brightness-110 transition-all"
                >
                  Cotizar repuesto
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
              <div className="w-full aspect-square max-w-md rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Wrench size={120} className="text-orange-400/40" strokeWidth={1} />
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl bg-orange-500/10 blur-2xl" />
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
                Más que repuestos: un sistema de mantenimiento especializado para que tus equipos operen al máximo rendimiento.
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
                    ¿Necesitas un repuesto?
                  </p>
                  <h3 className="font-headline font-bold text-white text-lg mb-3">
                    Cotiza tu componente ahora
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Si no está en stock, lo fabricamos. Te respondemos en menos de 24 horas.
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

        {/* ── Componentes ── */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-4">
                Componentes disponibles
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Partes críticas para mantenimiento preventivo y correctivo, más upgrades de hardware para materiales técnicos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMPONENTS.map((c, i) => (
                <div
                  key={c.name}
                  className="flex items-start gap-4 bg-white/5 border border-white/8 rounded-2xl p-5 hover:bg-white/8 transition-colors"
                >
                  <span className="font-headline font-bold text-primary-container/50 text-xs mt-0.5">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-headline font-bold text-white text-sm mb-1">{c.name}</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{c.use}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Productos de la tienda ── */}
        {products.length > 0 && (
          <section className="bg-white/4 border-y border-white/6 py-20">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 mb-12">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-primary-container text-xs font-bold uppercase tracking-widest mb-3">
                    Tienda
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-3">
                    Productos disponibles
                  </h2>
                  <p className="text-slate-400 max-w-xl">
                    Explora nuestro catálogo de repuestos e insumos disponibles para compra inmediata.
                  </p>
                </div>
                <Link
                  href="/tienda"
                  className="shrink-0 flex items-center gap-2 text-primary-container font-bold text-sm hover:underline"
                >
                  Ver todos los productos <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 sm:px-8">
              <LogoLoop
                fadeOut
                fadeOutColor="#16234d"
                pauseOnHover
                speed={80}
                logoHeight={320}
                gap={20}
                logos={products.map((p) => ({
                  node: (
                    <Link
                      href={`/tienda/${p.slug}`}
                      className="group w-52 flex flex-col bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-300"
                    >
                      <div className="aspect-square bg-white/8 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.img}
                          alt={p.alt || p.name}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="grow space-y-1 mb-3">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 line-clamp-1">{p.category}</span>
                        <h4 className="font-headline font-bold text-white text-xs leading-tight line-clamp-2">{p.name}</h4>
                        <span className="text-base font-bold text-white block">$ {p.price.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="w-full py-2 bg-white/10 text-white rounded-lg font-headline font-bold text-[10px] uppercase tracking-widest text-center group-hover:bg-primary-container transition-all">
                        Ver producto
                      </div>
                    </Link>
                  ),
                }))}
              />
            </div>

            <div className="flex justify-center mt-10">
              <Link
                href="/tienda"
                className="inline-flex items-center gap-2 border border-slate-600 text-slate-300 px-8 py-3 rounded-full font-headline font-bold text-sm hover:border-slate-400 hover:text-white transition-all"
              >
                Ir a la tienda completa
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        )}

        {/* ── Workflow ── */}
        <section className="bg-white/4 border-y border-white/6 py-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-4">
                Cómo es el proceso
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto">
                Del diagnóstico al equipo operativo en cinco pasos.
              </p>
            </div>

            <div className="relative">
              <div className="hidden md:block absolute top-8 left-[calc(10%+1rem)] right-[calc(10%+1rem)] h-px bg-white/10" />
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {WORKFLOW.map((w) => (
                  <div key={w.step} className="flex flex-col items-center text-center relative">
                    <div className="w-16 h-16 rounded-full bg-inverse-surface border-2 border-orange-500/40 flex items-center justify-center mb-4 relative z-10">
                      <span className="font-headline font-bold text-orange-400 text-sm">{w.step}</span>
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
              ¿Tu impresora necesita mantenimiento o un upgrade?
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Cuéntanos el modelo de tu equipo y el problema o mejora que buscas. Te respondemos con la solución adecuada en menos de 24 horas.
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
