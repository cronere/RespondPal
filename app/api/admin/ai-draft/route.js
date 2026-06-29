import { NextResponse } from 'next/server'

// AI draft endpoint — generates an on-brand response to a review using the
// client's saved voice settings. Calls the Anthropic API directly.
//
// Requires ANTHROPIC_API_KEY in the environment (set in Vercel).
//
// Model: Haiku 4.5 is fast + cost-effective for short review responses.
// Swap MODEL to 'claude-sonnet-4-6' if you want more polish.
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

  const ratingLine = review.star_rating
    ? `${review.star_rating} out of 5 stars`
    : review.recommendation === 'no'
      ? 'a "does not recommend" rating'
      : review.recommendation === 'yes'
        ? 'a "recommends" rating'
        : 'no rating given'

  let prompt = `You are writing a public response to a customer review on behalf of ${businessName}. This response will be posted publicly on ${review.platform}, visible to anyone who reads the reviews.

REVIEW DETAILS
Platform: ${review.platform}
Rating: ${ratingLine}
Reviewer: ${review.reviewer_name || 'Anonymous'}
Review text: "${review.review_text || '(no text provided)'}"

HOW TO WRITE THIS RESPONSE
- Tone: ${tone}.
- Keep it concise — 2 to 4 sentences. Real business owners don't write essays.
- Sound like a real human from the business, not a corporate template or an AI.
- Address the specific things the reviewer mentioned. Don't be generic.
- For positive reviews: thank them genuinely and warmly, reference what they liked.
- For negative reviews: be gracious and accountable without groveling. Acknowledge their experience, show you take it seriously, and invite them to connect offline to make it right. Never be defensive or argue.
- Don't restate the whole review back to them.
- Don't use phrases like "We're sorry to hear" if it sounds robotic — be genuine.`

  if (signer) {
    prompt += `\n- Sign the response as "${signer}" at the end.`
  } else {
    prompt += `\n- Do not add a signature or sign-off name.`
  }
  if (avoid) {
    prompt += `\n- IMPORTANT — things to avoid: ${avoid}`
  }
  if (tagline) {
    prompt += `\n- The business tagline (use only if it fits naturally, don't force it): "${tagline}"`
  }

  prompt += `\n\nWrite ONLY the response text itself — no preamble, no quotation marks around it, no explanation. Just the response exactly as it should be posted.`

  return prompt
}

export async function POST(req) {
  try {
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
        max_tokens: 400,
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
