import {
  Zap, Package, Cog, Truck,
  Settings2, Cpu, ArrowRight, ChevronRight,
  Search, ChevronDown, ShieldCheck,
  Heart, PlusCircle, Rocket, Factory,
  Printer, Wrench, ScanLine, PenTool, Hammer,
} from 'lucide-react';
import HeroCarousel from './components/HeroCarousel';
import Quoter from './components/Quoter';
import Navbar from './components/Navbar';

// ─── Static data ──────────────────────────────────────────────────────────────

const SERVICES = [
  {
    icon: <Printer size={32} />,
    title: 'Cotizar al instante',
    desc: 'Sube tu archivo y genera una cotización inmediata para impresión 3D. Sin esperas, sin complicaciones.',
    cta: 'Subir STL y cotizar',
    accent: 'bg-blue-600',
    light: 'bg-blue-50 text-blue-600',
  },
  {
    icon: <Wrench size={32} />,
    title: 'Repuestos para tus impresoras',
    desc: 'Encuentra y cotiza boquillas, extrusores, correas, drivers y todo lo que necesitas para mantener tu impresora en marcha.',
    cta: 'Cotizar repuesto',
    accent: 'bg-orange-600',
    light: 'bg-orange-50 text-orange-600',
  },
  {
    icon: <ScanLine size={32} />,
    title: 'Escaneo 3D',
    desc: 'Capturamos tu pieza u objeto con escáner de alta precisión y la convertimos en un modelo digital listo para producción o ingeniería inversa.',
    cta: 'Cotizar escaneo',
    accent: 'bg-teal-600',
    light: 'bg-teal-50 text-teal-600',
  },
  {
    icon: <PenTool size={32} />,
    title: 'Diseño 3D',
    desc: 'Nuestros ingenieros modelan tu idea desde cero o adaptan un diseño existente, entregando archivos optimizados para fabricación.',
    cta: 'Cotizar diseño',
    accent: 'bg-purple-600',
    light: 'bg-purple-50 text-purple-600',
  },
  {
    icon: <Hammer size={32} />,
    title: 'Prototipado y fabricación',
    desc: 'De la idea al objeto en el menor tiempo posible. Producimos prototipos funcionales y series cortas con materiales de ingeniería.',
    cta: 'Cotizar fabricación',
    accent: 'bg-[#16234d]',
    light: 'bg-[#16234d]/10 text-[#16234d]',
  },
];

