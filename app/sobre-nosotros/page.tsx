import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import AnimateIn from '../components/AnimateIn';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, MapPin, Phone, Mail,
  Target, Zap, Wrench, ScanLine, Box,
  ShieldCheck, Clock, CreditCard, Tag,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre nosotros',
  description:
    'Cesgar es una firma bogotana de tecnología industrial especializada en manufactura aditiva, ingeniería inversa y suministros técnicos para sectores comerciales e industriales en Colombia.',
  openGraph: {
    title: 'Sobre nosotros | Cesgar',
    description:
      'Fabricamos repuestos bajo demanda, digitalizamos activos físicos y comercializamos insumos técnicos para la industria colombiana.',
    url: 'https://cesgar.com.co/sobre-nosotros',
  },
};

const SOLUCIONES = [
  {
    icon: <Wrench size={28} />,
    title: 'Fabricación de repuestos bajo demanda',
    body: 'Rediseñamos y fabricamos componentes críticos —soportes, engranajes, carcasas— propensos a fatiga física. Sustituimos piezas plásticas comerciales frágiles por polímeros técnicos de alta resistencia mecánica, eliminando la dependencia de importaciones y reduciendo costos de almacenamiento.',
  },
  {
    icon: <ScanLine size={28} />,
    title: 'Ingeniería inversa y escaneo 3D industrial',
    body: 'Capturamos tridimensionalmente moldes industriales y herramental de inyección de plástico con alta precisión. Realizamos inspección geométrica, detección de desgaste en matrices y modificación de diseños originales para clientes que no cuentan con los planos CAD digitales.',
  },
  {
    icon: <Box size={28} />,
    title: 'Modelado y diseño CAD optimizado',
    body: 'Creamos modelos digitales tridimensionales desde cero en plataformas como SolidWorks. Adaptamos estructuralmente cada geometría para asegurar viabilidad y eficiencia en el proceso de impresión por capas, garantizando piezas finales operativas y no solo prototipos visuales.',
  },
];

