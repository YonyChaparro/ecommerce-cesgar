'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Heart, User, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from './CartContext';

const navigation = [
  { name: 'Inicio', href: '/', current: true },
  { name: 'Tienda', href: '/tienda', current: false },
  { name: 'Servicios', href: '#', current: false },
  { name: 'Blog', href: '/blog', current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const { openCart, totalItems } = useCart();
  return (
    <Disclosure as="nav" className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="mx-auto max-w-screen-2xl px-8">
        <div className="relative flex h-16 items-center justify-between">

          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center md:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-primary-container focus:outline-none">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Abrir menú</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div>

          {/* Logo + desktop links */}
          <div className="flex flex-1 items-center justify-center md:items-stretch md:justify-start">
            <div className="flex shrink-0 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logotipo-empresa-cesgar.webp" alt="Cesgar" className="h-10 w-auto object-contain" />
            </div>
            <div className="hidden md:ml-8 md:flex md:items-center md:gap-6">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current={item.current ? 'page' : undefined}
                  className={classNames(
                    item.current
                      ? 'text-primary-container font-bold border-b-2 border-primary-container'
                      : 'text-slate-600 hover:text-primary-container',
                    'font-headline tracking-tight transition-colors text-sm py-1',
                  )}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* Right side: CTA + icons */}
          <div className="absolute inset-y-0 right-0 flex items-center gap-4 md:static md:inset-auto md:ml-6">
            <button
              type="button"
              className="bg-primary-container text-white px-5 py-2 rounded-full font-headline font-bold text-sm hover:opacity-90 transition-opacity"
            >
              COTIZA AHORA
            </button>
            <div className="flex items-center gap-2 text-slate-600">
              <Heart size={22} className="cursor-pointer hover:text-primary-container transition-colors" />
              <Link href="/admin/login" aria-label="Administrar"><User size={22} className="hover:text-primary-container transition-colors" /></Link>
              <button onClick={openCart} className="relative cursor-pointer hover:text-primary-container transition-colors" aria-label="Abrir carrito">
                <ShoppingCart size={22} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-container text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile panel */}
      <DisclosurePanel className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="space-y-1 px-4 pt-2 pb-4">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={classNames(
                item.current
                  ? 'text-primary-container font-bold bg-primary-container/5'
                  : 'text-slate-600 hover:text-primary-container hover:bg-slate-50',
                'block rounded-md px-3 py-2 text-base font-headline tracking-tight transition-colors',
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
          <div className="pt-3">
            <button
              type="button"
              className="w-full bg-primary-container text-white px-5 py-2.5 rounded-full font-headline font-bold text-sm hover:opacity-90 transition-opacity"
            >
              COTIZA AHORA
            </button>
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
