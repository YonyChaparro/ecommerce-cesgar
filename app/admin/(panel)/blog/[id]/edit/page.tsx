import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BlogForm from '../../BlogForm';
import { updatePost } from '../../actions';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  if (!post) notFound();

  const action = updatePost.bind(null, id);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-headline font-bold text-inverse-surface">Editar artículo</h1>
        <p className="text-slate-500 text-sm mt-1 truncate max-w-xl">{post.title}</p>
      </div>
      <BlogForm action={action} post={post} submitLabel="Guardar cambios" />
    </div>
  );
}
