'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendQuoteRequestEmail } from '@/lib/mailer';

const Schema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.email('Correo electrónico inválido'),
  phone: z.string().optional(),
  serviceType: z.string().min(1, 'Selecciona un tipo de servicio'),
  message: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  stlFiles: z.string().optional(),
  mediaFiles: z.string().optional(),
});

export type QuoteFormState =
  | { success: true }
  | { success: false; errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function submitQuoteRequest(
  _prev: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const parsed = Schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    serviceType: formData.get('serviceType'),
    message: formData.get('message'),
    stlFiles: formData.get('stlFiles'),
    mediaFiles: formData.get('mediaFiles'),
  });

  if (!parsed.success) {
    return { success: false, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { name, email, phone, serviceType, message, stlFiles, mediaFiles } = parsed.data;

  let stlParsed: { name: string; url: string }[] = [];
  let mediaParsed: { name: string; url: string; type: string }[] = [];
  try {
    if (stlFiles) stlParsed = JSON.parse(stlFiles);
    if (mediaFiles) mediaParsed = JSON.parse(mediaFiles);
  } catch { /* malformed JSON — treat as empty */ }

  const extra = JSON.stringify({ serviceType, stlFiles: stlParsed, mediaFiles: mediaParsed });

  try {
    await prisma.serviceInquiry.create({
      data: {
        service: 'cotizador-personalizado',
        name,
        email,
        phone: phone || null,
        message,
        extra,
      },
    });
  } catch {
    return { success: false, message: 'Error al enviar la solicitud. Inténtalo de nuevo.' };
  }

  sendQuoteRequestEmail({ name, email, phone, serviceType, message, stlFiles: stlParsed, mediaFiles: mediaParsed });

  return { success: true };
}
