'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Package, LogOut, Home, Tag, BookOpen, ShoppingCart, Menu, X, Calculator, FileBox } from 'lucide-react';
import type { SessionPayload } from '@/lib/session';

const NAV = [
  { href: '/admin/products',    icon: Package,     label: 'Productos'   },
  { href: '/admin/categories',  icon: Tag,         label: 'Categorías'  },
  { href: '/admin/blog',        icon: BookOpen,    label: 'Blog'        },
  { href: '/admin/orders',      icon: ShoppingCart,label: 'Órdenes'     },
  { href: '/admin/cotizador',   icon: Calculator,  label: 'Cotizador'   },
  { href: '/admin/modelos',     icon: FileBox,     label: 'Modelos 3D'  },
  { href: '/',                  icon: Home,        label: 'Ver tienda'  },
];

type Props = {
  children: React.ReactNode;
  session: SessionPayload | null;
  logoutAction: () => Promise<void>;
};

export default function AdminShell({ children, session, logoutAction }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 w-60 shrink-0 bg-[#16234d] text-white flex flex-col',
          'transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:translate-x-0',
        ].join(' ')}
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logotipo-empresa-dark.png" alt="Cesgar" className="h-8 w-auto" />
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-headline">Panel Admin</p>
          </div>
          <button
            className="md:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-headline font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          {session && (
            <p className="text-xs text-slate-400 mb-3 truncate">{session.role}</p>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors w-full"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar solo en móvil */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#16234d] text-white shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="text-slate-300 hover:text-white"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logotipo-empresa-dark.png" alt="Cesgar" className="h-7 w-auto" />
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
