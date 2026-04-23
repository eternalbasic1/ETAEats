import { NextResponse, type NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  // Auth is client-side (localStorage) in MVP. Each dashboard page guards
  // itself via useEffect + auth store. Middleware scaffolded for future
  // server-side auth.
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
