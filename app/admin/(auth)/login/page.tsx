'use client';
import { useActionState } from 'react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logotipo-empresa-cesgar.webp" alt="Cesgar" className="h-12 w-auto" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-2xl font-headline font-bold text-[#16234d] mb-1">Panel admin</h1>
          <p className="text-slate-500 text-sm mb-6">Ingresa con tu cuenta de administrador.</p>

          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[#16234d] text-sm outline-none focus:border-[#4dbdcc] focus:ring-2 focus:ring-[#4dbdcc]/20 transition"
                placeholder="admin@cesgar.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[#16234d] text-sm outline-none focus:border-[#4dbdcc] focus:ring-2 focus:ring-[#4dbdcc]/20 transition"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <p className="text-red-500 text-sm font-medium">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-[#16234d] hover:bg-[#4dbdcc] text-white hover:text-[#16234d] font-headline font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {pending ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
