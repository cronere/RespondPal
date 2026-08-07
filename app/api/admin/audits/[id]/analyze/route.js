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

const HIPAA_KEYWORDS = ['dental', 'dentist', 'orthodont', 'medical', 'doctor', 'physician',
  'chiropractic', 'chiropractor', 'med spa', 'medspa', 'dermatology', 'dermatologist',
  'cosmetic surg', 'plastic surg', 'optometry', 'optometrist', 'ophthalmol',
  'behavioral health', 'mental health', 'psychiatr', 'psycholog', 'therapy',
  'physical therapy', 'urgent care', 'clinic', 'healthcare', 'health care',
  'oral surg', 'periodon', 'endodont', 'pediatric', 'obgyn', 'ob-gyn']

function buildAuditPrompt(industry) {
  const ind = (industry || '').toLowerCase()
  const isHipaa = HIPAA_KEYWORDS.some(kw => ind.includes(kw))

  let prompt = `You are conducting a "Reputation Risk Audit" for a local business — reviewing responses they have ALREADY posted publicly to Google and Yelp reviews. Your job is to flag anything risky, damaging, or low-quality, and provide a better rewrite for each flagged item.

BUSINESS INDUSTRY: ${industry || 'Not specified'}
${isHipaa ? 'THIS IS A HIPAA-COVERED HEALTHCARE BUSINESS. Privacy violations in responses carry federal enforcement risk ($10,000-$50,000+ per violation). Treat ALL privacy issues as CRITICAL severity.' : ''}

Screen every response against these failure patterns, drawn from analysis of thousands of real business review responses across ten industries:

1. PRIVACY VIOLATIONS — publicly confirming/denying someone is a customer/patient/client, referencing their visit/case/treatment history, or disclosing billing/account specifics in the response.${isHipaa ? ' FOR THIS HEALTHCARE BUSINESS: Even confirming someone IS a patient is a HIPAA violation — including phrases like "thank you for coming in," "sorry about your experience with us," or referencing any detail from their review that connects them to care. HHS has fined dental practices $10,000-$50,000 for exactly this. ALWAYS flag as CRITICAL.' : ' Flag as moderate for non-healthcare businesses, critical for healthcare.'}
   IMPORTANT EXCEPTION — do NOT flag a response as a Privacy Violation solely for using the reviewer's own first name back to them. The reviewer already made that name public by posting under it — reflecting it back ("Thank you, Amy" / "Thanks for the feedback, Michael") discloses nothing new and is NOT a HIPAA or privacy issue on its own. A genuine Privacy Violation requires confirming/denying patient or visit status, referencing specific treatment, care, diagnosis, or billing details, or referencing whether they are or are not found in the practice's records. A bare "thank you, [Name]" with no other content has ZERO privacy risk — if that is the ENTIRE issue with the response, flag it under Templated/Generic and/or Read-the-whole-review failure instead, never Privacy violation.

2. COMBATIVE / ARGUMENTATIVE — publicly disputing the reviewer\'s account, calling them wrong or lying, rebutting point-by-point, or "setting the record straight." Never wins the reader over; makes the business look defensive.

3. TEMPLATED / GENERIC — a response that could be pasted onto any review regardless of content (warm-but-empty phrases repeated verbatim, no specific reference to what the reviewer actually said).

4. READ-THE-WHOLE-REVIEW FAILURES — gushing/thanking as if the review were positive when the star rating or body is actually negative or mixed.

5. MISSED GRAVE REGISTER — an upbeat, cheerful, or generic closer on a review involving harm, injury, illness, death/loss, discrimination, or other serious situations. (e.g. "hope you feel better!" on a review describing a serious complaint.)

6. FALSE RESOLUTION CLAIMS — asserting contact or a resolution that may not have actually happened ("glad we got this sorted out") without evidence.

7. THROWING STAFF UNDER THE BUS — publicly blaming or exposing an individual employee by name in a negative light.

8. NAME ERRORS — using an invented nickname or guessed name variant instead of the reviewer\'s actual stated name, or addressing a handle/username as if it were a real name.

9. ASKING FOR REVIEW REMOVAL — requesting the reviewer take down, delete, or edit their review. Reads as suppression.

10. BILLING DEFENSIVENESS — publicly justifying or arguing pricing/charges rather than acknowledging the customer\'s frustration and moving specifics to a private conversation.

UNIVERSAL RULE FOR ALL REWRITES (every industry, no exceptions): NEVER invent, guess, or include a phone number, email address, physical address, or any other specific contact detail in a rewrite YOU write. You do not know this business's real contact information. Use generic phrasing instead — "please reach out to our office directly," "please contact us directly," "we welcome a call or message." A fabricated or incorrect phone number in a client-facing report is a serious credibility failure and must never happen.

IMPORTANT — this rule applies ONLY to rewrites you generate. It does NOT mean you should flag, question, or make any claim about phone numbers, emails, or contact details that already appear in the business's ORIGINAL historical response text. You have no way to verify whether a phone number in their existing response is correct or not — do not speculate, do not label it "fabricated," and do not invent this as an issue category. If a business's own original response includes their phone number, that is normal and not a finding of any kind unless it independently matches one of the 10 numbered failure patterns above.

For EACH response provided, determine:
- Whether it has ANY issues from the list above
- If yes: which issue(s), a brief explanation of why it is a problem, a SEVERITY rating (critical / moderate / minor), and a rewritten version that fixes it while preserving what the response was trying to accomplish
- Before assigning "Privacy violation" to ANY response, self-check: "Does this response confirm/deny patient status, reference specific treatment/care/diagnosis/billing details, or reference a records search — beyond simply using the reviewer's own self-disclosed name?" If the only thing present is a name and generic pleasantries with no other substance, do NOT use "Privacy violation" — use "Templated / generic" and/or "Read-the-whole-review failure" instead.
- If no issues: mark it as clean (no rewrite needed)
${isHipaa ? `
CRITICAL REWRITE RULES FOR THIS HEALTHCARE BUSINESS:
All rewrites MUST be strictly HIPAA-compliant. The model MUST treat this as a legal constraint, not a suggestion. Dental practices have been fined $10,000-$50,000 for the exact language patterns listed below.

FORBIDDEN phrases and patterns (DO NOT USE in any rewrite):
- "your visit" / "this visit" / "your experience with us" / "your appointment" (confirms a visit occurred)
- "thank you for coming in" / "thank you for choosing us" / "thank you for trusting us" (confirms they came in)
- "sorry about your experience" / "sorry this visit" / "sorry your visit" (confirms they had an experience as a patient)
- "patient experience" / "patient care" when directed at the reviewer with "your" (confirms they are a patient)
- "your treatment" / "your procedure" / "your care" / "your records" / "your chart" (confirms treatment occurred)
- "your concerns about [anything specific from the review]" (confirms the concern relates to their care)
- ANY variation of confirming, denying, or hedging around a records search — "we don't have a patient by that name," "we couldn't find you in our system," "we weren't able to connect your comments to a specific experience," "we're unable to locate a record matching your details," "we don't see you in our charts." These are all the SAME violation just phrased more softly — the act of referencing a records search result, in ANY direction (found, not found, "couldn't connect," "couldn't match"), discloses that the practice searched their patient database in relation to this specific person. NEVER reference whether a record was found, not found, matched, or connected. The rewrite must not imply a records lookup happened at all.
- "we'd like to make this right" / "make it right" (implies something went wrong with THEIR care)
- Any reference to what the reviewer described — even paraphrased or generalized

REQUIRED patterns for rewrites:
- Use ONLY general practice-value statements that could apply to anyone: "We take all feedback seriously" / "We hold ourselves to the highest standard" / "Every person who contacts our office deserves to be treated with respect"
- Invite GENERIC private communication: "Please reach out to our office directly" or "We welcome anyone with questions to contact us" — NEVER "please call us to discuss your concerns" or "so we can address what happened"
- Express care through VALUES, not through acknowledging specifics: "Quality of care is our highest priority" — NOT "we're sorry the care you received fell short"
- NEVER invent or include a phone number, email address, physical address, or any other contact detail in a rewrite. You do not know the business's real contact information. Say "please reach out to our office directly" or "please contact us through our website" — NEVER fabricate a phone number or email. A wrong or made-up phone number in a client-facing report is a serious credibility failure.

SELF-CHECK before finalizing each rewrite: Read it one more time and ask three questions: (1) "Could a reasonable person reading this determine that the reviewer IS or WAS a patient?" (2) "Does this rewrite reference a records search in ANY way — found, not found, connected, matched, or unable to locate?" (3) "Does this rewrite contain any phone number, email, or address?" If the answer to ANY of these is yes, rewrite it to remove that element entirely. When in doubt, be MORE general, not less.

SELF-CHECK for violating_phrase: before finalizing, verify the violating_phrase value is copied EXACTLY character-for-character from original_excerpt — not paraphrased, not summarized. If it doesn't match exactly, the highlighting in the report will silently fail to display. Double-check spelling, punctuation, and capitalization match precisely.
` : ''}
LENGTH: violating_phrase should almost always be under 12 words — a single clause or short phrase, not a full sentence and never multiple sentences. If you find yourself selecting more than one sentence, you have not narrowed it down enough — go back and pick the single clause within that sentence that does the actual damage. Good examples of the right length: "since your last visit" / "that is exactly what Dr. Fisher did" / "do not have you as a patient of record" / "marked your chart" / "two years or longer after the treatment was completed." A highlighted phrase that's nearly as long as the whole excerpt defeats the purpose — it should be short enough to jump out visually against the surrounding text.

HOW TO SELECT violating_phrase (applies to every finding where severity is critical or moderate):

The violating_phrase is what gets bolded and highlighted in the client-facing report — it must be the single most incriminating piece of evidence, not just any true statement from the response. Selecting the wrong phrase (a generic greeting instead of the real violation) undermines the entire report's credibility.

NEVER select a generic opener or pleasantry as violating_phrase, even if it happens to appear early in the excerpt or is easy to grab. These are NEVER acceptable choices on their own:
- "thank you for taking the time to share your experience" / "thank you for sharing your feedback" / "thank you for your review"
- "we're sorry to hear about your experience" (without a more specific confirming detail attached)
- General principle statements that don't reference this specific reviewer's situation — e.g. "sometimes the treatment a patient needs and wants don't match" (this is a generic policy statement, not evidence tying THIS reviewer to patient status)

INSTEAD, scan the full original_excerpt and select the phrase that does ONE of the following, in this priority order:
1. Names a specific provider, staff member, or specialist in connection with THIS reviewer's care (e.g. "that is exactly what Dr. Fisher did," "Dr. Fisher recommended")
2. States or implies a specific treatment, procedure, diagnosis, or clinical action taken for this reviewer (e.g. "the treatment was completed," "we have addressed the team")
3. References specific billing, insurance, timeline, or account details tied to this reviewer (e.g. "two years or longer after the treatment was completed")
4. Confirms an ongoing or past visit/appointment/relationship specific to this reviewer (e.g. "since your last visit," "we fell short of that for you" when tied to an earlier specific claim)
5. Only if NONE of the above exist in the excerpt, select the most specific available sentence — but this should be rare for anything flagged as a genuine Privacy violation.

SELF-CHECK for violating_phrase: Before finalizing, ask "If someone read ONLY this highlighted phrase in isolation, with no other context, would it clearly demonstrate why this is a privacy violation?" If the phrase could apply to literally any reviewer regardless of what they experienced (a generic greeting or general principle), it fails this test — go back and find a more specific phrase in the same excerpt instead.

Respond ONLY with valid JSON in this exact structure, no other text:
{
  "summary": "2-3 sentence plain-English summary of what you found, written for a business owner who isn\'t familiar with any of this terminology",
  "loom_talking_points": ["3-5 short, punchy talking points for the person delivering this audit to say OUT LOUD on a screen-recorded video walkthrough. These are FOR THE SALESPERSON, not for the report. Each one should be a specific, non-obvious insight from THIS audit that adds credibility or context beyond what's already visible in the findings — e.g. explaining WHY a specific phrase is a violation when it doesn\'t look like one on its surface (like confirming vs. denying patient status being the same violation), pointing out a pattern across multiple findings, or flagging the single most damaging finding to lead with. Keep each one to 1-2 sentences, conversational, ready to say out loud. Do NOT restate the findings themselves — add insight the findings don\'t already show."],
  "findings": [
    {
      "review_summary": "star rating + 6-10 word summary of what the reviewer complained about, e.g. \'1★ — Patient says she was overcharged and staff was rude\'",
      "original_excerpt": "the 2-3 MOST DAMAGING sentences from the business\'s response — the lines that would make a business owner cringe if they saw them quoted back. Not the opening pleasantries, the worst part. Include enough context to be visceral (30-60 words).",
      "violating_phrase": "the SHORTEST exact substring of original_excerpt (copy it verbatim, word-for-word, character-for-character), selected per the priority order and self-check defined above. Must be an EXACT substring of original_excerpt so it can be highlighted — do not paraphrase. null if severity is not critical or moderate.",
      "severity": "critical" | "moderate" | "minor" | "clean",
      "issues": ["ONE OR MORE labels, EXACTLY from this list only, no other categories permitted: Privacy violation, Combative tone, Templated / generic, Read-the-whole-review failure, Missed grave register, False resolution claims, Throwing staff under the bus, Name errors, Asking for review removal, Billing defensiveness"],
      "explanation": "1-2 sentences on why this is a problem, written for a business owner",
      "rewrite": "the full rewritten response — ONLY for CRITICAL findings, null for moderate/minor/clean"
    }
  ]
}

Here are the business\'s existing responses to audit:

`
  return prompt
}

