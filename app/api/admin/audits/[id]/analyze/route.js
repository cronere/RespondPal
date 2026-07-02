import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

// POST /api/admin/audits/[id]/analyze — run the Reputation Risk Audit scan
// on the raw pasted responses stored on this audit record. Uses Claude to
// flag each existing response against the same failure patterns catalogued
// in the cross-industry prompt calibration work (privacy, combative tone,
// false resolutions, templating, missed harm/grief register, etc.) and
// produce a rewrite for anything flagged.
export const dynamic = 'force-dynamic'
export const revalidate = 0

const MODEL = 'claude-sonnet-4-6' // analysis task — use Sonnet, not Haiku

const AUDIT_PROMPT = `You are conducting a "Reputation Risk Audit" for a local business — reviewing responses they have ALREADY posted publicly to Google and Yelp reviews. Your job is to flag anything risky, damaging, or low-quality, and provide a better rewrite for each flagged item.

Screen every response against these failure patterns, drawn from analysis of thousands of real business review responses across ten industries:

1. PRIVACY VIOLATIONS — publicly confirming/denying someone is a customer/patient/client, referencing their visit/case/treatment history, or disclosing billing/account specifics in the response. (Critical severity — especially for medical, dental, legal, or financial businesses. This is the single most damaging category — e.g. "we haven't seen you since 2021" or "your invoice shows...")

2. COMBATIVE / ARGUMENTATIVE — publicly disputing the reviewer's account, calling them wrong or lying, rebutting point-by-point, or "setting the record straight." Never wins the reader over; makes the business look defensive.

3. TEMPLATED / GENERIC — a response that could be pasted onto any review regardless of content (warm-but-empty phrases repeated verbatim, no specific reference to what the reviewer actually said).

4. READ-THE-WHOLE-REVIEW FAILURES — gushing/thanking as if the review were positive when the star rating or body is actually negative or mixed.

5. MISSED GRAVE REGISTER — an upbeat, cheerful, or generic closer on a review involving harm, injury, illness, death/loss, discrimination, or other serious situations. (e.g. "hope you feel better!" on a review describing a serious complaint.)

6. FALSE RESOLUTION CLAIMS — asserting contact or a resolution that may not have actually happened ("glad we got this sorted out") without evidence.

7. THROWING STAFF UNDER THE BUS — publicly blaming or exposing an individual employee by name in a negative light.

8. NAME ERRORS — using an invented nickname or guessed name variant instead of the reviewer's actual stated name, or addressing a handle/username as if it were a real name.

9. ASKING FOR REVIEW REMOVAL — requesting the reviewer take down, delete, or edit their review. Reads as suppression.

10. BILLING DEFENSIVENESS — publicly justifying or arguing pricing/charges rather than acknowledging the customer's frustration and moving specifics to a private conversation.

For EACH response provided, determine:
- Whether it has ANY issues from the list above
- If yes: which issue(s), a brief explanation of why it's a problem, a SEVERITY rating (critical / moderate / minor), and a rewritten version that fixes it while preserving what the response was trying to accomplish
- If no issues: mark it as clean (no rewrite needed)

Respond ONLY with valid JSON in this exact structure, no other text:
{
  "summary": "2-3 sentence plain-English summary of what you found, written for a business owner who isn't familiar with any of this terminology",
  "findings": [
    {
      "original_excerpt": "a short excerpt or paraphrase identifying which response this is (first ~15 words)",
      "severity": "critical" | "moderate" | "minor" | "clean",
      "issues": ["short label(s) from the list above, e.g. Privacy violation, Combative tone"],
      "explanation": "1-2 sentences on why this is a problem, written for a business owner",
      "rewrite": "the full rewritten response, or null if severity is clean"
    }
  ]
}

Here are the business's existing responses to audit:

`

export async function POST(req, { params }) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI is not configured. Add ANTHROPIC_API_KEY in Vercel.' }, { status: 500 })
    }

    const { id } = params

    const { data: audit, error: fetchError } = await supabaseAdmin
      .from('audits')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !audit) {
      return NextResponse.json({ error: 'Audit not found.' }, { status: 404 })
    }
    if (!audit.raw_input || !audit.raw_input.trim()) {
      return NextResponse.json({ error: 'No responses have been pasted in yet for this audit.' }, { status: 400 })
    }

    await supabaseAdmin.from('audits').update({ status: 'analyzing' }).eq('id', id)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        messages: [{ role: 'user', content: AUDIT_PROMPT + audit.raw_input.trim() }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Anthropic API error:', res.status, errText)
      await supabaseAdmin.from('audits').update({ status: 'awaiting_input' }).eq('id', id)
      return NextResponse.json({ error: `AI service error (${res.status}).` }, { status: 502 })
    }

    const data = await res.json()
    const raw = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    let parsed
    try {
      // Strip markdown code fences if the model wrapped the JSON in them.
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      parsed = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('Audit JSON parse error:', parseErr, raw)
      await supabaseAdmin.from('audits').update({ status: 'awaiting_input' }).eq('id', id)
      return NextResponse.json({ error: 'AI returned an unexpected format. Try again.' }, { status: 502 })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('audits')
      .update({
        status: 'ready',
        findings: parsed.findings || [],
        summary: parsed.summary || '',
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Audit save error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ audit: updated })
  } catch (err) {
    console.error('Audit analyze error:', err)
    return NextResponse.json({ error: 'Failed to analyze audit.' }, { status: 500 })
  }
}
