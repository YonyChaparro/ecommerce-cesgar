// Medición de volumen de STL para el cotizador.
//
// El precio se cobra por volumen de material, así que lo único que importa aquí
// es medir ese volumen bien — incluidas las piezas huecas, que no deben tarifarse
// como macizas. El volumen signado por triángulo (teorema de la divergencia) ya
// resta las cavidades, pero solo si el exportador orientó las normales internas
// hacia adentro. Muchos no lo hacen (Blender solidify sin recalcular, booleanos
// de CAD), y entonces la cavidad suma en vez de restar.
//
// Para no depender de eso, la malla se separa en componentes conexas y el signo
// de cada una se decide por su anidamiento geométrico, no por sus normales:
// profundidad par suma (cuerpo), impar resta (cavidad).

export interface STLData {
  volumeMm3: number;
  dimensions: { x: number; y: number; z: number };
  boundingBoxVolumeCm3: number;
  /** La malla no permitió medir el volumen con fiabilidad: no debe cotizarse en automático. */
  volumeUnreliable?: boolean;
}

// Por encima de esto el análisis de componentes no compensa; se usa el volumen
// signado directo, que para mallas bien exportadas da lo mismo.
const MAX_TRIS_FOR_COMPONENTS = 300_000;
// Resolución de soldadura de vértices: 1 µm. Fina de sobra para no fusionar
// vértices distintos y tosca de sobra para absorber el ruido de los float32.
const WELD = 1000;
const MAX_COMPONENTS_FOR_NESTING = 200;

const UNPARSEABLE: STLData = {
  volumeMm3: 0,
  dimensions: { x: 0, y: 0, z: 0 },
  boundingBoxVolumeCm3: 0,
  volumeUnreliable: true,
};

/** Devuelve los vértices en plano (9 floats por triángulo) o null si no es un STL legible. */
function readBinaryTriangles(buffer: ArrayBuffer): Float64Array | null {
  if (buffer.byteLength < 84) return null;
  const view = new DataView(buffer);
  const count = view.getUint32(80, true);
  if (count <= 0 || 84 + count * 50 !== buffer.byteLength) return null;

  const out = new Float64Array(count * 9);
  for (let i = 0; i < count; i++) {
    const off = 84 + i * 50 + 12; // +12 salta la normal declarada, que no se usa
    for (let k = 0; k < 9; k++) out[i * 9 + k] = view.getFloat32(off + k * 4, true);
  }
  return out;
}

// Tolerante con las variantes que escriben los exportadores: 1, 1.0, .5, +1.5, 1e-3
const NUM = String.raw`([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)`;

function readAsciiTriangles(buffer: ArrayBuffer): Float64Array | null {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  if (!/^\s*solid/i.test(text.slice(0, 256))) return null;

  const re = new RegExp(String.raw`vertex\s+${NUM}\s+${NUM}\s+${NUM}`, 'g');
  const coords: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    coords.push(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
  }
  if (coords.length < 9 || coords.length % 9 !== 0) return null;
  return Float64Array.from(coords);
}

/** Volumen signado del tetraedro origen-triángulo. */
function triSignedVolume(v: Float64Array, o: number): number {
  const ax = v[o],     ay = v[o + 1], az = v[o + 2];
  const bx = v[o + 3], by = v[o + 4], bz = v[o + 5];
  const cx = v[o + 6], cy = v[o + 7], cz = v[o + 8];
  return (ax * (by * cz - cy * bz) - ay * (bx * cz - cx * bz) + az * (bx * cy - cx * by)) / 6;
}

interface Component {
  volume: number; // magnitud, sin signo
  min: [number, number, number];
  max: [number, number, number];
  depth: number;
}

