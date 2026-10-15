import type { ArchivoAdjunto } from '@/lib/asistente/esquemas';
import { recordarMedicion } from '@/lib/asistente/archivos';
import { estadoAsistente, getAsistenteConfig } from '@/lib/asistente/config';
import { limitar, respuestaLimite } from '@/lib/asistente/limite';
import { PATRON_ID_SESION } from '@/lib/asistente/sesion';
import { effectiveVolumeCm3 } from '@/lib/quoter-calc';
import { checkOversize, detectGeometry } from '@/lib/quoter-rules';
import { parseSTL } from '@/lib/stl-parse';
import { MAX_STL_BYTES, subirStl, validarArchivoStl } from '@/lib/stl-upload';

export const maxDuration = 60;

function error(status: number, codigo: string, detalle?: string) {
  return Response.json({ codigo, detalle }, { status });
}

/**
 * Sube y mide el STL que el cliente adjunta en el chat (propuesta §8). Se mide
 * con el mismo parseSTL del checkout ANTES de subir: un archivo ilegible se
 * rechaza sin gastar Cloudinary. Se sube a modelos-3d, la carpeta que acepta
 * el checkout.
 */
export async function POST(req: Request) {
  if (!estadoAsistente(await getAsistenteConfig()).disponible) return error(503, 'apagado');

  const limite = limitar('archivo', req);
  if (!limite.ok) return respuestaLimite(limite.reintentarEnS);

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const id = String(form?.get('id') ?? '');
  if (!PATRON_ID_SESION.test(id)) return error(400, 'id-invalido');
  if (!(file instanceof File)) return error(400, 'sin-archivo');

  if (file.size > MAX_STL_BYTES) return error(413, 'muy-grande');
  const invalido = validarArchivoStl(file);
  if (invalido) return error(400, 'no-stl', invalido);

  try {
    const bytes = await file.arrayBuffer();
    const stl = parseSTL(bytes);
    if (stl.unreadable) return error(422, 'no-stl');

    const modelUrl = await subirStl(bytes, file.name);
    recordarMedicion(modelUrl, stl);

    const oversize = checkOversize(stl, 1);
    const adjunto: ArchivoAdjunto = {
      nombre: file.name,
      bytes: file.size,
      modelUrl,
      medidasMm: stl.dimensions,
      volumenCm3: Math.round(effectiveVolumeCm3(stl.volumeMm3 / 1000, stl.boundingBoxVolumeCm3, 1) * 10) / 10,
      geometria: detectGeometry(stl),
      grande: oversize?.oversize ?? false,
      ladoMayorCm: Math.round(Math.max(stl.dimensions.x, stl.dimensions.y, stl.dimensions.z)) / 10,
      volumenNoFiable: !!stl.volumeUnreliable,
    };
    return Response.json(adjunto);
  } catch (e) {
    console.error('[asistente/archivo]', e);
    return error(500, 'error-subida');
  }
}
