import { NextRequest, NextResponse } from 'next/server';
import { decryptFromCookieHeader } from '@/lib/session';

const PUBLIC = ['/admin/login'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (PUBLIC.includes(pathname)) return NextResponse.next();

  const session = await decryptFromCookieHeader(req.headers.get('cookie'));

  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
