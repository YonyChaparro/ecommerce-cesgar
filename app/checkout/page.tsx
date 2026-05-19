'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LockKeyhole, Box, MapPin, User, Home, Info, FileText } from 'lucide-react';
import { useCart } from '@/app/components/CartContext';
import { COLOMBIA } from '@/app/data/colombia';

const DOC_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'NIT', label: 'NIT (Empresa)' },
  { value: 'PP', label: 'Pasaporte' },
];

interface ShippingForm {
  name: string;
  email: string;
  docType: string;
  docNumber: string;
  phone: string;
  address: string;
  neighborhood: string;
  addressExtra: string;
  department: string;
  city: string;
  postalCode: string;
  instructions: string;
}

const EMPTY: ShippingForm = {
  name: '',
  email: '',
  docType: 'CC',
  docNumber: '',
  phone: '',
  address: '',
  neighborhood: '',
  addressExtra: '',
  department: '',
  city: '',
  postalCode: '',
  instructions: '',
};

export default function CheckoutPage() {
  const { items, clearCart, totalPrice } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<ShippingForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) router.replace('/carrito');
  }, [items.length, router]);

  const cities = useMemo(
    () => COLOMBIA.find((d) => d.name === form.department)?.cities ?? [],
    [form.department],
  );

  function setField(key: keyof ShippingForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'department' ? { city: '' } : {}),
    }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof ShippingForm, string>> = {};
    if (!form.name.trim()) e.name = 'Requerido';
    if (!form.email.trim()) e.email = 'Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo inválido';
    if (!form.docType) e.docType = 'Requerido';
    if (!form.docNumber.trim()) e.docNumber = 'Requerido';
    else if (!/^[\d\-A-Za-z]{4,20}$/.test(form.docNumber.trim())) e.docNumber = 'Número inválido';
    if (!form.phone.trim()) e.phone = 'Requerido';
    else if (!/^\d{7,10}$/.test(form.phone.replace(/[\s-]/g, ''))) e.phone = 'Número inválido (7–10 dígitos)';
    if (!form.address.trim()) e.address = 'Requerido';
    if (!form.department) e.department = 'Selecciona un departamento';
    if (!form.city) e.city = 'Selecciona una ciudad';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            ...(i.id.startsWith('cotizador-')
              ? { name: i.name, price: i.price, note: i.note ?? i.alt ?? '', modelUrl: i.modelUrl }
              : {}),
          })),
          shipping: {
            name: form.name.trim(),
            email: form.email.trim(),
            docType: form.docType,
            docNumber: form.docNumber.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            neighborhood: form.neighborhood.trim() || undefined,
            addressExtra: form.addressExtra.trim() || undefined,
            department: form.department,
            city: form.city,
            postalCode: form.postalCode.trim() || undefined,
            instructions: form.instructions.trim() || undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error ?? 'Error al procesar el pago');
        return;
      }

      clearCart();
      window.location.href = data.url;
    } catch {
      setServerError('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) return null;

  const inp = (err?: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm text-inverse-surface bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all${err ? ' border-red-300 bg-red-50' : ' border-slate-200'}`;

  const lbl = 'block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5';

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <Link href="/carrito" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Paso 2 de 2</p>
            <h1 className="font-headline font-bold text-2xl text-inverse-surface leading-tight">
              Datos de envío
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── FORMULARIO ── */}
            <div className="lg:col-span-3 space-y-5">

              {/* Datos del destinatario */}
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-5">
                  <User size={15} className="text-slate-400" />
                  <h2 className="font-headline font-bold text-inverse-surface">Datos del destinatario</h2>
                </div>

                {/* Nombre */}
                <div className="mb-4">
                  <label className={lbl}>Nombres y apellidos *</label>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Ej. Juan Pérez García"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className={inp(errors.name)}
                  />
                  <FieldError msg={errors.name} />
                </div>

                {/* Correo */}
                <div className="mb-4">
                  <label className={lbl}>Correo electrónico *</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="Ej. juan@correo.com"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className={inp(errors.email)}
                  />
                  <FieldError msg={errors.email} />
                  <p className="text-xs text-slate-400 mt-1">Para envío de guía y notificaciones de entrega.</p>
                </div>

                {/* Documento */}
                <div className="grid grid-cols-5 gap-3 mb-4">
                  <div className="col-span-2">
                    <label className={lbl}>Tipo doc. *</label>
                    <select
                      value={form.docType}
                      onChange={(e) => setField('docType', e.target.value)}
                      className={inp(errors.docType)}
                    >
                      {DOC_TYPES.map((d) => (
                        <option key={d.value} value={d.value}>{d.value}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.docType} />
                  </div>
                  <div className="col-span-3">
                    <label className={lbl}>Número de documento *</label>
                    <input
                      type="text"
                      placeholder="Ej. 1020304050"
                      value={form.docNumber}
                      onChange={(e) => setField('docNumber', e.target.value)}
                      className={inp(errors.docNumber)}
                    />
                    <FieldError msg={errors.docNumber} />
                  </div>
                </div>
                <p className="text-xs text-slate-400 -mt-2 mb-4">
                  Exigido por normatividad postal (CRC) para identificar al destinatario.
                </p>

                {/* Teléfono */}
                <div>
                  <label className={lbl}>Teléfono celular *</label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder="Ej. 3001234567"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    className={inp(errors.phone)}
                  />
                  <FieldError msg={errors.phone} />
                  <p className="text-xs text-slate-400 mt-1">La transportadora lo contactará en caso de novedad.</p>
                </div>
              </section>

              {/* Dirección de entrega */}
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-5">
                  <Home size={15} className="text-slate-400" />
                  <h2 className="font-headline font-bold text-inverse-surface">Dirección de entrega</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Nomenclatura exacta *</label>
                    <input
                      type="text"
                      autoComplete="street-address"
                      placeholder="Ej. Calle 45 # 23-10"
                      value={form.address}
                      onChange={(e) => setField('address', e.target.value)}
                      className={inp(errors.address)}
                    />
                    <FieldError msg={errors.address} />
                  </div>

                  <div>
                    <label className={lbl}>Barrio / Localidad</label>
                    <input
                      type="text"
                      placeholder="Ej. Barrio Las Mercedes, Localidad Suba"
                      value={form.neighborhood}
                      onChange={(e) => setField('neighborhood', e.target.value)}
                      className={inp()}
                    />
                  </div>

                  <div>
                    <label className={lbl}>
                      Apto · Torre · Conjunto · Edificio{' '}
                      <span className="normal-case font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Apto 302, Torre B, Conjunto Los Álamos"
                      value={form.addressExtra}
                      onChange={(e) => setField('addressExtra', e.target.value)}
                      className={inp()}
                    />
                  </div>
                </div>
              </section>

              {/* Ubicación geográfica */}
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-5">
                  <MapPin size={15} className="text-slate-400" />
                  <h2 className="font-headline font-bold text-inverse-surface">Ubicación geográfica</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Departamento *</label>
                    <select
                      value={form.department}
                      onChange={(e) => setField('department', e.target.value)}
                      className={inp(errors.department)}
                    >
                      <option value="">Selecciona un departamento</option>
                      {COLOMBIA.map((d) => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.department} />
                  </div>

                  <div>
                    <label className={lbl}>Ciudad / Municipio *</label>
                    <select
                      value={form.city}
                      onChange={(e) => setField('city', e.target.value)}
                      disabled={cities.length === 0}
                      className={inp(errors.city) + (cities.length === 0 ? ' opacity-50 cursor-not-allowed' : '')}
                    >
                      <option value="">
                        {cities.length === 0 ? 'Primero selecciona un departamento' : 'Selecciona una ciudad'}
                      </option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.city} />
                  </div>

                  <div>
                    <label className={lbl}>
                      Código postal{' '}
                      <span className="normal-case font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      autoComplete="postal-code"
                      placeholder="Ej. 110111"
                      value={form.postalCode}
                      onChange={(e) => setField('postalCode', e.target.value)}
                      className={inp()}
                    />
                  </div>
                </div>
              </section>

              {/* Instrucciones */}
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-5">
                  <Info size={15} className="text-slate-400" />
                  <h2 className="font-headline font-bold text-inverse-surface">
                    Instrucciones de entrega{' '}
                    <span className="text-slate-400 font-normal text-sm">(opcional)</span>
                  </h2>
                </div>
                <textarea
                  placeholder='Ej. "Dejar en portería." · "Solo disponible lunes a viernes 8am–5pm." · "Frente al parque principal."'
                  value={form.instructions}
                  onChange={(e) => setField('instructions', e.target.value)}
                  rows={3}
                  className={`${inp()} resize-none`}
                />
              </section>

              {/* Nota normativa */}
              <div className="flex gap-2 items-start text-xs text-slate-400 px-1">
                <FileText size={14} className="shrink-0 mt-0.5" />
                <p>
                  Los datos de identificación son requeridos por las transportadoras colombianas
                  (Servientrega, Coordinadora, Interrapidísimo, etc.) según normativa de la CRC.
                </p>
              </div>
            </div>

            {/* ── RESUMEN ── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-6">
                <h2 className="font-headline font-bold text-inverse-surface text-lg mb-5">
                  Resumen del pedido
                </h2>

                <div className="space-y-3 mb-5">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-start">
                      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.id.startsWith('cotizador-') ? (
                          <Box size={20} className="text-cyan-400" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.img}
                            alt={item.alt || item.name}
                            className="w-full h-full object-contain p-1"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-inverse-surface line-clamp-2 leading-tight">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.category} · x{item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-inverse-surface shrink-0">
                        ${(item.price * item.quantity).toLocaleString('es-CO')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2 mb-5">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-inverse-surface">
                      ${totalPrice.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Envío</span>
                    <span className="text-xs italic">A confirmar</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-headline font-bold text-slate-500">Total</span>
                    <span className="font-headline font-bold text-xl text-inverse-surface">
                      ${totalPrice.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                {serverError && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">
                    {serverError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#009ee3] hover:bg-[#007eb5] disabled:opacity-60 text-white rounded-xl font-headline font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-pulse">Procesando...</span>
                  ) : (
                    <>
                      <LockKeyhole size={16} />
                      Ir a pagar con MercadoPago
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 mt-3">
                  Pago seguro procesado por MercadoPago.
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </main>
  );
}
