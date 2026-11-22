import { Check, Loader2 } from 'lucide-react';

/** Una ficha por tool usada, arriba del mensaje: "Midió tu archivo", "Calculando precio…". */
export default function FichaTool({ texto, enCurso }: { texto: string; enCurso: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
      {enCurso
        ? <Loader2 size={14} className="animate-spin text-ia-tinta motion-reduce:animate-none" aria-hidden="true" />
        : <Check size={14} className="text-primary" aria-hidden="true" />}
      {texto}
    </span>
  );
}
