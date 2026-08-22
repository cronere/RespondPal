// Shared crypto helpers for Sales HQ authentication. Uses only Web Crypto
// (globalThis.crypto.subtle) so this same code works unmodified in both
// Next.js middleware (Edge Runtime, no Node 'crypto' module) and regular
// API routes (Node runtime) — one implementation instead of two copies
// drifting apart, the same lesson from several other bugs fixed today.
//
// Deliberately separate from the existing admin auth code (middleware.js /
// app/api/admin/auth/route.js) rather than refactored to share it — admin
// auth is already working and this keeps that risk at zero while building
// something new alongside it.

function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
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

// Password hashing: SHA-256 over (salt + password), with a random salt
// generated per rep at account-creation time. Not a slow hash like bcrypt/
// scrypt/argon2 — a deliberate, pragmatic tradeoff for a small, internal
// tool with a handful of trusted reps, not a public-facing high-value
// target. Using Web Crypto here (rather than Node's crypto.scrypt) keeps
// this file runnable in Edge middleware too, if ever needed there.
export async function hashPassword(password, salt) {
  const enc = new TextEncoder()
  const data = enc.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(hashBuffer)
}

export function generateSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return bytesToHex(bytes)
}

export async function verifyPassword(password, salt, expectedHash) {
  const actualHash = await hashPassword(password, salt)
  if (actualHash.length !== expectedHash.length) return false
  // Constant-time comparison — avoids leaking hash-match progress via
  // response timing, same principle as the signature check below.
  let diff = 0
  for (let i = 0; i < actualHash.length; i++) {
    diff |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  }
  return diff === 0
}

// Session token: "repId.expiry.signature" — the signature covers repId AND
// expiry together, so a token can't be replayed for a different rep or have
// its expiry silently extended.
export async function makeSalesToken(repId, secret) {
  const expiry = Date.now() + 1000 * 60 * 60 * 24 * 14 // 14 days
  const payload = `${repId}.${expiry}`
  const sig = await hmacHex(secret, payload)
  return `${payload}.${sig}`
}

export async function verifySalesToken(token, secret) {
  if (!token || !secret) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [repId, expiry, sig] = parts
  const expiryNum = Number(expiry)
  if (!expiryNum || Date.now() > expiryNum) return null

  const expected = await hmacHex(secret, `${repId}.${expiry}`)
  if (sig.length !== expected.length) return null
  let diff = 0
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  if (diff !== 0) return null
  return repId
}

// Convenience helper for API route handlers (not middleware): reads the
// session cookie directly off the request, verifies it, and returns the
// rep's id or null. Every sales API route uses this to scope queries to
// "this rep's own data only" — required for correct data isolation between
// reps regardless of what page-level middleware does or doesn't cover.
export async function getSalesRepId(req) {
  const secret = process.env.SALES_SESSION_SECRET
  const token = req.cookies.get('rp_sales')?.value
  return verifySalesToken(token, secret)
}
