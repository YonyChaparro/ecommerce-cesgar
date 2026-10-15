import { Fragment } from 'react';

// El agente escribe texto corto con **negrita** y, a veces, listas con "- ".
// No hace falta un parser de Markdown completo para eso.

function enLinea(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((trozo, i) =>
    trozo.startsWith('**') && trozo.endsWith('**') && trozo.length > 4
      ? <strong key={i} className="text-inverse-surface">{trozo.slice(2, -2)}</strong>
      : <Fragment key={i}>{trozo}</Fragment>,
  );
}

export default function TextoAsistente({ texto }: { texto: string }) {
  const bloques = texto.trim().split(/\n{2,}/);
  return (
    <>
      {bloques.map((bloque, i) => {
        const lineas = bloque.split('\n');
        if (lineas.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 text-base leading-relaxed text-slate-700">
              {lineas.map((l, j) => <li key={j}>{enLinea(l.replace(/^\s*([-*•]|\d+\.)\s+/, ''))}</li>)}
            </ul>
          );
        }
        return (
          <p key={i} className="text-base leading-relaxed text-slate-700">
            {lineas.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{enLinea(l)}</Fragment>)}
          </p>
        );
      })}
    </>
  );
}
