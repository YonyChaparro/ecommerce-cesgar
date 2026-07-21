export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Proyectos',
  description: 'Casos reales de impresión 3D industrial: repuestos, escaneo 3D, prototipos y piezas a medida fabricadas por Cesgar para sus clientes.',
  openGraph: {
    title: 'Proyectos | Cesgar',
    description: 'Casos reales de impresión 3D industrial resueltos por Cesgar.',
    url: 'https://cesgar.com.co/proyectos',
  },
};
import { prisma } from '@/lib/prisma';
import Navbar from '@/app/components/Navbar';
import { CalendarDays, User, ArrowRight, Tag } from 'lucide-react';
import AnimateIn from '@/app/components/AnimateIn';

export default async function ProjectListPage() {
  const projects = await prisma.project.findMany({
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
              Cesgar Proyectos
            </div>
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-white mb-4">
              Proyectos realizados
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl">
              Casos reales de clientes resueltos con impresión 3D, escaneo e ingeniería a medida.
            </p>
          </AnimateIn>
        </section>

        {/* Projects grid */}
        <section className="max-w-7xl mx-auto px-8 py-16">
          {projects.length === 0 ? (
            <p className="text-center text-slate-400 py-24">No hay proyectos publicados aún.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, i) => (
                <AnimateIn key={project.id} variant="fadeUp" delay={Math.min(i * 0.08, 0.32)}>
                <Link
                  href={`/proyectos/${project.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 h-full"
                >
                  {/* Cover */}
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    {project.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.coverImage}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-inverse-surface to-primary-container flex items-center justify-center">
                        <span className="text-white/30 text-5xl font-headline font-bold">
                          {project.title[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-6">
                    {/* Tags */}
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {project.tags.slice(0, 3).map(({ tag }) => (
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
                      {project.title}
                    </h2>

                    {project.excerpt && (
                      <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                        {project.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User size={11} />
                          {project.author.name}
                        </span>
                        {project.publishedAt && (
                          <span className="flex items-center gap-1">
                            <CalendarDays size={11} />
                            {new Date(project.publishedAt).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-[#4dbdcc] font-bold text-xs group-hover:gap-2 transition-all">
                        Ver <ArrowRight size={12} />
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
