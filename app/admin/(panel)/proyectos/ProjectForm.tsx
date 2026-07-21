'use client';

import { useActionState, useRef, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ProjectFormState } from './actions';
import TipTapEditor from '@/components/TipTapEditor';
import ImageUploader from '@/components/admin/ImageUploader';
import type { Project, ProjectTag } from '@prisma/client';

type Props = {
  action: (prev: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  project?: Project & { tags: { tag: ProjectTag }[] };
  submitLabel: string;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function ProjectForm({ action, project, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [showSuccess, setShowSuccess] = useState(false);
  const contentRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const initialContent = project?.content ?? '';
  const initialTags = project?.tags.map((t) => t.tag.name).join(', ') ?? '';

  useEffect(() => {
    if (contentRef.current && initialContent) {
      contentRef.current.value = initialContent;
    }
  }, [initialContent]);

  useEffect(() => {
    if (!state?.success) return;
    setShowSuccess(true);
    const t = setTimeout(() => setShowSuccess(false), 4000);
    return () => clearTimeout(t);
  }, [state]);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (slugRef.current && !project) {
      slugRef.current.value = slugify(e.target.value);
    }
  }

  const field = (name: string) => state?.errors?.[name]?.[0];

  const inputCls =
    'w-full border border-slate-200 rounded-xl px-4 py-3 text-inverse-surface text-sm outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition';

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm('¿Guardar los cambios en este proyecto?')) e.preventDefault();
      }}
      className="space-y-5 sm:space-y-6 max-w-4xl"
    >
      {state?.message && (
        <p className="text-red-500 text-sm font-medium bg-red-50 px-4 py-3 rounded-xl">
          {state.message}
        </p>
      )}

      {showSuccess && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
          <CheckCircle2 size={16} className="shrink-0" />
          Proyecto actualizado correctamente.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
            Título *
          </label>
          <input
            ref={titleRef}
            name="title"
            defaultValue={project?.title}
            required
            onChange={handleTitleChange}
            className={inputCls}
          />
          {field('title') && <p className="text-red-500 text-xs mt-1">{field('title')}</p>}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
            Slug *
          </label>
          <input
            ref={slugRef}
            name="slug"
            defaultValue={project?.slug}
            required
            placeholder="mi-proyecto"
            className={inputCls}
          />
          {field('slug') && <p className="text-red-500 text-xs mt-1">{field('slug')}</p>}
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
            Estado *
          </label>
          <select name="status" defaultValue={project?.status ?? 'draft'} className={inputCls}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
        </div>

        {/* Cover image */}
        <div className="sm:col-span-2">
          <ImageUploader
            name="coverImage"
            label="Imagen de portada"
            defaultValue={project?.coverImage ?? ''}
          />
          {field('coverImage') && (
            <p className="text-red-500 text-xs mt-1">{field('coverImage')}</p>
          )}
        </div>

        {/* Excerpt */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
            Extracto
          </label>
          <textarea
            name="excerpt"
            rows={2}
            defaultValue={project?.excerpt ?? ''}
            placeholder="Breve descripción del proyecto…"
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
            Etiquetas
          </label>
          <input
            name="tags"
            defaultValue={initialTags}
            placeholder="impresión 3d, prototipado, diseño"
            className={inputCls}
          />
          <p className="text-xs text-slate-400 mt-1">Separadas por coma</p>
        </div>

        {/* Published date */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
            Fecha de publicación
          </label>
          <input
            name="publishedAt"
            type="datetime-local"
            defaultValue={
              project?.publishedAt
                ? new Date(project.publishedAt).toISOString().slice(0, 16)
                : ''
            }
            className={inputCls}
          />
        </div>
      </div>

      {/* Content editor */}
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
          Contenido *
        </label>
        <input type="hidden" name="content" ref={contentRef} defaultValue={initialContent} />
        <TipTapEditor
          initialContent={initialContent || undefined}
          onChange={(json) => {
            if (contentRef.current) contentRef.current.value = json;
          }}
        />
        {field('content') && (
          <p className="text-red-500 text-xs mt-1">{field('content')}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-inverse-surface hover:bg-primary-container text-white hover:text-inverse-surface font-headline font-bold px-6 sm:px-8 py-3 rounded-xl transition-all disabled:opacity-50 text-sm w-full sm:w-auto"
        >
          {pending ? 'Guardando…' : submitLabel}
        </button>
        <a
          href="/admin/proyectos"
          className="text-slate-400 hover:text-inverse-surface text-sm font-medium transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
