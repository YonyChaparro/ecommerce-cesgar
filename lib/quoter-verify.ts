// Verificación server-side de los ítems del cotizador.
//
// El precio de una impresión 3D cuelga entero del volumen de la malla, y ese
// dato lo medía el navegador. Aquí se vuelve a descargar el STL que se subió y
// se mide de nuevo: lo que envíe el cliente como geometría o como precio se
// descarta sin mirarlo.

import { CLOUDINARY_FOLDER } from './cloudinary';
import { parseSTL, type STLData } from './stl-parse';
import { calcCost, type CostResult, type PrintConfig } from './quoter-calc';
import { buildVerifiedConfig, type RawPrintChoices } from './quoter-rules';
import type { QuoterPricing } from './quoter-types';

const MAX_MODEL_BYTES = 50 * 1024 * 1024; // igual que el tope de /api/stl-upload
const FETCH_TIMEOUT_MS = 15_000;
const VERIFY_CONCURRENCY = 4; // acota la memoria: 4 mallas en vuelo, no 100

/**
 * El modelUrl llega del cliente y el servidor va a hacerle fetch, así que solo
 * se acepta si apunta al raw upload de nuestra propia carpeta de Cloudinary.
 * Sin esta comprobación el endpoint sería un SSRF de manual.
 */
export function isOurModelUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' &&
    url.hostname === 'res.cloudinary.com' &&
    url.pathname.includes(`/${CLOUDINARY_FOLDER}/modelos-3d/`) &&
    url.pathname.toLowerCase().endsWith('.stl')
  );
}

export async function fetchModel(url: string): Promise<ArrayBuffer | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) return null;
    if (Number(res.headers.get('content-length') ?? 0) > MAX_MODEL_BYTES) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength > MAX_MODEL_BYTES ? null : buf;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface QuoterItemInput {
  modelUrl?: string;
  printConfig?: RawPrintChoices;
  quantity: number;
}

export type VerifiedItem =
  /** `unitPrice` ya trae el descuento por cantidad repartido: es lo que se cobra. */
  | { ok: true; unitPrice: number; total: number }
  | { ok: false; reason: string };

export type QuotedModel =
  | { ok: true; stl: STLData; config: PrintConfig; cost: CostResult }
  | { ok: false; reason: string };

/**
 * Tarifa un STL ya medido por el servidor: la variante de verifyQuoterItem que
 * devuelve también la geometría y la configuración verificada, no solo el precio.
 * La usa el asistente de IA, que mide el archivo al subirlo y no vuelve a
 * descargarlo para cotizar.
 */
export function quoteVerifiedModel(
  choices: RawPrintChoices,
  stl: STLData,
  pricing: QuoterPricing,
  quantity: number,
): QuotedModel {
  if (stl.volumeUnreliable) return { ok: false, reason: 'no se pudo medir el volumen del modelo' };

  const built = buildVerifiedConfig(choices, stl, pricing, quantity);
  if ('error' in built) return { ok: false, reason: built.error };

  const cost = calcCost(built.config, pricing);
  if (!(cost.billableUnit > 0) || !(cost.total > 0)) return { ok: false, reason: 'el precio calculado no es válido' };

  return { ok: true, stl, config: built.config, cost };
}

export async function verifyQuoterItem(
  input: QuoterItemInput,
  pricing: QuoterPricing,
): Promise<VerifiedItem> {
  if (!input.printConfig) return { ok: false, reason: 'falta la configuración de impresión' };
  if (!input.modelUrl || !isOurModelUrl(input.modelUrl)) {
    return { ok: false, reason: 'falta el modelo 3D o su enlace no es válido' };
  }

  const buffer = await fetchModel(input.modelUrl);
  if (!buffer) return { ok: false, reason: 'no se pudo descargar el modelo para verificarlo' };

  const quoted = quoteVerifiedModel(input.printConfig, parseSTL(buffer), pricing, input.quantity);
  if (!quoted.ok) return quoted;

  return { ok: true, unitPrice: quoted.cost.billableUnit, total: quoted.cost.total };
}

/** Verifica en paralelo con concurrencia acotada, conservando el orden de entrada. */
export async function verifyQuoterItems(
  inputs: QuoterItemInput[],
  pricing: QuoterPricing,
): Promise<VerifiedItem[]> {
  const out = new Array<VerifiedItem>(inputs.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(VERIFY_CONCURRENCY, inputs.length) }, async () => {
      for (let i = next++; i < inputs.length; i = next++) {
        out[i] = await verifyQuoterItem(inputs[i], pricing);
      }
    }),
  );
  return out;
}
