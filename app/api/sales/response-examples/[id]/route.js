import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/response-examples/[id] — single demo. Ownership boundary:
// only viewable by the rep who created it.
export async function GET(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('response_demos')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    if (data.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This response example belongs to another rep.' }, { status: 403 })
    }
    return NextResponse.json({ demo: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load.' }, { status: 500 })
  }
}
