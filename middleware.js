import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Protects all /admin routes behind the shared-password cookie.
// The login page itself (/admin/login) and the auth API are left open.

function verifyToken(token) {
  if (!token || !token.includes('.')) return false
  const [expiry, sig] = token.split('.')
  const expiryNum = Number(expiry)
  if (!expiryNum || Date.now() > expiryNum) return false

  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ''
  const expected = crypto.createHmac('sha256', secret).update(expiry).digest('hex')

  // Constant-time compare
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

export function middleware(req) {
  const { pathname } = req.nextUrl

  // Only guard /admin paths
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Allow the login page through without a cookie
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const token = req.cookies.get('rp_admin')?.value
  if (verifyToken(token)) {
    return NextResponse.next()
  }

  // Not authenticated — send to login
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/admin/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
