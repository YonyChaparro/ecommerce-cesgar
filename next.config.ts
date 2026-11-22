import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    // Evita que Turbopack infiera la raíz desde lockfiles de directorios superiores.
    root: path.resolve(import.meta.dirname),
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // El servidor de Hostinger reporta 63 CPU y Next lanza un worker por cada una: el
    // prerender agota el límite de hilos de la cuenta y la build muere (os error 11).
    cpus: 4,
  },
};

export default nextConfig;
