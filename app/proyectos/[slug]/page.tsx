export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, coverImage: true },
  });
  if (!project) return {};
  return {
    title: project.title,
    description: project.excerpt ?? undefined,
    openGraph: {
      title: `${project.title} | Cesgar`,
      description: project.excerpt ?? undefined,
      url: `https://cesgar.com.co/proyectos/${slug}`,
      type: 'article',
      images: project.coverImage ? [{ url: project.coverImage, alt: project.title }] : [],
    },
  };
}
import { tiptapToHtml } from '@/lib/tiptap-html';
import Navbar from '@/app/components/Navbar';
import { CalendarDays, User, ArrowLeft, Tag } from 'lucide-react';

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: 'published' },
      select: { slug: true },
    });
    return projects.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug, status: 'published' },
    include: { author: true, tags: { include: { tag: true } } },
  });

  if (!project) notFound();

  const html = tiptapToHtml(project.content);

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-white">
        {/* Cover */}
        {project.coverImage && (
          <div className="w-full h-72 md:h-96 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.coverImage}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Back */}
          <Link
            href="/proyectos"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-[#16234d] text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={14} />
            Volver a proyectos
          </Link>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {project.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#4dbdcc]/10 text-[#16234d] rounded-full text-xs font-bold uppercase tracking-widest"
                >
                  <Tag size={10} />
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-[#16234d] leading-tight mb-6">
            {project.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-5 text-sm text-slate-400 mb-8 pb-8 border-b border-slate-100">
            <span className="flex items-center gap-1.5">
              <User size={14} />
              {project.author.name}
            </span>
            {project.publishedAt && (
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                {new Date(project.publishedAt).toLocaleDateString('es-CO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Excerpt */}
          {project.excerpt && (
            <p className="text-lg text-slate-500 leading-relaxed mb-8 italic border-l-4 border-[#4dbdcc] pl-5">
              {project.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>
    </>
  );
}
