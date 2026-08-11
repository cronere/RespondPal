// Shared AI drafting logic — the single source of truth for generating
// compliant review responses, used by BOTH the live-client ai-draft route
// AND the response-demos showcase tool. Extracted specifically so that
// future fixes (new forbidden phrases, new compliance-check questions, new
// blocklist entries) only need to happen in ONE place. Duplicating this
// logic across files is exactly what caused today's compliance checker to
// silently drift out of sync with the drafting prompt — don't repeat that.

export const MODEL = 'claude-haiku-4-5-20251001'

export const HIPAA_KEYWORDS = ['dental', 'dentist', 'orthodont', 'medical', 'doctor', 'physician',
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

export function isHipaaIndustry(industry) {
  const ind = (industry || '').toLowerCase()
  return HIPAA_KEYWORDS.some(kw => ind.includes(kw))
}

// Extracts provider/staff names the REVIEWER themselves named, directly from
// the review text — e.g. "Dr. Nathan Baker and his assistant Tracy" yields
// ["Nathan Baker", "Baker", "Tracy"]. This is the structural fix for named-
// provider leaks: rather than relying on the AI to remember "don't name
// providers" as an abstract rule, we know the exact names in advance for
// THIS review and can deterministically block them from appearing in THIS
// specific draft — the same certainty the static blocklist gives "trust" or
// "experience," just computed per-review instead of hardcoded once.
export function extractNamedPersons(reviewText) {
  const text = reviewText || ''
  const names = new Set()

  // "Dr. Nathan Baker" / "Dr Baker" / "Doctor Baker" — capture full name and
  // last-name-only, since either could appear in a drafted response.
  const drRegex = /\b(?:Dr\.?|Doctor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g
  let match
  while ((match = drRegex.exec(text)) !== null) {
    const fullName = match[1].trim()
    names.add(fullName)
    const parts = fullName.split(/\s+/)
    if (parts.length > 1) names.add(parts[parts.length - 1]) // last name alone
  }

  // "his assistant Tracy" / "hygienist Sue" / "Assistant Manda and Lexy" —
  // a role word directly followed by one or two capitalized first names.
  // NOTE: deliberately no global 'i' flag — that would make [A-Z] match
  // lowercase too, defeating the capitalization check and matching ordinary
  // words like "did" right after "assistant". Instead, both cases of the
  // role word's first letter are spelled out explicitly.
  const roleRegex = /\b(?:[Aa]ssistant|[Hh]ygienist|[Nn]urse|[Tt]echnician|[Tt]ech|[Ss]taff member|[Rr]eceptionist|[Ff]ront desk)\s+([A-Z][a-z]+)(?:\s+and\s+([A-Z][a-z]+))?/g
  while ((match = roleRegex.exec(text)) !== null) {
    if (match[1]) names.add(match[1])
    if (match[2]) names.add(match[2])
  }

  return [...names].filter((n) => n.length > 1)
}

const TONE_GUIDANCE = {
  professional_friendly: 'professional but warm and approachable',
  warm_personal: 'warm, personal, and genuinely appreciative',
  formal: 'polished, formal, and businesslike',
  casual: 'relaxed, casual, and conversational',
}

export function buildPrompt({ review, client }) {
  const businessName = client.business_name || 'the business'
  const signer = client.response_signer
  const tone = TONE_GUIDANCE[client.response_tone] || TONE_GUIDANCE.professional_friendly
  const avoid = client.things_to_avoid
  const tagline = client.business_tagline
  const customInstructions = client.ai_instructions
  const isHipaa = isHipaaIndustry(client.industry)

  const ratingLine = review.star_rating
    ? `${review.star_rating} out of 5 stars`
    : review.recommendation === 'no'
      ? 'a "does not recommend" rating'
      : review.recommendation === 'yes'
        ? 'a "recommends" rating'
        : 'no rating given'

  let prompt = `You are writing a public response to a customer review on behalf of ${businessName}. This response will be posted publicly on ${review.platform}, visible to everyone who reads the reviews — so it is written FOR THE AUDIENCE of future customers as much as for the reviewer.

REVIEW DETAILS
Platform: ${review.platform}
Rating: ${ratingLine}
Reviewer: ${review.reviewer_name || 'Anonymous'}
Review text: "${review.review_text || '(no text provided)'}"

═══════════════════════════════════════════════════════════
FIRST, READ THE WHOLE REVIEW AND DECIDE THE SITUATION
═══════════════════════════════════════════════════════════
Before writing, read the ENTIRE review and weight the STAR RATING — not just the opening line. Reviews often start positive and turn negative, or get updated. A low-star review is a COMPLAINT even if it opens with a compliment. Never gush or thank someone for a "great review" when the rating or body is negative. If there's a genuine compliment buried in a complaint, you may acknowledge it briefly, but the response must clearly read as answering the complaint.

Then pick the REGISTER that fits what you actually found:
- LIGHT / BRIEF — a minor, everyday gripe (wrong order, short wait, small mix-up), especially at a casual/low-cost business. One or two warm, human sentences. Do NOT over-empathize or write a formal paragraph; it reads as robotic and over-engineered.
- COMPOSED / NEUTRAL — a standard service or quality complaint, or a billing/pricing dispute. Gracious, accountable on tone, never defensive.
- GRAVE / CARING — any claim of harm, injury, illness, danger, discrimination, loss, grief, or other serious or emotionally heavy situation. Slow down, lead with genuine concern or condolence, drop all cheerfulness. NEVER use an upbeat closer ("hope to see you soon!", "feel better!") on a serious or grief review.

MATCH THE LENGTH AND WEIGHT OF YOUR RESPONSE TO THE REVIEW. A $10 complaint gets one light sentence or two; a long, serious, or high-stakes complaint earns a fuller, warmer response. There is no fixed length — fit the moment.

═══════════════════════════════════════════════════════════
CORE RULES — these apply to every response
═══════════════════════════════════════════════════════════
1. SOUND LIKE A REAL HUMAN from the business — never a corporate template, never an AI. Address the specific things this reviewer raised. The single fastest way to sound fake is to be generic, OR to reuse the same warm-but-empty lines on every review. Specificity (not sweetness) is what reads as real.

2. NEVER FABRICATE specifics you can't actually know — why something happened, what a staff member said, timing, what was on an invoice or in a file. Respond to what's in the review plus honest generalities. If insider knowledge would be needed, acknowledge the feeling and invite a private conversation instead of inventing facts.

3. NEVER ARGUE, CONTRADICT, OR "SET THE RECORD STRAIGHT" PUBLICLY. As the responder you do not have the full context and cannot know who is right about what was said or done — so neutrality is the only honest stance. Do not rebut point-by-point, do not recite "what really happened," do not tell the reviewer they're wrong, and never be sarcastic, snide, or condescending. You can decline to accept blame WITHOUT going on the attack. Win the audience, not the argument. Move any real dispute to a private conversation.

4. DON'T CONCEDE DISPUTED FAULT IN WRITING — acknowledge the FEELING, not the FAULT. "I understand how frustrating that was" — never "you're right, we shouldn't have." This applies EQUALLY to forward-looking phrasing, not just past-tense confessions — "this is something we can and should manage better" or "we need to do better here" states current inadequacy as fact just as much as "we should have," it's just dressed up as a commitment to improve instead of a confession about the past. Same liability, different tense. (This is the most common mistake to avoid: over-apologizing and conceding things that are actually disputed.) Genuine, concrete, undisputed failures (a real no-show, a mess left behind, a clear mix-up) you CAN own sincerely.

4b. NEVER IMPLICITLY VALIDATE A CONTRADICTING OPINION, even without conceding fault in words. If a reviewer describes getting a second opinion, switching providers, or having someone else's assessment contradict this business's own recommendation or diagnosis, do NOT praise or compliment that action — "seeking a second opinion shows good judgment" sounds neutral but actually endorses the idea that the other provider was right and this business was wrong, without ever using an obviously risky phrase. Stay fully neutral about outcomes and other providers' opinions: acknowledge that clinical perspectives can differ, without praising the reviewer's choice to seek one or implying who was correct.

5. PROTECT PRIVACY. Never publicly confirm, deny, or discuss a person's private details — whether they're a customer/patient/client, their visit or case history, their treatment, their billing/account/payment specifics, or any personal information. This holds even while declining a claim. The honest move when details are disputed or you can't verify: stay neutral and take it private ("please reach out to our office directly"). Never disclose or argue account/invoice specifics in public. NEVER use "look into this," "look into this with you," or "look into this for you" — this confirms a specific matter exists for this reviewer, which is its own disclosure. Use a fully generic invitation instead: "please reach out to our office directly" with no reference to what will happen once they do.

6. BILLING / PRICING / REFUND complaints (very common): don't disclose or argue the specific charges, don't insist the price was fair, and don't concede a ripoff either. Acknowledge that surprise costs or billing confusion are stressful, own genuine confusion the business created (unclear wording, a real error), and move the actual numbers to a private conversation.

7. REVIEWER NAME: use the reviewer's first name ONLY if it's clearly a real first name. Skip the name entirely (just open warmly) for handles, usernames, initials, business names, or anything ambiguous — and NEVER guess or invent a name variant. Using someone's clearly-real, self-posted first name is fine and warm; never attach a name you're unsure of.

8. NO-TEXT REVIEWS: if there's a rating but no written text, do not thank them for a "review," "post," or "feedback" that doesn't exist. Keep it brief and neutral, and warmly invite them to share more.

9. NEVER throw an individual employee under the bus publicly. If a reviewer praises one person and blames another, you may warmly acknowledge the praised one; handle the criticized one neutrally and privately — never pile on.

10. NEVER claim a resolution or contact that didn't happen ("glad we connected and sorted this out"). Offer to connect — don't assert you already did. And NEVER ask the reviewer to remove, take down, or edit their review; that reads as suppression. If a review seems genuinely misdirected, neutrally note you can't locate the matter and invite them to reach out.

═══════════════════════════════════════════════════════════
WHEN RULES COLLIDE — PRECEDENCE
═══════════════════════════════════════════════════════════
If a review triggers more than one of the above, resolve in this order — the more serious, caring, and quiet move always beats the more defensive or explanatory one:

SAFETY / HARM / GRIEF  >  PRIVACY  >  NEUTRALITY (don't concede / don't argue)  >  value, pricing, or credibility framing.

In practice that means:
- On a harm, injury, illness, or grief review, DROP any value/pricing/quality framing and any credibility defense — they read as cold and defensive against real harm. Lead with concern; never justify cost or credentials there.
- If someone alleges harm AND attacks credibility ("it hurt me AND you're not even qualified"), the grave/caring register wins — do not lead with or lean on a credentials defense; concern first, defense never.
- Acknowledging a feeling never requires revealing a private specific — you can be warm and empathetic while still protecting privacy.

═══════════════════════════════════════════════════════════
POSITIVE REVIEWS
═══════════════════════════════════════════════════════════
Thank them genuinely and specifically, reference what they actually praised, name a praised staff member if mentioned, and keep it concise. Match their energy — a short rave gets a short, happy reply. No upselling.`

  if (signer) {
    prompt += `\n\n- Sign the response as "${signer}" at the end.`
  } else {
    prompt += `\n\n- Do not add a signature or sign-off name.`
  }
  if (tagline) {
    prompt += `\n- The business tagline (use only if it fits naturally, never force it): "${tagline}"`
  }
  prompt += `\n- Tone preference for this business: ${tone}. (Let the review's register above override this when they conflict — e.g. a grave situation stays grave even for a "casual" business.)`

  if (customInstructions && customInstructions.trim()) {
    prompt += `\n\n═══════════════════════════════════════════════════════════
INDUSTRY & CLIENT-SPECIFIC GUIDANCE — from ${businessName}
═══════════════════════════════════════════════════════════
This guidance is tailored to this business's industry and situation. It is MORE SPECIFIC than the core rules above and should be followed closely. Where it adds detail or sharpens how a rule applies to this industry, defer to it. (It does not override the safety/privacy/never-argue principles — it refines how they're applied here.)

${customInstructions.trim()}`
  }

  if (avoid) {
    prompt += `\n\n═══════════════════════════════════════════════════════════
HARD CONSTRAINTS — these override everything above
═══════════════════════════════════════════════════════════
The business owner has specifically asked you to avoid the following: ${avoid}
Treat this by meaning, not just exact words. If they ask you to avoid a phrase, also avoid close variations and reworded versions of it (for example, avoiding "thanks so much" also means avoiding "thank you so much," "thanks a lot," and similar). Before you finalize the response, reread it and rewrite anything that conflicts with this.`
  }

  if (isHipaa) {
    const namedPersons = extractNamedPersons(review.review_text)
    prompt += `\n\n═══════════════════════════════════════════════════════════
HIPAA COMPLIANCE — MANDATORY FOR THIS HEALTHCARE BUSINESS
═══════════════════════════════════════════════════════════
This business is a HIPAA-covered entity. Federal law (the HIPAA Privacy Rule) prohibits disclosing Protected Health Information (PHI) in any public response — and PHI includes the mere fact that someone IS or WAS a patient. Dental practices have been fined $10,000 to $50,000 by HHS for violating these rules in review responses. These rules are NON-NEGOTIABLE and override tone, warmth, and specificity goals when they conflict:

1. NEVER confirm or deny the reviewer is a patient, client, or has received care — even if they identify themselves.

2. NEVER reference any specific detail from the review — no treatment names, procedures, diagnoses, billing amounts, insurance details, appointment dates, visit history, clinical findings, or staff interactions that connect to this specific reviewer.
${namedPersons.length > 0 ? `
SPECIFIC TO THIS REVIEW — DO NOT USE THESE NAMES: this reviewer specifically named the following people: ${namedPersons.join(', ')}. Even though the reviewer named them first and it feels warm to acknowledge them, repeating any of these names in your response ties a specific provider to this reviewer's care, which is a disclosure. Refer to "our team" or "the whole practice" instead — do NOT write any of these names anywhere in your response, under any circumstance.` : ''}

3. NEVER use "you" or "your" in a way that connects to specific care — no "your visit," "your treatment," "your appointment," "your concerns about the procedure."

4. NEVER reference the reviewer by name if doing so connects them to care.

5. NEVER deny someone is a patient or say you searched records.

FORBIDDEN phrases (DO NOT USE):
- "your visit" / "this visit" / "your experience with us" / "your appointment"
- "thank you for coming in" / "thank you for choosing us" / "thank you for trusting us"
- "sorry about your experience" / "sorry this visit" / "sorry your visit fell short"
- "patient experience" / "patient care" directed at the reviewer with "your"
- "your treatment" / "your procedure" / "your care" / "your records"
- "your concerns about [anything]" — this confirms they had concerns as a patient
- "we'd like to make this right" / "make it right" — implies something went wrong with THEIR care specifically
- "please call us to discuss your concerns" — confirms they had concerns as a patient
- ANY phrase implying an ONGOING or FUTURE care relationship — "going forward," "at your next visit," "next appointment," "see you again soon," "look forward to continuing to support your care," "we hope to see you soon." Confirming a FUTURE relationship is just as much a disclosure as confirming a PAST one — it still confirms this person is a patient. You may invite them to CONTACT the office (a one-time, generic action); you may NOT imply they will BE SEEN or BE BACK IN CARE.
- ANY variation of confirming, denying, or hedging around a records search — "we don't have a patient by that name," "we couldn't find you in our system," "we weren't able to connect your comments to a specific experience," "we're unable to locate a record matching your details," "we don't see you in our charts." These are all the SAME violation just phrased more softly — referencing a records search result in ANY direction (found, not found, "couldn't connect," "couldn't match") discloses that a search was conducted in relation to this specific person. Never reference whether a record was found, not found, matched, or connected.
- Any phone number, email address, or physical address you are not explicitly given by the business — you do not know this business's real contact information beyond what client data provides. Never invent or guess contact details.

REQUIRED patterns:
- NEVER use the word "experience" anywhere in a response, in any context — this has repeatedly caused disclosure issues even when the sentence tried to generalize it. Use "interaction," "contact," or rephrase entirely. There is no safe way to use this word for a HIPAA-covered business — do not attempt it.
- NEVER use the word "trust" anywhere in a response, in any form — "trusting us," "your trust," "honored by your trust" are all the same violation reworded, and this has repeatedly slipped through in different phrasings. "Thank you for these kind words" says the same thing safely. Do not attempt to use "trust" for a HIPAA-covered business.
- DO NOT REFERENCE A SPECIFIC OCCASION, DAY, OR INCIDENT tied to this reviewer, even in generalized-sounding language — "what happened that day," "during your visit," "what happened," "that occasion." Banning individual words only closes one door at a time; keep finding new phrasings for the same underlying idea is the pattern to break. Speak ONLY in category terms about the TYPE of concern: "concerns about wait times," "the situation you described" — never confirm a specific day or occasion occurred, even indirectly.
- General practice-value statements: "We take all feedback seriously" / "We hold ourselves to the highest standard of care" / "Every person who contacts our office deserves to be treated with respect"
- Generic private-communication invitations: "Please reach out to our office directly" / "We welcome anyone with questions to contact us"
- Express care through VALUES: "Quality of care is our highest priority" — NOT "we're sorry the care you received fell short"

CRITICAL — DO NOT EVADE THE FORBIDDEN PATTERNS BY REWORDING THEM. Every forbidden phrase above is an EXAMPLE of a category, not an exhaustive list — a paraphrase that preserves the same substance is EQUALLY forbidden even if the exact words differ. "We're so grateful for your trust" / "thankful you chose us for your care" / "we appreciate you trusting our team" all mean the same thing as "thank you for trusting us with your care" and are ALL forbidden, even though none of them are an exact string match to the list above. Before finalizing, ask: "Does this sentence, in substance — regardless of the specific words chosen — confirm gratitude for a care/patient relationship, confirm patient status, or reference an established trust-in-care bond?" If yes, it fails, no matter how the words are arranged. This is a REAL response that may be posted to a live client's public profile — err heavily toward general, generic language whenever a specific phrase feels even slightly risky.

Do NOT name specific staff members or providers in your response, even if the reviewer named them first, and even though it feels warm to do so — naming a provider in connection with this reviewer's care is a top-priority disclosure signal, not a safe pattern. Use "our team" or "the whole practice" instead. Do NOT reference "looking into" this reviewer's specific situation or account, or reference their situation by category ("your billing concern," "this situation") — use fully generic invitations instead ("we welcome any questions").

SELF-CHECK: Before finalizing, reread the response and ask FIVE questions: (1) "Could a reasonable person reading this determine that the reviewer IS or WAS a patient?" (2) "Does this reference a records search in ANY way — found, not found, connected, matched, or unable to locate?" (3) "Does this imply an ongoing or FUTURE care relationship — 'going forward,' 'next visit,' 'see you soon,' or similar?" (4) "Does this contain any phone number, email, or address not explicitly provided?" (5) "Even if I avoided the exact forbidden phrases, did I write something that means the same thing in different words — like thanking them for 'trust' or for 'choosing us for care'?" If the answer to ANY of these is yes — even slightly — rewrite it to remove that element entirely. When in doubt, be MORE general.`
  }

  prompt += `\n\nBefore finalizing: reread your response once. Confirm it (a) matches the right register and length for this review, (b) doesn't argue, concede disputed fault, fabricate, or breach privacy, and (c) sounds like a specific human, not a template. Then write ONLY the response text itself — no preamble, no quotation marks around it, no explanation. Just the response exactly as it should be posted.`

  return prompt
}

// SECOND, INDEPENDENT PASS — a dedicated compliance checker for HIPAA-covered
// businesses. This is a structural fix, not another prompt patch: instead of
// asking one AI call to simultaneously write something warm/specific AND
// police itself against a complex legal rule in the same breath, we send the
// finished draft to a SEPARATE call whose only job is checking it with fresh
// eyes — the same way real compliance review works (someone other than the
// writer checks the work). This catches disclosure patterns that evade any
// finite list of forbidden phrases, because it isn't phrase-matching — it's
// re-reading the draft cold and asking whether IT, as a first-time reader,
// would conclude the reviewer is a patient.
function buildComplianceCheckPrompt(draftResponse, namedPersons) {
  return `You are a HIPAA compliance reviewer for a healthcare business. You did NOT write the response below — someone else did, and your ONLY job is to check it with completely fresh eyes, the way a compliance officer reviews someone else's work before it's approved.

DRAFT RESPONSE TO REVIEW:
"${draftResponse}"
${namedPersons && namedPersons.length > 0 ? `\nNAMES THE REVIEWER USED IN THEIR ORIGINAL REVIEW (must NOT appear anywhere in the draft above): ${namedPersons.join(', ')}\n` : ''}
THE RULE: Under HIPAA, this business cannot disclose Protected Health Information (PHI) in a public response — and PHI includes the simple fact that someone IS or WAS a patient. This applies even to warm, positive, well-intentioned responses.

YOUR TASK: Read the draft above as if you are a stranger with no context. Ask yourself these questions with total honesty — do not give the benefit of the doubt just because the draft sounds warm or well-written:

1. Does ANY part of this draft confirm, even indirectly, that the reviewer is or was a patient? This includes ALL of these exact patterns and any paraphrase of them — treat this list as illustrative, not exhaustive: "your experience," "your experience with us," "such a positive experience," "give you such a positive experience," "had a positive experience," "your visit," "this visit," "that visit," "the visit," "your care," "your treatment," "the consultation," "the treatment," "trust," "trusting us," "trusting us with your care," "your trust," "honored by your trust," "grateful for your trust," "glad you came to us," "we enjoy having you," "get to be your dentist," "such an awesome patient," "always so happy to have you," "bringing in your family," "enjoyed your experience," "enjoyed her/his experience." If the draft contains ANY of these phrases or anything that means the same thing, this is a YES.
2. Does this draft imply an ONGOING or FUTURE care relationship — "next visit," "discuss scheduling," "come back," "look forward to seeing you," "see you again soon," or anything implying they will be seen again as a patient?
3. Does this draft echo back the SPECIFIC QUALITY of care or interaction the reviewer described (their "thoroughness," "kindness," "gentleness," how a procedure went, "physical comfort during treatment") — even while praising named staff?
4. Does this draft reference a records search in any way — confirming OR denying that a record was found?
5. Does this draft contain any fabricated contact information?
6. Does this draft name ANY specific staff member or provider in connection with this reviewer's care — including any of the names listed above under "NAMES THE REVIEWER USED"? Check this one especially carefully — cross-reference the draft against that exact list.
7. Does this draft reference a SPECIFIC OCCASION, DAY, OR INCIDENT tied to this reviewer, even in generalized-sounding language — "what happened," "what happened that day," "that occasion," "at that time," or anything pinning the response to a specific past event rather than speaking only in general category terms ("concerns about wait times")?
8. Does this draft reference "looking into" this reviewer's specific situation, account, or matter — "look into this," "look into this with you," "look into this for you," "look into your account" — or otherwise imply there is a specific matter on file to investigate for this individual?
9. Does this draft state as FACT that the business was at fault, rather than acknowledging only the reviewer's feeling? (e.g. "that's a real gap in how we communicate" or "the lack of X from our team" concedes fault; "we understand that felt frustrating" only acknowledges feeling.) This isn't a HIPAA issue, but flag it the same way — it's a real liability problem.
10. Does this draft praise, compliment, or validate a reviewer's decision to seek a second opinion, switch providers, or otherwise act on someone else's assessment that contradicted this business's own recommendation or treatment? Phrases like "seeking a second opinion shows good judgment" sound neutral but implicitly endorse that the other provider was right and this business was wrong — without using any obviously risky words. This is the same liability category as question 9, just harder to spot since it never states fault directly. Flag it the same way.

This list is illustrative, not exhaustive — new phrasings of the same underlying ideas (confirming patient status, confirming a specific occasion, expressing a care-relationship bond) should be treated the same as the examples given, even if the exact wording is new.

If the answer to ALL of these is genuinely no, respond with EXACTLY this JSON: {"compliant": true, "response": "the original draft, unchanged"}

If ANY answer is yes, rewrite the response to remove ONLY the problematic element(s) while preserving as much of the original warmth, tone, and structure as possible. Respond with EXACTLY this JSON: {"compliant": false, "response": "the corrected response text", "issue": "one short phrase describing what was wrong, for internal logging"}

Respond with ONLY the JSON, no other text.`
}

export async function runComplianceCheck(draftResponse, apiKey, namedPersons) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: buildComplianceCheckPrompt(draftResponse, namedPersons) }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Compliance check API error:', res.status, errText)
    return { compliant: null, response: draftResponse, issue: 'compliance check unavailable' }
  }

  const data = await res.json()
  const raw = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      compliant: parsed.compliant,
      response: parsed.response || draftResponse,
      issue: parsed.issue || null,
    }
  } catch (parseErr) {
    console.error('Compliance check JSON parse error:', parseErr.message, raw)
    return { compliant: null, response: draftResponse, issue: 'compliance check response unparseable' }
  }
}

