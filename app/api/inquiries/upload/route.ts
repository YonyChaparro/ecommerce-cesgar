import { NextResponse } from 'next/server';
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary';

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp',
  'image/gif', 'image/avif', 'image/heic',
]);
const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4', 'video/webm', 'video/quicktime',
  'video/x-msvideo', 'video/x-matroska',
]);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
    if (file.size > MAX_BYTES)
      return NextResponse.json({ error: 'Archivo demasiado grande (máx 100 MB)' }, { status: 400 });

    const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);

    if (!isImage && !isVideo)
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const baseName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9_-]/gi, '_')
      .slice(0, 80);

    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'auto',
      folder: `${CLOUDINARY_FOLDER}/cotizaciones`,
      public_id: `${Date.now()}-${baseName}`,
      overwrite: false,
    });

    return NextResponse.json({
      url: result.secure_url,
      type: isImage ? 'image' : 'video',
      name: file.name,
    });
  } catch (err) {
    console.error('[inquiries/upload]', err);
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
  }
}
