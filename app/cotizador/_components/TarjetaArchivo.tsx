import { FileUp, Upload } from 'lucide-react';
import TarjetaCamino from './TarjetaCamino';

/** "Tengo mi archivo": el camino rápido al cotizador actual. */
export default function TarjetaArchivo() {
  return (
    <TarjetaCamino
      variante="archivo"
      href="/cotizador/modelo"
      encabezado={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-inverse-surface px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
            <FileUp size={14} aria-hidden="true" />
            Tengo mi archivo
          </span>
          <span className="text-sm font-semibold text-slate-600">Camino rápido</span>
        </div>
      }
      // Decisión 5: la zona de arrastre es un dibujo; la tarjeta entera es el enlace.
      ilustracion={
        <div className="flex h-46 flex-col items-center justify-center gap-3.5 rounded-2xl border-2 border-dashed border-slate-400 bg-slate-50 px-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-inverse-surface text-white">
            <Upload size={28} aria-hidden="true" />
          </span>
          <span className="text-sm text-slate-600">
            Arrastra tu archivo <strong className="text-inverse-surface">.STL</strong> o búscalo en tu equipo
          </span>
        </div>
      }
      titulo={<h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">Sube tu STL y obtén el precio al instante</h2>}
      texto="Tú configuras tecnología, material, calidad, relleno y cantidad. El precio se calcula sobre el volumen real de tu archivo."
      ventajas={[
        'Precio exacto, el mismo que pagas al finalizar',
        'Varios modelos en una misma compra',
        'Pago en línea y envío a todo Colombia',
      ]}
      boton="Subir mi STL"
    />
  );
}
