import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Eye } from 'lucide-react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pendiente',   cls: 'bg-yellow-100 text-yellow-700' },
  approved:   { label: 'Aprobado',    cls: 'bg-green-100 text-green-700' },
  in_process: { label: 'En proceso',  cls: 'bg-blue-100 text-blue-700' },
  rejected:   { label: 'Rechazado',   cls: 'bg-red-100 text-red-700' },
  cancelled:  { label: 'Cancelado',   cls: 'bg-slate-100 text-slate-500' },
};

const TYPE: Record<string, { label: string; cls: string }> = {
  product:   { label: 'Producto',     cls: 'bg-violet-100 text-violet-700' },
  cotizador: { label: 'Cotizador 3D', cls: 'bg-cyan-100 text-cyan-700' },
  mixed:     { label: 'Mixto',        cls: 'bg-orange-100 text-orange-700' },
};

export default async function AdminOrdersPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  const pending = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-headline font-bold text-[#16234d]">Órdenes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {orders.length} orden{orders.length !== 1 ? 'es' : ''}
            {pending > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                {pending} pendiente{pending !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-[#f8fafc]">
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">ID</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Fecha</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Ciudad</th>
              <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Total</th>
              <th className="text-center px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Tipo</th>
              <th className="text-center px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const st = STATUS[order.status] ?? STATUS.pending;
              const ty = TYPE[order.type] ?? TYPE.product;
              return (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-[#f8fafc] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                    {order.createdAt.toLocaleDateString('es-CO', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-[#16234d] truncate max-w-[180px]">
                      {order.shippingName ?? '—'}
                    </p>
                    {order.shippingEmail && (
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">
                        {order.shippingEmail}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                    {order.shippingCity
                      ? `${order.shippingCity}, ${order.shippingDepartment}`
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-[#16234d] whitespace-nowrap">
                    ${order.total.toLocaleString('es-CO')}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${ty.cls}`}>
                      {ty.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-[#16234d] hover:bg-slate-100 transition-colors inline-flex"
                    >
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-14 text-center text-slate-400">
                  Aún no hay órdenes registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
