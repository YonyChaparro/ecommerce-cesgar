'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  X, RotateCcw, Grid3X3, Layers, ZoomIn, ZoomOut,
  Play, Pause, Box, SunMedium, Moon,
} from 'lucide-react';

type STLData = {
  dimensions: { x: number; y: number; z: number };
  volumeMm3: number;
};

type Props = {
  file: File;
  stlData?: STLData | null;
  onClose: () => void;
};

const VIEW_PRESETS: { label: string; pos: [number, number, number] }[] = [
  { label: 'Isométrica', pos: [1, 1, 1] },
  { label: 'Frente',     pos: [0, 0, 1] },
  { label: 'Atrás',      pos: [0, 0, -1] },
  { label: 'Derecha',    pos: [1, 0, 0] },
  { label: 'Izquierda',  pos: [-1, 0, 0] },
  { label: 'Arriba',     pos: [0, 1, 0.001] },
  { label: 'Abajo',      pos: [0, -1, 0.001] },
];

const THEMES = {
  dark:  { bg: 0x0a1020, grid1: 0x1a2a3a, grid2: 0x0d1a28, key: 0x4dbdcc },
  light: { bg: 0xf0f4f8, grid1: 0xaabbcc, grid2: 0xd0dde8, key: 0x0097a7 },
};

