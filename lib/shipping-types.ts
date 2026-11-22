// Tarifas de envío. Igual que las del cotizador, se guardan como JSON en la
// tabla Setting y el administrador las edita desde el panel.

export interface ZonaEnvio {
  id: string;
  /** Lo que ve el cliente: "Bogotá", "Ciudades principales"… */
  nombre: string;
  costo: number;
  /** Nombres tal cual aparecen en app/data/colombia.ts */
  departamentos: string[];
  /** Opcional: afina dentro de un departamento. Gana sobre `departamentos`. */
  ciudades?: string[];
  /** Informativo, se muestra junto al costo. */
  diasEntrega?: string;
}

export interface ShippingConfig {
  /** Apagado = comportamiento anterior: no se cobra envío y se muestra "A confirmar". */
  habilitado: boolean;
  /**
   * Cómo viaja el envío a MercadoPago:
   *   'shipments' → campo nativo `shipments.cost` (recomendado: `items` sigue
   *                 cuadrando uno a uno con los OrderItem de la orden).
   *   'item'      → una línea más dentro de `items`, útil si la facturación
   *                 necesita el envío como producto.
   * El monto cobrado es el mismo en ambos casos.
   */
  modoPasarela: 'shipments' | 'item';
  zonas: ZonaEnvio[];
  /** Se aplica cuando el destino no cae en ninguna zona. */
  costoPorDefecto: number;
  /** Subtotal desde el cual el envío es gratis. 0 = nunca. */
  envioGratisDesde: number;
  recogida: {
    habilitada: boolean;
    etiqueta: string;
    direccion: string;
  };
  /** Tope de seguridad: un costo mal configurado nunca pasa de aquí. */
  costoMaximo: number;
}

// OJO: los costos de abajo son marcadores de posición, no tarifas acordadas con
// el negocio. Por eso `habilitado` arranca en false: hasta que alguien entre a
// /admin/envios y ponga las cifras reales, no se cobra nada.
export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  habilitado: false,
  modoPasarela: 'shipments',
  zonas: [
    {
      id: 'bogota',
      nombre: 'Bogotá y Cundinamarca',
      costo: 12000,
      departamentos: ['Bogotá D.C.', 'Cundinamarca'],
      diasEntrega: '1–2 días hábiles',
    },
    {
      id: 'principales',
      nombre: 'Ciudades principales',
      costo: 18000,
      departamentos: [
        'Antioquia', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Cauca', 'Cesar',
        'Córdoba', 'Huila', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander',
        'Quindío', 'Risaralda', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
      ],
      diasEntrega: '2–4 días hábiles',
    },
  ],
  costoPorDefecto: 25000,
  envioGratisDesde: 0,
  recogida: {
    habilitada: false,
    etiqueta: 'Recoger en punto',
    direccion: '',
  },
  costoMaximo: 200000,
};
