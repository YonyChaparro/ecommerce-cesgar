'use client';

import { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Box, Download, Trash2, Eye, X, ExternalLink,
  Calendar, User, FileBox, AlertTriangle,
} from 'lucide-react';
import { deleteModelAction } from './actions';

const STLViewerUrl = dynamic(() => import('@/components/STLViewerUrl'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0d1525]">
      <div className="text-cyan-400 text-xs animate-pulse">Cargando modelo…</div>
    </div>
  ),
});

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-700' },
  approved:   { label: 'Aprobado',   cls: 'bg-green-100 text-green-700' },
  in_process: { label: 'En proceso', cls: 'bg-blue-100 text-blue-700' },
  rejected:   { label: 'Rechazado',  cls: 'bg-red-100 text-red-700' },
  cancelled:  { label: 'Cancelado',  cls: 'bg-slate-100 text-slate-500' },
};

type ModelItem = {
  id: string;
  orderId: string;
  name: string;
  note: string | null;
  modelUrl: string | null;
  order: {
    id: string;
    createdAt: string;
    shippingName: string | null;
    shippingEmail: string | null;
    status: string;
  };
};

function PreviewModal({ item, onClose }: { item: ModelItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{item.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Orden #{item.order.id.slice(-8).toUpperCase()} ·{' '}
              {new Date(item.order.createdAt).toLocaleDateString('es-CO', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewer */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          <div className="h-64 md:h-auto md:flex-1 bg-[#0d1525]">
            {item.modelUrl && <STLViewerUrl url={item.modelUrl} />}
          </div>

          {/* Info panel */}
          <div className="md:w-72 p-5 border-t md:border-t-0 md:border-l border-slate-700 overflow-y-auto space-y-4 shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cliente</p>
              <p className="text-sm text-white font-medium">{item.order.shippingName ?? '—'}</p>
              {item.order.shippingEmail && (
                <p className="text-xs text-slate-400 mt-0.5 break-all">{item.order.shippingEmail}</p>
              )}
            </div>

            {item.note && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Configuración</p>
                <p className="text-xs text-slate-300 bg-slate-900/60 rounded-lg px-3 py-2 font-mono leading-relaxed break-words">
                  {item.note}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {item.modelUrl && (
                <a
                  href={item.modelUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-sm transition-colors"
                >
                  <Download size={15} />
                  Descargar STL
                </a>
              )}
              <Link
                href={`/admin/orders/${item.orderId}`}
                target="_blank"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 text-sm transition-colors"
              >
                <ExternalLink size={14} />
                Ver orden
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelCard({ item, onDeleted }: { item: ModelItem; onDeleted: (id: string) => void }) {
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const st = ORDER_STATUS[item.order.status] ?? ORDER_STATUS.pending;

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteModelAction(item.id);
      if (res.ok) {
        onDeleted(item.id);
      } else {
        setError(res.error ?? 'Error desconocido');
        setConfirming(false);
      }
    });
  };

  return (
    <>
      {previewing && <PreviewModal item={item} onClose={() => setPreviewing(false)} />}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Thumbnail */}
        <div
          className="h-40 bg-[#0d1525] cursor-pointer relative group"
          onClick={() => setPreviewing(true)}
        >
          {item.modelUrl && <STLViewerUrl url={item.modelUrl} />}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 text-white">
              <Eye size={22} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Vista previa</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
                {st.label}
              </span>
              <span className="text-[10px] text-slate-400">
                #{item.order.id.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <User size={11} className="shrink-0" />
              <span className="truncate">{item.order.shippingName ?? 'Sin nombre'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={11} className="shrink-0" />
              <span>
                {new Date(item.order.createdAt).toLocaleDateString('es-CO', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {item.note && (
            <p className="text-[10px] text-slate-400 bg-slate-50 rounded-lg px-2.5 py-2 font-mono leading-relaxed line-clamp-2">
              {item.note}
            </p>
          )}

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle size={11} /> {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto pt-1">
            <button
              onClick={() => setPreviewing(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
            >
              <Eye size={13} />
              Ver
            </button>

            {item.modelUrl && (
              <a
                href={item.modelUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs font-medium transition-colors border border-cyan-200"
              >
                <Download size={13} />
                STL
              </a>
            )}

            {confirming ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-2.5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isPending ? '…' : 'Sí'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={isPending}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Eliminar modelo"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ModelosClient({ items: initialItems }: { items: ModelItem[] }) {
  const [items, setItems] = useState<ModelItem[]>(initialItems);

  const handleDeleted = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-50 rounded-xl border border-cyan-100">
          <FileBox size={20} className="text-cyan-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-headline font-bold text-inverse-surface">
            Repositorio de Modelos 3D
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {items.length} {items.length === 1 ? 'modelo subido por clientes' : 'modelos subidos por clientes'}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Box size={40} className="text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">No hay modelos en el repositorio</p>
          <p className="text-slate-300 text-sm mt-1">
            Los modelos STL subidos por clientes aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => (
            <ModelCard key={item.id} item={item} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
