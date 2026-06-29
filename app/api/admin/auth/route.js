import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Shared-password gate for the admin HQ.
// The password is stored in the ADMIN_PASSWORD environment variable.
// On success we set a signed, HTTP-only cookie that the middleware checks.

function makeToken() {
  // A signed token: <expiry>.<hmac>. Lets middleware verify without a DB.
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ''
  const expiry = Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
  const sig = crypto.createHmac('sha256', secret).update(String(expiry)).digest('hex')
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

    const res = NextResponse.json({ success: true })
    res.cookies.set('rp_admin', makeToken(), {
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
  // Logout — clear the cookie.
  const res = NextResponse.json({ success: true })
  res.cookies.set('rp_admin', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })
  return res
}