export async function POST(req, { params }) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI is not configured. Add ANTHROPIC_API_KEY in Vercel.' }, { status: 500 })
    }

    const { id } = params
    // mode: 'fresh' (default) clears any prior findings/summary before this run —
    // use this for re-running after edits, prompt fixes, or corrected input.
    // mode: 'append' keeps prior findings and adds this run's results on top —
    // use this ONLY when deliberately continuing a large review set across
    // multiple batches in the same sitting.
    let mode = 'fresh'
    try {
      const body = await req.json()
      if (body && body.mode === 'append') mode = 'append'
    } catch {
      // No body provided — default to fresh.
    }

    const { data: audit, error: fetchError } = await supabaseAdmin
      .from('audits')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !audit) {
      return NextResponse.json({ error: 'Audit not found.' }, { status: 404 })
    }
    // raw_input is the single source of truth for what gets analyzed — always
    // exactly what's currently saved for this audit, no separate history or
    // batch-text tracking. Simple and predictable: what you see in the text
    // box is what gets sent to the AI, every time.
    const textToAnalyze = (audit.raw_input || '').trim()
    if (!textToAnalyze) {
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
        max_tokens: 8192,
        messages: [{ role: 'user', content: buildAuditPrompt(audit.industry) + textToAnalyze }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Anthropic API error:', res.status, errText)
      await supabaseAdmin.from('audits').update({ status: 'awaiting_input' }).eq('id', id)
      // Surface the actual error detail so it's visible without digging through
      // server logs — this is an internal admin endpoint, safe to expose.
      let detail = errText
      try {
        const parsedErr = JSON.parse(errText)
        detail = parsedErr?.error?.message || errText
      } catch {
        // errText wasn't JSON — use as-is.
      }
      return NextResponse.json({
        error: `AI service error (${res.status}): ${detail}`
      }, { status: 502 })
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
      const stopReason = data.stop_reason
      const likelyTruncated = stopReason === 'max_tokens'
      console.error('Audit JSON parse error:', parseErr.message, '| stop_reason:', stopReason, '| response length:', raw.length)
      await supabaseAdmin.from('audits').update({ status: 'awaiting_input' }).eq('id', id)
      return NextResponse.json({
        error: likelyTruncated
          ? 'The AI response was cut off because the batch was too large. Try splitting your input into smaller batches (15-20 reviews at a time).'
          : 'AI returned an unexpected format. Try again.'
      }, { status: 502 })
    }

    // In 'fresh' mode (the default), discard any prior findings/summary before
    // merging — this run replaces them entirely. In 'append' mode, prior
    // findings/summary are kept and this run's results are added on top,
    // for deliberately continuing a large review set across multiple batches.
    const existingFindings = mode === 'append' ? (audit.findings || []) : []
    const newFindings = parsed.findings || []

    // Deduplicate by normalized response text — if the same underlying review
    // response appears more than once (duplicate rows in pasted input, an
    // overlapping append batch, or any other source), only the first
    // occurrence is kept. This is a structural safeguard independent of WHY
    // a duplicate might occur, rather than trying to prevent every possible
    // path that could produce one.
    const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim()
    const seen = new Set(existingFindings.map((f) => normalize(f.original_excerpt)))
    const dedupedNewFindings = []
    for (const f of newFindings) {
      const key = normalize(f.original_excerpt)
      if (key && seen.has(key)) continue
      if (key) seen.add(key)
      dedupedNewFindings.push(f)
    }

    const mergedFindings = [...existingFindings, ...dedupedNewFindings]

    const existingSummary = mode === 'append' ? (audit.summary || '') : ''
    const newSummary = parsed.summary || ''
    const mergedSummary = existingSummary
      ? `${existingSummary}\n\n--- Batch ${Math.ceil(existingFindings.length / 50) + 1} ---\n${newSummary}`
      : newSummary

    // Talking points always reflect the latest run.
    const talkingPoints = parsed.loom_talking_points || []

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('audits')
      .update({
        status: 'ready',
        findings: mergedFindings,
        summary: mergedSummary,
        loom_talking_points: talkingPoints,
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
