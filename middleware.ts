import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(?:png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next()
  }

  const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password"
  const token = await getToken({ req })

  if (!token && !isAuthRoute) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    if (pathname && pathname !== "/") url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  if (token && isAuthRoute) {
    const url = req.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
}
