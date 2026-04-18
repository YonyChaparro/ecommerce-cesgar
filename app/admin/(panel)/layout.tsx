import Link from 'next/link';
import { getSession } from '@/lib/session';
import { logoutAction } from '../(auth)/login/actions';
import { Package, LogOut, Home } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#16234d] text-white flex flex-col">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logotipo-empresa-dark.png" alt="Cesgar" className="h-8 w-auto" />
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-headline">Panel Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-headline font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Package size={18} />
            Productos
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-headline font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Home size={18} />
            Ver tienda
          </Link>
        </nav>

        {/* User + logout */}
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

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
