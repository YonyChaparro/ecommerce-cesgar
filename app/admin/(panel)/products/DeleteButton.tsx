'use client';
import { Trash2 } from 'lucide-react';

export default function DeleteButton({
  productId,
  productName,
  action,
}: {
  productId: string;
  productName: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        onClick={(e) => {
          if (!confirm(`¿Eliminar "${productName}"?`)) e.preventDefault();
        }}
      >
        <Trash2 size={15} />
      </button>
    </form>
  );
}
