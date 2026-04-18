'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Zap, CloudUpload, Box, X, Loader2, Plus, Layers, Scale, Clock, ShoppingCart } from 'lucide-react';

// ─── Constants from cotizador.html ────────────────────────────────────────────

const MATERIALES: Record<string, any[]> = {
  fdm: [
    { id: 'pla', nombre: 'PLA', precioGramo: 420, densidad: 1.00, desc: 'Ideal para prototipos, biodegradable' },
    { id: 'abs', nombre: 'ABS', precioGramo: 490, densidad: 1.04, desc: 'Resistente al calor (100 °C), durable, estanqueidad' },
    { id: 'petg', nombre: 'PETG', precioGramo: 430, densidad: 1.27, desc: 'Resistente, ligeramente flexible' },
    { id: 'nylon', nombre: 'Nylon', precioGramo: 800, densidad: 1.27, desc: 'Resistente, flexible, alta temperatura (180 °C)' },
    { id: 'tpu', nombre: 'TPU', precioGramo: 900, densidad: 1.27, desc: 'Resistente, flexible Y elastico' },
    { id: 'pp', nombre: 'Polipropileno', precioGramo: 900, densidad: 1.27, desc: 'Resistente, flexible' }
  ],
  resina: [
    { id: 'standard', nombre: 'Standard', precioGramo: 700, densidad: 1.12, desc: 'Resina estándar para impresión SLA' },
    { id: 'abs_like', nombre: 'ABS-Like', precioGramo: 800, densidad: 1.15, desc: 'Resina con propiedades similares al ABS' },
    { id: 'ultra_transparente', nombre: 'Ultra Transparente', precioGramo: 900, densidad: 1.12, desc: 'Resina ultra transparente para piezas cristalinas' },
    { id: 'tough', nombre: 'Tough', precioGramo: 1200, densidad: 1.15, desc: 'Resina resistente para piezas mecánicas' },
    { id: 'nylon', nombre: 'Nylon Anti-impact', precioGramo: 2400, densidad: 1.15, desc: 'Resina tipo nylon anti impactos' },
    { id: 'f80', nombre: 'F-80', precioGramo: 2400, densidad: 1.15, desc: 'Resina flexible y elástica' }
  ]
};

