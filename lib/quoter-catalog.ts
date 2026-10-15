// Catálogo del cotizador que no vive en la tabla de tarifas: colores por
// material y calidades (alturas de capa) por tecnología.
//
// Estaba dentro de app/components/Quoter.tsx. Se movió aquí porque el asistente
// de IA lo necesita en el servidor (listar_materiales, mostrar_materiales) y
// porque el cotizador y el chat tienen que nombrar igual cada opción.

export interface ColorImpresion {
  id: string;
  nombre: string;
}

export const COLORES: Record<string, Record<string, ColorImpresion[]>> = {
  fdm: {
    pla: [
      { id: 'white', nombre: 'Blanco' }, { id: 'black', nombre: 'Negro' }, { id: 'grey', nombre: 'Gris' },
      { id: 'silver', nombre: 'Plata' }, { id: 'gold', nombre: 'Dorado' }, { id: 'red', nombre: 'Rojo' },
      { id: 'blue', nombre: 'Azul' }, { id: 'green', nombre: 'Verde' }, { id: 'yellow', nombre: 'Amarillo' },
      { id: 'orange', nombre: 'Naranja' }, { id: 'multicolor_red', nombre: 'Multicolor Tono Rojo' },
      { id: 'multicolor_pink', nombre: 'Multicolor Rosado' }, { id: 'brown', nombre: 'Café' }
    ],
    abs: [{ id: 'white', nombre: 'Blanco' }, { id: 'black', nombre: 'Negro' }, { id: 'grey', nombre: 'Gris' }, { id: 'silver', nombre: 'Plata' }],
    petg: [{ id: 'white', nombre: 'Blanco' }, { id: 'black', nombre: 'Negro' }, { id: 'translucent', nombre: 'Translúcido' }, { id: 'silver', nombre: 'Plata' }],
    nylon: [{ id: 'black', nombre: 'Negro' }, { id: 'white', nombre: 'Blanco' }, { id: 'silver', nombre: 'Plata' }],
    tpu: [{ id: 'black', nombre: 'Negro' }, { id: 'yellow', nombre: 'Amarillo' }, { id: 'orange', nombre: 'Naranja' }, { id: 'white', nombre: 'Blanco' }],
    pp: [{ id: 'black', nombre: 'Negro' }, { id: 'white', nombre: 'Blanco' }, { id: 'grey', nombre: 'Gris' }]
  },
  resina: {
    standard: [{ id: 'white', nombre: 'Blanco' }, { id: 'black', nombre: 'Negro' }, { id: 'translucent', nombre: 'Translúcido' }, { id: 'grey', nombre: 'Gris' }, { id: 'blue', nombre: 'Azul' }],
    abs_like: [{ id: 'white', nombre: 'Blanco' }, { id: 'black', nombre: 'Negro' }, { id: 'beige', nombre: 'Beige' }, { id: 'grey', nombre: 'Gris' }, { id: 'blue', nombre: 'Azul' }],
    ultra_transparente: [{ id: 'ultra_transparent', nombre: 'Ultra Transparente' }],
    tough: [{ id: 'black', nombre: 'Negro' }, { id: 'grey', nombre: 'Gris' }],
    nylon: [{ id: 'white', nombre: 'Blanco' }],
    f80: [{ id: 'black', nombre: 'Negro' }]
  }
};

export function getAvailableColors(tech: string, material: string): ColorImpresion[] {
  return (COLORES[tech] && COLORES[tech][material]) || [{ id: 'default', nombre: 'Por defecto' }];
}

export function getAvailableQualities(tech: string): { val: string; text: string }[] {
  if (tech === 'fdm') {
    return [
      { val: '0.3', text: '0.3mm (Borrador - Rápido)' },
      { val: '0.2', text: '0.2mm (Estándar - Equilibrado)' },
      { val: '0.15', text: '0.15mm (Detallado)' },
      { val: '0.1', text: '0.1mm (Alta Calidad)' }
    ];
  }
  return [
    { val: '0.1', text: '100 micras (Rápido)' },
    { val: '0.05', text: '50 micras (Estándar)' },
    { val: '0.02', text: '20 micras (Ultra Detalle)' }
  ];
}

/** Rellenos que ofrece el cotizador, con el nombre que les pone su selector. */
export const RELLENOS: { val: string; text: string }[] = [
  { val: '15', text: 'Ligero' },
  { val: '20', text: 'Estándar' },
  { val: '40', text: 'Resistente' },
  { val: '60', text: 'Fuerte' },
  { val: '80', text: 'Muy fuerte' },
  { val: '100', text: 'Sólido' },
];
