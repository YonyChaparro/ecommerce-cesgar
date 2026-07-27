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
};

export default nextConfig;
