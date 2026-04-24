import { NextResponse } from 'next/server'

export function middleware() {
  // Auth is client-side (localStorage) in MVP. Each dashboard page guards
  // itself via useEffect + auth store. Middleware scaffolded for future
  // server-side auth.
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
