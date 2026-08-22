import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { hashPassword, generateSalt } from '../../../lib/salesAuth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/sales-reps — list all reps, newest first. Never returns
// password_hash or password_salt to the client.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('sales_reps')
      .select('id, name, email, active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Sales reps list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ reps: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load sales reps.' }, { status: 500 })
  }
}

// POST /api/admin/sales-reps — create a new rep account. Expects a plain-
// text temporary password from the admin form; hashes it before storing,
// never stores or returns the plain text.
export async function POST(req) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const salt = generateSalt()
    const password_hash = await hashPassword(password, salt)

    const { data, error } = await supabaseAdmin
      .from('sales_reps')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash,
        password_salt: salt,
        active: true,
      })
      .select('id, name, email, active, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A rep with that email already exists.' }, { status: 409 })
      }
      console.error('Sales rep create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rep: data })
  } catch (err) {
    console.error('Sales rep create error:', err)
    return NextResponse.json({ error: 'Failed to create sales rep.' }, { status: 500 })
  }
}
