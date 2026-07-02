import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/audits — list all audit leads, newest first.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Audits list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ audits: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load audits.' }, { status: 500 })
  }
}

// POST /api/admin/audits — manually add an audit lead (e.g. from a phone call).
export async function POST(req) {
  try {
    const body = await req.json()
    const { business_name, contact_name, contact_email, contact_phone, industry, source } = body

    if (!business_name || !business_name.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    const insert = {
      business_name: business_name.trim(),
      contact_name: (contact_name || '').trim() || null,
      contact_email: (contact_email || '').trim() || null,
      contact_phone: (contact_phone || '').trim() || null,
      industry: (industry || '').trim() || null,
      source: (source || 'direct').trim(),
      status: 'new',
    }

    const { data, error } = await supabaseAdmin
      .from('audits')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('Audit create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ audit: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to add audit.' }, { status: 500 })
  }
}
