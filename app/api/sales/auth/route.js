import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword, makeSalesToken } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { email, password } = await req.json()
    const secret = process.env.SALES_SESSION_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: 'Sales HQ is not configured yet. Add SALES_SESSION_SECRET in Vercel.' },
        { status: 500 }
      )
    }
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const { data: rep, error } = await supabase
      .from('sales_reps')
      .select('id, name, email, password_hash, password_salt, active')
      .eq('email', email.trim().toLowerCase())
      .single()

    // Deliberately identical error message whether the email doesn't exist
    // or the password is wrong — doesn't confirm to an attacker which part
    // was incorrect.
    if (error || !rep) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
    }
    if (!rep.active) {
      return NextResponse.json({ error: 'This account has been archived. Contact Jacob.' }, { status: 403 })
    }

    const valid = await verifyPassword(password, rep.password_salt, rep.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
    }

    const token = await makeSalesToken(rep.id, secret)
    const res = NextResponse.json({ success: true, name: rep.name })
    res.cookies.set('rp_sales', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14, // 14 days
    })
    return res
  } catch (err) {
    console.error('Sales login error:', err)
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('rp_sales', '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
