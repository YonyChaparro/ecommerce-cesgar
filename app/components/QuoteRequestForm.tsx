'use client';

import { useActionState, useRef, useState, useCallback } from 'react';
import {
  Send, CheckCircle2, Upload, X, Loader2,
  FileBox, ImageIcon, VideoIcon, Paperclip,
} from 'lucide-react';
import { submitQuoteRequest, type QuoteFormState } from '@/app/cotizador/actions';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: 'stl' | 'image' | 'video';
  uploading: boolean;
  error?: string;
}

const SERVICE_OPTIONS = [
  'Impresión 3D (cotización automática)',
  'Diseño 3D',
  'Escaneo 3D',
  'Prototipado y Fabricación',
  'Repuestos para Impresoras',
  'Otro / No lo sé aún',
];

const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

function FileChip({ file, onRemove }: { file: UploadedFile; onRemove: (id: string) => void }) {
  const Icon = file.type === 'stl' ? FileBox : file.type === 'image' ? ImageIcon : VideoIcon;
  const accent = file.type === 'stl' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
    : file.type === 'image' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10'
    : 'text-orange-400 border-orange-500/30 bg-orange-500/10';

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${accent} ${file.error ? 'border-red-500/40 bg-red-500/10 text-red-400' : ''}`}>
      {file.uploading
        ? <Loader2 size={13} className="animate-spin shrink-0" />
        : <Icon size={13} className="shrink-0" />}
      <span className="truncate max-w-36">{file.name}</span>
      {!file.uploading && (
        <button type="button" onClick={() => onRemove(file.id)} className="ml-1 hover:opacity-60 transition-opacity shrink-0">
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export default function QuoteRequestForm() {
  const [state, action, pending] = useActionState<QuoteFormState, FormData>(submitQuoteRequest, undefined);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const stlInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File, type: 'stl' | 'image' | 'video') => {
    const id = `${Date.now()}-${Math.random()}`;
    setFiles(prev => [...prev, { id, name: file.name, url: '', type, uploading: true }]);

    try {
      const endpoint = type === 'stl' ? '/api/stl-upload' : '/api/inquiries/upload';
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? 'Error al subir');

      setFiles(prev => prev.map(f => f.id === id ? { ...f, url: json.url, uploading: false } : f));
    } catch (err: any) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, uploading: false, error: err.message } : f));
    }
  }, []);

  const handleStlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(file => uploadFile(file, 'stl'));
    e.target.value = '';
  }, [uploadFile]);

  const handleMediaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(file => {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      uploadFile(file, type);
    });
    e.target.value = '';
  }, [uploadFile]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const stlFiles = files.filter(f => f.type === 'stl' && f.url);
  const mediaFiles = files.filter(f => (f.type === 'image' || f.type === 'video') && f.url);
  const hasUploading = files.some(f => f.uploading);

  const errors = state && !state.success ? state.errors : undefined;
  const serverMessage = state && !state.success ? state.message : undefined;

  const inputBase = 'w-full bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors';

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-14">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-cyan-500/10">
          <CheckCircle2 size={32} className="text-cyan-400" />
        </div>
        <h3 className="font-headline font-bold text-white text-xl">¡Solicitud enviada!</h3>
        <p className="text-slate-400 max-w-xs">
          Recibimos tu proyecto. Te contactaremos en menos de 24 horas con una propuesta detallada.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {/* Hidden inputs for uploaded file URLs */}
      <input type="hidden" name="stlFiles" value={JSON.stringify(stlFiles.map(f => ({ name: f.name, url: f.url })))} readOnly />
      <input type="hidden" name="mediaFiles" value={JSON.stringify(mediaFiles.map(f => ({ name: f.name, url: f.url, type: f.type })))} readOnly />

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1.5">
            Nombre completo <span className="text-red-400">*</span>
          </label>
          <input name="name" type="text" placeholder="Tu nombre" required className={inputBase} />
          {errors?.name?.[0] && <p className="text-red-400 text-xs mt-1.5">{errors.name[0]}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1.5">
            Correo electrónico <span className="text-red-400">*</span>
          </label>
          <input name="email" type="email" placeholder="tu@email.com" required className={inputBase} />
          {errors?.email?.[0] && <p className="text-red-400 text-xs mt-1.5">{errors.email[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1.5">Teléfono / WhatsApp</label>
          <input name="phone" type="tel" placeholder="+57 300 000 0000" className={inputBase} />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1.5">
            Tipo de servicio <span className="text-red-400">*</span>
          </label>
          <select name="serviceType" required className={`${inputBase} cursor-pointer`}>
            <option value="" disabled>Selecciona...</option>
            {SERVICE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {errors?.serviceType?.[0] && <p className="text-red-400 text-xs mt-1.5">{errors.serviceType[0]}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-1.5">
          Descripción del proyecto <span className="text-red-400">*</span>
        </label>
        <textarea
          name="message"
          placeholder="Describe tu proyecto: qué necesitas fabricar, dimensiones aproximadas, material preferido, cantidad de piezas, uso final..."
          required
          rows={5}
          className={`${inputBase} resize-none`}
        />
        {errors?.message?.[0] && <p className="text-red-400 text-xs mt-1.5">{errors.message[0]}</p>}
      </div>

      {/* File uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* STL */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-300 mb-1">Archivos STL</p>
          <p className="text-xs text-slate-500 mb-4">Modelos 3D para cotización exacta. Máx 50 MB c/u.</p>
          <input ref={stlInputRef} type="file" accept=".stl" multiple className="hidden" onChange={handleStlChange} />
          <button
            type="button"
            onClick={() => stlInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-cyan-500/30 text-cyan-400 rounded-xl py-3 text-xs font-bold hover:border-cyan-400 hover:bg-cyan-500/5 transition-all"
          >
            <Upload size={14} /> Subir archivos .STL
          </button>
          {files.filter(f => f.type === 'stl').length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {files.filter(f => f.type === 'stl').map(f => (
                <FileChip key={f.id} file={f} onRemove={removeFile} />
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-300 mb-1">Material audiovisual</p>
          <p className="text-xs text-slate-500 mb-4">Fotos o videos de referencia. Máx 100 MB c/u.</p>
          <input
            ref={mediaInputRef}
            type="file"
            accept={ALLOWED_MEDIA.join(',')}
            multiple
            className="hidden"
            onChange={handleMediaChange}
          />
          <button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-purple-500/30 text-purple-400 rounded-xl py-3 text-xs font-bold hover:border-purple-400 hover:bg-purple-500/5 transition-all"
          >
            <Paperclip size={14} /> Subir imágenes / videos
          </button>
          {files.filter(f => f.type !== 'stl').length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {files.filter(f => f.type !== 'stl').map(f => (
                <FileChip key={f.id} file={f} onRemove={removeFile} />
              ))}
            </div>
          )}
        </div>
      </div>

      {serverMessage && <p className="text-red-400 text-sm">{serverMessage}</p>}

      <button
        type="submit"
        disabled={pending || hasUploading}
        className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-6 py-4 rounded-xl font-headline font-bold text-sm tracking-wide transition-all active:scale-[.98]"
      >
        {hasUploading
          ? <><Loader2 size={16} className="animate-spin" /> Subiendo archivos…</>
          : pending
          ? <><Loader2 size={16} className="animate-spin" /> Enviando…</>
          : <><Send size={16} /> Enviar cotización</>}
      </button>
    </form>
  );
}
