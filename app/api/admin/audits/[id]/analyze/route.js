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
  'oral surg', 'periodon', 'endodont', 'pediatric', 'obgyn', 'ob-gyn',
  'aesthetic', 'esthetic', 'wellness', 'injectable', 'botox', 'filler',
  'iv therapy', 'iv hydration', 'weight loss clinic', 'hormone', 'laser clinic',
  'natural medicine', 'functional medicine', 'integrative medicine', 'naturopath',
  'acupunctur', 'nutritionist', 'dietitian', 'rehab', 'recovery center',
  'urgent', 'family practice', 'internal medicine', 'nurse practitioner', 'nurse pract']

function buildAuditPrompt(industry, priorContext) {
  const ind = (industry || '').toLowerCase()
  const isHipaa = HIPAA_KEYWORDS.some(kw => ind.includes(kw))

  let prompt = `You are conducting a "Reputation Risk Audit" for a local business — reviewing responses they have ALREADY posted publicly to Google and Yelp reviews. Your job is to flag anything risky, damaging, or low-quality, and provide a better rewrite for each flagged item.

BUSINESS INDUSTRY: ${industry || 'Not specified'}
${isHipaa ? 'THIS IS A HIPAA-COVERED HEALTHCARE BUSINESS. Privacy violations in responses carry federal enforcement risk ($10,000-$50,000+ per violation). Treat ALL privacy issues as CRITICAL severity.' : ''}
${priorContext ? `
IMPORTANT — THIS IS A CONTINUATION OF AN AUDIT ALREADY IN PROGRESS. Some of this same business's reviews have already been analyzed in a prior pass, with these results (internal context only — the business owner never sees this note or knows their audit was run in multiple passes):
${priorContext}

Your "summary" field below must describe the COMPLETE picture of the ENTIRE audit — combining what was already found above WITH what you find in the new responses below — but it must read as ONE SEAMLESS, UNIFIED ANALYSIS, exactly as if you reviewed everything in a single pass. This is a client-facing document. NEVER use the words "batch," "batches," "earlier batch," "this new batch," "previous pass," "spanning both," or any other language that reveals the audit was conducted in multiple pieces. Simply describe the findings as a whole — "several responses," "the practice's responses," "across the reviews analyzed" — with no reference to process or sequencing. If earlier findings involved negative reviews and the new responses are all positive (or vice versa), blend both into one cohesive narrative without signaling that they came from separate passes.
` : ''}

Screen every response against these failure patterns, drawn from analysis of thousands of real business review responses across ten industries:

1. PRIVACY VIOLATIONS — publicly confirming/denying someone is a customer/patient/client, referencing their visit/case/treatment history, or disclosing billing/account specifics in the response.${isHipaa ? ' FOR THIS HEALTHCARE BUSINESS: Even confirming someone IS a patient is a HIPAA violation — including phrases like "thank you for coming in," "sorry about your experience with us," or referencing any detail from their review that connects them to care. HHS has fined dental practices $10,000-$50,000 for exactly this. ALWAYS flag as CRITICAL — this applies EQUALLY to warm, friendly, enthusiastic responses to POSITIVE reviews as it does to combative responses to negative ones. DO NOT let a cheerful or friendly TONE cause you to under-rate severity to "moderate" or "minor" — the legal risk comes entirely from the DISCLOSURE itself, not from how nice the response sounds. A response saying "so glad your Botox results turned out great!" or naming a provider in connection with a specific treatment is JUST AS CRITICAL as a combative response making the same disclosure, even though it reads as harmless. If you catch yourself reasoning "this one feels too friendly/minor to be critical," that instinct is WRONG for a HIPAA business — override it and flag as CRITICAL.' : ' Flag as moderate for non-healthcare businesses, critical for healthcare.'}
   IMPORTANT EXCEPTION — do NOT flag a response as a Privacy Violation solely for using the reviewer's own first name back to them. The reviewer already made that name public by posting under it — reflecting it back ("Thank you, Jordan" / "Thanks for the feedback, Taylor") discloses nothing new and is NOT a HIPAA or privacy issue on its own. A genuine Privacy Violation requires confirming/denying patient or visit status, referencing specific treatment, care, diagnosis, or billing details, or referencing whether they are or are not found in the practice's records. A bare "thank you, [Name]" with no other content has ZERO privacy risk — if that is the ENTIRE issue with the response, flag it under Templated/Generic and/or Read-the-whole-review failure instead, never Privacy violation.

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
- NEVER imply an ongoing, future, or continuing care relationship — this confirms patient status just as much as referencing the past. Forbidden: "going forward," "next visit," "see you again soon," "your next appointment," "continue to support your care," "in the future" when tied to seeing this specific reviewer again. A rewrite can invite them to CONTACT the office (a one-time, generic action) but must NOT imply they will be BACK IN CARE (an ongoing relationship). "Please reach out to our office directly" is fine; "we look forward to seeing you at your next visit" is NOT.
- CRITICAL — DO NOT EVADE THE FORBIDDEN PATTERNS BY REWORDING THEM. The forbidden phrases listed throughout this prompt (e.g. "thank you for trusting us") are EXAMPLES of a category, not an exhaustive list — a paraphrase that preserves the same substance is EQUALLY forbidden even if the exact words differ. "We're so grateful for your trust" / "thankful you chose us for your care" / "we appreciate you trusting our team" all mean the same thing as "thank you for trusting us with your care" and are ALL forbidden. Before finalizing, ask: "Does this sentence, in substance — regardless of the specific words chosen — confirm gratitude for a care/patient relationship, confirm patient status, or reference an established trust-in-care bond?" If yes, it fails, no matter how the words are arranged.
- Do NOT name specific staff members, providers, or specialists in a rewrite, even if the reviewer named them first and even if it feels warm to do so. Naming a provider in connection with this reviewer's care is our OWN top-priority signal for detecting a violation in original text — a rewrite cannot do the same thing and still be safe. Use "our team" or "the whole practice" instead of specific names. Safe: "Thank you so much — our team truly appreciates this!" Not safe: "Dr. Moss and Manda are wonderful" (still ties named providers to this reviewer's care).
- Do NOT reference "looking into" a matter, situation, or account for this specific reviewer, or reference their situation by category (e.g. "unexpected billing situations," "your billing concern") — even generalized-sounding category language can confirm that a specific matter exists for this reviewer. Use fully generic language instead: "we welcome the opportunity to discuss any questions" rather than "we can look into this for you."

SELF-CHECK before finalizing each rewrite: Read it one more time and ask five questions: (1) "Could a reasonable person reading this determine that the reviewer IS or WAS a patient?" (2) "Does this rewrite reference a records search in ANY way — found, not found, connected, matched, or unable to locate?" (3) "Does this rewrite contain any phone number, email, or address?" (4) "Does this rewrite imply an ongoing or future care relationship — 'going forward,' 'next visit,' 'see you soon,' or similar?" (5) "Even if I avoided the EXACT forbidden phrases, did I write something that means the same thing in different words — like thanking them for 'trust' or 'choosing us for care'?" If the answer to ANY of these is yes, rewrite it to remove that element entirely. When in doubt, be MORE general, not less.

SELF-CHECK for violating_phrase: before finalizing, verify the violating_phrase value is copied EXACTLY character-for-character from original_excerpt — not paraphrased, not summarized. If it doesn't match exactly, the highlighting in the report will silently fail to display. Double-check spelling, punctuation, and capitalization match precisely.
` : ''}
LENGTH: violating_phrase should almost always be under 12 words — a single clause or short phrase, not a full sentence and never multiple sentences. If you find yourself selecting more than one sentence, you have not narrowed it down enough — go back and pick the single clause within that sentence that does the actual damage. Good examples of the right length: "since your appointment in January" / "that is exactly what Dr. Alvarez recommended" / "do not have a record of you as a client" / "noted this in your file" / "more than 90 days after the service was completed." A highlighted phrase that's nearly as long as the whole excerpt defeats the purpose — it should be short enough to jump out visually against the surrounding text.

