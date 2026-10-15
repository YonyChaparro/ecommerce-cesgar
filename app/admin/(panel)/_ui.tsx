// Piezas compartidas por los formularios del panel. Cotizador, Envíos e Inicio
// tienen todavía su propia copia; el Asistente ya usa esta.

export const inputCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-shadow';

export function Card({ title, desc, aside, children, id }: {
  title: string;
  desc?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h2>
          {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
        </div>
        {aside}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Campo({ label, hint, htmlFor, children }: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
