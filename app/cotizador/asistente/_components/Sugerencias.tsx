'use client';

const SUGERENCIAS = [
  '¿Qué material aguanta humedad y peso?',
  'Tengo una idea, pero no el archivo',
  'Repuestos para mi impresora 3D',
  'Pieza de más de 30 cm',
];

/** Se envían como primer mensaje del cliente (vista 2). */
export default function Sugerencias({ onElegir, deshabilitadas }: { onElegir: (texto: string) => void; deshabilitadas: boolean }) {
  return (
    <div className="flex w-full flex-col items-center gap-3.5">
      <span className="text-sm font-semibold text-slate-500">O empieza con una de estas</span>
      <div className="flex flex-wrap justify-center gap-2.5">
        {SUGERENCIAS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={deshabilitadas}
            onClick={() => onElegir(s)}
            className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4.5 text-sm text-inverse-surface transition-colors hover:border-ia-violeta hover:bg-ia-niebla disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
