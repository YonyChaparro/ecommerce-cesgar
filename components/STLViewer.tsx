'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Props = {
  file: File;
  className?: string;
};

export default function STLViewer({ file, className = '' }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1525);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0x4dbdcc, 2);
    key.position.set(2, 3, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-2, -1, -2);
    scene.add(fill);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.enableZoom = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;

    // Load STL from File
    const loader = new STLLoader();
    const reader = new FileReader();
    let mesh: THREE.Mesh | null = null;

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
        const s = 2.5 / maxDim;
        geometry.scale(s, s, s);
      }

      const material = new THREE.MeshPhongMaterial({
        color: 0x4dbdcc,
        specular: 0x224455,
        shininess: 40,
        side: THREE.DoubleSide,
      });

      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    };

    reader.readAsArrayBuffer(file);

    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      mesh?.geometry.dispose();
      (mesh?.material as THREE.Material | undefined)?.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [file]);

  return <div ref={mountRef} className={`w-full h-full ${className}`} />;
}
