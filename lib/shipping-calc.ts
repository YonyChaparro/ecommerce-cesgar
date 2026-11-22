// Cálculo del costo de envío, compartido por el navegador y el servidor.
//
// Vive aquí y no dentro del checkout por la misma razón que lib/quoter-rules.ts:
// la cuenta que muestra la UI y la que cobra /api/checkout tienen que ser
// literalmente la misma función. Si divergen, el cliente ve un precio y paga otro.
//
// Módulo puro: no toca la base de datos ni el entorno. La configuración se le
// pasa como argumento (el servidor la lee de Setting, el navegador de
// /api/shipping-config).

import type { ShippingConfig, ZonaEnvio } from './shipping-types';

export type MetodoEntrega = 'domicilio' | 'recogida';

export interface DestinoEnvio {
  metodo: MetodoEntrega;
  departamento?: string | null;
  ciudad?: string | null;
}

export interface ResultadoEnvio {
  costo: number;
  /** id de la zona aplicada, o null si no se aplicó ninguna. */
  zona: string | null;
  /** Texto corto para la UI: "Bogotá · 1–2 días hábiles", "Gratis"… */
  etiqueta: string;
  gratisPorMonto: boolean;
  /** true cuando falta elegir destino y todavía no se puede calcular. */
  indeterminado: boolean;
}

/** Compara nombres de lugares sin que tildes o mayúsculas cambien el resultado. */
function normalizar(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function coincide(lista: string[] | undefined, valor: string | null | undefined): boolean {
  if (!lista || lista.length === 0) return false;
  const v = normalizar(valor);
  if (!v) return false;
  return lista.some((x) => normalizar(x) === v);
}

/** Zona que corresponde al destino. La ciudad manda sobre el departamento. */
export function buscarZona(
  zonas: ZonaEnvio[],
  departamento: string | null | undefined,
  ciudad: string | null | undefined,
): ZonaEnvio | null {
  const porCiudad = zonas.find((z) => coincide(z.ciudades, ciudad));
  if (porCiudad) return porCiudad;
  return zonas.find((z) => coincide(z.departamentos, departamento)) ?? null;
}

function acotar(costo: number, maximo: number): number {
  if (!Number.isFinite(costo)) return 0;
  const tope = Number.isFinite(maximo) && maximo > 0 ? maximo : Number.MAX_SAFE_INTEGER;
  return Math.round(Math.min(Math.max(costo, 0), tope));
}

export function calcShipping(
  destino: DestinoEnvio,
  subtotal: number,
  config: ShippingConfig,
): ResultadoEnvio {
  const base = { costo: 0, zona: null, gratisPorMonto: false, indeterminado: false };

  // 1. Apagado: exactamente lo que hacía la tienda antes de esta función.
  if (!config.habilitado) {
    return { ...base, etiqueta: 'A confirmar', indeterminado: true };
  }

  // 2. Recogida en punto: sin dirección y sin costo. Si el cliente la pide pero
  //    está deshabilitada, se trata como domicilio y el servidor la rechazará.
  if (destino.metodo === 'recogida' && config.recogida.habilitada) {
    return { ...base, etiqueta: config.recogida.etiqueta };
  }

  // 3. Umbral de envío gratis. Se evalúa sobre el subtotal que de verdad se va a
  //    cobrar, es decir con los descuentos por cantidad del cotizador ya dentro.
  const umbral = config.envioGratisDesde;
  if (umbral > 0 && Number.isFinite(subtotal) && subtotal >= umbral) {
    return { ...base, etiqueta: 'Gratis', gratisPorMonto: true };
  }

  // 4. Sin destino todavía no hay nada que calcular.
  if (!destino.departamento && !destino.ciudad) {
    return { ...base, etiqueta: 'Elige el destino', indeterminado: true };
  }

  // 5. Zona, o tarifa por defecto si el destino no cae en ninguna.
  const zona = buscarZona(config.zonas, destino.departamento, destino.ciudad);
  const costo = acotar(zona ? zona.costo : config.costoPorDefecto, config.costoMaximo);
  const nombre = zona?.nombre ?? 'Resto del país';
  const dias = zona?.diasEntrega;

  return {
    costo,
    zona: zona?.id ?? null,
    etiqueta: dias ? `${nombre} · ${dias}` : nombre,
    gratisPorMonto: false,
    indeterminado: false,
  };
}
