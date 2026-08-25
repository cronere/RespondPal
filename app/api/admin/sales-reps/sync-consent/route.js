import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { getStripeClient } from '../../../../lib/stripe'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/sales-reps/sync-consent — one-time (or repeatable)
// action to apply consent_collection.terms_of_service = 'required'
// retroactively to every rep's already-existing payment links.
//
// Only new links created going forward get this automatically — existing
// ones were created before this requirement existed. The stored links
// only ever saved the URL, not the underlying Stripe payment link ID that
// the Update endpoint actually needs, so this works by listing every
// payment link on the account and matching by URL instead of needing a
// schema change to fix retroactively.
export async function POST() {
  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured (STRIPE_SECRET_KEY missing).' }, { status: 500 })
  }

  try {
    const { data: reps, error: repsError } = await supabaseAdmin
      .from('sales_reps')
      .select('id, name, stripe_payment_links')
      .not('stripe_payment_links', 'is', null)

    if (repsError) {
      return NextResponse.json({ error: repsError.message }, { status: 500 })
    }

    // Every stored URL, across every rep, we need to find a matching
    // Stripe payment link ID for.
    const urlsToFind = new Set()
    for (const rep of reps || []) {
      for (const url of Object.values(rep.stripe_payment_links || {})) {
        urlsToFind.add(url)
      }
    }

    if (urlsToFind.size === 0) {
      return NextResponse.json({ updated: 0, skipped: 0, notFound: 0, message: 'No rep payment links found to update.' })
    }

    // List every payment link on the account, paginating through all of
    // them — a rep-link setup at this scale shouldn't run long, but this
    // doesn't assume it fits on one page.
    const urlToId = {}
    let startingAfter = undefined
    let hasMore = true
    while (hasMore) {
      const page = await stripe.paymentLinks.list({ limit: 100, starting_after: startingAfter })
      for (const link of page.data) {
        if (urlsToFind.has(link.url)) {
          urlToId[link.url] = { id: link.id, alreadyRequired: link.consent_collection?.terms_of_service === 'required' }
        }
      }
      hasMore = page.has_more
      startingAfter = page.data.length > 0 ? page.data[page.data.length - 1].id : undefined
    }

    let updated = 0
    let skipped = 0
    let notFound = 0
    const errors = []

    for (const url of urlsToFind) {
      const match = urlToId[url]
      if (!match) {
        notFound++
        continue
      }
      if (match.alreadyRequired) {
        skipped++
        continue
      }
      try {
        await stripe.paymentLinks.update(match.id, {
          consent_collection: { terms_of_service: 'required' },
        })
        updated++
      } catch (updateErr) {
        errors.push(`${url}: ${updateErr.message}`)
      }
    }

    return NextResponse.json({ updated, skipped, notFound, errors, totalChecked: urlsToFind.size })
  } catch (err) {
    console.error('Sync consent error:', err)
    return NextResponse.json({ error: err.message || 'Failed to sync consent settings.' }, { status: 500 })
  }
}
