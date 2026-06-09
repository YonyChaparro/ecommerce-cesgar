export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artículos sobre impresión 3D, materiales, tecnología y casos de uso industriales. Aprende con el equipo de Cesgar.',
  openGraph: {
    title: 'Blog | Cesgar',
    description: 'Artículos sobre impresión 3D, materiales y tecnología industrial.',
    url: 'https://cesgar.com.co/blog',
  },
};
import { prisma } from '@/lib/prisma';
import Navbar from '@/app/components/Navbar';
import { CalendarDays, User, ArrowRight, Tag } from 'lucide-react';
import AnimateIn from '@/app/components/AnimateIn';

export default async function BlogListPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    include: { author: true, tags: { include: { tag: true } } },
  });

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-white">
        {/* Header */}
        <section className="bg-inverse-surface py-20 px-8">
          <AnimateIn variant="fadeUp" className="max-w-7xl mx-auto">
            <div className="mb-4 inline-block px-4 py-1.5 bg-white/10 text-white/70 rounded-full text-xs font-bold uppercase tracking-widest font-headline">
              Cesgar Blog
            </div>
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-white mb-4">
              Recursos y artículos
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl">
              Conocimiento técnico sobre impresión 3D, materiales y fabricación digital.
            </p>
          </AnimateIn>
        </section>

        {/* Posts grid */}
        <section className="max-w-7xl mx-auto px-8 py-16">
          {posts.length === 0 ? (
            <p className="text-center text-slate-400 py-24">No hay artículos publicados aún.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => (
                <AnimateIn key={post.id} variant="fadeUp" delay={Math.min(i * 0.08, 0.32)}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 h-full"
                >
                  {/* Cover */}
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-inverse-surface to-primary-container flex items-center justify-center">
                        <span className="text-white/30 text-5xl font-headline font-bold">
                          {post.title[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-6">
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 3).map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-container/10 text-inverse-surface rounded text-[10px] font-bold uppercase tracking-widest"
                          >
                            <Tag size={9} />
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <h2 className="font-headline font-bold text-inverse-surface text-xl leading-snug mb-2 group-hover:text-primary-container transition-colors">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User size={11} />
                          {post.author.name}
                        </span>
                        {post.publishedAt && (
                          <span className="flex items-center gap-1">
                            <CalendarDays size={11} />
                            {new Date(post.publishedAt).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-[#4dbdcc] font-bold text-xs group-hover:gap-2 transition-all">
                        Leer <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
                </AnimateIn>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