/** Agrupa triángulos en componentes conexas soldando vértices coincidentes. */
function findComponents(v: Float64Array, triCount: number): Component[] | null {
  if (triCount > MAX_TRIS_FOR_COMPONENTS) return null;

  const parent = new Int32Array(triCount);
  for (let i = 0; i < triCount; i++) parent[i] = i;
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };

  const owner = new Map<string, number>();
  for (let t = 0; t < triCount; t++) {
    for (let j = 0; j < 3; j++) {
      const o = t * 9 + j * 3;
      const key = `${Math.round(v[o] * WELD)},${Math.round(v[o + 1] * WELD)},${Math.round(v[o + 2] * WELD)}`;
      const prev = owner.get(key);
      if (prev === undefined) { owner.set(key, t); continue; }
      const ra = find(prev), rb = find(t);
      if (ra !== rb) parent[ra] = rb;
    }
  }

  const byRoot = new Map<number, Component>();
  for (let t = 0; t < triCount; t++) {
    const root = find(t);
    let comp = byRoot.get(root);
    if (!comp) {
      comp = { volume: 0, min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity], depth: 0 };
      byRoot.set(root, comp);
    }
    comp.volume += triSignedVolume(v, t * 9);
    for (let j = 0; j < 3; j++) {
      const o = t * 9 + j * 3;
      for (let k = 0; k < 3; k++) {
        if (v[o + k] < comp.min[k]) comp.min[k] = v[o + k];
        if (v[o + k] > comp.max[k]) comp.max[k] = v[o + k];
      }
    }
  }

  const comps = [...byRoot.values()];
  for (const c of comps) c.volume = Math.abs(c.volume);
  return comps.length > MAX_COMPONENTS_FOR_NESTING ? null : comps;
}

const contains = (outer: Component, inner: Component) =>
  outer !== inner &&
  outer.min[0] <= inner.min[0] && outer.max[0] >= inner.max[0] &&
  outer.min[1] <= inner.min[1] && outer.max[1] >= inner.max[1] &&
  outer.min[2] <= inner.min[2] && outer.max[2] >= inner.max[2];

const bboxVol = (c: Component) =>
  (c.max[0] - c.min[0]) * (c.max[1] - c.min[1]) * (c.max[2] - c.min[2]);

/**
 * Volumen de material combinando componentes por anidamiento: un cuerpo suma,
 * la cavidad dentro de él resta, una isla sólida dentro de la cavidad vuelve a
 * sumar. Independiente de cómo el exportador haya orientado las normales.
 */
function combineByNesting(comps: Component[]): number {
  for (const c of comps) {
    // Anidamiento = cuántos componentes lo contienen. Empates de bbox idéntico
    // (dos cáscaras coincidentes) se ignoran vía el desempate por volumen.
    c.depth = comps.filter((o) => contains(o, c) && bboxVol(o) > bboxVol(c)).length;
  }
  return comps.reduce((sum, c) => sum + (c.depth % 2 === 0 ? c.volume : -c.volume), 0);
}

export function parseSTL(buffer: ArrayBuffer): STLData {
  const v = readBinaryTriangles(buffer) ?? readAsciiTriangles(buffer);
  if (!v) return UNPARSEABLE;

  const triCount = v.length / 9;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let signedVolume = 0;
  for (let t = 0; t < triCount; t++) {
    signedVolume += triSignedVolume(v, t * 9);
    for (let j = 0; j < 3; j++) {
      const o = t * 9 + j * 3;
      if (v[o] < minX) minX = v[o];         if (v[o] > maxX) maxX = v[o];
      if (v[o + 1] < minY) minY = v[o + 1]; if (v[o + 1] > maxY) maxY = v[o + 1];
      if (v[o + 2] < minZ) minZ = v[o + 2]; if (v[o + 2] > maxZ) maxZ = v[o + 2];
    }
  }

  const dimX = Math.max(0.1, maxX - minX);
  const dimY = Math.max(0.1, maxY - minY);
  const dimZ = Math.max(0.1, maxZ - minZ);
  const boundingBoxVolumeCm3 = (dimX * dimY * dimZ) / 1000;

  const comps = findComponents(v, triCount);
  let volumeMm3 = comps && comps.length > 1 ? combineByNesting(comps) : Math.abs(signedVolume);
  let volumeUnreliable = false;

  // Una malla cerrada válida jamás excede su propia caja envolvente ni mide <= 0.
  // Si pasa, la medición no es de fiar: se acota, pero se avisa en vez de cobrar
  // el máximo en silencio.
  const bboxMm3 = dimX * dimY * dimZ;
  if (!(volumeMm3 > 0) || volumeMm3 > bboxMm3 * 1.001) {
    volumeMm3 = Math.min(Math.max(Math.abs(signedVolume), 0.1), bboxMm3);
    volumeUnreliable = true;
  }

  return {
    volumeMm3,
    dimensions: {
      x: Math.round(dimX * 10) / 10,
      y: Math.round(dimY * 10) / 10,
      z: Math.round(dimZ * 10) / 10,
    },
    boundingBoxVolumeCm3,
    ...(volumeUnreliable && { volumeUnreliable: true }),
  };
}