const PRODUCTS = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCv6qUeKRAWyUPKx37FHVJ8tCHq_w8lh-X_ZEjND-ZxMxbK4DA692DQNBJabIrH_6kJBIT1Img9N_uy81IIz5jCsHWTFxIAaYgHpK4YUmJDzSA2RbWb1NSs4vkeX36Zjo3Sv76vPggHibq_ymXQxnhp3BzYN04wHDUewiNjc5rc1b47_yuD5AbrNZeaDV7LuN7MbZ4EOuzdfLtiwiUJC50wU_C3W4ZLrXZvK5vqSfevotO9Nk_wWX31bXseCGX1vrODwakWaa7Xl9I',
    alt: 'Brass Nozzles',
    category: 'Repuestos para impresoras 3D',
    name: 'Boquillas de latón de 0.4 mm MK8',
    price: '$ 4.000',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnrn9qvlTW8MyN6vi8vbNg3rj4Q4k7sOZKCGNQ0Y0B-DN-r0IpRGbb9bjrvYt6Mjnwpc0CA-S8YatrLMu6cwFcsPdLva8k_oO_I81XvTSk7wNwmmjxLYP68yQyvKdivwMQyuYRz7Ewb_l4h4mjAouQjVvsyaFSeKwwVrXKUnSUZzlKH3cthgaKOgltReFrlMmIreXnvuv4-Z1XnpHCTYAVQRFMb-j-N5CaUHwekTm_e498rQJiwaupUsuwt9lDNa7TvDETHw3efd0',
    alt: 'Extruder',
    category: 'Sistemas de Tracción',
    name: 'Direct Drive Extruder V3 Kit',
    price: '$ 84.000',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATJY-spvKCPPbudfVEMArvrRtF8LLF000jKjLRiRN2aufQ7xrsqmNCBBzaJp1VddGELJ-LCKsQSo6cGa5G1n_NQOAs8AdVW_5fVyak3A3FI5igVWZAK3x4u4EEfilNiLjJlGtFdZYyHcFQx_oTZntUzAp6p6arys5rfUTLnfIXnjR66mQnSODOJlb0gheH9q3I996OJ9mKG_3v0e5Y_SSf_dR-grTQxdUfFt2zI9pI6EsOOD3sEtj-Aa_aMkVOfJ6Oo6g_GjvoqU8',
    alt: 'Timing Belt',
    category: 'Transmisión',
    name: 'Correa Sincrónica 2GT 9mm x 6m',
    price: '$ 150.000',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvIAwM6QBD5ufdlfEBNwmoYA9hx1y6VuL_oPqUFSQQvF11I4x_YfuBPt4GaFm9cMukqD491gOj7TPQHjUWt5ygBj4MJJpCVV0wzWl--OHDqyDyR1COzzxY_yzHqjsZxdLrLr_2jXcf-Vwqu1M6PEqfk_mDxX4GnYyNuVBXDBTXU8Wd5x_RuesPDdcKe4zmEo40vBDdawEEQYfmkLjOs2RvSMF7r71AXg1gx6FjpMOH0mC-N61OqC6STmjIMRaHIuL8ZRmXGg4FMl4',
    alt: 'Control Board',
    category: 'Electrónica',
    name: '32-Bit Control Board Kit Industrial',
    price: '$ 145.000',
  },
];