const COLORES: Record<string, Record<string, any[]>> = {
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

const TARIFAS = {
  costoSetup: 1000,
  precioHora: 300,
  postProcesado: 2000,
  multiplicadorCalidad: {
    fdm: { '0.3': 0.9, '0.2': 1.0, '0.15': 1.2, '0.1': 1.5, '0.05': 2.0 } as Record<string, number>,
    resina: { '0.1': 1.0, '0.05': 1.4, '0.02': 1.8 } as Record<string, number>,
  },
  multiplicadorRelleno: {
    '15': 0.8, '20': 0.9, '40': 1.0, '60': 1.3, '80': 1.7, '100': 2.0
  } as Record<string, number>,
  multiplicadorCantidad: [
    { min: 50, mult: 0.7 }, { min: 20, mult: 0.75 }, { min: 10, mult: 0.8 }, 
    { min: 5, mult: 0.85 }, { min: 3, mult: 0.9 }, { min: 2, mult: 0.95 }, { min: 1, mult: 1.0 }
  ]
};

// ─── Types and Parser ────────────────────────────────────────────────────────

interface STLData {
  volumeMm3: number;
  dimensions: { x: number; y: number; z: number };
  boundingBoxVolumeCm3: number;
}

interface QuoterModel {
  id: string;
  file: File;
  stl: STLData | null;
  config: {
    printingTech: string;
    materialType: string;
    layerHeight: string;
    infillDensity: string;
    printColor: string;
    quantity: number;
    postProcessing: boolean;
  };
}

function parseSTL(buffer: ArrayBuffer): STLData {
  const view = new DataView(buffer);
  
  if (buffer.byteLength < 84) {
    return { volumeMm3: 1000, dimensions: { x: 20, y: 20, z: 20 }, boundingBoxVolumeCm3: 8 };
  }

  const triangleCount = view.getUint32(80, true);
  const expectedSize = 84 + triangleCount * 50;
  const isBinary = expectedSize === buffer.byteLength && triangleCount > 0;

  if (!isBinary) {
    const approxTriangles = Math.max(10, (buffer.byteLength - 80) / 150);
    const approxVol = approxTriangles * 5;
    return { volumeMm3: approxVol, dimensions: { x: 30, y: 30, z: 30 }, boundingBoxVolumeCm3: 27 };
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let signedVolume = 0;

  for (let i = 0; i < triangleCount; i++) {
    const off = 84 + i * 50;
    const p = [
      [view.getFloat32(off + 12, true), view.getFloat32(off + 16, true), view.getFloat32(off + 20, true)],
      [view.getFloat32(off + 24, true), view.getFloat32(off + 28, true), view.getFloat32(off + 32, true)],
      [view.getFloat32(off + 36, true), view.getFloat32(off + 40, true), view.getFloat32(off + 44, true)]
    ];

    for (let j = 0; j < 3; j++) {
      minX = Math.min(minX, p[j][0]); maxX = Math.max(maxX, p[j][0]);
      minY = Math.min(minY, p[j][1]); maxY = Math.max(maxY, p[j][1]);
      minZ = Math.min(minZ, p[j][2]); maxZ = Math.max(maxZ, p[j][2]);
    }

    signedVolume +=
      (p[0][0] * (p[1][1] * p[2][2] - p[2][1] * p[1][2]) -
       p[0][1] * (p[1][0] * p[2][2] - p[2][0] * p[1][2]) +
       p[0][2] * (p[1][0] * p[2][1] - p[2][0] * p[1][1])) / 6;
  }

  const dimX = Math.max(0.1, maxX - minX);
  const dimY = Math.max(0.1, maxY - minY);
  const dimZ = Math.max(0.1, maxZ - minZ);
  const volumeMm3 = Math.max(0.1, Math.abs(signedVolume));

  return {
    volumeMm3,
    dimensions: {
      x: Math.round(dimX * 10) / 10,
      y: Math.round(dimY * 10) / 10,
      z: Math.round(dimZ * 10) / 10,
    },
    boundingBoxVolumeCm3: (dimX * dimY * dimZ) / 1000,
  };
}

// ─── Price Calculation based on cotizador.html ────────────────────────────────

function isHollow(stl: STLData | null): boolean {
  if (!stl) return false;
  const volumeCm3 = stl.volumeMm3 / 1000;
  const relacion = volumeCm3 / Math.max(stl.boundingBoxVolumeCm3, 0.1);
  return relacion < 0.2;
}

function calculateItemCosts(model: QuoterModel) {
  if (!model.stl) return { cost: 0, weightG: 0, timeH: 0 };
  
  const tech = model.config.printingTech;
  const materialId = model.config.materialType;
  const layerHeight = model.config.layerHeight;
  const infill = model.config.infillDensity;
  const quantity = model.config.quantity;
  
  const matObj = MATERIALES[tech].find(m => m.id === materialId) || MATERIALES[tech][0];
  const isObjHollow = isHollow(model.stl);
  const volCm3 = model.stl.volumeMm3 / 1000;
  
  let pesoGramos = volCm3 * matObj.densidad;
  if (!isObjHollow && tech !== 'resina') {
    pesoGramos *= parseInt(infill) / 100;
  }

  let costoMaterial = pesoGramos * matObj.precioGramo;
  const multiplicadorCalidad = TARIFAS.multiplicadorCalidad[tech as 'fdm' | 'resina'][layerHeight] || 1.0;
  costoMaterial *= multiplicadorCalidad;
  
  if (!isObjHollow && tech !== 'resina') {
    costoMaterial *= TARIFAS.multiplicadorRelleno[infill] || 1.0;
  }
  
  const baseTimePerCm3 = tech === 'fdm' ? 0.15 : 0.08;
  let tiempoHoras = volCm3 * baseTimePerCm3;
  if (parseFloat(layerHeight) < 0.1) tiempoHoras *= 1.5;
  if (parseFloat(layerHeight) < 0.05) tiempoHoras *= 2.0;
  
  const costoTiempo = tiempoHoras * TARIFAS.precioHora;
  const costoPost = model.config.postProcessing ? TARIFAS.postProcesado : 0;
  
  let descuentoCantidad = 1.0;
  for (const discount of TARIFAS.multiplicadorCantidad) {
    if (quantity >= discount.min) {
      descuentoCantidad = discount.mult;
      break;
    }
  }
  
  const subtotalUnitario = TARIFAS.costoSetup + costoMaterial + costoTiempo + costoPost;
  const total = subtotalUnitario * quantity * Math.min(1.0, descuentoCantidad); 
  
  return {
    cost: Math.round(total),
    weightG: pesoGramos * quantity,
    timeH: tiempoHoras * quantity,
    unitPrice: subtotalUnitario
  };
}

function getAvailableColors(tech: string, material: string) {
  return (COLORES[tech] && COLORES[tech][material]) || [{ id: 'default', nombre: 'Por defecto' }];
}

function getAvailableQualities(tech: string) {
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

// ─── Modal Component ─────────────────────────────────────────────────────────

function ConfigurationModal({ 
  model, 
  onUpdate, 
  onClose 
}: { 
  model: QuoterModel, 
  onUpdate: (id: string, config: any) => void,
  onClose: () => void 
}) {
  const c = model.config;
  const mats = MATERIALES[c.printingTech];
  const matObj = mats.find(m => m.id === c.materialType) || mats[0];
  const colors = getAvailableColors(c.printingTech, c.materialType);
  const qualities = getAvailableQualities(c.printingTech);
  
  const { cost, timeH, weightG } = calculateItemCosts(model);

  const hc = (key: string, val: any) => {
    const newConf = { ...c, [key]: val };
    
    if (key === 'printingTech') {
      newConf.materialType = MATERIALES[val as string][0].id;
      newConf.layerHeight = val === 'fdm' ? '0.2' : '0.05';
      const cList = getAvailableColors(val as string, newConf.materialType);
      newConf.printColor = cList[0].id;
    } else if (key === 'materialType') {
      const cList = getAvailableColors(c.printingTech, val as string);
      if (!cList.find(color => color.id === newConf.printColor)) {
        newConf.printColor = cList[0].id;
      }
    }
    
    onUpdate(model.id, newConf);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Summary Menu */}
        <div className="bg-slate-900/50 p-6 md:p-8 flex flex-col items-center justify-center md:w-1/3 border-b md:border-b-0 md:border-r border-slate-700 relative shrink-0 overflow-y-auto">
          <div className="text-center w-full max-w-[300px]">
            <Box size={48} className="text-cyan-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 break-words leading-tight">{model.file.name}</h3>
            {model.stl ? (
              <div className="text-slate-400 text-sm space-y-1 mb-6">
                <p>Dimensiones:</p>
                <div className="flex gap-2 justify-center font-mono text-[10px] sm:text-xs flex-wrap">
                  <span className="bg-slate-800 px-2 py-1 rounded whitespace-nowrap">X: {model.stl.dimensions.x}</span>
                  <span className="bg-slate-800 px-2 py-1 rounded whitespace-nowrap">Y: {model.stl.dimensions.y}</span>
                  <span className="bg-slate-800 px-2 py-1 rounded whitespace-nowrap">Z: {model.stl.dimensions.z}</span>
                </div>
                <p className="mt-4 text-cyan-400 font-bold bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-900/50 inline-block text-xs sm:text-sm">
                  {isHollow(model.stl) ? '🫧 Pieza Hueca' : '⬤ Pieza Sólida'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 mb-6">
                 <Loader2 size={24} className="text-cyan-400 animate-spin" />
                 <span className="text-xs text-slate-400">Analizando geometría...</span>
              </div>
            )}
            
            <div className="bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-700 w-full mt-4">
               <div className="text-[10px] sm:text-xs text-slate-400 mb-1 uppercase tracking-wider text-left">Costo Estimado</div>
               <div className="text-2xl sm:text-3xl font-bold text-cyan-400 text-left font-mono truncate">${cost.toLocaleString('es-CO')}</div>
               <div className="text-[10px] sm:text-xs text-slate-500 mt-2 text-left border-t border-slate-700 pt-2 flex justify-between flex-wrap gap-2">
                  <span>Peso: <span className="font-bold text-slate-300">{weightG.toFixed(1)}g</span></span>
                  <span>Tiempo: <span className="font-bold text-slate-300">{timeH.toFixed(1)}h</span></span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Config Form */}
        <div className="p-6 md:p-8 md:w-2/3 overflow-y-auto relative w-full">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-600"
          >
            <X size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-white mb-6 pr-10">Configuración de Impresión</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tech */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase mb-2 tracking-wider">🖨️ Tecnología</label>
              <select 
                value={c.printingTech} 
                onChange={e => hc('printingTech', e.target.value)}
                className="w-full bg-slate-900/50 text-white text-sm rounded-xl px-4 py-3 border border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
              >
                <option value="fdm">FDM (Filamento) 30X30X45 Cm Max</option>
                <option value="resina">Resina (SLA) 25x12x21 cm Max</option>
              </select>
            </div>

            {/* Material */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase mb-2 tracking-wider">🧱 Material</label>
              <select 
                value={c.materialType} 
                onChange={e => hc('materialType', e.target.value)}
                className="w-full bg-slate-900/50 text-white text-sm rounded-xl px-4 py-3 border border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
              >
                {mats.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
            
            {/* Model Info Banner */}
            <div className="col-span-1 md:col-span-2 -mt-2">
              <div className="bg-cyan-950/20 text-cyan-200 px-4 py-3 rounded-lg border border-cyan-800/30 text-xs flex gap-2 items-start">
                <span className="text-base leading-none tracking-tight pt-0.5">ℹ️</span> 
                <span className="leading-relaxed opacity-90">{matObj.desc}</span>
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase mb-2 tracking-wider">📏 Altura de Capa (Calidad)</label>
              <select 
                value={c.layerHeight} 
                onChange={e => hc('layerHeight', e.target.value)}
                className="w-full bg-slate-900/50 text-white text-sm rounded-xl px-4 py-3 border border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
              >
                {qualities.map(q => (
                   <option key={q.val} value={q.val}>{q.text}</option>
                ))}
              </select>
            </div>

            {/* Infill */}
            <div className={`${c.printingTech !== 'fdm' ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase mb-2 tracking-wider">🏗️ Relleno</label>
              <select 
                value={c.infillDensity} 
                onChange={e => hc('infillDensity', e.target.value)}
                disabled={c.printingTech !== 'fdm'}
                className="w-full bg-slate-900/50 text-white text-sm rounded-xl px-4 py-3 border border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
              >
                <option value="15">15% (Ligero)</option>
                <option value="20">20% (Estándar)</option>
                <option value="40">40% (Resistente)</option>
                <option value="60">60% (Fuerte)</option>
                <option value="80">80% (Muy fuerte)</option>
                <option value="100">100% (Sólido)</option>
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase mb-2 tracking-wider">🎨 Color</label>
              <select 
                value={c.printColor} 
                onChange={e => hc('printColor', e.target.value)}
                className="w-full bg-slate-900/50 text-white text-sm rounded-xl px-4 py-3 border border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
              >
                {colors.map(col => (
                  <option key={col.id} value={col.id}>{col.nombre}</option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase mb-2 tracking-wider">🔢 Cantidad</label>
              <input 
                type="number"
                min={1}
                value={c.quantity} 
                onChange={e => hc('quantity', parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900/50 text-white text-sm rounded-xl px-4 py-3 border border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
              />
            </div>
            
            {/* Post prep */}
            <div className="col-span-1 md:col-span-2">
               <label className="flex items-center space-x-3 cursor-pointer p-4 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700 hover:border-slate-500 transition-colors mt-2 group">
                  <input type="checkbox" className="form-checkbox h-5 w-5 text-cyan-500 rounded bg-slate-900/50 border-slate-600 outline-none ring-0 shadow-none border-2" checked={c.postProcessing} onChange={e => hc('postProcessing', e.target.checked)}/>
                  <span className="text-white font-medium group-hover:text-cyan-100 transition-colors">Post Procesado (+ Limpieza y lijado básico)</span>
               </label>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full mt-8 bg-cyan-500 hover:bg-cyan-400 text-slate-900 py-4 rounded-xl font-bold text-lg transition-colors shadow-[0_0_20px_rgba(34,211,238,0.2)] flex items-center justify-center gap-2"
          >
            Aceptar Configuración ✔️
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Quoter() {
  const [models, setModels] = useState<QuoterModel[]>([]);
  const [configuringModelId, setConfiguringModelId] = useState<string | null>(null);
  
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    
    // Validations: size > 500MB (for safety) and extension check
    const newModels: QuoterModel[] = [];
    let shouldOpenConfig = !configuringModelId; // auto-open if nothing open
    let firstNewId: string | null = null;
    
    fileArray.forEach((file) => {
      if (!file.name.toLowerCase().endsWith('.stl')) {
        alert(`El archivo ${file.name} no es un archivo STL válido.`);
        return;
      }
      
      const id = `${Date.now()}-${Math.random()}`;
      if (!firstNewId) firstNewId = id;
      
      const newModel: QuoterModel = {
        id,
        file,
        stl: null,
        config: {
          printingTech: 'fdm',
          materialType: 'pla',
          layerHeight: '0.2',
          infillDensity: '40',
          printColor: 'blue',
          quantity: 1,
          postProcessing: false
        }
      };
      
      newModels.push(newModel);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) return;
        const stl = parseSTL(e.target.result as ArrayBuffer);
        setModels((prev) => prev.map((m) => (m.id === id ? { ...m, stl } : m)));
      };
      reader.readAsArrayBuffer(file);
    });

    if (newModels.length > 0) {
      setModels((prev) => [...prev, ...newModels]);
      if (shouldOpenConfig && firstNewId) setConfiguringModelId(firstNewId);
    }
  }, [configuringModelId]);

  const updateModelConfig = useCallback(
    (id: string, config: any) => {
      setModels((prev) => prev.map((m) => (m.id === id ? { ...m, config } : m)));
    },
    []
  );

  const removeModel = useCallback((id: string) => {
    setModels((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const totals = models.reduce(
    (acc, m) => {
      const costs = calculateItemCosts(m);
      return { 
        weight: acc.weight + costs.weightG, 
        time: acc.time + costs.timeH, 
        price: acc.price + costs.cost 
      };
    },
    { weight: 0, time: 0, price: 0 }
  );

  const hasModels = models.length > 0;
  const configuringModel = configuringModelId ? models.find(m => m.id === configuringModelId) : null;

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-8 border border-white/10 relative">
      {/* Configuration Modal */}
      {configuringModel && (
        <ConfigurationModal 
          model={configuringModel} 
          onUpdate={updateModelConfig} 
          onClose={() => setConfiguringModelId(null)} 
        />
      )}
      
      {/* Label */}
      <div className="flex items-center gap-2 mb-8 text-[#4dbdcc] text-xs font-bold uppercase tracking-widest">
        <Zap size={16} />
        Cotización automática
      </div>

      {/* Upload zone (hidden when models exist) */}
      {!hasModels && (
        <div
          className="bg-gradient-to-b from-slate-700/50 to-slate-800/50 p-8 rounded-xl border-2 border-dashed border-[#4dbdcc]/40 text-center mb-6 cursor-pointer transition-all hover:border-[#4dbdcc] hover:from-slate-700 hover:to-slate-700 group"
          onClick={() => primaryInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
             <CloudUpload size={40} className="text-[#4dbdcc]" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">Sube tu primer modelo STL</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">Calcularemos automáticamente el costo, tiempo y material necesario para tu impresión 3D.</p>
          <input
            ref={primaryInputRef}
            type="file"
            className="hidden"
            accept=".stl"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); primaryInputRef.current?.click(); }}
            className="inline-block bg-[#4dbdcc] hover:bg-cyan-500 text-slate-900 px-8 py-3 rounded-full font-bold text-sm transition-all cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
          >
            Seleccionar Archivos
          </button>
          <p className="text-slate-500 text-xs mt-4">Formatos soportados: .STL | Máx. 100MB</p>
        </div>
      )}

      {/* Models list */}
      {hasModels && (
        <div className="space-y-4 mb-8">
          {models.map((model, index) => {
            const costs = calculateItemCosts(model);
            
            const printColorObj = getAvailableColors(model.config.printingTech, model.config.materialType).find(c => c.id === model.config.printColor);
            const qualityObj = getAvailableQualities(model.config.printingTech).find(q => q.val === model.config.layerHeight);
            
            return (
              <div key={model.id} className="bg-slate-700/30 hover:bg-slate-700/60 rounded-xl p-5 border border-slate-600/50 transition-colors group">
                <div className="flex flex-col md:flex-row items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-[#4dbdcc] flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full overflow-hidden">
                    <div className="flex items-start justify-between">
                       <h4 className="text-white font-bold text-lg mb-2 truncate max-w-[80%]">{model.file.name}</h4>
                       <div className="flex gap-2 md:hidden flex-shrink-0">
                          <button onClick={() => setConfiguringModelId(model.id)} className="bg-slate-600 hover:bg-[#4dbdcc] hover:text-slate-900 text-white p-2 rounded-lg"><Zap size={16} /></button>
                          <button onClick={() => removeModel(model.id)} className="bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 p-2 rounded-lg cursor-pointer"><X size={16} /></button>
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-600 font-medium flex items-center gap-1 uppercase tracking-wider whitespace-nowrap">
                        🖨️ {model.config.printingTech === 'fdm' ? 'FDM' : 'RESINA'}
                      </span>
                      <span className="text-[10px] bg-cyan-900/30 text-cyan-300 px-2 py-1 rounded border border-cyan-800 font-medium flex items-center gap-1 uppercase tracking-wider whitespace-nowrap truncate max-w-[150px]">
                        🧱 {MATERIALES[model.config.printingTech].find(m => m.id === model.config.materialType)?.nombre}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-600 font-medium flex items-center gap-1 uppercase tracking-wider whitespace-nowrap">
                        📏 {qualityObj?.text.split(' ')[0]} {qualityObj?.text.includes('Borrador') ? '(Borrador)' : qualityObj?.text.includes('Rápido') ? '(Rápido)' : ''}
                      </span>
                      {model.config.printingTech === 'fdm' && (
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-600 font-medium flex items-center gap-1 uppercase tracking-wider whitespace-nowrap">
                          🏗️ REL {model.config.infillDensity}%
                        </span>
                      )}
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-600 font-medium flex items-center gap-1 uppercase tracking-wider whitespace-nowrap truncate max-w-[120px]">
                        🎨 {printColorObj?.nombre}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-3 border-t border-slate-600/50 pt-4 md:pt-0 md:border-t-0 md:border-l md:pl-4 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end flex-shrink-0">
                     <div className="text-left md:text-right min-w-[110px] overflow-hidden">
                        <div className="text-xl sm:text-2xl font-bold text-[#4dbdcc] font-mono whitespace-nowrap truncate w-full">
                          ${costs.cost.toLocaleString('es-CO')}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wide whitespace-nowrap">
                          {model.config.quantity}x u. (✓ incl)
                        </div>
                     </div>
                     
                     <div className="hidden md:flex gap-2 flex-shrink-0">
                       <button
                          onClick={() => setConfiguringModelId(model.id)}
                          className="bg-slate-700 border border-slate-600 hover:bg-[#4dbdcc] hover:text-slate-900 text-white p-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
                          title="Configurar Impresión"
                       >
                         <Zap size={18} />
                       </button>
                       <button
                          onClick={() => removeModel(model.id)}
                          className="bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 p-2.5 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar"
                       >
                         <X size={18} />
                       </button>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add more */}
      {hasModels && (
        <div className="flex justify-center mb-10">
          <input
            ref={addMoreInputRef}
            type="file"
            className="hidden"
            accept=".stl"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => addMoreInputRef.current?.click()}
            className="border-2 border-dashed border-[#4dbdcc]/40 text-[#4dbdcc] px-6 py-3 rounded-lg font-headline font-bold text-sm transition-all hover:border-[#4dbdcc] hover:bg-slate-700/50 cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={18} /> Agregar otro modelo
          </button>
        </div>
      )}

      {/* Summary Menu */}
      {hasModels && (
        <div className="bg-slate-900 rounded-2xl p-4 md:p-5 border border-slate-700 shadow-2xl mt-6 relative overflow-hidden flex flex-row flex-wrap items-center justify-between gap-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4dbdcc] to-transparent opacity-50"></div>
          
          {/* Details */}
          <div className="flex flex-row flex-wrap items-center gap-6 flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg flex items-center gap-2 font-headline whitespace-nowrap">
              <ShoppingCart className="text-cyan-400" size={20} />
              Resumen
            </h3>
            
            <div className="flex flex-row items-center gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-1.5">
                <Layers size={16} className="text-slate-500" />
                <span><strong className="text-white text-base">{models.reduce((t, m) => t + m.config.quantity, 0)}</strong> pz</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700"></div>
              <div className="flex items-center gap-1.5">
                <Scale size={16} className="text-slate-500" />
                <span><strong className="text-white text-base">{totals.weight.toFixed(0)}</strong> g</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700"></div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-slate-500" />
                <span><strong className="text-white text-base">{totals.time.toFixed(1)}</strong> h</span>
              </div>
            </div>
            
            <button
               onClick={() => {
                 if(confirm('¿Seguro quieres vacíar la bandeja por completo?')) setModels([]);
               }}
               className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap border-l border-slate-700/50 pl-4"
            >
               <X size={14} /> Vacíar
            </button>
          </div>

          {/* Action */}
          <div className="flex flex-col items-center gap-4 sm:gap-6 border-slate-700/50 pl-0 md:pl-6 md:border-l ml-auto flex-shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                 Total
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#4dbdcc] font-mono leading-none flex items-baseline justify-end">
                <span className="text-sm sm:text-base opacity-60 mr-1 font-sans">$</span>
                {Math.round(totals.price).toLocaleString('es-CO')}
              </div>
            </div>
            
            <button
              className="bg-[#4dbdcc] hover:bg-cyan-400 text-slate-900 px-5 py-3 rounded-xl font-bold text-sm sm:text-base transition-all shadow-[0_0_20px_rgba(77,189,204,0.15)] flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              Pagar <Zap size={18} className="fill-current border-transparent" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
