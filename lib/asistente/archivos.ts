import 'server-only';
import { fetchModel } from '../quoter-verify';
import { parseSTL, type STLData } from '../stl-parse';

// El STLData medido al subir queda en memoria por modelUrl, así cotizar_archivo
// no vuelve a descargar el archivo. Si el proceso se reinició, se descarga de
// Cloudinary y se mide otra vez (propuesta §8).

const MAX_ENTRADAS = 200;
const medidos = new Map<string, STLData>();

export function recordarMedicion(modelUrl: string, stl: STLData): void {
  medidos.delete(modelUrl);
  medidos.set(modelUrl, stl);
  if (medidos.size > MAX_ENTRADAS) medidos.delete(medidos.keys().next().value!);
}

/** Quien llama ya comprobó isOurModelUrl: aquí solo se mide. */
export async function medirArchivo(modelUrl: string): Promise<STLData | null> {
  const guardado = medidos.get(modelUrl);
  if (guardado) return guardado;
  const buffer = await fetchModel(modelUrl);
  if (!buffer) return null;
  const stl = parseSTL(buffer);
  recordarMedicion(modelUrl, stl);
  return stl;
}
