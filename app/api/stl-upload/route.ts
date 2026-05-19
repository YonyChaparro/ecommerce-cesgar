import { NextResponse } from 'next/server';
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary';

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
    if (!file.name.toLowerCase().endsWith('.stl'))
      return NextResponse.json({ error: 'Solo se permiten archivos .stl' }, { status: 400 });
    if (file.size > MAX_BYTES)
      return NextResponse.json({ error: 'Archivo demasiado grande (máx 50 MB)' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUri = `data:application/octet-stream;base64,${base64}`;

    // Keep .stl in the public_id so Cloudinary preserves it in the URL,
    // which lets the browser detect the file type on download.
    const baseName = file.name
      .replace(/\.stl$/i, '')
      .replace(/[^a-z0-9_-]/gi, '_')
      .slice(0, 80);

    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'raw',
      folder: `${CLOUDINARY_FOLDER}/modelos-3d`,
      public_id: `${Date.now()}-${baseName}.stl`,
      overwrite: false,
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error('[stl-upload]', err);
    return NextResponse.json({ error: 'Error al subir el modelo' }, { status: 500 });
  }
}
