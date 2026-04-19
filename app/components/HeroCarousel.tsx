'use client';

import CountUp from '@/components/ui/CountUp';

const METRICS = [
  { to: 500, suffix: '+', label: 'Proyectos Completados' },
  { to: 150, suffix: '+', label: 'Clientes Satisfechos' },
  { to: 15,  suffix: '+', label: 'Materiales Disponibles' },
  { to: 48,  suffix: 'h', label: 'Tiempo de Entrega' },
];

export default function HeroCarousel() {

  return (
    <div className="relative overflow-hidden bg-gray-900 h-217.5">
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="https://res.cloudinary.com/dpnv9gx8m/video/upload/v1776295939/4198845-hd_1920_1080_25fps_msnj7k.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent md:[background:linear-gradient(to_right,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0)_100%)] [background:linear-gradient(to_top,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.2)_100%)]" />

      {/* Content */}
      <div className="relative z-10 h-7/12 flex items-center justify-start px-6 md:px-16">
        <div className="max-w-md md:max-w-lg ml-0 md:ml-8 lg:ml-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Precisión Industrial a Tu Alcance
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Impresión 3D, diseño, escaneo y prototipado de precisión. Todo lo que necesitas para llevar tus ideas a la realidad, en Bogotá.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="absolute top-7/12 left-0 right-0 z-20 px-6 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-4">
            {METRICS.map((metric) => (
              <div
                key={metric.label}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1 text-center hover:bg-white/15 transition-all duration-300"
              >
                <div className="text-2xl md:text-3xl font-bold text-[#4dbdcc] mb-1 tabular-nums">
                  <CountUp to={metric.to} />{metric.suffix}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-gray-200 font-medium break-words">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
