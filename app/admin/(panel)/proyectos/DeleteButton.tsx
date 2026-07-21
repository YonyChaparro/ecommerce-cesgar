'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteProject } from './actions';

export default function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return;
        start(() => deleteProject(id));
      }}
      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
      title="Eliminar"
    >
      <Trash2 size={15} />
    </button>
  );
}
