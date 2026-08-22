import { NextResponse } from 'next/server'
import { verifySalesToken } from './app/lib/salesAuth'

// Protects all /admin routes behind the shared-password cookie.
// The login page itself (/admin/login) and the auth API are left open.
//
// Uses the Web Crypto API (globalThis.crypto.subtle) because Next.js
// middleware runs on the Edge Runtime, which does NOT support Node's
// built-in 'crypto' module.

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacHex(secret, message) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return bytesToHex(sig)
}

async function verifyToken(token) {
  return verifyTokenWithSecret(
    token,
    process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ''
  )
}

async function verifyTokenWithSecret(token, secret) {
  if (!token || !token.includes('.')) return false
  if (!secret) return false
  const [expiry, sig] = token.split('.')
  const expiryNum = Number(expiry)
  if (!expiryNum || Date.now() > expiryNum) return false

  const expected = await hmacHex(secret, expiry)

  if (sig.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

export async function middleware(req) {
  const { pathname } = req.nextUrl

  // ── Sales HQ gate ──
  if (pathname.startsWith('/sales')) {
    if (pathname === '/sales/login') {
      return NextResponse.next()
    }
    const secret = process.env.SALES_SESSION_SECRET
    const token = req.cookies.get('rp_sales')?.value
    const repId = secret ? await verifySalesToken(token, secret) : null
    if (repId) {
      return NextResponse.next()
    }
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/sales/login'
    return NextResponse.redirect(loginUrl)
  }

  // ── Admin gate ──
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const token = req.cookies.get('rp_admin')?.value
  if (await verifyToken(token)) {
    return NextResponse.next()
  }

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/admin/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*', '/sales/:path*'],
}
