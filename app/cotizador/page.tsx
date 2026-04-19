import type { Metadata } from 'next';
import { Zap, Package, Cog, Truck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Quoter from '../components/Quoter';

export const metadata: Metadata = {
  title: 'Cotizador | Precision3D',
  description: 'Cotiza tu impresión 3D industrial al instante. Carga tu archivo STL y obtén precio, materiales y tiempos en segundos.',
};

export default function CotizadorPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#16234d] text-white">
        <div className="max-w-7xl mx-auto px-8 pt-36 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left copy */}
            <div>
              <h1 className="text-4xl font-headline font-bold mb-6 text-[#4dbdcc]">
                Cotiza tu impresión 3D industrial al instante
              </h1>
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

            {/* Right: quoter */}
            <Quoter />
          </div>
        </div>
      </main>
    </>
  );
}
