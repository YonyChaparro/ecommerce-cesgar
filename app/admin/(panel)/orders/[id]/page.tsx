import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Box, Package, User, MapPin, Phone, Mail, CreditCard, Download } from 'lucide-react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { StatusUpdater } from './StatusUpdater';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-700' },
  approved:   { label: 'Aprobado',   cls: 'bg-green-100 text-green-700' },
  in_process: { label: 'En proceso', cls: 'bg-blue-100 text-blue-700' },
  rejected:   { label: 'Rechazado',  cls: 'bg-red-100 text-red-700' },
  cancelled:  { label: 'Cancelado',  cls: 'bg-slate-100 text-slate-500' },
};

const TYPE: Record<string, { label: string; cls: string }> = {
  product:   { label: 'Producto',     cls: 'bg-violet-100 text-violet-700' },
  cotizador: { label: 'Cotizador 3D', cls: 'bg-cyan-100 text-cyan-700' },
  mixed:     { label: 'Mixto',        cls: 'bg-orange-100 text-orange-700' },
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-400 w-24 sm:w-36 shrink-0">{label}</span>
      <span className="text-inverse-surface font-medium wrap-break-word min-w-0">{value}</span>
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  const st = STATUS[order.status] ?? STATUS.pending;
  const ty = TYPE[order.type] ?? TYPE.product;

  const productItems   = order.items.filter((i) => i.itemType === 'product');
  const cotizadorItems = order.items.filter((i) => i.itemType === 'cotizador');

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 sm:mb-8">
        <Link
          href="/admin/orders"
          className="p-2 rounded-lg text-slate-400 hover:text-inverse-surface hover:bg-slate-100 transition-colors mt-0.5"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-headline font-bold text-inverse-surface">
              Orden #{order.id.slice(-8).toUpperCase()}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${ty.cls}`}>{ty.label}</span>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${st.cls}`}>{st.label}</span>
          </div>
          <p className="text-slate-400 text-sm">
            {order.createdAt.toLocaleDateString('es-CO', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
            {' · '}
            {order.createdAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Items ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Productos */}
          {productItems.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 sm:px-6 py-4 border-b border-slate-50">
                <Package size={15} className="text-slate-400" />
                <h2 className="font-headline font-bold text-inverse-surface text-sm">
                  Productos ({productItems.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-50">
                {productItems.map((item) => (
                  <div key={item.id} className="px-4 sm:px-6 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {item.category && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                          {item.category}
                        </p>
                      )}
                      <p className="font-medium text-inverse-surface text-sm leading-snug">{item.name}</p>
                      {item.slug && (
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.slug}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-inverse-surface">
                        ${(item.price * item.quantity).toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs text-slate-400">
                        ${item.price.toLocaleString('es-CO')} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Cotizador 3D */}
          {cotizadorItems.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 sm:px-6 py-4 border-b border-slate-50">
                <Box size={15} className="text-cyan-500" />
                <h2 className="font-headline font-bold text-inverse-surface text-sm">
                  Impresiones 3D ({cotizadorItems.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-50">
                {cotizadorItems.map((item) => (
                  <div key={item.id} className="px-4 sm:px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-inverse-surface text-sm leading-snug">{item.name}</p>
                        {item.note && (
                          <p className="mt-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 font-mono leading-relaxed">
                            {item.note}
                          </p>
                        )}
                        {item.modelUrl ? (
                          <a
                            href={item.modelUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300 transition-colors text-xs font-bold"
                          >
                            <Download size={13} />
                            Descargar modelo STL
                          </a>
                        ) : (
                          <p className="mt-2 text-[11px] text-slate-400 italic">Sin modelo adjunto</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-inverse-surface">
                          ${(item.price * item.quantity).toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs text-slate-400">
                          ${item.price.toLocaleString('es-CO')} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Total */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 sm:px-6 py-4 flex justify-between items-center">
            <span className="font-headline font-bold text-slate-500">Total pagado</span>
            <span className="font-headline font-bold text-xl text-inverse-surface">
              ${order.total.toLocaleString('es-CO')}
            </span>
          </div>

          {/* IDs técnicos */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 sm:px-6 py-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Referencias</h3>
            <Row label="ID orden" value={order.id} />
            <Row label="ID preferencia MP" value={order.preferenceId} />
            <Row label="ID pago MP" value={order.paymentId} />
          </section>
        </div>

        {/* ── RIGHT: Estado + Cliente + Envío ── */}
        <div className="space-y-5">

          {/* Estado */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Estado de la orden</h3>
            <StatusUpdater orderId={order.id} currentStatus={order.status} />
          </section>

          {/* Datos del cliente */}
          {(order.shippingName || order.shippingEmail || order.shippingPhone) && (
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={14} className="text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Destinatario</h3>
              </div>
              <div className="space-y-2.5">
                <Row label="Nombre" value={order.shippingName} />
                {(order.shippingDocType || order.shippingDocNumber) && (
                  <div className="flex gap-2 text-sm">
                    <span className="text-slate-400 w-36 shrink-0">Documento</span>
                    <span className="text-inverse-surface font-medium">
                      {order.shippingDocType} {order.shippingDocNumber}
                    </span>
                  </div>
                )}
                {order.shippingEmail && (
                  <div className="flex gap-2 text-sm items-center">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <a
                      href={`mailto:${order.shippingEmail}`}
                      className="text-inverse-surface font-medium hover:text-primary-container transition-colors truncate"
                    >
                      {order.shippingEmail}
                    </a>
                  </div>
                )}
                {order.shippingPhone && (
                  <div className="flex gap-2 text-sm items-center">
                    <Phone size={12} className="text-slate-400 shrink-0" />
                    <a
                      href={`tel:${order.shippingPhone}`}
                      className="text-inverse-surface font-medium hover:text-primary-container transition-colors"
                    >
                      {order.shippingPhone}
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Dirección de envío */}
          {order.shippingAddress && (
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={14} className="text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Envío</h3>
              </div>
              <div className="space-y-2.5">
                <Row label="Dirección"      value={order.shippingAddress} />
                <Row label="Barrio"         value={order.shippingNeighborhood} />
                <Row label="Info adicional" value={order.shippingAddressExtra} />
                <Row
                  label="Ciudad"
                  value={[order.shippingCity, order.shippingDepartment].filter(Boolean).join(', ') || null}
                />
                <Row label="Código postal"  value={order.shippingPostalCode} />
                <Row label="Instrucciones"  value={order.shippingInstructions} />
              </div>
            </section>
          )}

          {/* Sin datos de envío */}
          {!order.shippingName && !order.shippingAddress && (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 text-center">
              <CreditCard size={20} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Sin datos de envío registrados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