HOW TO SELECT violating_phrase (applies to every finding where severity is critical or moderate):

The violating_phrase is what gets bolded and highlighted in the client-facing report — it must be the single most incriminating piece of evidence, not just any true statement from the response. Selecting the wrong phrase (a generic greeting instead of the real violation) undermines the entire report's credibility.

NEVER select a generic opener or pleasantry as violating_phrase, even if it happens to appear early in the excerpt or is easy to grab. These are NEVER acceptable choices on their own:
- "thank you for taking the time to share your experience" / "thank you for sharing your feedback" / "thank you for your review"
- "we're sorry to hear about your experience" (without a more specific confirming detail attached)
- General principle statements that don't reference this specific reviewer's situation — e.g. "sometimes the treatment a patient needs and wants don't match" (this is a generic policy statement, not evidence tying THIS reviewer to patient status)
- Company policy or hypothetical future-action statements, even when they sound severe or dramatic — e.g. "we do not issue refunds more than 90 days after a service is completed, regardless of circumstances" or "it is standard practice for clients to confirm their own coverage before scheduling." These describe what the business does/would do IN GENERAL, not a confirmed fact about THIS reviewer's specific patient status, treatment, or account. A phrase can sound serious or quotable and still fail this test — severity of TONE is not the same as specificity to THIS reviewer. If the response ALSO contains a more specific, reviewer-tied phrase elsewhere (even if less dramatic-sounding), that phrase must be chosen instead. If truly nothing in the excerpt ties specifically to this reviewer, reconsider whether "Privacy violation" is the correct tag at all — it may only warrant "Combative tone" or "Billing defensiveness" instead.

