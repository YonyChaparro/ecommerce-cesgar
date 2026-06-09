'use client';

import { useRef, useState } from 'react';
import { Film, Upload, X, Loader2 } from 'lucide-react';

type Props = {
  label?: string;
  onUpload: (url: string) => void;
};

export default function VideoUploader({ label = 'Video', onUpload }: Props) {
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    setProgress(0);

    // 1. Obtener firma del servidor (el video NO pasa por Next.js)
    let signData: { signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string };
    try {
      const res = await fetch('/api/cloudinary/sign-video');
      if (!res.ok) throw new Error('No se pudo obtener la firma de subida');
      signData = await res.json();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar la subida');
      setUploading(false);
      return;
    }

    // 2. Subir directamente a Cloudinary desde el navegador
    const body = new FormData();
    body.append('file', file);
    body.append('api_key', signData.apiKey);
    body.append('timestamp', String(signData.timestamp));
    body.append('signature', signData.signature);
    body.append('folder', signData.folder);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      setUploading(false);
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        setError(`Error del servidor (${xhr.status})`);
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        const secureUrl = data.secure_url as string;
        setUrl(secureUrl);
        onUpload(secureUrl);
      } else {
        const msg = (data.error as { message?: string })?.message ?? 'Error al subir el video';
        setError(msg);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError('Error de red al subir el video');
    };

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`);
    xhr.send(body);
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
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
        {label}
      </label>

      {url ? (
        <div className="relative group w-full max-w-xs">
          <video
            src={url}
            controls
            className="w-full aspect-video rounded-xl border border-slate-200 bg-black"
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
          onClick={() => !uploading && inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 w-full max-w-xs aspect-video border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary-container hover:bg-[#f0fbfc] transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 w-full px-6">
              <Loader2 size={24} className="text-primary-container animate-spin" />
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary-container h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 font-medium">{progress}%</span>
            </div>
          ) : (
            <>
              <Film size={28} className="text-slate-300" />
              <span className="text-xs text-slate-400 font-medium text-center px-4">
                Arrastra o haz click para subir<br />
                <span className="text-slate-300">MP4, WebM o MOV</span>
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleChange}
      />

      {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
    </div>
  );
}
