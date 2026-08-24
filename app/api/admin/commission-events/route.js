import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/commission-events?status=needs_review — list commission
// events, newest first. status is optional; omitted returns everything.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('commission_events')
      .select('*, sales_reps(name), clients(business_name)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) {
      console.error('Commission events list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ events: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load commission events.' }, { status: 500 })
  }
}
