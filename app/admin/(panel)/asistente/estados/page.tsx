import CabeceraAsistente from '../_components/CabeceraAsistente';
import GaleriaEstados from './GaleriaEstados';

// Fase 1 (opcional): cada tarjeta y aviso del chat con datos de ejemplo, como el
// tablero 5, para revisar los estados difíciles de provocar.
export default function EstadosAsistentePage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl space-y-5">
        <CabeceraAsistente
          pestana="estados"
          descripcion="Cada tarjeta y aviso del chat con datos de ejemplo. Los botones no hacen nada aquí."
        />
        <GaleriaEstados />
      </div>
    </div>
  );
}
