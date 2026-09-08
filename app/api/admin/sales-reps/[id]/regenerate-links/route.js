import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'
import { getStripeClient } from '../../../../../lib/stripe'
import { generateRepPaymentLinks, generateRepTrialPaymentLinks } from '../../route'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/sales-reps/[id]/regenerate-links — creates a brand new
// set of payment links for this rep (both standard and trial) and
// overwrites whatever was stored before. Unlike the consent sync (which
// only updates settings on existing links), this actually replaces them —
// the real fix for a rep whose links were generated while the wrong
// Stripe key was active (e.g. test mode instead of live), since a
// test-mode link can't be converted into a live one after the fact. Also
// the right tool for backfilling trial links onto a rep created before
// that feature existed. The old links are simply abandoned; Stripe
// doesn't need them deleted, they just stop being handed out.
export async function POST(req, { params }) {
  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured (STRIPE_SECRET_KEY missing).' }, { status: 500 })
  }

  try {
    const { data: rep, error: repError } = await supabaseAdmin
      .from('sales_reps')
      .select('id, name')
      .eq('id', params.id)
      .single()

    if (repError || !rep) {
      return NextResponse.json({ error: 'Rep not found.' }, { status: 404 })
    }

    // Each set is generated and saved independently — a failure in one
    // (a bad price ID, a Stripe-side issue) never prevents the other,
    // already-successful set from being saved. This matters in practice:
    // it's exactly what protects a rep's working standard links from
    // being wiped out by an unrelated failure generating trial links.
    let links = {}
    let trialLinks = {}
    let linksError = null
    let trialLinksError = null

    try {
      links = await generateRepPaymentLinks(stripe, rep.id, rep.name)
    } catch (err) {
      linksError = err.message || 'Failed to generate standard links.'
    }
    try {
      trialLinks = await generateRepTrialPaymentLinks(stripe, rep.id, rep.name)
    } catch (err) {
      trialLinksError = err.message || 'Failed to generate trial links.'
    }

    if (Object.keys(links).length === 0 && Object.keys(trialLinks).length === 0) {
      return NextResponse.json({
        error: 'No links were generated.',
        linksError,
        trialLinksError,
      }, { status: 500 })
    }

    const updatePayload = {}
    if (Object.keys(links).length > 0) updatePayload.stripe_payment_links = links
    if (Object.keys(trialLinks).length > 0) updatePayload.stripe_trial_payment_links = trialLinks

    const { error: updateError } = await supabaseAdmin
      .from('sales_reps')
      .update(updatePayload)
      .eq('id', rep.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ links, trialLinks, linksError, trialLinksError })
  } catch (err) {
    console.error('Regenerate links error:', err)
    return NextResponse.json({ error: err.message || 'Failed to regenerate links.' }, { status: 500 })
  }
}