export default function STLViewerFull({ file, stlData, onClose }: Props) {
  const mountRef    = useRef<HTMLDivElement>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef     = useRef<THREE.Mesh | null>(null);
  const gridRef     = useRef<THREE.GridHelper | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);

  const [wireframe,  setWireframe]  = useState(false);
  const [grid,       setGrid]       = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [theme,      setTheme]      = useState<'dark' | 'light'>('dark');

  // ─── Three.js setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let animRafId: number;
    let cleanupFn: (() => void) | null = null;

    // Defer until the flex layout has given the div real dimensions
    const initRafId = requestAnimationFrame(() => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      const t = THEMES.dark;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(t.bg);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.001, 2000);
    camera.position.set(4, 3, 4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(t.key, 2.2);
    key.position.set(3, 5, 4);
    scene.add(key);
    keyLightRef.current = key;
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-3, -2, -3);
    scene.add(fill);

    // Grid
    const gridHelper = new THREE.GridHelper(12, 24, t.grid1, t.grid2);
    scene.add(gridHelper);
    gridRef.current = gridHelper;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.5;
    controls.enableZoom = true;
    controlsRef.current = controls;

    // Load STL
    const loader = new STLLoader();
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return;
      const geometry = loader.parse(e.target.result as ArrayBuffer);
      geometry.computeBoundingBox();
      geometry.center();

      const bbox = geometry.boundingBox!;
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const s = 3 / maxDim;
        geometry.scale(s, s, s);
      }

      const material = new THREE.MeshPhongMaterial({
        color: 0x4dbdcc,
        specular: 0x224455,
        shininess: 40,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      meshRef.current = mesh;

      // Place grid at model base
      const scaledBbox = new THREE.Box3().setFromObject(mesh);
      gridHelper.position.y = scaledBbox.min.y;

      // Fit camera to model
      const d = 4;
      camera.position.set(d, d * 0.7, d);
      controls.target.set(0, 0, 0);
      controls.update();
    };
      reader.readAsArrayBuffer(file);

      const animate = () => {
        animRafId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const ro = new ResizeObserver(() => {
        const nw = mount.clientWidth;
        const nh = mount.clientHeight;
        if (!nw || !nh) return;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      });
      ro.observe(mount);

      cleanupFn = () => {
        cancelAnimationFrame(animRafId);
        ro.disconnect();
        controls.dispose();
        renderer.dispose();
        meshRef.current?.geometry.dispose();
        (meshRef.current?.material as THREE.Material | undefined)?.dispose();
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      };
    }); // end requestAnimationFrame

    return () => {
      cancelAnimationFrame(initRafId);
      cleanupFn?.();
    };
  }, [file]);

  // ─── Reactive syncs ──────────────────────────────────────────────────────────
  useEffect(() => {
    const mat = meshRef.current?.material as THREE.MeshPhongMaterial | undefined;
    if (mat) mat.wireframe = wireframe;
  }, [wireframe]);

  useEffect(() => {
    if (gridRef.current) gridRef.current.visible = grid;
  }, [grid]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const t = THEMES[theme];
    if (sceneRef.current)  (sceneRef.current.background as THREE.Color).set(t.bg);
    if (keyLightRef.current) keyLightRef.current.color.set(t.key);
    if (gridRef.current) {
      (gridRef.current.material as THREE.LineBasicMaterial).color.set(t.grid1);
    }
  }, [theme]);

  // ─── Controls ────────────────────────────────────────────────────────────────
  const setView = useCallback((pos: [number, number, number]) => {
    const camera   = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const dist = camera.position.length();
    const n = new THREE.Vector3(...pos).normalize().multiplyScalar(dist);
    camera.position.copy(n);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }, []);

  const resetView = useCallback(() => {
    const camera   = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.set(4, 3, 4);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }, []);

  const zoom = useCallback((factor: number) => {
    const camera   = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.multiplyScalar(factor);
    controls.update();
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-99999 flex flex-col" style={{ background: '#0a1020' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-black/40 border-b border-white/10 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Box size={16} className="text-cyan-400 shrink-0" />
          <span className="text-white font-bold text-sm truncate">{file.name}</span>
          {stlData && (
            <span className="text-slate-500 text-xs hidden sm:block font-mono shrink-0">
              {stlData.dimensions.x} × {stlData.dimensions.y} × {stlData.dimensions.z} mm
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0">
          <X size={18} />
        </button>
      </div>

      {/* ── Canvas + sidebar ── */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div ref={mountRef} className="flex-1 cursor-grab active:cursor-grabbing" />

        {/* Right sidebar */}
        <div className="w-44 bg-black/30 border-l border-white/8 backdrop-blur-sm flex flex-col p-3 gap-0.5 overflow-y-auto shrink-0">

          <Section label="Vistas" />
          {VIEW_PRESETS.map((v) => (
            <SideBtn key={v.label} onClick={() => setView(v.pos)}>{v.label}</SideBtn>
          ))}

          <Divider />
          <Section label="Herramientas" />

          <SideBtn
            active={wireframe}
            icon={<Layers size={12} />}
            onClick={() => setWireframe(w => !w)}
          >Wireframe</SideBtn>

          <SideBtn
            active={grid}
            icon={<Grid3X3 size={12} />}
            onClick={() => setGrid(g => !g)}
          >Cuadrícula</SideBtn>

          <SideBtn
            active={autoRotate}
            icon={autoRotate ? <Pause size={12} /> : <Play size={12} />}
            onClick={() => setAutoRotate(r => !r)}
          >Auto-rotar</SideBtn>

          <SideBtn icon={<RotateCcw size={12} />} onClick={resetView}>
            Restablecer
          </SideBtn>

          <SideBtn
            icon={theme === 'dark' ? <SunMedium size={12} /> : <Moon size={12} />}
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          </SideBtn>

          <Divider />
          <Section label="Zoom" />

          <SideBtn icon={<ZoomIn size={12} />} onClick={() => zoom(0.75)}>Acercar</SideBtn>
          <SideBtn icon={<ZoomOut size={12} />} onClick={() => zoom(1.33)}>Alejar</SideBtn>

          {stlData && (
            <>
              <Divider />
              <Section label="Dimensiones" />
              <InfoRow label="X" value={`${stlData.dimensions.x} mm`} />
              <InfoRow label="Y" value={`${stlData.dimensions.y} mm`} />
              <InfoRow label="Z" value={`${stlData.dimensions.z} mm`} />
              <InfoRow label="Vol." value={`${(stlData.volumeMm3 / 1000).toFixed(2)} cm³`} />
            </>
          )}
        </div>
      </div>

      {/* ── Bottom hint ── */}
      <div className="text-center py-1.5 text-[10px] text-slate-600 bg-black/30 border-t border-white/5 shrink-0">
        Arrastrar → rotar &nbsp;·&nbsp; Scroll → zoom &nbsp;·&nbsp; Click derecho → mover
      </div>
    </div>,
    document.body
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Section({ label }: { label: string }) {
  return <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2 mb-0.5 px-1">{label}</p>;
}

function Divider() {
  return <div className="border-t border-white/8 my-1.5" />;
}

function SideBtn({
  children, onClick, active = false, icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1.5 rounded-lg transition-colors text-left font-medium flex items-center gap-2 w-full ${
        active
          ? 'bg-cyan-500/20 text-cyan-300'
          : 'text-slate-300 hover:text-white hover:bg-white/8'
      }`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-1 py-0.5">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className="text-[10px] text-slate-200 font-mono">{value}</span>
    </div>
  );
}
