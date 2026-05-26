import { Printer, Wrench, ScanLine, PenTool, Hammer } from 'lucide-react';

export const SERVICES = [
  {
    icon: <Printer size={32} />,
    title: 'Cotizar al instante',
    desc: 'Sube tu archivo y genera una cotización inmediata para impresión 3D. Sin esperas, sin complicaciones.',
    cta: 'Subir STL y cotizar',
    iconColor: 'text-blue-400',
    image: '/cotizador 3D.png',
  },
  {
    icon: <Wrench size={32} />,
    title: 'Repuestos para tus impresoras',
    desc: 'Encuentra y cotiza boquillas, extrusores, correas, drivers y todo lo que necesitas para mantener tu impresora en marcha.',
    cta: 'Cotizar repuesto',
    iconColor: 'text-orange-400',
    image: '/repuestos-3D-bogota-colombia.webp',
    href: '/servicios/repuestos-impresoras',
  },
  {
    icon: <ScanLine size={32} />,
    title: 'Escaneo 3D',
    desc: 'Capturamos tu pieza u objeto con escáner de alta precisión y la convertimos en un modelo digital listo para producción o ingeniería inversa.',
    cta: 'Cotizar escaneo',
    iconColor: 'text-teal-400',
    image: '/scanner.png',
    href: '/servicios/escaneo-3d',
  },
  {
    icon: <PenTool size={32} />,
    title: 'Diseño 3D',
    desc: 'Nuestros ingenieros modelan tu idea desde cero o adaptan un diseño existente, entregando archivos optimizados para fabricación.',
    cta: 'Cotizar diseño',
    iconColor: 'text-purple-400',
    image: '/Diseno3D.png',
    href: '/servicios/diseno-3d',
  },
  {
    icon: <Hammer size={32} />,
    title: 'Prototipado y fabricación',
    desc: 'De la idea al objeto en el menor tiempo posible. Producimos prototipos funcionales y series cortas con materiales de ingeniería.',
    cta: 'Cotizar fabricación',
    iconColor: 'text-yellow-400',
    image: '/prototipado y fabricacion.jpg',
    href: '/servicios/prototipado-fabricacion',
  },
];
