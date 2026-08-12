import { NextResponse } from 'next/server'
import { generateCompliantDraft } from '../../../lib/aiDrafting'
import { generateCompliantDraftV2 } from '../../../lib/testing/aiDrafting'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/admin/verify-loop-test — runs the SAME review through both the
// current live system (V1: single-pass + independent check + deterministic
// blocklist) and the new experimental system (V2: verify-redraft loop with
// 3 narrow single-question checks) side by side. Purely for comparison —
// does not touch any client data, does not save anything, completely
// isolated from the live ai-draft route and the Response Examples tool.
export async function POST(req) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI is not configured. Add ANTHROPIC_API_KEY in Vercel.' }, { status: 500 })
    }

    const { review, client } = await req.json()
    if (!review || !client) {
      return NextResponse.json({ error: 'Review and client are required.' }, { status: 400 })
    }

    const [v1Result, v2Result] = await Promise.all([
      generateCompliantDraft({ review, client, apiKey }),
      generateCompliantDraftV2({ review, client, apiKey, maxAttempts: 2 }),
    ])

    return NextResponse.json({
      v1: v1Result,
      v2: v2Result,
    })
  } catch (err) {
    console.error('Verify-loop test error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate test drafts.' }, { status: 500 })
  }
}
