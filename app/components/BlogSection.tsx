'use client';

import Link from 'next/link';
import ScrollStack, { ScrollStackItem } from '@/components/ScrollStack';

const PALETTE = [
  { bg: 'bg-[#eaf4fb]', accent: 'text-blue-600',   tagBg: 'bg-blue-100 text-blue-700'   },
  { bg: 'bg-[#f0faf7]', accent: 'text-teal-600',   tagBg: 'bg-teal-100 text-teal-700'   },
  { bg: 'bg-[#fdf6ee]', accent: 'text-orange-600', tagBg: 'bg-orange-100 text-orange-700' },
  { bg: 'bg-[#f5f0ff]', accent: 'text-purple-600', tagBg: 'bg-purple-100 text-purple-700' },
];

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
          {posts.map((post, i) => {
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
                itemClassName={`${bg} flex flex-row gap-8 items-center`}
              >
                {post.coverImage && (
                  <div className="shrink-0 w-48 h-full rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col justify-between flex-1 h-full">
                <div>
                  {tag && (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${tagBg}`}>
                      {tag}
                    </span>
                  )}
                  <h3 className={`text-2xl font-headline font-bold mb-3 ${accent}`}>
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-slate-600 text-sm leading-relaxed max-w-lg">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-6">
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
        </ScrollStack>
      </div>
    </section>
  );
}
