import BlogForm from '../BlogForm';
import { createPost } from '../actions';

export default function NewBlogPostPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-[#16234d]">Nuevo artículo</h1>
        <p className="text-slate-500 text-sm mt-1">Crea un nuevo artículo para el blog</p>
      </div>
      <BlogForm action={createPost} submitLabel="Publicar artículo" />
    </div>
  );
}
