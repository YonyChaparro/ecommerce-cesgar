'use client';

import { useState, useTransition } from 'react';
import { addMedia, deleteMedia, updateMediaOrder } from './mediaActions';
import type { ProductMedia } from '@prisma/client';
import { Trash2, Film, ImageIcon } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';

type Props = {
  productId: string;
  media: ProductMedia[];
};

export default function MediaManager({ productId, media }: Props) {
  const [type, setType] = useState<'image' | 'video'>('image');
  const [alt, setAlt] = useState('');
  const [order, setOrder] = useState(media.length);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const sorted = [...media].sort((a, b) => a.order - b.order);

  function save(url: string) {
    if (!url) { setError('La URL es obligatoria.'); return; }
    setError('');
    const fd = new FormData();
    fd.set('url', url);
    fd.set('type', type);
    fd.set('alt', alt);
    fd.set('order', String(order));
    startTransition(async () => {
      const result = await addMedia(productId, undefined, fd);
      if (result?.error) setError(result.error);
      else {
        setAlt('');
        setVideoUrl('');
        setOrder(sorted.length + 1);
      }
    });
  }

  function handleVideoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save(videoUrl);
  }

  return (
    <div className="space-y-6">
      {/* Existing media */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map((item) => (
            <MediaCard key={item.id} item={item} productId={productId} />
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-sm py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
          Sin medios. Agrega imágenes o videos abajo.
        </p>
      )}

      {/* Add section */}
      <div className="bg-[#f8fafc] rounded-xl p-5 border border-slate-100 space-y-4">
        <h3 className="text-sm font-headline font-bold text-inverse-surface">Agregar medio</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'image' | 'video')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-inverse-surface bg-white outline-none focus:border-primary-container transition"
            >
              <option value="image">Imagen</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Orden</label>
            <input
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-inverse-surface bg-white outline-none focus:border-primary-container transition"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Texto alternativo</label>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Descripción del medio"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-inverse-surface bg-white outline-none focus:border-primary-container transition"
            />
          </div>

          {type === 'image' ? (
            <div className="sm:col-span-2">
              <ImageUploader
                name="_img_upload"
                label="Imagen — se guarda automáticamente al subir"
                onUpload={(url) => save(url)}
              />
            </div>
          ) : (
            <div className="sm:col-span-2">
              <form onSubmit={handleVideoSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">URL del video *</label>
                  <input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    type="url"
                    placeholder="https://..."
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-inverse-surface bg-white outline-none focus:border-primary-container transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-inverse-surface hover:bg-primary-container text-white hover:text-inverse-surface font-headline font-bold px-6 py-2.5 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  {isPending ? 'Guardando…' : '+ Agregar video'}
                </button>
              </form>
            </div>
          )}
        </div>

        {isPending && type === 'image' && (
          <p className="text-xs text-slate-400">Guardando en galería…</p>
        )}
        {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
      </div>
    </div>
  );
}

// ─── Media card ────────────────────────────────────────────────────────────────

function MediaCard({ item, productId }: { item: ProductMedia; productId: string }) {
  const isVideo = item.type === 'video';
  const deleteAction = deleteMedia.bind(null, item.id, productId);
  const orderAction = updateMediaOrder.bind(null, item.id, productId);

  return (
    <div className="group relative bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
      <div className="aspect-square bg-[#f8fafc] flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Film size={32} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Video</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.alt || ''} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="px-3 py-2 border-t border-slate-50 flex items-center gap-2">
        {isVideo
          ? <Film size={11} className="text-slate-400 shrink-0" />
          : <ImageIcon size={11} className="text-slate-400 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase text-slate-400 truncate">
            {isVideo ? 'Video' : 'Imagen'}
          </p>
          {item.alt && <p className="text-[10px] text-slate-500 truncate">{item.alt}</p>}
        </div>

        <form action={orderAction} className="flex items-center gap-1">
          <input
            name="order"
            type="number"
            defaultValue={item.order}
            min={0}
            className="w-10 border border-slate-200 rounded px-1.5 py-1 text-[10px] text-inverse-surface bg-white outline-none focus:border-primary-container text-center"
          />
          <button type="submit" className="text-[10px] text-slate-400 hover:text-primary-container font-bold transition-colors">✓</button>
        </form>
      </div>

      <form action={deleteAction} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="submit"
          className="p-1.5 bg-white rounded-lg shadow text-slate-400 hover:text-red-500 transition-colors"
          onClick={(e) => { if (!confirm('¿Eliminar este medio?')) e.preventDefault(); }}
        >
          <Trash2 size={13} />
        </button>
      </form>
    </div>
  );
}
