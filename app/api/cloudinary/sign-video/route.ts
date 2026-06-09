import type { NextRequest } from 'next/server';
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  void req;
  const session = await getSession();
  if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { folder: CLOUDINARY_FOLDER, timestamp };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return Response.json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: CLOUDINARY_FOLDER,
  });
}
