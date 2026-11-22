import { Info } from 'lucide-react';
import { LIMITES_TOPES } from '@/lib/asistente/tipos';
import { Campo, Card, inputCls } from '../../_ui';

export default function TopesConversacion({ maxTurnos, maxCaracteres, onTurnos, onCaracteres }: {
  maxTurnos: number;
  maxCaracteres: number;
  onTurnos: (v: number) => void;
  onCaracteres: (v: number) => void;
}) {
  const t = LIMITES_TOPES;
  return (
    <Card title="Topes por conversación">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Máx. turnos" htmlFor="max-turnos" hint="Al llegar, el chat ofrece seguir con un asesor.">
            <input
              id="max-turnos"
              type="number"
              min={t.maxTurnos.min}
              max={t.maxTurnos.max}
              value={maxTurnos}
              onChange={(e) => onTurnos(parseInt(e.target.value) || 0)}
              className={inputCls}
            />
          </Campo>
          <Campo label="Máx. caracteres por mensaje" htmlFor="max-caracteres" hint="El cliente ve el contador bajo la caja de texto.">
            <input
              id="max-caracteres"
              type="number"
              min={t.maxCaracteresMensaje.min}
              max={t.maxCaracteresMensaje.max}
              value={maxCaracteres}
              onChange={(e) => onCaracteres(parseInt(e.target.value) || 0)}
              className={inputCls}
            />
          </Campo>
        </div>
        <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          El tope de gasto se configura en la key de OpenRouter y es la última barrera de costo. El límite por IP se aplica
          en el servidor.
        </p>
      </div>
    </Card>
  );
}