const PROYECTOS = [
  {
    image: 'https://res.cloudinary.com/dpnv9gx8m/image/upload/v1778961459/rejilla-ventilacion-personalizada-carros_ht5coq.png',
    alt: 'Rejilla de ventilación personalizada para carros',
    href: '/blog/repotenciacion',
    categoria: 'Diseño 3D',
    titulo: 'Rejilla de ventilación personalizada para carros',
    descripcion:
      'Repuesto descatalogado sin planos disponibles. Reconstruimos la geometría completa en SolidWorks a partir de fragmentos originales y fabricamos la pieza con encaje perfecto en el tablero del vehículo.',
    tags: ['SolidWorks', 'PLA+', 'Repuesto automotriz'],
  },
  {
    image: 'https://res.cloudinary.com/dpnv9gx8m/image/upload/v1778961471/optimizacion-ender-3-voron_stdudw.webp',
    alt: 'Repotenciación de impresora 3D Ender 3',
    href: '/blog/repotenciacion-de-impresora-3d-ender-3',
    categoria: 'Repuestos impresoras 3D',
    titulo: 'Repotenciación de impresora 3D Ender 3',
    descripcion:
      'Granja de impresión con atascos recurrentes en sus máquinas Ender 3. Diseñamos y fabricamos soporte de extrusión directa, fan duct de doble canal y tensor de correa, reduciendo fallos en más del 70%.',
    tags: ['ABS', 'Extrusión directa', 'Upgrade rendimiento'],
  },
  {
    image: 'https://res.cloudinary.com/dpnv9gx8m/image/upload/v1778961471/escaneo-3d-de-un-molde-industrial-para-digitalizacion-y-control-de-calidad_xnxm76.png',
    alt: 'Escaneo 3D de molde industrial para digitalización',
    href: '/blog/escaner-3d-en-la-modificacion-de-moldes',
    categoria: 'Escaneo 3D',
    titulo: 'Escáner 3D en la modificación de moldes',
    descripcion:
      'Empresa de manufactura sin documentación CAD de su molde de inyección de 20 años. Capturamos la geometría completa, generamos el sólido STEP y entregamos el archivo listo para mecanizado CNC.',
    tags: ['Escaneo industrial', 'STEP', 'Control dimensional'],
  },
  {
    image: 'https://res.cloudinary.com/dpnv9gx8m/image/upload/v1778961476/impresion-3d-hmi-personalizado_gmmpfi.png',
    alt: 'Carcasa HMI personalizada impresión 3D',
    href: '/blog/hmi-personalizado',
    categoria: 'Diseño 3D',
    titulo: 'HMI personalizado para planta de producción',
    descripcion:
      'Planta de alimentos requería proteger pantallas HMI de salpicaduras y golpes. Diseñamos carcasas a medida con bisagra integrada y cierre de cuarto de vuelta, fabricadas en PETG antichoque.',
    tags: ['PETG', 'Diseño funcional', 'Protección industrial'],
  },
  {
    image: 'https://res.cloudinary.com/dpnv9gx8m/image/upload/v1778961439/bandeja-de-goteo-para-maquinas-vending-recogiendo-liquidos-derramados_gbhk7z.png',
    alt: 'Bandeja de goteo para máquinas vending',
    href: '/blog/bandeja-de-goteo-para-maquinas-vending',
    categoria: 'Fabricación bajo demanda',
    titulo: 'Bandeja de goteo para máquinas vending',
    descripcion:
      'Operador de máquinas expendedoras necesitaba bandejas de goteo dimensionadas exactamente a cada modelo de equipo. Diseñadas y fabricadas a medida para eliminar derrames y cumplir normativas sanitarias.',
    tags: ['PETG', 'Dimensionado a medida', 'Industria'],
  },
  {
    image: 'https://res.cloudinary.com/dpnv9gx8m/image/upload/v1778961395/bomba-dosificadora-de-precision-para-uso-en-la-produccion-de-bioetanol-600x487_qh6zjd.jpg',
    alt: 'Bomba dosificadora para producción de bioetanol',
    href: '/blog/bomba-dosificadora-para-produccion-de-bioetanol',
    categoria: 'Prototipado y fabricación',
    titulo: 'Bomba dosificadora para producción de bioetanol',
    descripcion:
      'Componente de 5 ml/ciclo con tolerancias críticas para sistema de bioetanol. Modelamos el mecanismo, prototipamos en PETG y validamos ensamble y funcionalidad antes de producir la serie final.',
    tags: ['PETG', 'Tolerancias ±0.1 mm', 'Mecanismo'],
  },
  {
    image: 'https://res.cloudinary.com/dpnv9gx8m/image/upload/v1778961464/soporte-motor-batidor_fg59v9.png',
    alt: 'Soporte de motor batidor fabricación bajo demanda',
    href: '/blog/soporte-de-motor-batidor-produccion-bajo-demanda-y-mayor-resistencia',
    categoria: 'Fabricación bajo demanda',
    titulo: 'Soporte de motor batidor: mayor resistencia',
    descripcion:
      'Componente crítico propenso a fatiga en condiciones de uso continuo. Sustituimos la pieza plástica comercial frágil por un soporte fabricado en nylon PA12 con relleno técnico de alta resistencia mecánica.',
    tags: ['Nylon PA12', 'Alta resistencia', 'Industrial'],
  },
];

const VENTAJAS = [
  {
    icon: <Clock size={22} />,
    title: 'Respuesta ágil',
    body: 'Sistema dinámico de cotización en línea. Evalúa tu modelo 3D y recibe precio en segundos, sin tiempos de espera ni formularios.',
  },
  {
    icon: <CreditCard size={22} />,
    title: 'Infraestructura de pago certificada',
    body: 'Pasarela de pagos habilitada con Mercado Pago. Envíos a todo Colombia y entregas contra entrega directamente en Bogotá.',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Orientación funcional, no decorativa',
    body: 'Fabricamos piezas finales capaces de soportar esfuerzos reales de trabajo pesado, respaldadas por materiales técnicos y procesos de ingeniería validados.',
  },
];

