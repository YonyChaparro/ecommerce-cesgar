export interface MaterialConfig {
  id: string;
  nombre: string;
  precioCm3: number;
  densidad: number; // solo para estimar el peso mostrado — no afecta el precio
  desc: string;
  disabled?: boolean;
}

export interface QuoterPricing {
  tarifas: {
    costoSetup: number;
    precioHora: number;
    postProcesado: number;
    multiplicadorCalidad: {
      fdm: Record<string, number>;
      resina: Record<string, number>;
    };
    multiplicadorRelleno: Record<string, number>;
    multiplicadorCantidad: Array<{ min: number; mult: number }>;
  };
  materiales: {
    fdm: MaterialConfig[];
    resina: MaterialConfig[];
  };
}

export const DEFAULT_QUOTER_PRICING: QuoterPricing = {
  tarifas: {
    costoSetup: 1000,
    precioHora: 300,
    postProcesado: 2000,
    multiplicadorCalidad: {
      fdm:    { '0.3': 0.9, '0.2': 1.0, '0.15': 1.2, '0.1': 1.5, '0.05': 2.0 },
      resina: { '0.1': 1.0, '0.05': 1.4, '0.02': 1.8 },
    },
    multiplicadorRelleno: {
      '15': 0.8, '20': 0.9, '40': 1.0, '60': 1.3, '80': 1.7, '100': 2.0,
    },
    multiplicadorCantidad: [
      { min: 50, mult: 0.70 },
      { min: 20, mult: 0.75 },
      { min: 10, mult: 0.80 },
      { min: 5,  mult: 0.85 },
      { min: 3,  mult: 0.90 },
      { min: 2,  mult: 0.95 },
      { min: 1,  mult: 1.00 },
    ],
  },
  // precioCm3 equivale a los antiguos precios por gramo: resina = precioGramo × densidad;
  // FDM anclado al relleno 40% (multiplicador 1.0): precioGramo × densidad × 0.4
  materiales: {
    fdm: [
      { id: 'pla',   nombre: 'PLA',           precioCm3: 168, densidad: 1.00, desc: 'Ideal para prototipos, biodegradable' },
      { id: 'abs',   nombre: 'ABS',           precioCm3: 204, densidad: 1.04, desc: 'Resistente al calor (100 °C), durable, estanqueidad' },
      { id: 'petg',  nombre: 'PETG',          precioCm3: 218, densidad: 1.27, desc: 'Resistente, ligeramente flexible' },
      { id: 'nylon', nombre: 'Nylon',         precioCm3: 406, densidad: 1.27, desc: 'Resistente, flexible, alta temperatura (180 °C)' },
      { id: 'tpu',   nombre: 'TPU',           precioCm3: 457, densidad: 1.27, desc: 'Resistente, flexible Y elastico' },
      { id: 'pp',    nombre: 'Polipropileno', precioCm3: 457, densidad: 1.27, desc: 'Resistente, flexible' },
    ],
    resina: [
      { id: 'standard',          nombre: 'Standard',          precioCm3: 784,  densidad: 1.12, desc: 'Resina estándar para impresión SLA' },
      { id: 'abs_like',          nombre: 'ABS-Like',          precioCm3: 920,  densidad: 1.15, desc: 'Resina con propiedades similares al ABS' },
      { id: 'ultra_transparente',nombre: 'Ultra Transparente',precioCm3: 1008, densidad: 1.12, desc: 'Resina ultra transparente para piezas cristalinas' },
      { id: 'tough',             nombre: 'Tough',             precioCm3: 1380, densidad: 1.15, desc: 'Resina resistente para piezas mecánicas' },
      { id: 'nylon',             nombre: 'Nylon Anti-impact', precioCm3: 2760, densidad: 1.15, desc: 'Resina tipo nylon anti impactos' },
      { id: 'f80',               nombre: 'F-80',              precioCm3: 2760, densidad: 1.15, desc: 'Resina flexible y elástica' },
    ],
  },
};
