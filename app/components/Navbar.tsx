'use client';

import { useEffect, useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { User, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from './CartContext';

const CTA_LABELS = [
  'Cotización Instantánea',
  'Sin tiempos de espera',
  'Precio en segundos',
  'Cotiza sin registrarte',
  '¡Empieza ahora!',
];

const CTA_LABELS_SHORT = [
  '¡Cotizar!',
  'Sin esperas',
  'Precio ya',
  'Sin cuenta',
  '¡Ahora!',
];

const NAV_ITEMS = [
  { label: 'Inicio',         href: '/'                },
  { label: 'Tienda',         href: '/tienda'          },
  { label: 'Servicios',      href: '/servicios'       },
  { label: 'Sobre nosotros', href: '/sobre-nosotros'  },
  { label: 'Proyectos',      href: '/proyectos'       },
  { label: 'Blog',           href: '/blog'            },
];

export default function Navbar() {
  const { openCart, totalItems } = useCart();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [ctaIndex, setCtaIndex] = useState(0);
  const [ctaVisible, setCtaVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCtaVisible(false);
      setTimeout(() => {
        setCtaIndex((i) => (i + 1) % CTA_LABELS.length);
        setCtaVisible(true);
      }, 250);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Disclosure
      as="header"
      className={`fixed top-0 w-full z-50 bg-white transition-all duration-300 ${
        scrolled
          ? 'shadow-sm shadow-slate-200/60 border-b border-slate-100'
          : ''
      }`}
    >
      <div className="mx-auto max-w-screen-2xl px-6 sm:px-8">
        <div className="flex h-18 items-center gap-4">

          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logotipo-empresa-cesgar.webp"
              alt="Cesgar"
              className="h-11 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center justify-center gap-0.5 flex-1" aria-label="Principal">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-4 py-2 rounded-lg text-base font-headline font-semibold tracking-tight transition-all duration-200 ${
                    active
                      ? 'text-primary-container bg-primary-container/10'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-container"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">
            <Link
              href="/cotizador"
              className="inline-flex items-center justify-center overflow-hidden bg-primary-container text-white w-24 py-2 sm:w-auto sm:px-5 sm:py-2.5 rounded-full font-headline font-bold text-xs sm:text-sm tracking-wide hover:brightness-110 transition-all mr-1"
            >
              <span className={`transition-opacity duration-250 sm:hidden ${ctaVisible ? 'opacity-100' : 'opacity-0'}`}>
                {CTA_LABELS_SHORT[ctaIndex]}
              </span>
              {/* Todas las etiquetas apiladas en la misma celda: el ancho del
                  botón lo fija la más larga y deja de saltar al rotar */}
              <span className="hidden sm:grid">
                {CTA_LABELS.map((label, i) => (
                  <span
                    key={label}
                    aria-hidden={i !== ctaIndex}
                    className={`col-start-1 row-start-1 whitespace-nowrap text-center transition-opacity duration-250 ${
                      i === ctaIndex && ctaVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </span>
            </Link>

            <Link
              href="/admin/login"
              aria-label="Administrar"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <User size={21} />
            </Link>

            <button
              onClick={openCart}
              aria-label="Abrir carrito"
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <ShoppingCart size={21} />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-primary-container text-white text-[9px] font-bold min-w-3.5 h-3.5 rounded-full flex items-center justify-center px-0.5 leading-none">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Mobile hamburger */}
            <DisclosureButton className="group md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none">
              <span className="sr-only">Abrir menú</span>
              <Bars3Icon className="size-6 group-data-open:hidden" />
              <XMarkIcon className="size-6 hidden group-data-open:block" />
            </DisclosureButton>
          </div>

        </div>
      </div>

      {/* Mobile panel */}
      <DisclosurePanel className="md:hidden border-t border-slate-100 bg-white">
        <div className="px-4 pt-3 pb-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <DisclosureButton
                key={item.href}
                as="a"
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-headline font-semibold tracking-tight transition-colors ${
                  active
                    ? 'text-primary-container bg-primary-container/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    active ? 'bg-primary-container' : 'bg-slate-200'
                  }`}
                />
                {item.label}
              </DisclosureButton>
            );
          })}

        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
