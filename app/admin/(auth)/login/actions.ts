'use server';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Completa todos los campos.' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: 'Credenciales incorrectas.' };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: 'Credenciales incorrectas.' };
  }

  await createSession(user.id, user.role);
  redirect('/admin/products');
}

export async function logoutAction() {
  const { deleteSession } = await import('@/lib/session');
  await deleteSession();
  redirect('/admin/login');
}
