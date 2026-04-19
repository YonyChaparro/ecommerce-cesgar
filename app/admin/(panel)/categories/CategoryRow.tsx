'use client';

import { useState, useTransition } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { renameCategory, deleteCategory } from './actions';

interface Props {
  name: string;
  count: number;
}

export default function CategoryRow({ name, count }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!value.trim() || value.trim() === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    startTransition(async () => {
      await renameCategory(name, value.trim());
      setEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm(`¿Mover todos los productos de "${name}" a "Sin categoría"?`)) return;
    startTransition(() => deleteCategory(name));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setEditing(false); setValue(name); }
  }

  return (
    <tr className={`border-b border-slate-50 transition-colors ${isPending ? 'opacity-50' : 'hover:bg-[#f8fafc]'}`}>
      <td className="px-5 py-3">
        {editing ? (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border border-[#4dbdcc] rounded-lg px-3 py-1.5 text-sm text-[#16234d] font-medium outline-none w-64"
          />
        ) : (
          <span className="font-medium text-[#16234d]">{name}</span>
        )}
      </td>
      <td className="px-5 py-3 text-slate-500 text-sm">
        {count} producto{count !== 1 ? 's' : ''}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                title="Guardar"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => { setEditing(false); setValue(name); }}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                title="Cancelar"
              >
                <X size={15} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-[#16234d] hover:bg-slate-100 transition-colors"
                title="Renombrar"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Eliminar categoría"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
