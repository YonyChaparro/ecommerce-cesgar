import 'server-only';
import cloudinary, { CLOUDINARY_FOLDER } from './cloudinary';

// Subida de STL a Cloudinary. Estaba dentro de /api/stl-upload; la usan esa ruta
// (cotizador) y /api/cotizador/archivo (asistente). Los dos suben a la misma
// carpeta modelos-3d, que es la única que acepta el checkout (isOurModelUrl).

export const MAX_STL_BYTES = 50 * 1024 * 1024; // 50 MB

/** null si el archivo se puede subir; si no, el motivo para mostrarle al cliente. */
export function validarArchivoStl(file: File | null): string | null {
  if (!file) return 'No se recibió archivo';
  if (!file.name.toLowerCase().endsWith('.stl')) return 'Solo se permiten archivos .stl';
  if (file.size > MAX_STL_BYTES) return 'Archivo demasiado grande (máx 50 MB)';
  return null;
}

/** Sube el STL y devuelve su URL pública (secure_url). */
export async function subirStl(bytes: ArrayBuffer, nombreArchivo: string): Promise<string> {
  const base64 = Buffer.from(bytes).toString('base64');
  const dataUri = `data:application/octet-stream;base64,${base64}`;

  // Keep .stl in the public_id so Cloudinary preserves it in the URL,
  // which lets the browser detect the file type on download.
  const baseName = nombreArchivo
    .replace(/\.stl$/i, '')
    .replace(/[^a-z0-9_-]/gi, '_')
    .slice(0, 80);

  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: 'raw',
    folder: `${CLOUDINARY_FOLDER}/modelos-3d`,
    public_id: `${Date.now()}-${baseName}.stl`,
    overwrite: false,
  });
  return result.secure_url;
}
