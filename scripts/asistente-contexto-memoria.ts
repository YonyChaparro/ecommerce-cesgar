// Contexto de las tools en memoria, para los scripts verify:asistente y
// verify:agente: sin BD ni Cloudinary. Los STL y productos son de ejemplo.

import { CLOUDINARY_FOLDER } from '../lib/cloudinary';
import { generarCodigo } from '../lib/asistente/codigos';
import type { ContextoTools, CotizacionGuardada, ProductoTienda } from '../lib/asistente/tools/contexto';
import { DEFAULT_QUOTER_PRICING, type QuoterPricing } from '../lib/quoter-types';
import { DEFAULT_SHIPPING_CONFIG, type ShippingConfig } from '../lib/shipping-types';
import type { STLData } from '../lib/stl-parse';

export const urlDeEjemplo = (nombre: string) =>
  `https://res.cloudinary.com/demo/raw/upload/v1/${CLOUDINARY_FOLDER}/modelos-3d/1700000000000-${nombre}`;

/** La pieza de la vista 3: 42,6 cm³ en una caja de 84 × 40 × 62 mm. */
export const STL_SOPORTE: STLData = {
  volumeMm3: 42_600,
  dimensions: { x: 84, y: 40, z: 62 },
  boundingBoxVolumeCm3: (84 * 40 * 62) / 1000,
};

/** Una pieza de 34 cm de largo: no se cotiza sola. */
export const STL_GRANDE: STLData = {
  volumeMm3: 300_000,
  dimensions: { x: 340, y: 60, z: 40 },
  boundingBoxVolumeCm3: (340 * 60 * 40) / 1000,
};

export const PRODUCTOS: ProductoTienda[] = [
  { id: 'prod-boquilla', nombre: 'Boquillas de latón de 0.4 mm MK8', slug: 'boquillas-mk8', categoria: 'Repuestos', precio: 4000, imagen: '', stock: 25 },
  { id: 'prod-hotend', nombre: 'Hotend All-Metal V6 Kit Completo', slug: 'hotend-v6', categoria: 'Repuestos', precio: 120000, imagen: '', stock: 3 },
];

/** Las tarifas por defecto, encendidas: así se puede probar estimar_envio. */
export const ENVIO_DE_EJEMPLO: ShippingConfig = { ...DEFAULT_SHIPPING_CONFIG, habilitado: true, envioGratisDesde: 150000 };

export function contextoEnMemoria(
  archivos: Record<string, STLData>,
  pricing: QuoterPricing = DEFAULT_QUOTER_PRICING,
  envio: ShippingConfig = ENVIO_DE_EJEMPLO,
): ContextoTools & {
  cotizaciones: Map<string, CotizacionGuardada>;
} {
  const cotizaciones = new Map<string, CotizacionGuardada>();
  return {
    pricing,
    envio,
    cotizaciones,
    leerProducto: async (id) => PRODUCTOS.find((p) => p.id === id) ?? null,
    medirArchivo: async (url) => archivos[url] ?? null,
    buscarProductos: async (consulta) => {
      const q = consulta.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      return PRODUCTOS.filter((p) => q.split(/\s+/).some((w) => w.length > 2 && p.nombre.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(w)));
    },
    guardarCotizacion: async (nueva) => {
      let codigo = generarCodigo(nueva.tipo === 'archivo' ? 'Q' : 'E');
      while (cotizaciones.has(codigo)) codigo = generarCodigo(nueva.tipo === 'archivo' ? 'Q' : 'E');
      cotizaciones.set(codigo, { ...nueva, id: `mem-${cotizaciones.size + 1}`, codigo } as CotizacionGuardada);
      return codigo;
    },
    leerCotizacion: async (codigo) => cotizaciones.get(codigo) ?? null,
    actualizarPreciosMostrados: async (codigo, precios) => {
      const c = cotizaciones.get(codigo);
      if (c?.tipo === 'archivo') c.datos.preciosMostrados = precios;
    },
  };
}
