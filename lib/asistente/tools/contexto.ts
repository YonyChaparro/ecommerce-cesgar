// Lo que las tools necesitan del mundo exterior. En el chat lo implementa
// lib/asistente/sesion.ts (Prisma, Cloudinary); en los scripts verify:* una
// versión en memoria. Así la lógica de cada tool se prueba sin BD ni red.

import type { QuoterPricing } from '../../quoter-types';
import type { ShippingConfig } from '../../shipping-types';
import type { STLData } from '../../stl-parse';
import type { Eleccion } from '../etiquetas';
import type { EstimadoModelado } from '../clasificador';
import type { Ficha } from '../ficha';
import type { ParametrosComerciales, snapshotModelado } from '../parametros-tipos';

export interface ProductoTienda {
  id: string;
  nombre: string;
  slug: string;
  categoria: string;
  /** Lo que cobra el checkout: salePrice ?? price. */
  precio: number;
  imagen: string;
  stock: number;
}

/** Copia que guardan las Q- y E- (design §6.2): la versión y la fecha de las tarifas del cotizador. */
export interface CopiaParametros {
  version: string;
  tarifasCotizador: string | null;
}

export interface DatosCotizacionArchivo {
  archivo: string;
  modelUrl: string;
  stl: STLData;
  eleccion: Required<Eleccion> & { postProcessing: boolean };
  cantidad: number;
  /** cantidad → precio unitario que se le mostró al cliente (§10.1.3, "El precio cambió"). */
  preciosMostrados: Record<string, number>;
  /** Falta en las cotizaciones de antes de la v5. */
  parametros?: CopiaParametros;
}

export interface DatosEstimacion {
  descripcion: string;
  medidasCm: { x: number; y: number; z: number };
  eleccion: Eleccion;
  min: number;
  max: number;
  parametros?: CopiaParametros;
}

/** Estimado de modelado M- (R5.11): la clase y el resultado, con la copia de los parámetros. */
export interface DatosModelado {
  descripcion: string;
  modeling: Ficha['modeling'];
  resultado: EstimadoModelado;
  parametros: ReturnType<typeof snapshotModelado>;
}

export type CotizacionGuardada =
  | { tipo: 'archivo'; id: string; codigo: string; datos: DatosCotizacionArchivo }
  | { tipo: 'estimacion'; id: string; codigo: string; datos: DatosEstimacion }
  | { tipo: 'modelado'; id: string; codigo: string; datos: DatosModelado };

export type NuevaCotizacion =
  | { tipo: 'archivo'; datos: DatosCotizacionArchivo }
  | { tipo: 'estimacion'; datos: DatosEstimacion }
  | { tipo: 'modelado'; datos: DatosModelado };

export interface ContextoTools {
  pricing: QuoterPricing;
  /** Tarifas de /admin/envios: las mismas con las que cobra el checkout. */
  envio: ShippingConfig;
  /** Parámetros comerciales de /admin/asistente (agente v5). */
  parametros: ParametrosComerciales;
  /** updatedAt del Setting quoter_pricing, para la copia de las Q- y E-. */
  tarifasCotizadorFecha: string | null;
  /** STLData medido en el servidor, o null si el archivo no se pudo descargar. */
  medirArchivo(modelUrl: string): Promise<STLData | null>;
  buscarProductos(consulta: string): Promise<ProductoTienda[]>;
  leerProducto(id: string): Promise<ProductoTienda | null>;
  /** Guarda la cotización en la conversación y devuelve su código (Q-, E- o M-). */
  guardarCotizacion(nueva: NuevaCotizacion): Promise<string>;
  /** Solo resuelve códigos de la conversación en curso. */
  leerCotizacion(codigo: string): Promise<CotizacionGuardada | null>;
  actualizarPreciosMostrados(codigo: string, precios: Record<string, number>): Promise<void>;
  /** La ficha de la conversación, o null si todavía no hay (N5). */
  leerFicha(): Promise<Ficha | null>;
  /** Guarda la ficha y las columnas de métricas (perfil, ruta, clases, oportunidad). */
  guardarFicha(ficha: Ficha): Promise<void>;
  /** Guarda el motivo de la última derivación (R10.1). El resultado lo marca el clic en WhatsApp. */
  marcarDerivacion(motivo: string): Promise<void>;
}

export const tipoDeCodigo = (tipo: NuevaCotizacion['tipo']) => (tipo === 'archivo' ? 'Q' : tipo === 'estimacion' ? 'E' : 'M');
