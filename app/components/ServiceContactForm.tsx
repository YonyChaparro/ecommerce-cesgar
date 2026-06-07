'use client';

import { useActionState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { submitServiceInquiry, type InquiryFormState } from '@/app/servicios/actions';

export interface ExtraField {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  options?: string[];
}

interface Props {
  service: string;
  serviceLabel: string;
  /** Full Tailwind color name: "orange" | "teal" | "purple" | "yellow" | "blue" */
  accent?: 'orange' | 'teal' | 'purple' | 'yellow' | 'blue';
  extraFields?: ExtraField[];
}

const ACCENTS = {
  orange: {
    focus: 'focus:border-orange-500 focus:ring-orange-500/20',
    button: 'bg-orange-500 hover:bg-orange-400',
    icon: 'text-orange-400',
    badge: 'bg-orange-500/10 text-orange-400',
    check: 'text-orange-400',
  },
  teal: {
    focus: 'focus:border-teal-500 focus:ring-teal-500/20',
    button: 'bg-teal-500 hover:bg-teal-400',
    icon: 'text-teal-400',
    badge: 'bg-teal-500/10 text-teal-400',
    check: 'text-teal-400',
  },
  purple: {
    focus: 'focus:border-purple-500 focus:ring-purple-500/20',
    button: 'bg-purple-500 hover:bg-purple-400',
    icon: 'text-purple-400',
    badge: 'bg-purple-500/10 text-purple-400',
    check: 'text-purple-400',
  },
  yellow: {
    focus: 'focus:border-yellow-500 focus:ring-yellow-500/20',
    button: 'bg-yellow-500 hover:bg-yellow-400',
    icon: 'text-yellow-400',
    badge: 'bg-yellow-500/10 text-yellow-400',
    check: 'text-yellow-400',
  },
  blue: {
    focus: 'focus:border-blue-500 focus:ring-blue-500/20',
    button: 'bg-blue-500 hover:bg-blue-400',
    icon: 'text-blue-400',
    badge: 'bg-blue-500/10 text-blue-400',
    check: 'text-blue-400',
  },
} satisfies Record<string, Record<string, string>>;

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  options,
  error,
  focusClass,
}: {
  label: string;
  name: string;
  type?: ExtraField['type'];
  placeholder?: string;
  required?: boolean;
  options?: string[];
  error?: string;
  focusClass: string;
}) {
  const base = `w-full bg-white/8 border border-white/10 text-white placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm ${focusClass} focus:ring-2 focus:outline-none transition-colors`;

  return (
    <div>
      <label className="block text-sm font-bold text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required={required}
          rows={4}
          className={`${base} resize-none`}
        />
      ) : type === 'select' ? (
        <select name={name} required={required} className={`${base} cursor-pointer`}>
          <option value="" disabled>Selecciona una opción...</option>
          {options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          className={base}
        />
      )}
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

export default function ServiceContactForm({
  service,
  serviceLabel,
  accent = 'orange',
  extraFields = [],
}: Props) {
  const colors = ACCENTS[accent];
  const [state, action, pending] = useActionState<InquiryFormState, FormData>(
    submitServiceInquiry,
    undefined,
  );

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-14">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${colors.badge}`}>
          <CheckCircle2 size={32} className={colors.check} />
        </div>
        <h3 className="font-headline font-bold text-white text-xl">¡Solicitud enviada!</h3>
        <p className="text-slate-400 max-w-xs">
          Recibimos tu mensaje. Te contactaremos en menos de 24 horas.
        </p>
      </div>
    );
  }

  const errors = state && !state.success ? state.errors : undefined;
  const serverMessage = state && !state.success ? state.message : undefined;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="service" value={service} />
      <input type="hidden" name="serviceLabel" value={serviceLabel} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          label="Nombre completo"
          name="name"
          placeholder="Tu nombre"
          required
          error={errors?.name?.[0]}
          focusClass={colors.focus}
        />
        <Field
          label="Correo electrónico"
          name="email"
          type="email"
          placeholder="tu@email.com"
          required
          error={errors?.email?.[0]}
          focusClass={colors.focus}
        />
      </div>

      <Field
        label="Teléfono / WhatsApp"
        name="phone"
        type="tel"
        placeholder="+57 300 000 0000"
        error={errors?.phone?.[0]}
        focusClass={colors.focus}
      />

      {extraFields.map((f) => (
        <Field
          key={f.name}
          label={f.label}
          name={f.name}
          type={f.type}
          placeholder={f.placeholder}
          required={f.required}
          options={f.options}
          error={errors?.[f.name]?.[0]}
          focusClass={colors.focus}
        />
      ))}

      <Field
        label="Descripción del problema o necesidad"
        name="message"
        type="textarea"
        placeholder="Describe con detalle lo que necesitas..."
        required
        error={errors?.message?.[0]}
        focusClass={colors.focus}
      />

      {serverMessage && (
        <p className="text-red-400 text-sm">{serverMessage}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`w-full flex items-center justify-center gap-2 ${colors.button} disabled:opacity-50 text-white px-6 py-4 rounded-xl font-headline font-bold text-sm tracking-wide transition-all active:scale-[.98]`}
      >
        {pending ? 'Enviando...' : 'Enviar solicitud'}
        <Send size={16} />
      </button>
    </form>
  );
}
