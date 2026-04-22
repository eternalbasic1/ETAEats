import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/orders', '/profile']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    // Auth is stored client-side (localStorage). Protected pages guard themselves
    // via useEffect + useAuthStore. Middleware is scaffolded for future SSR auth.
    return NextResponse.next()
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/orders/:path*', '/profile/:path*'],
}
