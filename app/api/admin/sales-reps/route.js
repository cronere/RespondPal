import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { hashPassword, generateSalt } from '../../../lib/salesAuth'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
})

function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

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

    // Email the new rep their login credentials. Sent after the DB insert
    // succeeds — if this fails, the rep account still exists and Jacob can
    // relay the password manually from the confirmation screen, so a mail
    // error here shouldn't block account creation from succeeding.
    try {
      await transporter.sendMail({
        from: `"RespondPal" <${process.env.GMAIL_USER}>`,
        to: data.email,
        subject: `Your RespondPal Sales HQ login`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;color:#1a1a1a">
            <h2 style="color:#C2410C;margin-bottom:4px">Welcome to Sales HQ, ${escapeHtml(data.name)}!</h2>
            <p>Your account is ready. Here's how to sign in:</p>
            <table style="margin:16px 0;">
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">Login page</td><td><a href="https://respondpal.ai/sales/login">respondpal.ai/sales/login</a></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">Email</td><td>${escapeHtml(data.email)}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">Temporary password</td><td style="font-weight:700">${escapeHtml(password)}</td></tr>
            </table>
            <p>Once you're in, you can add leads, request audits and Response Examples PDFs, and track your pipeline.</p>
            <p style="margin-top:24px">Talk soon,<br>Jacob</p>
          </div>
        `,
      })
    } catch (mailErr) {
      console.error('Sales rep welcome email error:', mailErr)
    }

    return NextResponse.json({ rep: data })
  } catch (err) {
    console.error('Sales rep create error:', err)
    return NextResponse.json({ error: 'Failed to create sales rep.' }, { status: 500 })
  }
}
