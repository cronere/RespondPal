import { NextResponse } from 'next/server'
import { generateCompliantDraft } from '../../../lib/aiDrafting'

// AI draft endpoint — generates an on-brand response to a review using the
// client's saved voice settings. Calls the Anthropic API via the shared
// drafting library (lib/aiDrafting.js), which is also used by the
// response-demos showcase tool — keeping both in permanent sync.
//
// Requires ANTHROPIC_API_KEY in the environment (set in Vercel).

export async function POST(req) {
  try {
    // Auth — reject requests without a valid draft key
    const draftKey = process.env.RESPONDPAL_DRAFT_KEY
    const providedKey = req.headers.get('x-draft-key')
    if (draftKey && providedKey !== draftKey) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI drafting is not configured. Add ANTHROPIC_API_KEY in Vercel.' },
        { status: 500 }
      )
    }

    const { review, client } = await req.json()
    if (!review || !client) {
      return NextResponse.json({ error: 'Review and client are required.' }, { status: 400 })
    }

    const { draft, complianceFlag } = await generateCompliantDraft({ review, client, apiKey })
    return NextResponse.json({ draft, complianceFlag })
  } catch (err) {
    console.error('AI draft error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate draft.' }, { status: 500 })
  }
}
