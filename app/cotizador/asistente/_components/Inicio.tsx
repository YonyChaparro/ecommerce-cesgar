import Orbe from '@/components/ia/Orbe';
import PieChat from './PieChat';
import Sugerencias from './Sugerencias';

/** Vista 2: orbe con aura, la promesa, la caja grande y las sugerencias. */
export default function Inicio({ caja, onSugerencia, ocupado }: {
  caja: React.ReactNode;
  onSugerencia: (texto: string) => void;
  ocupado: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-10 pb-10 pt-8 sm:pt-12">
      <div className="flex flex-col items-center gap-6 text-center">
        <Orbe tamano="lg" activo />
        <div className="flex flex-col gap-2.5">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">¿Qué pieza necesitas?</h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Cuéntame para qué la vas a usar. Te recomiendo material, te doy precios reales y nada entra a tu carrito sin que lo confirmes.
          </p>
        </div>
      </div>
      {caja}
      <Sugerencias onElegir={onSugerencia} deshabilitadas={ocupado} />
      <div className="mt-auto w-full border-t border-slate-200 pt-6">
        <PieChat variante="inicio" />
      </div>
    </div>
  );
}
