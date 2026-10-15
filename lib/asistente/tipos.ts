// Configuración del asistente de IA que se edita en /admin/asistente (vista 6).
// Vive en Setting como JSON, con el patrón de lib/quoter-config.ts.

export interface AsistenteConfig {
  /** Apagado: la tarjeta del selector lleva a la cotización personalizada. */
  activo: boolean;
  /** Id de OpenRouter. Solo se acepta un modelo aprobado por verify:agente. */
  modelo: string;
  /** En orden. Se envían a OpenRouter en el arreglo `models` detrás del principal. */
  respaldos: string[];
  /** Mensajes del cliente por conversación. */
  maxTurnos: number;
  maxCaracteresMensaje: number;
}

// Arranca apagado: hasta que verify:agente apruebe un modelo y el admin lo elija,
// el selector ofrece la cotización personalizada.
export const DEFAULT_ASISTENTE_CONFIG: AsistenteConfig = {
  activo: false,
  modelo: '',
  respaldos: [],
  maxTurnos: 30,
  maxCaracteresMensaje: 1000,
};

// OpenRouter acepta una lista corta en `models`: principal + 2 respaldos.
export const MAX_RESPALDOS = 2;

export const LIMITES_TOPES = {
  maxTurnos: { min: 4, max: 100 },
  maxCaracteresMensaje: { min: 200, max: 4000 },
} as const;
