'use client';

import Link from 'next/link';

interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  img: string;
  alt: string | null;
}

export default function ProductMarquee({ products }: { products: Product[] }) {
  // Duplicate for seamless loop
  const items = [...products, ...products];

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="flex gap-5 w-max animate-marquee hover:[animation-play-state:paused]">
        {items.map((p, i) => (
          <Link
            key={`${p.id}-${i}`}
            href={`/tienda/${p.slug}`}
            className="group w-56 shrink-0 bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-xl transition-all duration-300 flex flex-col"
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
              <h4 className="font-headline font-bold text-[#16234d] text-xs leading-tight line-clamp-2">{p.name}</h4>
              <span className="text-base font-bold text-[#16234d] block">$ {p.price.toLocaleString('es-CO')}</span>
            </div>
            <button className="w-full py-2 bg-[#16234d] text-white rounded-lg font-headline font-bold text-[10px] uppercase tracking-widest hover:bg-[#4dbdcc] hover:text-[#16234d] transition-all">
              Ver producto
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
