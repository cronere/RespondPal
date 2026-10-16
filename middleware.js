import { NextResponse } from 'next/server'

// Internal areas have been removed. This is a safety net so these paths
// return 404 even if a route is ever re-added by mistake.
export function middleware() {
  return new NextResponse('Not found', { status: 404 })
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/sales',
    '/sales/:path*',
    '/api/admin',
    '/api/admin/:path*',
    '/api/sales',
    '/api/sales/:path*',
  ],
}