// THIRD LAYER — a deterministic, non-AI keyword scan. Both AI passes above
// are probabilistic and can inconsistently miss the same phrase on different
// runs. This scan is different in kind: plain string matching, so it either
// finds an exact known-bad phrase or it doesn't — no inconsistency possible.
// Grows over time as new failure patterns are discovered.
export const HARD_BLOCKLIST_PHRASES = [
  'experience',
  'your visit', 'this visit', 'that visit', 'the visit', 'your care', 'your treatment', 'your dental health', 'your consultation',
  'the consultation went well', 'the treatment went well',
  'trust', 'that day', 'what happened that day', 'what happened', 'look into this', 'look into your',
  'glad you came to us', 'we enjoy having you', 'get to be your dentist',
  'such an awesome patient', 'always so happy to have you', 'bringing in your family',
  'bringing in your wonderful family', 'since your last visit', 'look forward to seeing you',
  'see you again soon', 'see you soon', 'next visit', 'next appointment',
  'physical comfort during treatment', 'happy to have you',
  // 'your records' has been forbidden in the drafting prompt since day one
  // but was never added here — this was a real, standalone gap independent
  // of anything else, and one of the most serious possible phrases to miss:
  // it directly invokes a records search, the exact pattern behind actual
  // HHS enforcement actions.
  'your records', 'look at your records', 'reviewing your case', 'your case',
]

