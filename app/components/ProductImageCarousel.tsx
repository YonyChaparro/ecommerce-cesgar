'use client';

import { useState } from 'react';
import { Heart, ChevronLeft, ChevronRight, Film } from 'lucide-react';

interface MediaItem {
  url: string;
  alt: string;
  type?: 'image' | 'video';
}

export default function ProductImageCarousel({ images }: { images: MediaItem[] }) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length);
  const next = () => setCurrent((i) => (i + 1) % images.length);

  const item = images[current];
  const isVideo = item.type === 'video';

  return (
    <div className="flex flex-col gap-4">
      {/* Main viewer */}
      <div className="bg-[#f8fafc] rounded-3xl border border-slate-100 flex items-center justify-center relative overflow-hidden h-105">
        <button className="absolute top-6 right-6 p-4 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm hover:shadow-md transition-all z-10">
          <Heart size={24} />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-[#16234d] rounded-full shadow-sm hover:shadow-md transition-all z-10"
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-[#16234d] rounded-full shadow-sm hover:shadow-md transition-all z-10"
              aria-label="Siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {isVideo ? (
          <video
            key={item.url}
            src={item.url}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={item.url}
            src={item.url}
            alt={item.alt}
            className="w-full h-full object-contain p-8 transition-opacity duration-300"
          />
        )}

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((m, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? 'bg-[#16234d] w-4' : 'bg-slate-300 w-1.5'
                }`}
                aria-label={`Ver ${m.type === 'video' ? 'video' : 'imagen'} ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((m, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative shrink-0 w-20 h-20 rounded-xl border-2 bg-[#f8fafc] p-1.5 transition-all overflow-hidden ${
                i === current
                  ? 'border-[#4dbdcc] shadow-sm'
                  : 'border-slate-100 hover:border-slate-300'
              }`}
              aria-label={`Ver ${m.type === 'video' ? 'video' : 'imagen'} ${i + 1}`}
            >
              {m.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg">
                  <Film size={22} className="text-slate-400" />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={m.url}
                  alt={m.alt}
                  className="w-full h-full object-contain"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
