import { auth } from '@/lib/auth/edge-config';
import { NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/favorites', '/alerts', '/garage'];
const PROTECTED_API = ['/api/favorites', '/api/alerts', '/api/vehicles'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isProtectedPage = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isProtectedApi = PROTECTED_API.some((r) => pathname.startsWith(r));

  if ((isProtectedPage || isProtectedApi) && !req.auth) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized', code: 401 }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)'],
};