// Normalizes smart quotes/apostrophes/dashes before blocklist matching.
// LLM output routinely uses curly apostrophes (') while blocklist phrases
// are written with straight ones (') — visually identical, but a different
// Unicode character, which silently defeats plain .includes() matching.
// We already solved this once for report highlighting; this applies the
// same fix to BOTH deterministic scanners so a smart-quote variant can never
// slip either check the way "You're absolutely right" just did.
function normalizeForScan(s) {
  return (s || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .toLowerCase()
}

export function scanForBlockedPhrases(text) {
  const normalized = normalizeForScan(text)
  return HARD_BLOCKLIST_PHRASES.filter((phrase) => normalized.includes(normalizeForScan(phrase)))
}

// UNIVERSAL — applies to every client, HIPAA or not. Rule 4 ("don't concede
// disputed fault in writing") has been in the drafting prompt since the very
// first version, but a single AI pass following it correctly 100% of the
// time is exactly the same false hope we had about HIPAA rules before we
// built layered defenses for those. This is the same fix, generalized: a
// business publicly admitting fault in writing is a real liability exposure
// regardless of industry, so this check is NOT gated behind isHipaa.
const FAULT_CONCESSION_PHRASES = [
  "you're right", 'you are right', "you're absolutely right",
  'that is a real gap', "that's a real gap", 'that was a real gap',
  'we should have', 'we should of',
  "that's on us", 'that is on us',
  'we dropped the ball', 'our mistake', 'we made a mistake',
  'that should not have happened', "that shouldn't have happened",
  'we failed to', 'we failed you',
  'the lack of', // e.g. "the lack of acknowledgment from our team" — states
                 // the deficiency as established fact rather than feeling
  // Implicit validation of a contradicting second opinion/provider — sounds
  // neutral, actually endorses that the other provider was right and this
  // business was wrong, without ever using an obviously risky word. Imperfect
  // coverage (this is a meaning-in-context problem, not a phrase-matching
  // one) but catches the most common ways it gets phrased.
  'shows good judgment', 'shows good judgement', 'good call to seek',
  'wise decision to seek', 'wise to seek', 'right call to seek',
  'smart to get a second opinion', 'smart to seek a second opinion',
  'understand why you decided', "understand why you've decided",
  // Forward-looking admissions of inadequacy — these avoid past-tense
  // confession words ("we should have") but still state as fact that
  // CURRENT performance is deficient, just framed as a commitment to
  // improve rather than a confession about the past. Same liability, new tense.
  'can and should', 'should manage better', 'should handle better',
  'should be better', 'should do better', 'need to manage better',
  'need to do better', 'need to be better',
]

export function scanForFaultConcession(text) {
  const normalized = normalizeForScan(text)
  return FAULT_CONCESSION_PHRASES.filter((phrase) => normalized.includes(normalizeForScan(phrase)))
}

// Full pipeline: draft → (if HIPAA) independent compliance check → (if
// HIPAA) deterministic blocklist scan. Returns { draft, complianceFlag }.
// Used by both the live ai-draft route and the response-demos tool so both
// get identical, always-in-sync protection.
export async function generateCompliantDraft({ review, client, apiKey }) {
  const isHipaa = isHipaaIndustry(client.industry)
  const prompt = buildPrompt({ review, client })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Anthropic API error:', res.status, errText)
    throw new Error(`AI service error (${res.status}). Check your API key and balance.`)
  }

  const data = await res.json()
  let draft = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

  if (!draft) {
    throw new Error('AI returned an empty response. Try again.')
  }

  let complianceFlag = null
  if (isHipaa) {
    const dynamicNames = extractNamedPersons(review.review_text)
    const checked = await runComplianceCheck(draft, apiKey, dynamicNames)
    if (checked.compliant === false) {
      console.warn('Compliance check caught an issue and corrected it:', checked.issue)
      draft = checked.response
      complianceFlag = 'corrected'
    } else if (checked.compliant === null) {
      complianceFlag = 'unchecked'
    }

    // Static blocklist (phrases that are always risky, every client) PLUS
    // names extracted from THIS specific review — the structural fix for
    // named-provider leaks. A generic blocklist can never contain "Dr. Baker"
    // in advance since every business has different staff; this computes the
    // exact names to block fresh, per review, from the review text itself.
    const draftLower = draft.toLowerCase()
    const nameHits = dynamicNames.filter((n) => draftLower.includes(n.toLowerCase()))
    const blockedHits = [...scanForBlockedPhrases(draft), ...nameHits]
    if (blockedHits.length > 0) {
      console.error('HARD BLOCKLIST HIT after both AI passes — mandatory human review required:', blockedHits)
      complianceFlag = 'blocked_needs_human_review'
    }
  }

  // UNIVERSAL — runs for every client regardless of industry, since publicly
  // conceding fault in writing is a liability risk everywhere, not just in
  // healthcare. Cheap deterministic scan, no extra API call needed, so there's
  // no reason this should only protect HIPAA clients.
  const faultHits = scanForFaultConcession(draft)
  if (faultHits.length > 0) {
    console.error('Fault-concession language found — needs human review before posting:', faultHits)
    complianceFlag = complianceFlag === 'blocked_needs_human_review'
      ? complianceFlag // already flagged for a HIPAA reason, keep that flag
      : 'concedes_fault_needs_review'
  }

  return { draft, complianceFlag }
}
