import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { SERVICES } from '../data/services';

export const metadata = {
  title: 'Servicios | Cesgar',
  description: 'Impresión 3D, escaneo 3D, diseño, prototipado y repuestos para impresoras 3D en Bogotá.',
};

export default function ServiciosPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-inverse-surface">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="mb-14 text-center">
            <div className="inline-block px-4 py-1.5 bg-primary-container/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest font-headline mb-4">
              Cesgar
            </div>
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-white mb-5">
              Nuestros Servicios
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Desde cotización inmediata hasta fabricación de piezas industriales. Todo lo que necesitas en un solo lugar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => (
              <Link
                key={s.title}
                href={s.href ?? '/cotizador'}
                className={`group flex flex-col rounded-2xl border border-slate-200 p-6 transition-all duration-300 relative overflow-hidden cursor-pointer bg-white opacity-75 hover:opacity-100 ${i === 0 ? 'sm:col-span-2' : ''}`}
              >
                <div className="absolute inset-0 bg-white" />
                {s.image && (
                  <Image
                    src={s.image}
                    alt=""
                    width={300}
                    height={300}
                    className="absolute right-0 top-0 bottom-0 h-full w-1/2 object-contain opacity-90 pointer-events-none select-none translate-y-10 transition-transform duration-300 group-hover:scale-105 group-hover:translate-y-4"
                  />
                )}
                <div className="relative z-10 flex flex-col h-full transition-transform duration-300 group-hover:scale-105">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-slate-100 ${s.iconColor}`}>
                    {s.icon}
                  </div>
                  <h3 className="font-headline font-bold text-lg mb-3 leading-snug text-slate-900">
                    {s.title}
                  </h3>
                  <p className={`text-sm leading-relaxed flex-1 mb-6 text-slate-500 ${s.image ? 'w-1/2 pr-2' : ''}`}>
                    {s.desc}
                  </p>
                  <span className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-headline font-bold text-sm text-white bg-slate-800 group-hover:bg-slate-700 transition-all w-fit">
                    {s.cta}
                    <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
