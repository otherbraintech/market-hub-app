import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('session')?.value;

  // Rutas públicas que no requieren auth
  const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/api/webhooks');

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isPublicRoute && !pathname.startsWith('/api/webhooks')) {
    try {
      const parsed = await decrypt(session);
      if (parsed) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      // Session invalid, continue to public route
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)'],
};
