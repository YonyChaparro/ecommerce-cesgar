'use client';

import { useEffect, useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { User, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from './CartContext';

const NAV_ITEMS = [
  { label: 'Inicio',    href: '/'          },
  { label: 'Tienda',   href: '/tienda'     },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Blog',     href: '/blog'       },
];

export default function Navbar() {
  const { openCart, totalItems } = useCart();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Disclosure
      as="header"
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/92 backdrop-blur-md shadow-sm shadow-slate-200/60 border-b border-slate-100'
          : 'bg-white/70 backdrop-blur-sm'
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
          <nav className="hidden md:flex items-center gap-0.5 flex-1" aria-label="Principal">
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
              className="hidden sm:inline-flex items-center bg-primary-container text-white px-5 py-2.5 rounded-full font-headline font-bold text-sm tracking-wide hover:brightness-110 transition-all whitespace-nowrap mr-1"
            >
              COTIZA AHORA
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
      <DisclosurePanel className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md">
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

          <div className="pt-3 mt-3 border-t border-slate-100">
            <a
              href="/cotizador"
              className="flex items-center justify-center w-full bg-primary-container text-white px-5 py-3 rounded-xl font-headline font-bold text-sm tracking-wide hover:opacity-90 transition-opacity"
            >
              COTIZA AHORA
            </a>
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
