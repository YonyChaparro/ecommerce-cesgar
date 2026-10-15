import type { EstadoValidacion } from '@/lib/asistente/validaciones';

/** Una fila del buscador de modelos: lo de OpenRouter más su estado en verify:agente. */
export interface FilaModelo {
  id: string;
  proveedor: string;
  contexto: number;
  validacion: EstadoValidacion;
}
