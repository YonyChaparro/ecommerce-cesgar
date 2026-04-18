'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

/** Human-readable labels for known route segments. */
const SEGMENT_LABELS: Record<string, string> = {
  tienda: 'Tienda',
  servicios: 'Servicios',
  recursos: 'Recursos',
  cotizar: 'Cotizar',
  proyectos: 'Proyectos',
  'impresion-3d': 'Impresión 3D',
  'modelado-3d': 'Modelado 3D',
  'escaneo-3d': 'Escaneo 3D',
  mantenimiento: 'Mantenimiento',
  repuestos: 'Repuestos',
  filamentos: 'Filamentos',
  electronica: 'Electrónica',
  herramientas: 'Herramientas',
};

function labelFor(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

interface Crumb {
  label: string;
  href: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Hide on home page — no breadcrumb needed for the root.
  if (!pathname || pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);

  const crumbs: Crumb[] = [
    { label: 'Inicio', href: '/' },
    ...segments.map((seg, i) => ({
      label: labelFor(seg),
      href: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: crumb.href,
    })),
  };

  return (
    <>
      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label="Ruta de navegación"
        className="fixed top-16 inset-x-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-100"
      >
        <div className="max-w-screen-2xl mx-auto px-8 h-10 flex items-center">
          <ol className="flex items-center gap-1 text-sm min-w-0">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li key={crumb.href} className="flex items-center gap-1 min-w-0">
                  {i === 0 ? (
                    <Link
                      href={crumb.href}
                      className="text-slate-400 hover:text-[#4dbdcc] transition-colors flex items-center shrink-0"
                      aria-label="Inicio"
                    >
                      <Home size={14} />
                    </Link>
                  ) : isLast ? (
                    <span
                      className="text-[#16234d] font-medium truncate"
                      aria-current="page"
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-slate-500 hover:text-[#4dbdcc] transition-colors whitespace-nowrap"
                    >
                      {crumb.label}
                    </Link>
                  )}
                  {!isLast && (
                    <ChevronRight
                      size={14}
                      className="text-slate-300 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
