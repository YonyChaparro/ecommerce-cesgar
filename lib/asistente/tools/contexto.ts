// Lo que las tools necesitan del mundo exterior. En el chat lo implementa
// lib/asistente/sesion.ts (Prisma, Cloudinary); en los scripts verify:* una
// versión en memoria. Así la lógica de cada tool se prueba sin BD ni red.

import type { QuoterPricing } from '../../quoter-types';
import type { ShippingConfig } from '../../shipping-types';
import type { STLData } from '../../stl-parse';
import type { Eleccion } from '../etiquetas';

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

export interface DatosCotizacionArchivo {
  archivo: string;
  modelUrl: string;
  stl: STLData;
  eleccion: Required<Eleccion> & { postProcessing: boolean };
  cantidad: number;
  /** cantidad → precio unitario que se le mostró al cliente (§10.1.3, "El precio cambió"). */
  preciosMostrados: Record<string, number>;
}

export interface DatosEstimacion {
  descripcion: string;
  medidasCm: { x: number; y: number; z: number };
  eleccion: Eleccion;
  min: number;
  max: number;
}

export type CotizacionGuardada =
  | { tipo: 'archivo'; id: string; codigo: string; datos: DatosCotizacionArchivo }
  | { tipo: 'estimacion'; id: string; codigo: string; datos: DatosEstimacion };

export type NuevaCotizacion =
  | { tipo: 'archivo'; datos: DatosCotizacionArchivo }
  | { tipo: 'estimacion'; datos: DatosEstimacion };

export interface ContextoTools {
  pricing: QuoterPricing;
  /** Tarifas de /admin/envios: las mismas con las que cobra el checkout. */
  envio: ShippingConfig;
  /** STLData medido en el servidor, o null si el archivo no se pudo descargar. */
  medirArchivo(modelUrl: string): Promise<STLData | null>;
  buscarProductos(consulta: string): Promise<ProductoTienda[]>;
  leerProducto(id: string): Promise<ProductoTienda | null>;
  /** Guarda la cotización en la conversación y devuelve su código (Q- o E-). */
  guardarCotizacion(nueva: NuevaCotizacion): Promise<string>;
  /** Solo resuelve códigos de la conversación en curso. */
  leerCotizacion(codigo: string): Promise<CotizacionGuardada | null>;
  actualizarPreciosMostrados(codigo: string, precios: Record<string, number>): Promise<void>;
}