CLASSIFICATION CHECK — before tagging ANY finding "Privacy violation": scan the response for language that ties to THIS specific reviewer — their name, "you/your," a specific date, a specific dollar amount, a named provider in connection with their care, or any other reviewer-specific fact. If the ENTIRE response only uses generic, hypothetical, or third-person language ("a patient," "the patient," "our patients," "we have a policy that...") with NOTHING that specifically confirms or ties to this individual reviewer, do NOT tag it "Privacy violation" — even if the tone is defensive or combative, and even if it was written in obvious response to a specific complaint. Generic deflection is a "Combative tone" and/or "Billing defensiveness" issue, not a privacy issue, unless it actually discloses something specific about this reviewer.

INSTEAD, scan the full original_excerpt and select the phrase that does ONE of the following, in this priority order:
1. Names a specific provider, staff member, or specialist in connection with THIS reviewer's care (e.g. "that is exactly what Dr. Alvarez recommended," "Dr. Alvarez consulted on this")
2. States or implies a specific treatment, procedure, diagnosis, or clinical action taken for this reviewer (e.g. "the crown was placed that day," "we already adjusted the fitting")
3. References specific billing, insurance, timeline, or account details tied to this reviewer (e.g. "the $275 balance from your January visit")
4. Confirms an ongoing or past visit/appointment/relationship specific to this reviewer (e.g. "since your appointment in January," "we're sorry that visit didn't go as expected" when tied to an earlier specific claim)
5. Only if NONE of the above exist in the excerpt, select the most specific available sentence — but this should be rare for anything flagged as a genuine Privacy violation.

CRITICAL — DO NOT DEFAULT TO WHICHEVER PHRASE YOU ENCOUNTER FIRST. Read the ENTIRE excerpt start to finish before choosing. A common mistake is grabbing an early, generic, plural phrase (e.g. "issues or concerns patients may have with their treatment") when a later sentence in the SAME excerpt contains a specific, reviewer-tied detail (e.g. a dollar amount, a timeframe, a named provider) that ranks higher on the priority list above. Position in the excerpt is irrelevant — priority tier is what matters. If a tier-3 phrase (specific billing/timeline) appears LATER in the excerpt than a generic phrase, you must still choose the tier-3 phrase.

