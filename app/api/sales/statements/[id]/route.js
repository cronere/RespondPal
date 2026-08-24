import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/statements/[id] — one statement, only if it belongs to
// the logged-in rep. Also fetches the rep's own name/email for display on
// the document itself — statements should be self-contained and readable
// without needing a separate lookup.
export async function GET(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('statements')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    if (data.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This statement belongs to another rep.' }, { status: 403 })
    }

    const { data: rep } = await supabase
      .from('sales_reps')
      .select('name, email')
      .eq('id', repId)
      .single()

    return NextResponse.json({ statement: { ...data, rep_name: rep?.name, rep_email: rep?.email } })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load statement.' }, { status: 500 })
  }
}
