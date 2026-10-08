import { Printer, Wrench, ScanLine, PenTool, Hammer } from 'lucide-react';
import type { HomeContent, ServicioId } from '@/lib/home-content-types';

// Lo que no es texto de cada servicio. Los textos (título, descripción, botón)
// se editan en /admin/inicio y viven en lib/home-content-types.ts.
export const SERVICES: {
  id: ServicioId;
  icon: React.ReactNode;
  iconColor: string;
  image?: string;
  href?: string;
}[] = [
  {
    id: 'cotizador',
    icon: <Printer size={32} />,
    iconColor: 'text-blue-400',
    image: '/cotizador 3D.png',
  },
  {
    id: 'repuestos',
    icon: <Wrench size={32} />,
    iconColor: 'text-orange-400',
    image: '/repuestos-3D-bogota-colombia.webp',
    href: '/servicios/repuestos-impresoras',
  },
  {
    id: 'escaneo',
    icon: <ScanLine size={32} />,
    iconColor: 'text-teal-400',
    image: '/scanner.png',
    href: '/servicios/escaneo-3d',
  },
  {
    id: 'diseno',
    icon: <PenTool size={32} />,
    iconColor: 'text-purple-400',
    image: '/Diseno3D.png',
    href: '/servicios/diseno-3d',
  },
  {
    id: 'prototipado',
    icon: <Hammer size={32} />,
    iconColor: 'text-yellow-400',
    image: '/prototipado y fabricacion.jpg',
    href: '/servicios/prototipado-fabricacion',
  },
];

/** Cada servicio con sus textos vigentes. Lo usan el home y /servicios. */
export function serviciosConTextos(textos: HomeContent['servicios']) {
  return SERVICES.map((s) => ({ ...s, ...textos[s.id] }));
}
