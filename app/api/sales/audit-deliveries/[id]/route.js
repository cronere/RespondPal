import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/audit-deliveries/[id] — single audit, for the rep's
// report-viewing page. Only viewable if it's this rep's AND has actually
// been pushed (delivered/converted) — a rep can't peek at an audit Jacob
// is still working on just by guessing an id.
export async function GET(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    if (data.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This audit belongs to another rep.' }, { status: 403 })
    }
    if (!['delivered', 'converted'].includes(data.status)) {
      return NextResponse.json({ error: 'This audit hasn\'t been pushed to you yet.' }, { status: 403 })
    }
    return NextResponse.json({ audit: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load.' }, { status: 500 })
  }
}
