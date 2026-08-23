import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSalesRepId } from '../../../lib/salesAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sales/clients — read-only list of active/onboarding/paused
// clients, business name + industry only. Exists so a rep can check
// whether a prospect is already a client before pursuing them as a new
// lead — deliberately minimal fields, this isn't a full client-management
// view, just a "don't go after this one" check.
export async function GET(req) {
  const repId = await getSalesRepId(req)
  if (!repId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, business_name, industry, status')
      .in('status', ['active', 'onboarding', 'paused'])
      .order('business_name', { ascending: true })

    if (error) {
      console.error('Sales clients list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ clients: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load clients.' }, { status: 500 })
  }
}
