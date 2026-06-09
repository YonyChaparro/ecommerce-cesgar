import type { NextRequest } from 'next/server';
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary';
import { getSession } from '@/lib/session';
import type { UploadApiResponse } from 'cloudinary';

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return Response.json({ error: 'No se recibió archivo' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Formato no permitido. Usa MP4, WebM o MOV.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: CLOUDINARY_FOLDER, resource_type: 'video' },
      (error, res) => {
        if (error || !res) reject(error ?? new Error('Upload fallido'));
        else resolve(res);
      }
    ).end(buffer);
  });

  return Response.json({ url: result.secure_url, publicId: result.public_id });
}
