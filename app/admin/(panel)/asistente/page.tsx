export const dynamic = 'force-dynamic';
import { getAsistenteConfig } from '@/lib/asistente/config';
import { listarModelosConTools } from '@/lib/asistente/openrouter';
import { getParametros } from '@/lib/asistente/parametros';
import { estadoValidacion, leerValidaciones } from '@/lib/asistente/validaciones';
import AsistenteConfigForm from './AsistenteConfigForm';
import type { FilaModelo } from './_components/tipos';

const ORDEN = { aprobado: 0, fallo: 1, 'sin-validar': 2 } as const;

// Lee en el servidor la configuración, los resultados de verify:agente y los
// modelos de OpenRouter que soportan tools (vista 6).
export default async function AdminAsistentePage() {
  const [config, deOpenRouter, parametros] = await Promise.all([getAsistenteConfig(), listarModelosConTools(), getParametros()]);
  const validaciones = leerValidaciones();

  // Los validados y los elegidos se muestran aunque OpenRouter no los liste hoy.
  const porId = new Map((deOpenRouter ?? []).map((m) => [m.id, m]));
  for (const id of [...Object.keys(validaciones.modelos), config.modelo, ...config.respaldos]) {
    if (id && !porId.has(id)) porId.set(id, { id, proveedor: id.split('/')[0], contexto: 0 });
  }
  const modelos: FilaModelo[] = [...porId.values()]
    .map((m) => ({ ...m, validacion: estadoValidacion(m.id, validaciones) }))
    .sort((a, b) => ORDEN[a.validacion.estado] - ORDEN[b.validacion.estado] || a.id.localeCompare(b.id));

  return (
    <AsistenteConfigForm
      initial={config}
      parametros={parametros}
      modelos={modelos}
      validaciones={validaciones}
      sinListaOpenRouter={deOpenRouter === null}
      hayKey={!!process.env.OPENROUTER_API_KEY}
    />
  );
}