const PROJECTS = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2HxACAEofBmkqBzuetu5K7TyokwRVKGSCtxkIhXZNvzMEhqtJRXB3vNpdTnXR9y-UNooCZ3VpS1LnhoMwoY7pk6YtGByctaianAtsBwndPt64skWpIvjVBKwUCh5zcD2ilPnx0XkrZu3cf6n2TZ3N6ZsleYHJ0hOOtgEVyvQ7jv6FTS6UIfFmr61ukT3h8wlTIJbG0PtfLkvXURWNL4pzLI-stc1rfwPiql4DNjrhqoNcB5To8Et3PD_Nt-jqBv4d3Kns-FjA4ek',
    alt: 'Prototipo industrial',
    badge: 'Industrial',
    badgeColor: 'bg-[#4dbdcc]',
    title: 'Sistema de Engranajes Personalizados',
    desc: 'Desarrollo de un sistema completo de engranajes para maquinaria industrial con tolerancias de alta precisión.',
    material: 'Nylon PA12',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCv6qUeKRAWyUPKx37FHVJ8tCHq_w8lh-X_ZEjND-ZxMxbK4DA692DQNBJabIrH_6kJBIT1Img9N_uy81IIz5jCsHWTFxIAaYgHpK4YUmJDzSA2RbWb1NSs4vkeX36Zjo3Sv76vPggHibq_ymXQxnhp3BzYN04wHDUewiNjc5rc1b47_yuD5AbrNZeaDV7LuN7MbZ4EOuzdfLtiwiUJC50wU_C3W4ZLrXZvK5vqSfevotO9Nk_wWX31bXseCGX1vrODwakWaa7Xl9I',
    alt: 'Prototipo de carcasa',
    badge: 'Prototipado',
    badgeColor: 'bg-[#16234d]',
    title: 'Prototipo de Carcasa Electrónica',
    desc: 'Diseño y fabricación de carcasa protectora para dispositivo IoT con acabado profesional.',
    material: 'PLA Industrial',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnrn9qvlTW8MyN6vi8vbNg3rj4Q4k7sOZKCGNQ0Y0B-DN-r0IpRGbb9bjrvYt6Mjnwpc0CA-S8YatrLMu6cwFcsPdLva8k_oO_I81XvTSk7wNwmmjxLYP68yQyvKdivwMQyuYRz7Ewb_l4h4mjAouQjVvsyaFSeKwwVrXKUnSUZzlKH3cthgaKOgltReFrlMmIreXnvuv4-Z1XnpHCTYAVQRFMb-j-N5CaUHwekTm_e498rQJiwaupUsuwt9lDNa7TvDETHw3efd0',
    alt: 'Pieza automotriz',
    badge: 'Automotriz',
    badgeColor: 'bg-[#904d14]',
    title: 'Repuestos Automotrices',
    desc: 'Fabricación de piezas de repuesto descontinuadas para vehículos clásicos y de colección.',
    material: 'PETG Reforzado',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATJY-spvKCPPbudfVEMArvrRtF8LLF000jKjLRiRN2aufQ7xrsqmNCBBzaJp1VddGELJ-LCKsQSo6cGa5G1n_NQOAs8AdVW_5fVyak3A3FI5igVWZAK3x4u4EEfilNiLjJlGtFdZYyHcFQx_oTZntUzAp6p6arys5rfUTLnfIXnjR66mQnSODOJlb0gheH9q3I996OJ9mKG_3v0e5Y_SSf_dR-grTQxdUfFt2zI9pI6EsOOD3sEtj-Aa_aMkVOfJ6Oo6g_GjvoqU8',
    alt: 'Maqueta arquitectónica',
    badge: 'Arquitectura',
    badgeColor: 'bg-[#006973]',
    title: 'Maqueta Arquitectónica',
    desc: 'Modelo a escala de proyecto residencial con detalles de alta fidelidad para presentación a inversionistas.',
    material: 'Resina UV',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvIAwM6QBD5ufdlfEBNwmoYA9hx1y6VuL_oPqUFSQQvF11I4x_YfuBPt4GaFm9cMukqD491gOj7TPQHjUWt5ygBj4MJJpCVV0wzWl--OHDqyDyR1COzzxY_yzHqjsZxdLrLr_2jXcf-Vwqu1M6PEqfk_mDxX4GnYyNuVBXDBTXU8Wd5x_RuesPDdcKe4zmEo40vBDdawEEQYfmkLjOs2RvSMF7r71AXg1gx6FjpMOH0mC-N61OqC6STmjIMRaHIuL8ZRmXGg4FMl4',
    alt: 'Jigs y fixtures',
    badge: 'Herramientas',
    badgeColor: 'bg-[#4dbdcc]',
    title: 'Jigs y Fixtures de Producción',
    desc: 'Herramientas de posicionamiento personalizadas para línea de ensamblaje electrónico.',
    material: 'ABS Industrial',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
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
          <div className="h-32 bg-gradient-to-b from-transparent to-[#16234d]" />
          <div className="bg-[#16234d] pb-16">
          <div className="max-w-7xl mx-auto px-8">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {SERVICES.map((s, i) => (
                <div
                  key={s.title}
                  className={`group flex flex-col rounded-2xl border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${i === 0 ? 'sm:col-span-2 bg-cover bg-center' : i >= 1 ? 'bg-cover bg-center' : 'bg-white'}`}
                  style={
                    i === 0 ? { backgroundImage: "url('https://res.cloudinary.com/dpnv9gx8m/image/upload/v1776517722/3D_PRINTING_f99f1122-8730-4f8f-b257-d804a9e270ad_flpl0q.webp')" }
                    : i === 1 ? { backgroundImage: "url('https://res.cloudinary.com/dpnv9gx8m/image/upload/v1776518125/Repuestos-para-Impresoras-3D-CREALITY_m6mimp.webp')" }
                    : i === 2 ? { backgroundImage: "url('https://res.cloudinary.com/dpnv9gx8m/image/upload/v1776518392/61wJ6bftY7L._SX522__1_ueewew.jpg')" }
                    : i === 3 ? { backgroundImage: "url('https://res.cloudinary.com/dpnv9gx8m/image/upload/v1776518871/persona-trabajando-proyecto-animacion_23-2149269941_fdtscg.avif')" }
                    : i === 4 ? { backgroundImage: "url('https://res.cloudinary.com/dpnv9gx8m/image/upload/v1776519057/PROTOTIPADO-EN-IMPRESION-3D_aemnhm.jpg')" }
                    : undefined
                  }
                >
                  <div className="absolute inset-0 bg-[#16234d]/85" />
                  <div className={`relative z-10 flex flex-col h-full`}>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-white/20 text-white">
                      {s.icon}
                    </div>
                    <h3 className="font-headline font-bold text-lg mb-3 leading-snug text-white">
                      {s.title}
                    </h3>
                    <p className="text-sm leading-relaxed flex-1 mb-6 text-white/80">
                      {s.desc}
                    </p>
                    <a
                      href="#cotizador"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-headline font-bold text-sm text-white bg-white/20 hover:bg-white/30 transition-all active:scale-95"
                    >
                      {s.cta}
                      <ArrowRight size={15} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </section>

        {/* ── Section 2: Quoter ── */}
        <section className="bg-[#16234d] py-24 text-white relative">
          {/* Stats floating card */}
          {/* <div className="absolute left-1/2 -translate-x-1/2 -top-20 z-40 w-full px-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-[#16234d] rounded-3xl p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center shadow-2xl border border-white/10">
                {[
                  { value: '500+', label: 'Proyectos Completados' },
                  { value: '150+', label: 'Clientes Satisfechos' },
                  { value: '15+', label: 'Materiales Disponibles' },
                  { value: '48h', label: 'Tiempo de Entrega' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-4xl md:text-5xl font-headline font-bold text-[#4dbdcc] mb-2">{stat.value}</div>
                    <div className="text-slate-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div> */}

          <div className="max-w-7xl mx-auto px-8 pt-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              {/* Left copy */}
              <div>
                <h2 className="text-4xl font-headline font-bold mb-6 text-[#4dbdcc]">
                  Cotiza tu impresión 3D industrial al instante
                </h2>
                <p className="text-slate-300 mb-10 text-lg">
                  Carga tu archivo STL 3D y obtén el precio al instante. Nuestro sistema calcula materiales, tiempos y costos para que avances sin perder tiempo. Configura cada modelo con tus preferencias exactas.
                </p>
                <div className="space-y-6">
                  {[
                    { icon: <Zap size={22} className="text-primary-container shrink-0" />, key: 'speed', text: 'Precio inmediato para servicios de impresión 3D' },
                    { icon: <Package size={22} className="text-primary-container shrink-0" />, key: 'inventory', text: 'Impresión 3D industrial con materiales técnicos' },
                    { icon: <Cog size={22} className="text-primary-container shrink-0" />, key: 'precision', text: 'Configuración individual de cada modelo 3D' },
                    { icon: <Truck size={22} className="text-primary-container shrink-0" />, key: 'shipping', text: 'Producción en Bogotá · Envíos a todo Colombia' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-4 text-slate-300">
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right quoter */}
              <Quoter />
            </div>
          </div>
        </section>

        {/* ── Section 3: Store preview ── */}
        <section className="bg-white py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#4dbdcc]/5 rounded-full blur-3xl" />
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
                <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-[#16234d]/5 rounded-full blur-2xl" />
              </div>
              <div className="flex flex-col items-start">
                <div className="mb-4 inline-block px-4 py-1.5 bg-[#4dbdcc]/10 text-[#006973] rounded-full text-xs font-bold uppercase tracking-widest font-headline">
                  Catálogo Técnico Especializado
                </div>
                <h2 className="text-4xl md:text-5xl font-headline font-bold text-[#16234d] mb-6 leading-tight">
                  Explora nuestra tienda técnica
                </h2>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                  Desde boquillas de alta precisión hasta placas de control industriales, en Precision3D encuentras todo lo que tu impresora necesita. Contamos con un inventario especializado de repuestos, insumos electrónicos y recursos técnicos.
                </p>
                <div className="grid grid-cols-2 gap-6 mb-10 w-full">
                  <div className="flex items-start gap-3">
                    <Settings2 size={22} className="text-primary-container shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[#16234d] text-sm font-headline">Partes Mecánicas</div>
                      <div className="text-xs text-slate-500">Correas, poleas y extrusores</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Cpu size={22} className="text-primary-container shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[#16234d] text-sm font-headline">Electrónica</div>
                      <div className="text-xs text-slate-500">Drivers y placas de control</div>
                    </div>
                  </div>
                </div>
                <button className="bg-[#4dbdcc] hover:bg-cyan-500 text-white px-10 py-4 rounded-xl font-headline font-bold tracking-wide shadow-lg shadow-[#4dbdcc]/20 transition-all active:scale-95 flex items-center gap-2">
                  VER CATÁLOGO COMPLETO
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4: Shop ── */}
        <section className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-8">
            {/* Header */}
            <div className="mb-12">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                <span>Precision3D</span>
                <ChevronRight size={14} />
                <span className="text-[#16234d]">Tienda</span>
              </div>
              <h2 className="text-5xl font-headline font-bold text-[#16234d] mb-4">Tienda</h2>
              <p className="text-slate-500 max-w-2xl text-lg border-l-4 border-[#4dbdcc] pl-6">
                Insumos industriales y electrónicos especializados. Repuestos de alta precisión para maximizar tu productividad.
              </p>
            </div>

            {/* Search & Filters */}
            <div className="bg-[#f8fafc] p-2 rounded-2xl flex flex-col md:flex-row gap-2 mb-16 border border-slate-100">
              <div className="flex-grow relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="w-full pl-12 pr-4 py-4 bg-transparent text-[#16234d] placeholder-slate-400 font-headline outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-8 py-4 bg-[#4dbdcc] text-[#16234d] rounded-xl font-headline font-bold flex items-center gap-3 hover:bg-cyan-400 transition-colors">
                  Categorías
                  <ChevronDown size={16} />
                </button>
                <button className="px-8 py-4 bg-[#16234d] text-white rounded-xl font-headline font-bold hover:bg-slate-800 transition-colors">
                  Todos los productos
                </button>
              </div>
            </div>

            {/* Recommended label */}
            <div className="mb-8 flex justify-between items-end">
              <h3 className="text-2xl font-headline font-bold text-[#16234d]">Recomendados</h3>
              <button className="text-[#4dbdcc] font-bold text-sm flex items-center gap-1 hover:underline">
                Ver categoría <ArrowRight size={14} />
              </button>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {PRODUCTS.map((p) => (
                <div key={p.name} className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-xl transition-all duration-300">
                  <div className="aspect-square bg-[#f8fafc] rounded-xl mb-6 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={p.alt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      src={p.img}
                    />
                  </div>
                  <div className="space-y-1 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{p.category}</span>
                    <h4 className="font-headline font-bold text-[#16234d] leading-tight h-10 overflow-hidden">{p.name}</h4>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-lg font-bold text-[#16234d]">{p.price}</span>
                      <span className="text-[10px] text-slate-400">IVA incluido</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="w-full py-3 bg-[#16234d] text-white rounded-lg font-headline font-bold text-xs uppercase tracking-widest hover:bg-[#4dbdcc] hover:text-[#16234d] transition-all">
                      Añadir al carrito
                    </button>
                    <button className="flex items-center justify-center gap-2 text-slate-400 hover:text-red-500 text-xs font-bold transition-colors">
                      <Heart size={14} /> Me gusta
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="flex justify-center mb-24">
              <button className="px-12 py-4 border-2 border-[#16234d] text-[#16234d] rounded-xl font-headline font-bold hover:bg-[#16234d] hover:text-white transition-all shadow-md active:scale-95">
                Ir a la tienda completa
              </button>
            </div>

            {/* Trust banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 max-w-4xl mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#4dbdcc]/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={40} className="text-primary-container" />
              </div>
              <div>
                <h4 className="text-xl font-headline font-bold text-[#16234d] mb-1">Compra garantizada</h4>
                <p className="text-slate-500 leading-relaxed text-sm">
                  Paga de manera segura con nuestra pasarela de pago certificada. Múltiples medios de pago disponibles incluyendo contra entrega en Bogotá y Medellín.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: Projects ── */}
        <section className="bg-[#f8fafc] py-24">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <div className="mb-4 inline-block px-4 py-1.5 bg-[#4dbdcc]/10 text-[#006973] rounded-full text-xs font-bold uppercase tracking-widest font-headline">
                Portafolio
              </div>
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-[#16234d] mb-6">Proyectos Realizados</h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                Descubre algunos de los proyectos que hemos desarrollado para nuestros clientes. Desde prototipos funcionales hasta piezas de producción industrial.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {PROJECTS.map((proj) => (
                <div key={proj.title} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={proj.alt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      src={proj.img}
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 ${proj.badgeColor} text-white text-xs font-bold rounded-full`}>
                        {proj.badge}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-headline font-bold text-xl text-[#16234d] mb-2">{proj.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 leading-relaxed">{proj.desc}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Factory size={14} />
                        <span>{proj.material}</span>
                      </div>
                      <span className="text-primary-container font-bold text-sm flex items-center gap-1 cursor-pointer hover:underline">
                        Ver detalles <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* CTA card */}
              <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                <div className="aspect-[4/3] overflow-hidden relative bg-gradient-to-br from-[#16234d] to-[#4dbdcc] flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <PlusCircle size={64} className="mb-4 mx-auto" />
                    <h3 className="font-headline font-bold text-xl mb-2">Tu Proyecto Aquí</h3>
                    <p className="text-white/80 text-sm">Cuéntanos tu idea y la hacemos realidad</p>
                  </div>
                </div>
                <div className="p-6 bg-[#16234d]">
                  <button className="w-full py-3 bg-[#4dbdcc] text-[#16234d] rounded-lg font-headline font-bold text-sm hover:bg-cyan-400 transition-all flex items-center justify-center gap-2">
                    <Rocket size={16} />
                    Iniciar Proyecto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-slate-800 bg-[#16234d] text-white">
        <div className="flex flex-col md:flex-row justify-between items-start px-8 py-16 gap-8 w-full max-w-screen-2xl mx-auto">
          <div className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logotipo-empresa-dark.png" alt="Cesgar" className="h-12 w-auto object-contain" />
            <div className="text-xs uppercase tracking-widest text-slate-400">© 2024 Precision3D Industrial. All rights reserved.</div>
          </div>
          <div className="flex flex-wrap gap-10">
            <div className="flex flex-col gap-3">
              <span className="font-headline font-bold text-sm text-[#4dbdcc]">Explora</span>
              <a className="text-slate-400 hover:text-white transition-colors text-sm" href="#">Tienda</a>
              <a className="text-slate-400 hover:text-white transition-colors text-sm" href="#">¿Cómo funciona?</a>
              <a className="text-slate-400 hover:text-white transition-colors text-sm" href="#">Cotiza tu proyecto</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-headline font-bold text-sm text-[#4dbdcc]">Servicios</span>
              <a className="text-slate-400 hover:text-white transition-colors text-sm" href="#">Impresión 3D</a>
              <a className="text-slate-400 hover:text-white transition-colors text-sm" href="#">Modelado 3D</a>
              <a className="text-slate-400 hover:text-white transition-colors text-sm" href="#">Escaneo 3D</a>
              <a className="text-slate-400 hover:text-white transition-colors text-sm" href="#">Mantenimiento</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-headline font-bold text-sm text-[#4dbdcc]">Contacto</span>
              <a className="text-slate-400 hover:text-white transition-colors text-sm" href="#">WhatsApp</a>
              <a className="text-slate-400 hover:text-white transition-colors text-sm" href="#">info@precision3d.co</a>
              <a className="text-slate-400 hover:text-white transition-colors text-sm" href="#">Bogotá, Colombia</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
