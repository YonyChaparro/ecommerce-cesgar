'use client';

import { useCallback, useRef, useState } from 'react';
import type { ArchivoAdjunto } from '@/lib/asistente/esquemas';

const MAX_BYTES = 50 * 1024 * 1024; // el tope de /api/cotizador/archivo

export type EstadoSubida =
  | { fase: 'inactivo' }
  | { fase: 'subiendo'; nombre: string; bytes: number; progreso: number }
  | { fase: 'midiendo'; nombre: string; bytes: number }
  | { fase: 'listo'; nombre: string; bytes: number; archivo: ArchivoAdjunto }
  | { fase: 'error'; nombre: string; bytes: number; titulo: string; texto: string };

const ERRORES: Record<string, { titulo: string; texto: string }> = {
  'no-stl': { titulo: 'No es un archivo STL', texto: 'Exporta tu modelo en formato .stl e inténtalo de nuevo.' },
  'muy-grande': { titulo: 'El archivo pesa más de 50 MB', texto: 'Reduce la resolución de la malla al exportar o habla con un asesor.' },
  limite: { titulo: 'Un momento', texto: 'Estás subiendo archivos muy rápido. Espera un momento e inténtalo de nuevo.' },
  fallo: { titulo: 'No pudimos subir el archivo', texto: 'Revisa tu conexión e inténtalo de nuevo.' },
};

/**
 * Subida del STL con progreso y cancelar. Usa XMLHttpRequest porque fetch no
 * informa el progreso de subida (vista 5).
 */
export function useSubidaStl(idConversacion: string) {
  const [estado, setEstado] = useState<EstadoSubida>({ fase: 'inactivo' });
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const subir = useCallback((file: File) => {
    xhrRef.current?.abort();
    const base = { nombre: file.name, bytes: file.size };
    if (!file.name.toLowerCase().endsWith('.stl')) {
      setEstado({ fase: 'error', ...base, ...ERRORES['no-stl'] });
      return;
    }
    if (file.size > MAX_BYTES) {
      setEstado({ fase: 'error', ...base, ...ERRORES['muy-grande'] });
      return;
    }

    const form = new FormData();
    form.append('file', file);
    form.append('id', idConversacion);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    setEstado({ fase: 'subiendo', ...base, progreso: 0 });

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setEstado({ fase: 'subiendo', ...base, progreso: Math.round((e.loaded / e.total) * 100) });
    };
    // Terminó de subir: el servidor mide la malla antes de responder.
    xhr.upload.onload = () => setEstado({ fase: 'midiendo', ...base });
    xhr.onload = () => {
      xhrRef.current = null;
      let datos: { codigo?: string } & Partial<ArchivoAdjunto> = {};
      try { datos = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status === 200 && datos.modelUrl) {
        setEstado({ fase: 'listo', ...base, archivo: datos as ArchivoAdjunto });
        return;
      }
      const clave = xhr.status === 429 ? 'limite' : (datos.codigo && ERRORES[datos.codigo] ? datos.codigo : 'fallo');
      setEstado({ fase: 'error', ...base, ...ERRORES[clave] });
    };
    xhr.onerror = () => {
      xhrRef.current = null;
      setEstado({ fase: 'error', ...base, ...ERRORES.fallo });
    };
    xhr.onabort = () => setEstado({ fase: 'inactivo' });

    xhr.open('POST', '/api/cotizador/archivo');
    xhr.send(form);
  }, [idConversacion]);

  const cancelar = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setEstado({ fase: 'inactivo' });
  }, []);

  return { estado, subir, cancelar, limpiar: cancelar };
}
