'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, Mail } from 'lucide-react';

const links = {
  tienda: [
    { label: 'Todos los productos', href: '/tienda' },
    { label: 'Repuestos impresoras 3D', href: '/tienda' },
    { label: 'Repuestos CNC', href: '/tienda' },
    { label: 'Resinas', href: '/tienda' },
  ],
  servicios: [
    { label: 'Impresión 3D', href: '#' },
    { label: 'Modelado 3D', href: '#' },
    { label: 'Escaneo 3D', href: '#' },
    { label: 'Mantenimiento', href: '#' },
  ],
  empresa: [
    { label: 'Inicio', href: '/' },
    { label: 'Proyectos', href: '#' },
    { label: 'Recursos', href: '#' },
    { label: 'Cotizar', href: '#' },
  ],
};

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="bg-inverse-surface text-white mt-auto">
      <div className="max-w-7xl mx-auto px-8 pt-16 pb-8">

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logotipo-empresa-dark.png" alt="Cesgar" className="h-9 w-auto mb-4" />
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Insumos, repuestos y servicios de impresión 3D industrial. Precisión y calidad para tus proyectos en Colombia.
            </p>
            <div className="flex gap-3">
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary-container flex items-center justify-center transition-colors">
                <IconInstagram />
              </a>
              <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary-container flex items-center justify-center transition-colors">
                <IconFacebook />
              </a>
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-primary-container mb-5">Tienda</h4>
            <ul className="space-y-3">
              {links.tienda.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-slate-300 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-primary-container mb-5">Servicios</h4>
            <ul className="space-y-3">
              {links.servicios.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-slate-300 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-primary-container mb-5">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-300 text-sm">
                <MapPin size={16} className="mt-0.5 shrink-0 text-primary-container" />
                Bogotá, Colombia
              </li>
              <li className="flex items-center gap-3 text-slate-300 text-sm">
                <Phone size={16} className="shrink-0 text-primary-container" />
                <a href="tel:+57" className="hover:text-white transition-colors">+57 (000) 000-0000</a>
              </li>
              <li className="flex items-center gap-3 text-slate-300 text-sm">
                <Mail size={16} className="shrink-0 text-primary-container" />
                <a href="mailto:info@cesgar.com.co" className="hover:text-white transition-colors">info@cesgar.com.co</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider + bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Cesgar. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            {links.empresa.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