SELF-CHECK for violating_phrase: Before finalizing, ask three questions: (1) "If someone read ONLY this highlighted phrase in isolation, with no other context, would it clearly demonstrate why this is a privacy violation?" (2) "Is this phrase describing a general company policy, rule, or hypothetical future action — rather than a confirmed fact specific to THIS reviewer?" (3) "Did I scan the FULL excerpt, or did I stop at the first qualifying-ish phrase I found?" If the answer to (1) is no, (2) is yes, or you're not confident about (3), go back and re-read the entire excerpt for a more specific, reviewer-tied phrase. Dramatic or severe-sounding language is not a substitute for specificity, and neither is convenience of position.

Respond ONLY with valid JSON in this exact structure, no other text:
{
  "summary": "2-4 SHORT PARAGRAPHS (NOT one dense block), separated by a literal blank line (\\n\\n) between each paragraph. Each paragraph should be 2-3 sentences, covering ONE idea — do not cram multiple topics into a single paragraph. Suggested structure: paragraph 1 = the most urgent issue (usually negative-review privacy/tone problems); paragraph 2 = a secondary pattern if one exists (e.g. positive-review issues, templating, missed opportunities) — omit this paragraph entirely if there isn't a genuinely distinct second pattern; final paragraph = a brief closing line framing what this means overall, only if it adds something the prior paragraphs didn't already say. Total length should read comfortably in under 30 seconds — if a paragraph is doing the work of three, split it. Written for a business owner unfamiliar with this terminology. IMPORTANT: do NOT state a specific number of responses/reviews reviewed or analyzed (e.g. never write \\'this audit reviewed 16 responses\\') — you cannot reliably know the true total across the business\\'s full profile, and an inaccurate count undermines credibility. Instead describe findings qualitatively (\\'several responses,\\' \\'multiple responses,\\' \\'a pattern across negative reviews\\') or refer to specific named findings. The accurate review counts are displayed separately elsewhere in the report from data the business owner provided directly. ALSO IMPORTANT: never reference \\'batches,\\' \\'passes,\\' or any internal process language — this is a client-facing document and must read as one seamless analysis regardless of how the audit was actually conducted.",
  "loom_talking_points": ["3-5 bullet points, EACH ONE A SINGLE SHORT SENTENCE OR FRAGMENT — HARD MAXIMUM 15 WORDS, target 8-12 words. This is a flat observation to glance at while talking, NOT a script, NOT an explanation, NOT a paragraph. Do NOT explain WHY something is a violation, do NOT include legal reasoning or HIPAA rule explanations (that context is already in the report and the fixed script), do NOT include a 'here's the fix' or 'here's how we solve it' bullet (that's the salesperson's job in the close, not yours). Just state the pattern, flatly, in plain language a business owner would use. EXACT REFERENCE EXAMPLES of the correct length and tone — write NEW bullets in this same style for the specific audit, do not reuse these: 'HIPAA issues in negative reviews, but more in positive reviews.' / 'Lots of reviews, negative and positive, never got a response — missed opportunity.' / 'Some responses got defensive or argued about billing — doesn't look good.' / 'Canned, templated responses on 5-star reviews add no value to the brand.' If a bullet is longer than one sentence or explains reasoning, it is WRONG — cut it down to a flat one-line observation."],
  "findings": [
    {
      "review_summary": "star rating + 6-10 word summary of what the reviewer complained about, e.g. \'1★ — Client says appointment ran an hour late with no apology\'",
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

// SECOND, INDEPENDENT PASS for HIPAA clients — reviews ALL rewrites from this
// run together in ONE additional call, batched to keep cost reasonable rather
// than one compliance check per finding. This is the same structural fix used
// in the production ai-draft route: a separate call with no memory of having
// written the rewrites, reviewing them cold, rather than the same call that
// wrote them self-certifying its own work.
function buildRewriteComplianceCheckPrompt(rewrites) {
  const numbered = rewrites.map((r, i) => `[${i}] "${r}"`).join('\n\n')
  return `You are a HIPAA compliance reviewer. You did NOT write the rewrites below — someone else did, and your ONLY job is to check each one with completely fresh eyes, the way a compliance officer reviews someone else's work before it's approved for a client-facing report.

REWRITES TO REVIEW:
${numbered}

THE RULE: These are proposed replacement responses for a HIPAA-covered healthcare business. None of them may disclose Protected Health Information (PHI) — which includes the simple fact that someone IS or WAS a patient. This applies even to warm, positive rewrites.

For EACH rewrite, ask with total honesty — do not give the benefit of the doubt just because it sounds warm or well-written:
1. Does it confirm, even indirectly, that the reviewer is or was a patient (including soft paraphrases of "trust," "your care," "your experience")?
2. Does it imply an ONGOING or FUTURE care relationship (next visit, scheduling, coming back)?
3. Does it name a specific staff member or provider in connection with this reviewer's care?
4. Does it reference "looking into" or otherwise confirm a specific matter/situation exists for this reviewer, even in generalized category language?
5. Does it reference a records search in any way, or contain fabricated contact info?

Respond with ONLY a JSON array, one entry per rewrite in the same order, no other text:
[{"index": 0, "compliant": true, "response": "unchanged text"}, {"index": 1, "compliant": false, "response": "corrected text with the issue removed, preserving as much warmth/structure as possible", "issue": "short description"}]`
}

async function runRewriteComplianceCheck(rewrites, apiKey) {
  if (rewrites.length === 0) return []
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: buildRewriteComplianceCheckPrompt(rewrites) }],
    }),
  })

  if (!res.ok) {
    console.error('Rewrite compliance check API error:', res.status, await res.text())
    return null // signal failure — caller keeps original rewrites, unflagged
  }

  const data = await res.json()
  const raw = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim()
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    return JSON.parse(cleaned)
  } catch (parseErr) {
    console.error('Rewrite compliance check parse error:', parseErr.message, raw)
    return null
  }
}

