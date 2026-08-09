import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../../lib/supabaseAdmin'

// POST /api/admin/audits/[id]/regenerate-summary — rewrites ONLY the summary
// field using the findings already stored on this audit. Does NOT re-analyze
// raw_input, does NOT touch findings. This exists specifically for cases
// where a prompt fix changes how the summary should be FORMATTED (e.g. the
// paragraph-break requirement) but the underlying findings from a prior run
// are still perfectly valid — a full re-run would be needlessly expensive
// and risks re-introducing findings drift for no reason. Cheap, fast, safe.
export const dynamic = 'force-dynamic'
export const revalidate = 0

const MODEL = 'claude-sonnet-4-6'

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

    const findings = audit.findings || []
    if (findings.length === 0) {
      return NextResponse.json({ error: 'This audit has no findings yet — run a full audit first.' }, { status: 400 })
    }

    const critical = findings.filter(f => (f.severity || '').toLowerCase() === 'critical')
    const moderate = findings.filter(f => (f.severity || '').toLowerCase() === 'moderate')
    const minor = findings.filter(f => (f.severity || '').toLowerCase() === 'minor')

    const findingsDigest = critical
      .map(f => `- [CRITICAL: ${(f.issues || []).join(', ')}] ${f.review_summary || ''}`)
      .join('\n')

    const prompt = `You are writing the client-facing summary paragraph for a Reputation Risk Audit report. The full analysis has already been done — here are the findings already identified:

CRITICAL FINDINGS (${critical.length} total):
${findingsDigest || '(none)'}

Also identified: ${moderate.length} moderate findings, ${minor.length} minor findings.

BUSINESS INDUSTRY: ${audit.industry || 'Not specified'}

Write ONLY the summary paragraph(s) — nothing else, no preamble, no JSON, just the summary text itself.

FORMAT REQUIREMENTS: 2-4 SHORT PARAGRAPHS (NOT one dense block), separated by a literal blank line between each paragraph. Each paragraph should be 2-3 sentences, covering ONE idea — do not cram multiple topics into a single paragraph. Suggested structure: paragraph 1 = the most urgent issue (usually negative-review privacy/tone problems); paragraph 2 = a secondary pattern if one exists (e.g. positive-review issues, templating, missed opportunities) — omit this paragraph entirely if there isn't a genuinely distinct second pattern; final paragraph = a brief closing line framing what this means overall, only if it adds something the prior paragraphs didn't already say. Total length should read comfortably in under 30 seconds.

Written for a business owner unfamiliar with this terminology. Do NOT state a specific number of responses/reviews reviewed or analyzed — instead describe findings qualitatively ("several responses," "a pattern across negative reviews"). Never reference "batches," "passes," or any internal process language.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Regenerate summary API error:', res.status, errText)
      return NextResponse.json({ error: `AI service error (${res.status}).` }, { status: 502 })
    }

    const data = await res.json()
    const newSummary = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    if (!newSummary) {
      return NextResponse.json({ error: 'AI returned an empty summary. Try again.' }, { status: 502 })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('audits')
      .update({ summary: newSummary })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to save regenerated summary:', updateError)
      return NextResponse.json({ error: 'Failed to save the new summary.' }, { status: 500 })
    }

    return NextResponse.json({ audit: updated })
  } catch (err) {
    console.error('Regenerate summary error:', err)
    return NextResponse.json({ error: 'Failed to regenerate summary.' }, { status: 500 })
  }
}
