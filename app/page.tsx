import {
  Settings2, Cpu, ArrowRight, ChevronRight,
  Printer, Wrench, ScanLine, PenTool, Hammer,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import HeroCarousel from './components/HeroCarousel';
import Navbar from './components/Navbar';
import BlogSection from './components/BlogSection';
import ChromaGrid from '@/components/ui/ChromaGrid';
import { LogoLoop } from '@/components/LogoLoop';
import { prisma } from '../lib/prisma';

// ─── Static data ──────────────────────────────────────────────────────────────

const SERVICES = [
  {
    icon: <Printer size={32} />,
    title: 'Cotizar al instante',
    desc: 'Sube tu archivo y genera una cotización inmediata para impresión 3D. Sin esperas, sin complicaciones.',
    cta: 'Subir STL y cotizar',
    accent: 'bg-blue-600',
    light: 'bg-blue-50 text-blue-600',
    iconColor: 'text-blue-400',
  },
  {
    icon: <Wrench size={32} />,
    title: 'Repuestos para tus impresoras',
    desc: 'Encuentra y cotiza boquillas, extrusores, correas, drivers y todo lo que necesitas para mantener tu impresora en marcha.',
    cta: 'Cotizar repuesto',
    accent: 'bg-orange-600',
    light: 'bg-orange-50 text-orange-600',
    iconColor: 'text-orange-400',
  },
  {
    icon: <ScanLine size={32} />,
    title: 'Escaneo 3D',
    desc: 'Capturamos tu pieza u objeto con escáner de alta precisión y la convertimos en un modelo digital listo para producción o ingeniería inversa.',
    cta: 'Cotizar escaneo',
    accent: 'bg-teal-600',
    light: 'bg-teal-50 text-teal-600',
    iconColor: 'text-teal-400',
  },
  {
    icon: <PenTool size={32} />,
    title: 'Diseño 3D',
    desc: 'Nuestros ingenieros modelan tu idea desde cero o adaptan un diseño existente, entregando archivos optimizados para fabricación.',
    cta: 'Cotizar diseño',
    accent: 'bg-purple-600',
    light: 'bg-purple-50 text-purple-600',
    iconColor: 'text-purple-400',
  },
  {
    icon: <Hammer size={32} />,
    title: 'Prototipado y fabricación',
    desc: 'De la idea al objeto en el menor tiempo posible. Producimos prototipos funcionales y series cortas con materiales de ingeniería.',
    cta: 'Cotizar fabricación',
    accent: 'bg-[#16234d]',
    light: 'bg-[#16234d]/10 text-[#16234d]',
    iconColor: 'text-yellow-400',
  },
];


const PROJECTS = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2HxACAEofBmkqBzuetu5K7TyokwRVKGSCtxkIhXZNvzMEhqtJRXB3vNpdTnXR9y-UNooCZ3VpS1LnhoMwoY7pk6YtGByctaianAtsBwndPt64skWpIvjVBKwUCh5zcD2ilPnx0XkrZu3cf6n2TZ3N6ZsleYHJ0hOOtgEVyvQ7jv6FTS6UIfFmr61ukT3h8wlTIJbG0PtfLkvXURWNL4pzLI-stc1rfwPiql4DNjrhqoNcB5To8Et3PD_Nt-jqBv4d3Kns-FjA4ek',
    alt: 'Prototipo industrial',
    badge: 'Industrial',
    title: 'Sistema de Engranajes Personalizados',
    desc: 'Desarrollo de un sistema completo de engranajes para maquinaria industrial con tolerancias de alta precisión.',
    material: 'Nylon PA12',
    borderColor: '#4dbdcc',
    gradient: 'linear-gradient(145deg,#0a2a3a,#0a1842)',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCv6qUeKRAWyUPKx37FHVJ8tCHq_w8lh-X_ZEjND-ZxMxbK4DA692DQNBJabIrH_6kJBIT1Img9N_uy81IIz5jCsHWTFxIAaYgHpK4YUmJDzSA2RbWb1NSs4vkeX36Zjo3Sv76vPggHibq_ymXQxnhp3BzYN04wHDUewiNjc5rc1b47_yuD5AbrNZeaDV7LuN7MbZ4EOuzdfLtiwiUJC50wU_C3W4ZLrXZvK5vqSfevotO9Nk_wWX31bXseCGX1vrODwakWaa7Xl9I',
    alt: 'Prototipo de carcasa',
    badge: 'Prototipado',
    title: 'Prototipo de Carcasa Electrónica',
    desc: 'Diseño y fabricación de carcasa protectora para dispositivo IoT con acabado profesional.',
    material: 'PLA Industrial',
    borderColor: '#505c8a',
    gradient: 'linear-gradient(210deg,#16234d,#0a0f1f)',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnrn9qvlTW8MyN6vi8vbNg3rj4Q4k7sOZKCGNQ0Y0B-DN-r0IpRGbb9bjrvYt6Mjnwpc0CA-S8YatrLMu6cwFcsPdLva8k_oO_I81XvTSk7wNwmmjxLYP68yQyvKdivwMQyuYRz7Ewb_l4h4mjAouQjVvsyaFSeKwwVrXKUnSUZzlKH3cthgaKOgltReFrlMmIreXnvuv4-Z1XnpHCTYAVQRFMb-j-N5CaUHwekTm_e498rQJiwaupUsuwt9lDNa7TvDETHw3efd0',
    alt: 'Pieza automotriz',
    badge: 'Automotriz',
    title: 'Repuestos Automotrices',
    desc: 'Fabricación de piezas de repuesto descontinuadas para vehículos clásicos y de colección.',
    material: 'PETG Reforzado',
    borderColor: '#904d14',
    gradient: 'linear-gradient(165deg,#3a1800,#1a0800)',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATJY-spvKCPPbudfVEMArvrRtF8LLF000jKjLRiRN2aufQ7xrsqmNCBBzaJp1VddGELJ-LCKsQSo6cGa5G1n_NQOAs8AdVW_5fVyak3A3FI5igVWZAK3x4u4EEfilNiLjJlGtFdZYyHcFQx_oTZntUzAp6p6arys5rfUTLnfIXnjR66mQnSODOJlb0gheH9q3I996OJ9mKG_3v0e5Y_SSf_dR-grTQxdUfFt2zI9pI6EsOOD3sEtj-Aa_aMkVOfJ6Oo6g_GjvoqU8',
    alt: 'Maqueta arquitectónica',
    badge: 'Arquitectura',
    title: 'Maqueta Arquitectónica',
    desc: 'Modelo a escala de proyecto residencial con detalles de alta fidelidad para presentación a inversionistas.',
    material: 'Resina UV',
    borderColor: '#006973',
    gradient: 'linear-gradient(195deg,#003a40,#001a1f)',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvIAwM6QBD5ufdlfEBNwmoYA9hx1y6VuL_oPqUFSQQvF11I4x_YfuBPt4GaFm9cMukqD491gOj7TPQHjUWt5ygBj4MJJpCVV0wzWl--OHDqyDyR1COzzxY_yzHqjsZxdLrLr_2jXcf-Vwqu1M6PEqfk_mDxX4GnYyNuVBXDBTXU8Wd5x_RuesPDdcKe4zmEo40vBDdawEEQYfmkLjOs2RvSMF7r71AXg1gx6FjpMOH0mC-N61OqC6STmjIMRaHIuL8ZRmXGg4FMl4',
    alt: 'Jigs y fixtures',
    badge: 'Herramientas',
    title: 'Jigs y Fixtures de Producción',
    desc: 'Herramientas de posicionamiento personalizadas para línea de ensamblaje electrónico.',
    material: 'ABS Industrial',
    borderColor: '#4dbdcc',
    gradient: 'linear-gradient(225deg,#0a2a3a,#0a1842)',
  },
  {
    img: 'https://www.3ds.com/assets/invest/2022-10/iStock-1182118213%20%281%29.jpg',
    alt: 'Proyecto médico',
    badge: 'Médico',
    title: 'Modelos Anatómicos Quirúrgicos',
    desc: 'Réplicas de alta fidelidad de estructuras óseas para planificación y entrenamiento quirúrgico.',
    material: 'Resina Biocompatible',
    borderColor: '#7c3aed',
    gradient: 'linear-gradient(160deg,#2e1065,#0f0a1e)',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2HxACAEofBmkqBzuetu5K7TyokwRVKGSCtxkIhXZNvzMEhqtJRXB3vNpdTnXR9y-UNooCZ3VpS1LnhoMwoY7pk6YtGByctaianAtsBwndPt64skWpIvjVBKwUCh5zcD2ilPnx0XkrZu3cf6n2TZ3N6ZsleYHJ0hOOtgEVyvQ7jv6FTS6UIfFmr61ukT3h8wlTIJbG0PtfLkvXURWNL4pzLI-stc1rfwPiql4DNjrhqoNcB5To8Et3PD_Nt-jqBv4d3Kns-FjA4ek',
    alt: 'Estructura de dron',
    badge: 'Aeronáutica',
    title: 'Estructura de Dron Personalizado',
    desc: 'Chasis ligero y resistente para dron de inspección industrial, optimizado para vuelo en entornos confinados.',
    material: 'Fibra de Carbono + PLA',
    borderColor: '#16a34a',
    gradient: 'linear-gradient(175deg,#052e16,#011a0e)',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCv6qUeKRAWyUPKx37FHVJ8tCHq_w8lh-X_ZEjND-ZxMxbK4DA692DQNBJabIrH_6kJBIT1Img9N_uy81IIz5jCsHWTFxIAaYgHpK4YUmJDzSA2RbWb1NSs4vkeX36Zjo3Sv76vPggHibq_ymXQxnhp3BzYN04wHDUewiNjc5rc1b47_yuD5AbrNZeaDV7LuN7MbZ4EOuzdfLtiwiUJC50wU_C3W4ZLrXZvK5vqSfevotO9Nk_wWX31bXseCGX1vrODwakWaa7Xl9I',
    alt: 'Articulaciones robóticas',
    badge: 'Robótica',
    title: 'Articulaciones para Brazo Robótico',
    desc: 'Conjunto de articulaciones de 6 ejes impresas en alta resolución para brazo colaborativo de precisión.',
    material: 'TPU Flexible + ABS',
    borderColor: '#db2777',
    gradient: 'linear-gradient(185deg,#4a0020,#1f000d)',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const [products, blogPosts] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        tags: { include: { tag: true }, take: 1 },
      },
    }),
  ]);
  return (
    <>
      {/* ── Navbar ── */}
      <Navbar />

      <main className="pt-16 min-h-screen">

        {/* ── Section 1: Hero Carousel ── */}
        <HeroCarousel />

        {/* ── Section 1.5: Services ── */}
        <section className="relative z-10 -mt-96">
          {/* gradient fade from hero into section */}
          <div className="h-44 bg-linear-to-b from-transparent to-inverse-surface" />
          <div className="bg-inverse-surface pb-16">
          <div className="max-w-7xl mx-auto px-8">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {SERVICES.map((s, i) => (
                <a
                  key={s.title}
                  href="/cotizador"
                  className={`group flex flex-col rounded-2xl border border-slate-200 p-6 transition-all duration-300 relative overflow-hidden cursor-pointer bg-white opacity-75 hover:opacity-100 ${i === 0 ? 'sm:col-span-2' : ''}`}
                >
                  <div className="absolute inset-0 bg-white" />
                  {i === 2 && <Image src="/scanner.png" alt="" width={300} height={300} className="absolute right-0 top-0 bottom-0 h-full w-1/2 object-contain opacity-90 pointer-events-none select-none transition-transform duration-300 group-hover:scale-105" />}
                  <div className={`relative z-10 flex flex-col h-full transition-transform duration-300 group-hover:scale-105`}>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-slate-100 ${s.iconColor}`}>
                      {s.icon}
                    </div>
                    <h3 className="font-headline font-bold text-lg mb-3 leading-snug text-slate-900">
                      {s.title}
                    </h3>
                    <p className={`text-sm leading-relaxed flex-1 mb-6 text-slate-500 ${i === 2 ? 'w-1/2' : ''}`}>
                      {s.desc}
                    </p>
                    <span className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-headline font-bold text-sm text-white bg-slate-800 group-hover:bg-slate-700 transition-all">
                      {s.cta}
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
          </div>
        </section>


        {/* ── Section 3: Store preview ── */}
        <section className="bg-white py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl" />
                <div className="relative z-10 w-full h-120 rounded-2xl overflow-hidden">
                  <video
                    src="/Flow_202603191659.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-inverse-surface/5 rounded-full blur-2xl" />
              </div>
              <div className="flex flex-col items-start">
                <div className="mb-4 inline-block px-4 py-1.5 bg-primary-container/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest font-headline">
                  Catálogo Técnico Especializado
                </div>
                <h2 className="text-4xl md:text-5xl font-headline font-bold text-inverse-surface mb-6 leading-tight">
                  Explora nuestra tienda técnica
                </h2>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                  Desde boquillas de alta precisión hasta placas de control industriales, en Precision3D encuentras todo lo que tu impresora necesita. Contamos con un inventario especializado de repuestos, insumos electrónicos y recursos técnicos.
                </p>
                <div className="grid grid-cols-2 gap-6 mb-10 w-full">
                  <div className="flex items-start gap-3">
                    <Settings2 size={22} className="text-primary-container shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-inverse-surface text-sm font-headline">Partes Mecánicas</div>
                      <div className="text-xs text-slate-500">Correas, poleas y extrusores</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Cpu size={22} className="text-primary-container shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-inverse-surface text-sm font-headline">Electrónica</div>
                      <div className="text-xs text-slate-500">Drivers y placas de control</div>
                    </div>
                  </div>
                </div>
                <Link href="/tienda" className="bg-primary-container hover:bg-cyan-500 text-white px-10 py-4 rounded-xl font-headline font-bold tracking-wide shadow-lg shadow-primary-container/20 transition-all active:scale-95 flex items-center gap-2">
                  VER CATÁLOGO COMPLETO
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4: Shop preview ── */}
        <section className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-8 mb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
                  <span>Cesgar</span>
                  <ChevronRight size={14} />
                  <span className="text-inverse-surface">Tienda</span>
                </div>
                <h2 className="text-5xl font-headline font-bold text-inverse-surface mb-3">Tienda</h2>
                <p className="text-slate-500 max-w-xl text-lg border-l-4 border-primary-container pl-5">
                  Insumos industriales y electrónicos especializados.
                </p>
              </div>
              <Link href="/tienda" className="shrink-0 flex items-center gap-2 text-primary-container font-bold text-sm hover:underline">
                Ver todos los productos <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-8">
          <LogoLoop
            fadeOut
            fadeOutColor="#ffffff"
            pauseOnHover
            speed={80}
            logoHeight={320}
            gap={20}
            logos={products.map((p) => ({
              node: (
                <Link
                  href={`/tienda/${p.slug}`}
                  className="group w-52 flex flex-col bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-square bg-[#f8fafc] rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.img}
                      alt={p.alt || p.name}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="grow space-y-1 mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 line-clamp-1">{p.category}</span>
                    <h4 className="font-headline font-bold text-inverse-surface text-xs leading-tight line-clamp-2">{p.name}</h4>
                    <span className="text-base font-bold text-inverse-surface block">$ {p.price.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="w-full py-2 bg-inverse-surface text-white rounded-lg font-headline font-bold text-[10px] uppercase tracking-widest text-center group-hover:bg-primary-container group-hover:text-inverse-surface transition-all">
                    Ver producto
                  </div>
                </Link>
              ),
            }))}
          />
          </div>

          <div className="flex justify-center mt-12">
            <Link
              href="/tienda"
              className="px-12 py-4 border-2 border-inverse-surface text-inverse-surface rounded-xl font-headline font-bold hover:bg-inverse-surface hover:text-white transition-all shadow-sm active:scale-95"
            >
              Ir a la tienda completa
            </Link>
          </div>
        </section>

        {/* ── Section 5: Clients ── */}
        <section className="bg-surface-container-low border-y border-slate-100 py-16">
          <div className="max-w-7xl mx-auto px-8">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-10">
              Empresas e instituciones que confían en nosotros
            </p>
          </div>
          <LogoLoop
            fadeOut
            fadeOutColor="#f3f2ff"
            pauseOnHover
            logoHeight={72}
            gap={48}
            logos={[
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><path d="M24 4L4 16v2h40v-2L24 4z" fill="currentColor" opacity=".15"/><path d="M24 4L4 16h40L24 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="8" y="18" width="6" height="18" rx="1" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="1.5"/><rect x="21" y="18" width="6" height="18" rx="1" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="1.5"/><rect x="34" y="18" width="6" height="18" rx="1" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="36" width="40" height="3" rx="1" fill="currentColor"/><path d="M18 10l6-4 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">Universidad Nacional</span></div> },
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" opacity=".15" fill="currentColor"/><path d="M24 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="currentColor"/><path d="M16 32c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 22l4 2M36 22l-4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M14 30l3-1M34 30l-3-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">SENA</span></div> },
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><path d="M24 6c-6 8-10 14-10 20a10 10 0 0 0 20 0c0-6-4-12-10-20z" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M18 30c0 3.3 2.7 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M32 12v8M36 16h-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">Ecopetrol</span></div> },
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><path d="M24 6l-4 16h8L20 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="6" r="3" fill="currentColor"/><path d="M14 22h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/><path d="M10 30c3-3 7-3 10 0s7 3 10 0s7-3 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".3"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">EPM</span></div> },
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><rect x="4" y="20" width="40" height="20" rx="2" fill="currentColor" opacity=".1" stroke="currentColor" strokeWidth="2"/><rect x="8" y="24" width="5" height="12" rx="1" fill="currentColor" opacity=".4"/><rect x="17" y="24" width="5" height="12" rx="1" fill="currentColor" opacity=".4"/><rect x="26" y="24" width="5" height="12" rx="1" fill="currentColor" opacity=".4"/><rect x="35" y="24" width="5" height="12" rx="1" fill="currentColor" opacity=".4"/><path d="M4 20l20-12 20 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="18" y="34" width="12" height="6" rx="1" fill="currentColor"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">Bancolombia</span></div> },
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><path d="M8 28l28-16 4 4-24 10 4 8-8-2-4-4z" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M6 36h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M22 16l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">Avianca</span></div> },
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="32" r="4" fill="currentColor"/><path d="M15 23a12.7 12.7 0 0 1 18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 17a20.5 20.5 0 0 1 30 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5"/><path d="M4 11a28 28 0 0 1 40 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".25"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">Claro Colombia</span></div> },
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><path d="M24 8c-8 0-14 5-14 12 0 4 2 7 6 9l-2 11h20l-2-11c4-2 6-5 6-9 0-7-6-12-14-12z" fill="currentColor" opacity=".12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M18 29h12M20 33h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20 16c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">Grupo Nutresa</span></div> },
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><path d="M6 20l18-12 18 12-18 4-18-4z" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 22v12M24 24v10M36 22v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="8" y="34" width="32" height="3" rx="1" fill="currentColor"/><path d="M40 20v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="40" cy="30" r="2" fill="currentColor"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">Ministerio de Educación</span></div> },
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="6" fill="currentColor"/><circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="1.5" opacity=".3" strokeDasharray="4 3"/><circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5" opacity=".15" strokeDasharray="4 3"/><path d="M24 6v4M24 38v4M6 24h4M38 24h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">Colciencias</span></div> },
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><rect x="8" y="16" width="32" height="22" rx="2" fill="currentColor" opacity=".1" stroke="currentColor" strokeWidth="2"/><path d="M16 16v-4a8 8 0 0 1 16 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="24" cy="27" r="4" stroke="currentColor" strokeWidth="2"/><path d="M24 23v-3M24 31v3M20 27h-3M27 27h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">Indumil</span></div> },
              { node: <div className="flex flex-col items-center gap-2 text-slate-400"><svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><rect x="4" y="24" width="40" height="16" rx="2" fill="currentColor" opacity=".1" stroke="currentColor" strokeWidth="2"/><path d="M4 24c0-6 4-10 10-10h20c6 0 10 4 10 10" stroke="currentColor" strokeWidth="2"/><line x1="14" y1="14" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="24" y1="14" x2="24" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="34" y1="14" x2="34" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="20" y="30" width="8" height="10" rx="1" fill="currentColor" opacity=".4"/></svg><span className="text-[10px] font-bold leading-tight text-center w-20">Corferias</span></div> },
            ]}
          />
        </section>

        {/* ── Section 6: Projects ── */}
        <section className="bg-zinc-900 py-24">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <div className="mb-4 inline-block px-4 py-1.5 bg-primary-container/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest font-headline">
                Portafolio
              </div>
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-white mb-6">Proyectos Realizados</h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Descubre algunos de los proyectos que hemos desarrollado para nuestros clientes. Desde prototipos funcionales hasta piezas de producción industrial.
              </p>
            </div>

            <ChromaGrid
                items={PROJECTS.map((p) => ({
                  image: p.img,
                  title: p.title,
                  subtitle: p.desc,
                  handle: p.badge,
                  location: p.material,
                  borderColor: p.borderColor,
                  gradient: p.gradient,
                }))}
              />
          </div>
        </section>

        {/* ── Section 7: Blog ── */}
        <BlogSection posts={blogPosts} />

      </main>

    </>
  );
}
