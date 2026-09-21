'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ScrollStack, { ScrollStackItem } from '@/components/ScrollStack';

const PALETTE = [
  { bg: 'bg-[#eaf4fb]', accent: 'text-blue-600',   tagBg: 'bg-blue-100 text-blue-700'   },
  { bg: 'bg-[#f0faf7]', accent: 'text-teal-600',   tagBg: 'bg-teal-100 text-teal-700'   },
  { bg: 'bg-[#fdf6ee]', accent: 'text-orange-600', tagBg: 'bg-orange-100 text-orange-700' },
  { bg: 'bg-[#f5f0ff]', accent: 'text-purple-600', tagBg: 'bg-purple-100 text-purple-700' },
];

// El stack muestra como máximo 6 tarjetas: 5 artículos + la invitación a /blog.
const MAX_POSTS = 5;

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  tags: { tag: { name: string } }[];
};

type Props = { posts: Post[] };

export default function BlogSection({ posts }: Props) {
  const visiblePosts = posts.slice(0, MAX_POSTS);

  return (
    <section className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-8 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="mb-4 inline-block px-4 py-1.5 bg-primary-container/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest font-headline">
              Blog
            </div>
            <h2 className="text-5xl font-headline font-bold text-inverse-surface mb-3">
              Recursos y artículos
            </h2>
            <p className="text-slate-500 max-w-xl text-lg border-l-4 border-primary-container pl-5">
              Conocimiento técnico sobre impresión 3D, materiales y fabricación digital.
            </p>
          </div>
          <Link
            href="/blog"
            className="shrink-0 text-sm font-bold text-primary-container hover:underline"
          >
            Ver todos →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        <ScrollStack
          useWindowScroll
          itemDistance={80}
          baseScale={0.9}
          stackPosition="30%"
        >
          {visiblePosts.map((post, i) => {
            const { bg, accent, tagBg } = PALETTE[i % PALETTE.length];
            const tag = post.tags[0]?.tag.name;
            const date = post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : null;

            return (
              <ScrollStackItem
                key={post.slug}
                itemClassName={`${bg} flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center`}
              >
                {post.coverImage && (
                  <div className="hidden sm:block shrink-0 sm:w-40 md:w-48 sm:h-full rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col justify-between flex-1 h-full min-h-0">
                  <div>
                    {tag && (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 sm:mb-4 ${tagBg}`}>
                        {tag}
                      </span>
                    )}
                    <h3 className={`text-lg sm:text-xl md:text-2xl font-headline font-bold mb-2 sm:mb-3 leading-snug ${accent}`}>
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-slate-600 text-sm leading-relaxed max-w-lg line-clamp-2 sm:line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 sm:mt-6">
                    {date && <span className="text-xs text-slate-400 font-medium">{date}</span>}
                    <Link
                      href={`/blog/${post.slug}`}
                      className={`text-xs font-bold uppercase tracking-widest hover:underline ${accent}`}
                    >
                      Leer artículo →
                    </Link>
                  </div>
                </div>
              </ScrollStackItem>
            );
          })}

          {/* Última tarjeta: invitación a ver todos los artículos en /blog */}
          <ScrollStackItem
            key="ver-todos"
            itemClassName="bg-inverse-surface overflow-hidden"
          >
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl" />
            <Link
              href="/blog"
              className="group relative flex flex-col items-center justify-center h-full w-full text-center gap-3 sm:gap-5"
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/10 text-primary-container">
                Blog
              </span>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-headline font-bold text-white leading-snug">
                ¿Quieres seguir leyendo?
              </h3>
              <p className="hidden sm:block text-inverse-on-surface/70 text-sm md:text-base max-w-md">
                Explora todos los artículos sobre impresión 3D, materiales y fabricación digital.
              </p>
              <span className="inline-flex items-center gap-2 bg-primary-container group-hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-headline font-bold text-sm tracking-wide shadow-lg shadow-primary-container/20 transition-all">
                Ver todos los artículos
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </ScrollStackItem>
        </ScrollStack>
      </div>
    </section>
  );
}