export default function SobreNosotrosPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">

        {/* ── Hero ── */}
        <section className="bg-inverse-surface pt-32 pb-24 px-8">
          <div className="max-w-4xl mx-auto">
            <AnimateIn variant="fadeUp">
              <div className="inline-block px-4 py-1.5 bg-primary-container/10 text-primary-container rounded-full text-xs font-bold uppercase tracking-widest font-headline mb-6">
                Quiénes somos
              </div>
              <h1 className="text-5xl md:text-6xl font-headline font-bold text-white mb-6 leading-tight">
                Tecnología industrial<br className="hidden sm:block" /> para la manufactura local
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                Firma bogotana especializada en manufactura aditiva, ingeniería inversa y suministros técnicos.
                Resolvemos fallas de suministro y optimizamos costos de mantenimiento en sectores comerciales e industriales.
              </p>
            </AnimateIn>
          </div>
        </section>

        {/* ── Perfil corporativo ── */}
        <section className="max-w-5xl mx-auto px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            <AnimateIn variant="fadeUp">
              <h2 className="text-3xl font-headline font-bold text-inverse-surface mb-6">
                Nuestra historia
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Cesgar nació de una necesidad real del mercado colombiano: las empresas pierden tiempo y capital
                  importando lotes de repuestos que pueden fabricarse localmente con la misma —o mayor— resistencia técnica.
                  Nuestra respuesta fue construir un taller digital capaz de producir bajo demanda, solo lo que se necesita,
                  exactamente cuando se necesita.
                </p>
                <p>
                  Operamos como proveedor B2B y B2C especializado en la <strong className="text-inverse-surface">sustitución de importaciones</strong> y la
                  <strong className="text-inverse-surface"> digitalización de activos físicos</strong>, reduciendo tiempos de inactividad de maquinaria crítica
                  mediante la replicación técnica de componentes. Además, gestionamos una tienda especializada en insumos,
                  resinas y repuestos para impresoras 3D y maquinaria CNC en Colombia.
                </p>
              </div>
            </AnimateIn>

            <AnimateIn variant="fadeUp" delay={0.1}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Ubicación', value: 'Bogotá, Colombia' },
                  { label: 'Modelo', value: 'B2B & B2C' },
                  { label: 'Especialidad', value: 'Manufactura aditiva' },
                  { label: 'Enfoque', value: 'Producción bajo demanda' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary-container font-headline mb-1">{item.label}</p>
                    <p className="font-semibold text-inverse-surface text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* ── Misión & Visión ── */}
        <section className="bg-slate-50 py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <AnimateIn variant="fadeUp">
              <h2 className="text-3xl font-headline font-bold text-inverse-surface mb-12 text-center">Lo que nos define</h2>
            </AnimateIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimateIn variant="fadeUp" delay={0}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center mb-5">
                    <Target size={28} />
                  </div>
                  <h3 className="font-headline font-bold text-lg text-inverse-surface mb-3">Misión</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Eliminar la dependencia de importaciones masivas de repuestos mediante la producción local bajo demanda.
                    Reducimos los tiempos de inactividad de maquinaria industrial a través de la replicación técnica de componentes
                    con polímeros de alta resistencia mecánica.
                  </p>
                </div>
              </AnimateIn>
              <AnimateIn variant="fadeUp" delay={0.1}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center mb-5">
                    <Zap size={28} />
                  </div>
                  <h3 className="font-headline font-bold text-lg text-inverse-surface mb-3">Visión</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Ser el referente colombiano en manufactura digital aplicada a la industria, liderando la sustitución de
                    importaciones con tecnología de fabricación aditiva e ingeniería inversa de precisión, accesible para
                    empresas de todos los sectores.
                  </p>
                </div>
              </AnimateIn>
            </div>
          </div>
        </section>

        {/* ── Soluciones especializadas ── */}
        <section className="max-w-5xl mx-auto px-8 py-20">
          <AnimateIn variant="fadeUp">
            <h2 className="text-3xl font-headline font-bold text-inverse-surface mb-4">
              Soluciones especializadas
            </h2>
            <p className="text-slate-500 mb-12 max-w-2xl">
              Nuestro portafolio de ingeniería cubre desde la captura digital de un componente físico hasta
              su replicación funcional con materiales técnicos de alta exigencia.
            </p>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SOLUCIONES.map((s, i) => (
              <AnimateIn key={s.title} variant="fadeUp" delay={i * 0.1}>
                <div className="flex flex-col gap-4 bg-white border border-slate-100 rounded-2xl shadow-sm p-8 h-full hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0">
                    {s.icon}
                  </div>
                  <h3 className="font-headline font-bold text-base text-inverse-surface leading-snug">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.body}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </section>

        {/* ── Ventajas competitivas ── */}
        <section className="bg-inverse-surface py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <AnimateIn variant="fadeUp">
              <h2 className="text-3xl font-headline font-bold text-white mb-12 text-center">
                Por qué Cesgar
              </h2>
            </AnimateIn>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {VENTAJAS.map((v, i) => (
                <AnimateIn key={v.title} variant="fadeUp" delay={i * 0.1}>
                  <div className="flex flex-col gap-3 p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary-container flex items-center justify-center">
                      {v.icon}
                    </div>
                    <h3 className="font-headline font-bold text-white text-base">{v.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{v.body}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Proyectos destacados ── */}
        <section className="max-w-6xl mx-auto px-8 py-20">
          <AnimateIn variant="fadeUp">
            <div className="inline-block px-4 py-1.5 bg-primary-container/10 text-primary-container rounded-full text-xs font-bold uppercase tracking-widest font-headline mb-4">
              Casos de ingeniería
            </div>
            <h2 className="text-3xl font-headline font-bold text-inverse-surface mb-4">
              Proyectos realizados
            </h2>
            <p className="text-slate-500 mb-12 max-w-2xl">
              Cada proyecto es un problema de ingeniería resuelto. Aquí algunos casos representativos
              del trabajo que hacemos para empresas colombianas.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROYECTOS.map((p, i) => (
              <AnimateIn key={p.titulo} variant="fadeUp" delay={Math.min(i * 0.08, 0.32)}>
                <Link
                  href={p.href}
                  className="flex flex-col rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full group"
                >
                  {/* Cover image */}
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <Image
                      src={p.image}
                      alt={p.alt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-inverse-surface/50" />
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 text-white rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/20">
                      <Tag size={9} />
                      {p.categoria}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-6 bg-white">
                    <h3 className="font-headline font-bold text-inverse-surface text-base leading-snug mb-3 group-hover:text-primary-container transition-colors">
                      {p.titulo}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-4">
                      {p.descripcion}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                      {p.tags.map((t) => (
                        <span key={t} className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-500 rounded-lg text-[11px] font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </AnimateIn>
            ))}
          </div>

          <AnimateIn variant="fadeUp" delay={0.2}>
            <p className="text-center text-sm text-slate-400 mt-12">
              ¿Tienes un componente que necesitas replicar o digitalizar?{' '}
              <Link href="/cotizador" className="text-primary-container font-semibold hover:underline">
                Cotiza en línea
              </Link>{' '}
              o{' '}
              <Link href="/servicios" className="text-primary-container font-semibold hover:underline">
                explora nuestros servicios
              </Link>.
            </p>
          </AnimateIn>
        </section>

        {/* ── Contacto ── */}
        <section className="max-w-4xl mx-auto px-8 py-20">
          <AnimateIn variant="fadeUp">
            <h2 className="text-3xl font-headline font-bold text-inverse-surface mb-8">Contáctanos</h2>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-slate-600">
                <MapPin size={18} className="text-primary-container shrink-0" />
                Bogotá, Colombia
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <Phone size={18} className="text-primary-container shrink-0" />
                <a href="tel:+573057956352" className="hover:text-primary-container transition-colors">+57 (305) 795 6352</a>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <Mail size={18} className="text-primary-container shrink-0" />
                <a href="mailto:cesangarciar@gmail.com" className="hover:text-primary-container transition-colors">cesangarciar@gmail.com</a>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/cotizador"
                className="inline-flex items-center gap-2 bg-inverse-surface text-white hover:bg-primary-container hover:text-inverse-surface font-headline font-bold px-7 py-3.5 rounded-xl transition-all text-sm"
              >
                Cotiza tu pieza <ArrowRight size={16} />
              </Link>
              <Link
                href="/servicios"
                className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 hover:border-primary-container hover:text-primary-container font-headline font-semibold px-7 py-3.5 rounded-xl transition-all text-sm"
              >
                Ver servicios
              </Link>
            </div>
          </AnimateIn>
        </section>

      </main>
    </>
  );
}
