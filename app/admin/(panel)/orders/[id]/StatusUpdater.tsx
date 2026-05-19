'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus } from '../actions';

const STATUSES = [
  { value: 'pending',    label: 'Pendiente' },
  { value: 'approved',   label: 'Aprobado' },
  { value: 'in_process', label: 'En proceso' },
  { value: 'rejected',   label: 'Rechazado' },
  { value: 'cancelled',  label: 'Cancelado' },
];

export function StatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateOrderStatus(orderId, status);
      setSaved(true);
    });
  }

  return (
    <div className="flex gap-2 items-center">
      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); setSaved(false); }}
        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-[#16234d] focus:outline-none focus:ring-2 focus:ring-[#4dbdcc]/40 bg-white"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={isPending || status === currentStatus}
        className="px-4 py-2 bg-[#16234d] hover:bg-[#4dbdcc] disabled:opacity-40 text-white hover:text-[#16234d] rounded-xl text-sm font-headline font-bold transition-all whitespace-nowrap"
      >
        {isPending ? 'Guardando…' : saved ? '✓ Guardado' : 'Actualizar'}
      </button>
    </div>
  );
}
