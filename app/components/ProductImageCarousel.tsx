'use client';

import { useState } from 'react';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';

interface Image {
  url: string;
  alt: string;
}

export default function ProductImageCarousel({ images }: { images: Image[] }) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length);
  const next = () => setCurrent((i) => (i + 1) % images.length);

  const img = images[current];

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="bg-[#f8fafc] rounded-3xl border border-slate-100 flex items-center justify-center relative overflow-hidden h-105">
        <button className="absolute top-6 right-6 p-4 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm hover:shadow-md transition-all z-10">
          <Heart size={24} />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-[#16234d] rounded-full shadow-sm hover:shadow-md transition-all z-10"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-[#16234d] rounded-full shadow-sm hover:shadow-md transition-all z-10"
              aria-label="Imagen siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={img.url}
          src={img.url}
          alt={img.alt}
          className="w-full h-full object-contain p-8 transition-opacity duration-300"
        />

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === current ? 'bg-[#16234d] w-4' : 'bg-slate-300'
                }`}
                aria-label={`Ver imagen ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 bg-[#f8fafc] p-1.5 transition-all ${
                i === current
                  ? 'border-[#4dbdcc] shadow-sm'
                  : 'border-slate-100 hover:border-slate-300'
              }`}
              aria-label={`Ver imagen ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
