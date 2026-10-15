export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { estadoAsistente, getAsistenteConfig } from '@/lib/asistente/config';
import TarjetaArchivo from './_components/TarjetaArchivo';
import TarjetaAsistente from './_components/TarjetaAsistente';
import TarjetaPersonalizada from './_components/TarjetaPersonalizada';
import ComparacionCaminos from './_components/ComparacionCaminos';
import VentajasCotizador from './_components/VentajasCotizador';

export const metadata: Metadata = {
  title: 'Cotizador',
  description: 'Cotiza tu impresión 3D industrial: sube tu archivo STL y obtén el precio al instante, o cuéntale tu idea al asistente y te recomienda material y precio.',
};

// Selector de camino (vista 1). Es de servidor entero: sus animaciones son CSS.
export default async function CotizadorPage() {
  const { disponible } = estadoAsistente(await getAsistenteConfig());

  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-x-clip bg-white text-inverse-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-28 sm:pt-36 pb-16 sm:pb-20">
          <header className="mx-auto mb-10 sm:mb-14 flex max-w-3xl flex-col items-center gap-4 text-center">
            <span className="inline-flex items-center rounded-full bg-primary-container/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              Cotizador de impresión 3D
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">¿Cómo quieres cotizar tu pieza?</h1>
            <p className="text-base sm:text-lg leading-relaxed text-slate-600">
              Elige según lo que tengas hoy: <strong className="text-inverse-surface">un archivo 3D</strong> o{' '}
              <strong className="text-inverse-surface">solo una idea</strong>.
            </p>
          </header>

          <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
            <TarjetaArchivo />
            {disponible ? <TarjetaAsistente /> : <TarjetaPersonalizada />}
          </div>

          {disponible && <ComparacionCaminos />}

          <p className="mt-7 text-center text-base text-slate-600">
            ¿Necesitas diseño 3D, escaneo o piezas de más de 30 cm?{' '}
            <Link href="/cotizador/modelo#cotizacion-personalizada" className="font-bold text-primary hover:underline">
              Solicita una cotización personalizada
            </Link>
          </p>

          <VentajasCotizador tono="claro" className="mt-14 border-t border-slate-200 pt-8" />
        </div>
      </main>
    </>
  );
}
