'use client';

import { useRef, useState } from 'react';
import { ImageIcon, Upload, X, Loader2 } from 'lucide-react';

type Props = {
  name: string;
  defaultValue?: string;
  label?: string;
  onUpload?: (url: string) => void;
};

export default function ImageUploader({ name, defaultValue = '', label = 'Imagen', onUpload }: Props) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setUploading(true);

    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/cloudinary/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al subir');
      setUrl(data.url);
      onUpload?.(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setUrl('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
        {label}
      </label>

      {/* Hidden input carries the URL for form submission */}
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative group w-full max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Vista previa"
            className="w-full aspect-video object-cover rounded-xl border border-slate-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow text-xs font-bold text-slate-600 hover:text-primary-container opacity-0 group-hover:opacity-100 transition-all"
          >
            <Upload size={12} /> Cambiar
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 w-full max-w-xs aspect-video border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary-container hover:bg-[#f0fbfc] transition-colors"
        >
          {uploading ? (
            <Loader2 size={28} className="text-primary-container animate-spin" />
          ) : (
            <>
              <ImageIcon size={28} className="text-slate-300" />
              <span className="text-xs text-slate-400 font-medium">
                Arrastra o haz click para subir
              </span>
            </>
          )}
        </div>
      )}

      {/* File input (hidden) */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={handleChange}
      />

      {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
    </div>
  );
}
