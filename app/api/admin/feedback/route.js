import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/feedback — list all feedback, newest first, with client name.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .select('*, clients(business_name)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Feedback list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ feedback: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load feedback.' }, { status: 500 })
  }
}
