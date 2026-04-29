import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Plus, Pencil } from 'lucide-react';
import DeleteButton from './DeleteButton';

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: true, tags: { include: { tag: true } } },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-headline font-bold text-[#16234d]">Blog</h1>
          <p className="text-slate-500 text-sm mt-1">
            {posts.length} artículo{posts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="flex items-center gap-2 bg-[#16234d] hover:bg-[#4dbdcc] text-white hover:text-[#16234d] font-headline font-bold px-5 py-2.5 rounded-xl transition-all text-sm"
        >
          <Plus size={16} />
          Nuevo artículo
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-[#f8fafc]">
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                Artículo
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell">
                Autor
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hidden lg:table-cell">
                Etiquetas
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                Estado
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-slate-50 hover:bg-[#f8fafc] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {post.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                    )}
                    <div>
                      <p className="font-medium text-[#16234d] truncate max-w-[260px]">
                        {post.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">/{post.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-500 hidden md:table-cell">
                  {post.author.name}
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {post.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="p-2 text-slate-400 hover:text-[#16234d] hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </Link>
                    <DeleteButton id={post.id} />
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">
                  No hay artículos todavía.{' '}
                  <Link href="/admin/blog/new" className="text-[#4dbdcc] font-medium hover:underline">
                    Crear el primero
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
