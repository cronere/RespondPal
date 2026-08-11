import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const EDITABLE_FIELDS = [
  'business_name', 'industry', 'contact_name', 'contact_email',
  'google_url', 'yelp_url', 'total_reviews', 'response_rate',
  'reviews', 'status',
]

export async function GET(req, { params }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('response_demos')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Response demo not found.' }, { status: 404 })
    }
    return NextResponse.json({ demo: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load response demo.' }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json()
    const update = {}
    for (const key of EDITABLE_FIELDS) {
      if (key in body) update[key] = body[key]
    }
    update.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('response_demos')
      .update(update)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Response demo update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ demo: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update response demo.' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { error } = await supabaseAdmin
      .from('response_demos')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete response demo.' }, { status: 500 })
  }
}
