'use client';

import FuzzyText from '@/components/FuzzyText';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundClient() {
  return (
    <div className="min-h-screen bg-inverse-surface flex flex-col items-center justify-center px-6 text-center">

      <FuzzyText
        fontSize="clamp(6rem, 22vw, 18rem)"
        fontWeight={900}
        color="#4dbdcc"
        baseIntensity={0.15}
        hoverIntensity={0.6}
        enableHover
        glitchMode
        glitchInterval={3000}
        glitchDuration={180}
        transitionDuration={300}
      >
        404
      </FuzzyText>

      <p className="mt-4 text-2xl sm:text-3xl font-headline font-bold text-white tracking-tight">
        Página no encontrada
      </p>
      <p className="mt-3 text-slate-400 text-base max-w-sm leading-relaxed">
        La ruta que buscas no existe o fue movida. Te llevamos de vuelta al inicio.
      </p>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-full font-headline font-bold text-sm tracking-wide hover:brightness-110 transition-all"
      >
        <ArrowLeft size={16} />
        Volver al inicio
      </Link>
    </div>
  );
}
