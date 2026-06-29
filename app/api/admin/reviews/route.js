import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/reviews — list all reviews, newest first, with client info.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*, clients(business_name, response_signer, response_tone, things_to_avoid, business_tagline)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Reviews list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ reviews: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load reviews.' }, { status: 500 })
  }
}

// POST /api/admin/reviews — manually add a review to the queue.
export async function POST(req) {
  try {
    const body = await req.json()
    const {
      client_id,
      platform,
      reviewer_name,
      star_rating,
      recommendation,
      review_text,
      review_date,
    } = body

    if (!client_id || !platform) {
      return NextResponse.json({ error: 'Client and platform are required.' }, { status: 400 })
    }

    const insert = {
      client_id,
      platform,
      reviewer_name: reviewer_name || null,
      star_rating: star_rating ? parseInt(star_rating) : null,
      recommendation: recommendation || null,
      review_text: review_text || null,
      review_date: review_date || new Date().toISOString(),
      response_status: 'pending',
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert(insert)
      .select('*, clients(business_name, response_signer, response_tone, things_to_avoid, business_tagline)')
      .single()

    if (error) {
      console.error('Review create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ review: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to add review.' }, { status: 500 })
  }
}
