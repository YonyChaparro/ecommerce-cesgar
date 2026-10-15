const FILAS = [
  // Decisión 7: sin "una foto" mientras el chat no acepte fotos (fase 3).
  { pregunta: 'Qué necesitas', archivo: 'Un archivo .STL listo', asistente: 'Una idea o las medidas aproximadas' },
  { pregunta: 'Quién decide', archivo: 'Tú eliges material, calidad y relleno', asistente: 'El asistente te recomienda y tú confirmas' },
  { pregunta: 'Qué obtienes', archivo: 'Precio exacto y pago inmediato', asistente: 'Recomendación, precio y carrito, o un asesor si tu pieza lo requiere' },
];

const fila = 'grid grid-cols-1 sm:grid-cols-[minmax(8.75rem,0.6fr)_1fr_1fr]';

/** Tabla "¿Cuál elijo?". Se oculta con el asistente apagado: su tercera columna es el asistente. */
export default function ComparacionCaminos() {
  return (
    <section aria-label="Diferencias entre los dos caminos" className="mt-12 overflow-hidden rounded-2xl border border-slate-200">
      <div className={`${fila} border-b border-slate-200 bg-slate-50 text-sm font-bold uppercase tracking-wider text-slate-600`}>
        <span className="px-5 py-3.5">¿Cuál elijo?</span>
        <span className="hidden sm:block px-5 py-3.5 text-inverse-surface">Tengo mi archivo</span>
        <span className="hidden sm:block px-5 py-3.5 text-ia-tinta">Asistente con IA</span>
      </div>
      {FILAS.map((f, i) => (
        <div key={f.pregunta} className={`${fila} text-base leading-normal ${i < FILAS.length - 1 ? 'border-b border-slate-200' : ''}`}>
          <span className="px-5 pt-4 sm:py-4 font-bold">{f.pregunta}</span>
          <span className="px-5 py-2 sm:py-4 text-slate-700">
            <span className="sm:hidden text-xs font-bold uppercase tracking-wider text-inverse-surface">Tengo mi archivo · </span>
            {f.archivo}
          </span>
          <span className="px-5 pb-4 pt-2 sm:py-4 text-slate-700">
            <span className="sm:hidden text-xs font-bold uppercase tracking-wider text-ia-tinta">Asistente · </span>
            {f.asistente}
          </span>
        </div>
      ))}
    </section>
  );
}