// THIRD LAYER — deterministic, non-AI keyword scan, same list and same logic
// as the production ai-draft route. Both AI passes above are probabilistic
// and can inconsistently miss the same phrase on different runs. This is
// plain string matching — no inconsistency possible. It won't catch novel
// paraphrases, but for every pattern already proven to fail in testing, this
// is a 100%-reliable backstop. Grows over time — add newly discovered failure
// patterns here, in both this file and app/api/admin/ai-draft/route.js.
const HARD_BLOCKLIST_PHRASES = [
  'your experience', 'such a positive experience', 'give you such a positive experience',
  'had a positive experience', 'enjoyed your experience', 'enjoyed her experience', 'enjoyed his experience',
  'your visit', 'your care', 'your treatment', 'your dental health', 'your consultation',
  'the consultation went well', 'the treatment went well',
  'trusting us', 'trusting us with your care',
  'glad you came to us', 'we enjoy having you', 'get to be your dentist',
  'such an awesome patient', 'always so happy to have you', 'bringing in your family',
  'bringing in your wonderful family', 'since your last visit', 'look forward to seeing you',
  'see you again soon', 'see you soon', 'next visit', 'next appointment',
  'physical comfort during treatment', 'happy to have you',
]

function scanForBlockedPhrases(text) {
  const lower = (text || '').toLowerCase()
  return HARD_BLOCKLIST_PHRASES.filter((phrase) => lower.includes(phrase))
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

    // In append mode, build a compact summary of findings from earlier batches
    // so the AI can write a summary reflecting the COMPLETE audit so far, not
    // just this batch. Without this, the model has no way to know earlier
    // batches exist at all — which is why append-mode summaries have been
    // describing only a fraction of what's actually been found.
    const priorFindings = mode === 'append' ? (audit.findings || []) : []
    let priorContext = ''
    if (priorFindings.length > 0) {
      const bySeverity = { critical: 0, moderate: 0, minor: 0 }
      priorFindings.forEach(f => {
        const sev = (f.severity || '').toLowerCase()
        if (bySeverity[sev] !== undefined) bySeverity[sev]++
      })
      const criticalSummaries = priorFindings
        .filter(f => (f.severity || '').toLowerCase() === 'critical')
        .slice(0, 12)
        .map(f => `- ${f.review_summary || 'Critical finding'} [${(f.issues || []).join(', ')}]`)
        .join('\n')
      priorContext = `Earlier batches found: ${bySeverity.critical} critical, ${bySeverity.moderate} moderate, ${bySeverity.minor} minor findings.${criticalSummaries ? `\n\nCritical findings from earlier batches:\n${criticalSummaries}${priorFindings.filter(f => (f.severity || '').toLowerCase() === 'critical').length > 12 ? '\n(plus additional critical findings not listed here for brevity)' : ''}` : ''}`
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
        messages: [{ role: 'user', content: buildAuditPrompt(audit.industry, priorContext) + textToAnalyze }],
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

    // Append new findings to any existing ones (supports batched audits).
    const existingFindings = mode === 'append' ? (audit.findings || []) : []
    let newFindings = parsed.findings || []

    // SECOND PASS — for HIPAA-covered businesses, send all rewrites from this
    // run to an independent compliance check before saving. Structural fix,
    // not another prompt patch: a separate call reviewing the finished
    // rewrites with no memory of writing them, the same safeguard used in
    // the production ai-draft route.
    const industryLower = (audit.industry || '').toLowerCase()
    const isHipaaAudit = HIPAA_KEYWORDS.some(kw => industryLower.includes(kw))
    if (isHipaaAudit) {
      const rewriteIndexes = []
      const rewriteTexts = []
      newFindings.forEach((f, i) => {
        if (f.rewrite) {
          rewriteIndexes.push(i)
          rewriteTexts.push(f.rewrite)
        }
      })
      if (rewriteTexts.length > 0) {
        const checkResults = await runRewriteComplianceCheck(rewriteTexts, apiKey)
        if (checkResults) {
          checkResults.forEach((result) => {
            if (result.compliant === false && typeof result.index === 'number') {
              const findingIdx = rewriteIndexes[result.index]
              if (findingIdx !== undefined && result.response) {
                console.warn('Rewrite compliance check corrected a finding:', result.issue)
                newFindings[findingIdx] = { ...newFindings[findingIdx], rewrite: result.response }
              }
            }
          })
        } else {
          console.error('Rewrite compliance check failed or was unparseable — original rewrites kept, unverified by second pass.')
        }
      }

      // THIRD LAYER — deterministic scan on every rewrite, whether or not the
      // AI check touched it. This can't be inconsistent the way two AI passes
      // can. Anything still matching a known-bad phrase gets flagged directly
      // on the finding so it's visible in HQ — never silently trusted.
      rewriteIndexes.forEach((findingIdx) => {
        const currentRewrite = newFindings[findingIdx]?.rewrite
        if (!currentRewrite) return
        const hits = scanForBlockedPhrases(currentRewrite)
        if (hits.length > 0) {
          console.error('HARD BLOCKLIST HIT in audit rewrite after both AI passes — flagging for manual review:', hits)
          newFindings[findingIdx] = { ...newFindings[findingIdx], needsManualReview: true, blockedPhrases: hits }
        }
      })
    }

    const mergedFindings = [...existingFindings, ...newFindings]

    // The AI now receives prior-batch context (see priorContext above) and is
    // explicitly instructed to write a summary covering the COMPLETE audit so
    // far, not just this batch — so its output can simply replace the old
    // summary directly. No more divider-concatenation needed, which was the
    // source of both the "3 ---" display artifact and summaries that only
    // ever described whichever batch happened to run first.
    const mergedSummary = parsed.summary || audit.summary || ''

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
