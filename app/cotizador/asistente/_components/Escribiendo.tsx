import Orbe from '@/components/ia/Orbe';

/** Los tres puntos antes del primer texto de la respuesta (vista 5). */
export default function Escribiendo() {
  return (
    <div className="flex items-center gap-3.5">
      <Orbe activo />
      <div role="status" aria-label="El asistente está escribiendo" className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-2.5">
        {['', '[animation-delay:.2s]', '[animation-delay:.4s]'].map((retraso) => (
          <span key={retraso} className={`punto-ia size-1.5 rounded-full bg-slate-500 ${retraso}`} />
        ))}
      </div>
    </div>
  );
}
