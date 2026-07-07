import { NextResponse } from 'next/server'

// AI draft endpoint — generates an on-brand response to a review using the
// client's saved voice settings. Calls the Anthropic API directly.
//
// Requires ANTHROPIC_API_KEY in the environment (set in Vercel).
//
// Model: Haiku 4.5 is fast + cost-effective for short review responses.
// Swap MODEL to 'claude-sonnet-4-6' if you want more polish on hard negatives.
//
// v2 (prompt synthesis): the base prompt now encodes the 10 universal response
// rules + precedence logic + register-routing distilled from cross-industry
// review analysis (see PROMPT_CALIBRATION_ARCHIVE.md). Per-industry guidance
// still layers on top via client.ai_instructions exactly as before.
const MODEL = 'claude-haiku-4-5-20251001'

const TONE_GUIDANCE = {
  professional_friendly: 'professional but warm and approachable',
  warm_personal: 'warm, personal, and genuinely appreciative',
  formal: 'polished, formal, and businesslike',
  casual: 'relaxed, casual, and conversational',
}

function buildPrompt({ review, client }) {
  const businessName = client.business_name || 'the business'
  const signer = client.response_signer
  const tone = TONE_GUIDANCE[client.response_tone] || TONE_GUIDANCE.professional_friendly
  const avoid = client.things_to_avoid
  const tagline = client.business_tagline
  const customInstructions = client.ai_instructions
  const industry = (client.industry || '').toLowerCase()

  // Determine if this client is in a HIPAA-covered industry.
  const HIPAA_KEYWORDS = ['dental', 'dentist', 'orthodont', 'medical', 'doctor', 'physician',
    'chiropractic', 'chiropractor', 'med spa', 'medspa', 'dermatology', 'dermatologist',
    'cosmetic surg', 'plastic surg', 'optometry', 'optometrist', 'ophthalmol',
    'behavioral health', 'mental health', 'psychiatr', 'psycholog', 'therapy',
    'physical therapy', 'urgent care', 'clinic', 'healthcare', 'health care',
    'oral surg', 'periodon', 'endodont', 'pediatric', 'obgyn', 'ob-gyn']
  const isHipaa = HIPAA_KEYWORDS.some(kw => industry.includes(kw))

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

4. DON'T CONCEDE DISPUTED FAULT IN WRITING — acknowledge the FEELING, not the FAULT. "I understand how frustrating that was" — never "you're right, we shouldn't have." (This is the most common mistake to avoid: over-apologizing and conceding things that are actually disputed.) Genuine, concrete, undisputed failures (a real no-show, a mess left behind, a clear mix-up) you CAN own sincerely.

5. PROTECT PRIVACY. Never publicly confirm, deny, or discuss a person's private details — whether they're a customer/patient/client, their visit or case history, their treatment, their billing/account/payment specifics, or any personal information. This holds even while declining a claim. The honest move when details are disputed or you can't verify: stay neutral and take it private ("we'd like to look into this with you directly — please reach out"). Never disclose or argue account/invoice specifics in public.

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
    prompt += `\n\n═══════════════════════════════════════════════════════════
HIPAA COMPLIANCE — MANDATORY FOR THIS HEALTHCARE BUSINESS
═══════════════════════════════════════════════════════════
This business is a HIPAA-covered entity. Federal law (the HIPAA Privacy Rule) prohibits disclosing Protected Health Information (PHI) in any public response — and PHI includes the mere fact that someone IS or WAS a patient. Dental practices have been fined $10,000 to $50,000 by HHS for violating these rules in review responses. These rules are NON-NEGOTIABLE and override tone, warmth, and specificity goals when they conflict:

1. NEVER confirm or deny the reviewer is a patient, client, or has received care — even if they identify themselves.

2. NEVER reference any specific detail from the review — no treatment names, procedures, diagnoses, billing amounts, insurance details, appointment dates, visit history, clinical findings, or staff interactions that connect to this specific reviewer.

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

REQUIRED patterns:
- General practice-value statements: "We take all feedback seriously" / "We hold ourselves to the highest standard of care" / "Every person who contacts our office deserves to be treated with respect"
- Generic private-communication invitations: "Please reach out to our office directly" / "We welcome anyone with questions to contact us"
- Express care through VALUES: "Quality of care is our highest priority" — NOT "we're sorry the care you received fell short"

SELF-CHECK: Before finalizing, reread the response and ask: "Could a reasonable person reading this determine that the reviewer IS or WAS a patient?" If YES — even slightly — rewrite it to be more general. When in doubt, be MORE general.`
  }

  prompt += `\n\nBefore finalizing: reread your response once. Confirm it (a) matches the right register and length for this review, (b) doesn't argue, concede disputed fault, fabricate, or breach privacy, and (c) sounds like a specific human, not a template. Then write ONLY the response text itself — no preamble, no quotation marks around it, no explanation. Just the response exactly as it should be posted.`

  return prompt
}

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
      return NextResponse.json(
        { error: `AI service error (${res.status}). Check your API key and balance.` },
        { status: 502 }
      )
    }

    const data = await res.json()
    const draft = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    if (!draft) {
      return NextResponse.json({ error: 'AI returned an empty response. Try again.' }, { status: 502 })
    }

    return NextResponse.json({ draft })
  } catch (err) {
    console.error('AI draft error:', err)
    return NextResponse.json({ error: 'Failed to generate draft.' }, { status: 500 })
  }
}
