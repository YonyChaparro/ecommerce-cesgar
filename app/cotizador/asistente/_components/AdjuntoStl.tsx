import { FileBox, X } from 'lucide-react';
import Orbe from '@/components/ia/Orbe';
import { medidasMm, tamanoArchivo, volumenCm3 } from '@/lib/formato';
import type { EstadoSubida } from '../_hooks/useSubidaStl';
import Aviso from './Aviso';

/**
 * Ficha del archivo con los estados de subida de la vista 5. Solo recibe props:
 * el estado vive en useSubidaStl.
 */
export default function AdjuntoStl({ estado, onQuitar, onAsesor }: {
  estado: Exclude<EstadoSubida, { fase: 'inactivo' }>;
  onQuitar: () => void;
  onAsesor: () => void;
}) {
  if (estado.fase === 'error') {
    return (
      <Aviso
        tono="error"
        titulo={estado.titulo}
        texto={estado.texto}
        accion={<button type="button" onClick={onQuitar} className="text-sm font-bold text-primary hover:underline">Elegir otro archivo</button>}
      />
    );
  }

  const subtitulo =
    estado.fase === 'subiendo' ? `Subiendo… ${estado.progreso} %`
    : estado.fase === 'midiendo' ? 'Midiendo volumen y medidas…'
    : `${medidasMm(estado.archivo.medidasMm)} · ${volumenCm3(estado.archivo.volumenCm3)} · ${tamanoArchivo(estado.bytes)}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5">
        {estado.fase === 'midiendo'
          ? <Orbe activo />
          : <FileBox size={22} className="shrink-0 text-ia-tinta" aria-hidden="true" />}
        <div className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-sm">{estado.nombre}</strong>
          <span className="text-xs text-slate-500" aria-live="polite">{subtitulo}</span>
        </div>
        <button
          type="button"
          onClick={onQuitar}
          aria-label={estado.fase === 'listo' ? 'Quitar archivo' : 'Cancelar subida'}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <X size={16} />
        </button>
      </div>
      {estado.fase === 'subiendo' && (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          {/* El ancho cambia en vivo: es el único estilo en línea permitido (§6.1). */}
          <div className="degradado-ia h-full rounded-full transition-[width]" style={{ width: `${estado.progreso}%` }} />
        </div>
      )}
      {estado.fase === 'listo' && <AvisosArchivo archivo={estado.archivo} onAsesor={onAsesor} />}
    </div>
  );
}

function AvisosArchivo({ archivo, onAsesor }: { archivo: Extract<EstadoSubida, { fase: 'listo' }>['archivo']; onAsesor: () => void }) {
  const asesor = <button type="button" onClick={onAsesor} className="text-sm font-bold text-primary hover:underline">Hablar con un asesor</button>;
  return (
    <>
      {archivo.geometria !== 'solid' && (
        <Aviso
          tono="advertencia"
          titulo={archivo.geometria === 'hollow' ? 'Pieza hueca' : 'Pieza laminar'}
          texto="El relleno queda fijo en 100 % para que la pieza no se debilite. El precio ya lo incluye."
        />
      )}
      {archivo.grande && (
        <Aviso
          tono="advertencia"
          titulo="Mide más de 30 cm"
          texto={`Su lado más largo mide ${archivo.ladoMayorCm.toLocaleString('es-CO')} cm. Un asesor puede revisar si se imprime por partes.`}
          accion={asesor}
        />
      )}
      {archivo.volumenNoFiable && (
        <Aviso
          tono="advertencia"
          titulo="No pudimos medir el volumen con seguridad"
          texto="La malla parece tener huecos o caras abiertas. Revisa el archivo o habla con un asesor antes de comprar."
          accion={asesor}
        />
      )}
    </>
  );
}
