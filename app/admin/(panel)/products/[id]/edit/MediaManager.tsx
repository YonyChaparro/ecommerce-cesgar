'use client';
import { useActionState } from 'react';
import { addMedia, deleteMedia, updateMediaOrder, type MediaFormState } from './mediaActions';
import type { ProductMedia } from '@prisma/client';
import { Trash2, Film, ImageIcon } from 'lucide-react';

type Props = {
  productId: string;
  media: ProductMedia[];
};

export default function MediaManager({ productId, media }: Props) {
  const boundAdd = addMedia.bind(null, productId);
  const [state, formAction, pending] = useActionState<MediaFormState, FormData>(boundAdd, undefined);

  const sorted = [...media].sort((a, b) => a.order - b.order);

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

      {/* Add form */}
      <form action={formAction} className="bg-[#f8fafc] rounded-xl p-5 border border-slate-100 space-y-4">
        <h3 className="text-sm font-headline font-bold text-inverse-surface">Agregar medio</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Tipo *</label>
            <select
              name="type"
              defaultValue="image"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-inverse-surface bg-white outline-none focus:border-primary-container transition"
            >
              <option value="image">Imagen</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Orden</label>
            <input
              name="order"
              type="number"
              min={0}
              defaultValue={sorted.length}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-inverse-surface bg-white outline-none focus:border-primary-container transition"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">URL *</label>
            <input
              name="url"
              type="url"
              placeholder="https://..."
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-inverse-surface bg-white outline-none focus:border-primary-container transition"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Texto alternativo</label>
            <input
              name="alt"
              placeholder="Descripción del medio"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-inverse-surface bg-white outline-none focus:border-primary-container transition"
            />
          </div>
        </div>

        {state?.error && (
          <p className="text-red-500 text-xs font-medium">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-[#16234d] hover:bg-[#4dbdcc] text-white hover:text-inverse-surface font-headline font-bold px-6 py-2.5 rounded-lg text-sm transition-all disabled:opacity-50"
        >
          {pending ? 'Agregando…' : '+ Agregar'}
        </button>
      </form>
    </div>
  );
}

// ─── Media card (each item) ────────────────────────────────────────────────────

function MediaCard({ item, productId }: { item: ProductMedia; productId: string }) {
  const isVideo = item.type === 'video';
  const deleteAction = deleteMedia.bind(null, item.id, productId);
  const orderAction = updateMediaOrder.bind(null, item.id, productId);

  return (
    <div className="group relative bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
      {/* Thumbnail */}
      <div className="aspect-square bg-[#f8fafc] flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Film size={32} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Video</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.alt || ''}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Info bar */}
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

        {/* Inline order editor */}
        <form action={orderAction} className="flex items-center gap-1">
          <input
            name="order"
            type="number"
            defaultValue={item.order}
            min={0}
            className="w-10 border border-slate-200 rounded px-1.5 py-1 text-[10px] text-inverse-surface bg-white outline-none focus:border-primary-container text-center"
          />
          <button type="submit" className="text-[10px] text-slate-400 hover:text-[#4dbdcc] font-bold transition-colors">✓</button>
        </form>
      </div>

      {/* Delete button (visible on hover) */}
      <form
        action={deleteAction}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          type="submit"
          className="p-1.5 bg-white rounded-lg shadow text-slate-400 hover:text-red-500 transition-colors"
          onClick={(e) => {
            if (!confirm('¿Eliminar este medio?')) e.preventDefault();
          }}
        >
          <Trash2 size={13} />
        </button>
      </form>
    </div>
  );
}
