'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendServiceInquiryEmail } from '@/lib/mailer';

const BASE_FIELDS = ['service', 'serviceLabel', 'name', 'email', 'phone', 'message'];

const Schema = z.object({
  service: z.string().min(1),
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.email('Correo electrónico inválido'),
  phone: z.string().optional(),
  message: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
});

export type InquiryFormState =
  | { success: true }
  | { success: false; errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function submitServiceInquiry(
  _prev: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  const parsed = Schema.safeParse({
    service: formData.get('service'),
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const extra: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (!BASE_FIELDS.includes(key) && typeof value === 'string' && value.trim()) {
      extra[key] = value;
    }
  }

  const extraJson = Object.keys(extra).length > 0 ? JSON.stringify(extra) : null;

  try {
    await prisma.serviceInquiry.create({
      data: {
        service: parsed.data.service,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        message: parsed.data.message,
        extra: extraJson,
      },
    });
  } catch {
    return { success: false, message: 'Error al enviar la solicitud. Inténtalo de nuevo.' };
  }

  // Fire-and-forget — never block the response on email delivery
  sendServiceInquiryEmail({
    service: parsed.data.service,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    message: parsed.data.message,
    extra: extraJson,
  });

  return { success: true };
}
