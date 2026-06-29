import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

// Always fetch fresh — never serve a cached client list.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/clients — return all clients for the roster.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Clients list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ clients: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load clients.' }, { status: 500 })
  }
}
