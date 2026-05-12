import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('session')?.value;

  // Rutas públicas que no requieren auth
  const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname.startsWith('/api/webhooks');

  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  const token = session ? await decrypt(session).catch(() => null) : null;

  if (!token && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname && pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (token && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api/webhooks|.*\\..*).*)'],
};
