import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET);
const COOKIE = 'admin-session';
const DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionPayload = {
  userId: string;
  role: string;
  expiresAt: Date;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: string) {
  const expiresAt = new Date(Date.now() + DURATION_MS);
  const token = await encrypt({ userId, role, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  return decrypt(token);
}

/** Reads the raw cookie string — safe to use from Edge middleware */
export async function decryptFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return decrypt(match?.[1]);
}
