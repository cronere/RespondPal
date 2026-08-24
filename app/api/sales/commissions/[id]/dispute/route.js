import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/sales/commissions/[id]/dispute — a rep flags one specific
// commission line item as disputed, with a required note. Only works on
// an event that's actually theirs. This is the in-app version of the
// 30-day written dispute right in Section 3.5 of the rep agreement —
// previously that meant emailing Jacob separately with no connection to
// the actual line item in question.
export async function POST(req, { params }) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { note } = await req.json()
    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Please explain what looks wrong.' }, { status: 400 })
    }

    const { data: event, error: fetchError } = await supabase
      .from('commission_events')
      .select('id, sales_rep_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !event) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    if (event.sales_rep_id !== repId) {
      return NextResponse.json({ error: 'This commission belongs to another rep.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('commission_events')
      .update({
        disputed: true,
        disputed_at: new Date().toISOString(),
        dispute_note: note.trim(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Dispute error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ event: data })
  } catch (err) {
    console.error('Dispute error:', err)
    return NextResponse.json({ error: 'Failed to submit dispute.' }, { status: 500 })
  }
}
