import { prisma } from '@/lib/prisma';
import CategoryRow from './CategoryRow';
import { Tag } from 'lucide-react';

export default async function AdminCategoriesPage() {
  const rows = await prisma.product.groupBy({
    by: ['category'],
    _count: { id: true },
    orderBy: { category: 'asc' },
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-headline font-bold text-[#16234d]">Categorías</h1>
          <p className="text-slate-500 text-sm mt-1">
            {rows.length} categoría{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#16234d]/5 flex items-center justify-center">
          <Tag size={20} className="text-[#16234d]" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-[#f8fafc]">
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                Nombre
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                Productos
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <CategoryRow
                key={row.category}
                name={row.category}
                count={row._count.id}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center text-slate-400">
                  No hay categorías todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Al eliminar una categoría, sus productos pasan a <strong>Sin categoría</strong>.
      </p>
    </div>
  );
}
