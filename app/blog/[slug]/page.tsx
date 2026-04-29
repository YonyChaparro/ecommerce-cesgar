import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { tiptapToHtml } from '@/lib/tiptap-html';
import Navbar from '@/app/components/Navbar';
import { CalendarDays, User, ArrowLeft, Tag } from 'lucide-react';

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'published' },
    select: { slug: true },
  });
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'published' },
    include: { author: true, tags: { include: { tag: true } } },
  });

  if (!post) notFound();

  const html = tiptapToHtml(post.content);

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-white">
        {/* Cover */}
        {post.coverImage && (
          <div className="w-full h-72 md:h-96 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Back */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-[#16234d] text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={14} />
            Volver al blog
          </Link>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map(({ tag }) => (
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
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-5 text-sm text-slate-400 mb-8 pb-8 border-b border-slate-100">
            <span className="flex items-center gap-1.5">
              <User size={14} />
              {post.author.name}
            </span>
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                {new Date(post.publishedAt).toLocaleDateString('es-CO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-lg text-slate-500 leading-relaxed mb-8 italic border-l-4 border-[#4dbdcc] pl-5">
              {post.excerpt}
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
