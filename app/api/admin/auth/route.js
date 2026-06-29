import { NextResponse } from 'next/server'

// Shared-password gate for the admin HQ.
// The password is stored in the ADMIN_PASSWORD environment variable.
// On success we set a signed, HTTP-only cookie that the middleware checks.
//
// Uses the Web Crypto API so the signing method matches the Edge-runtime
// middleware exactly (both sign with HMAC-SHA256 over the expiry timestamp).

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

async function makeToken() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ''
  const expiry = Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
  const sig = await hmacHex(secret, String(expiry))
  return `${expiry}.${sig}`
}

export async function POST(req) {
  try {
    const { password } = await req.json()
    const expected = process.env.ADMIN_PASSWORD

    if (!expected) {
      return NextResponse.json(
        { error: 'Admin password is not configured.' },
        { status: 500 }
      )
    }

    if (!password || password !== expected) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
    }

    const token = await makeToken()
    const res = NextResponse.json({ success: true })
    res.cookies.set('rp_admin', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return res
  } catch (err) {
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('rp_admin', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })
  return res
}
