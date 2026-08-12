// EXPERIMENTAL — the verify-redraft loop system (V2), fully isolated from
// the proven, live-tested lib/aiDrafting.js. That file is the trusted
// fallback and stays completely untouched by anything in this file.
//
// This file does NOT duplicate the shared building blocks (buildPrompt,
// the blocklists, name extraction) — it imports them from the main lib,
// the same lesson learned earlier today when the ai-draft route and the
// compliance checker drifted out of sync from having separate copies of
// the same logic. Only what's genuinely NEW to the verify-loop approach
// lives here.
//
// ═══════════════════════════════════════════════════════════════════════
// WHAT THIS IS: generate → verify (3 narrow single-question checks, run in
// parallel) → if any fail, redraft with the exact quoted violation and
// reason → repeat once more if still failing → return.
//
// This is a genuinely different mechanism than the blocklist-based system
// in the main lib, not a replacement for it. The blocklist catches phrases
// already known to fail. This is built to catch NOVEL phrasings not yet
// seen, by asking the model a narrow, single-focus question rather than
// pattern-matching against known text. HIPAA-gated only — for non-HIPAA
// clients, use generateCompliantDraft (V1) directly from the main lib,
// which goes straight from generation to human review with no added
// latency or cost.
// ═══════════════════════════════════════════════════════════════════════

import {
  MODEL,
  buildPrompt,
  isHipaaIndustry,
  extractNamedPersons,
  scanForBlockedPhrases,
  scanForFaultConcession,
} from '../aiDrafting'

async function callClaude(prompt, apiKey, maxTokens = 400) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Anthropic API error (${res.status}): ${errText}`)
  }
  const data = await res.json()
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim()
}

function parseCheckJSON(raw) {
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      violates: !!parsed.violates,
      quote: parsed.quote || '',
      reason: parsed.reason || '',
    }
  } catch {
    // If the checker's own output is unparseable, treat as non-violating
    // rather than blocking the loop — this is a test system; a parse
    // failure here should surface as visible data, not a silent crash.
    return { violates: false, quote: '', reason: '(check response unparseable)' }
  }
}

const NARROW_CHECKS = [
  {
    id: 'patient_status',
    label: 'Confirms patient status',
    build: (draft) => `You did not write the response below. Read it as a complete stranger with zero context — the way an outside compliance reviewer would.

RESPONSE TO REVIEW:
"${draft}"

QUESTION: Does anything in this response — any word, phrase, or implication, however indirect — let a reasonable person conclude that the specific reviewer is or was a patient of this practice? This includes confirming a positive interaction happened to them, thanking them for a relationship of trust or care, or anything functionally equivalent, even if worded in a completely new way you haven't seen before.

Answer with ONLY this JSON, nothing else: {"violates": true or false, "quote": "the exact phrase from the response that causes this, or empty string if false", "reason": "one sentence explaining why, or empty string if false"}`,
  },
  {
    id: 'fault_or_validation',
    label: 'Concedes fault or validates a disputed claim',
    build: (draft) => `You did not write the response below. Read it as a complete stranger with zero context.

RESPONSE TO REVIEW:
"${draft}"

QUESTION: Does this response either (a) concede fault or admit current inadequacy in writing — including forward-looking phrasing like "we can and should do better" or "we need to manage this better," not just past-tense confessions — or (b) validate, praise, or implicitly endorse a reviewer's decision to seek care elsewhere or get a second opinion, in a way that implies this business's own recommendation was wrong? Acknowledging a FEELING ("that sounds frustrating") is fine; stating FAULT as established fact is not.

Answer with ONLY this JSON, nothing else: {"violates": true or false, "quote": "the exact phrase from the response that causes this, or empty string if false", "reason": "one sentence explaining why, or empty string if false"}`,
  },
  {
    id: 'detail_echo',
    label: 'Echoes back a specific detail tied to this reviewer',
    build: (draft) => `You did not write the response below. Read it as a complete stranger with zero context.

RESPONSE TO REVIEW:
"${draft}"

QUESTION: Does this response echo back any SPECIFIC detail the reviewer described about their own case — clinical (a particular quality of care, how a procedure went) OR operational (being seen quickly, a specific staff interaction, a specific day or occasion) — in a way that confirms that specific detail happened to THIS reviewer? A generic capability statement about the practice in general is fine ("our team works hard for everyone"); mirroring their specific described circumstance back is not.

Answer with ONLY this JSON, nothing else: {"violates": true or false, "quote": "the exact phrase from the response that causes this, or empty string if false", "reason": "one sentence explaining why, or empty string if false"}`,
  },
]

async function runNarrowChecks(draft, apiKey) {
  const results = await Promise.all(
    NARROW_CHECKS.map(async (check) => {
      const raw = await callClaude(check.build(draft), apiKey, 200)
      return { id: check.id, label: check.label, ...parseCheckJSON(raw) }
    })
  )
  return results
}

function buildRedraftPrompt(originalPrompt, previousDraft, failedChecks) {
  const issueList = failedChecks
    .map((c, i) => `${i + 1}. ${c.label}: the phrase "${c.quote}" is a problem because ${c.reason}`)
    .join('\n')

  return `${originalPrompt}

═══════════════════════════════════════════════════════════
YOUR PREVIOUS ATTEMPT FAILED REVIEW — FIX THESE SPECIFIC ISSUES
═══════════════════════════════════════════════════════════
Your previous draft was:
"${previousDraft}"

An independent compliance review found the following specific, confirmed issues:
${issueList}

Rewrite the ENTIRE response from scratch. Preserve as much of the original warmth, tone, and structure as you reasonably can, but you MUST remove every issue listed above — do not use the quoted phrases, and do not use any other wording that means the same thing. Write ONLY the corrected response text, no preamble, no explanation.`
}

// Returns { draft, complianceFlag, meta } where meta contains full
// transparency into what happened — every attempt, every check result —
// so the test page can show exactly how the loop behaved, not just the
// final answer.
export async function generateCompliantDraftV2({ review, client, apiKey, maxAttempts = 2 }) {
  const isHipaa = isHipaaIndustry(client.industry)
  const originalPrompt = buildPrompt({ review, client })

  // Non-HIPAA clients bypass the verify loop entirely — straight from
  // generation to human review, same as V1, no added latency or cost for
  // a segment where this level of scrutiny isn't the priority.
  if (!isHipaa) {
    const draft = await callClaude(originalPrompt, apiKey, 500)
    return { draft, complianceFlag: null, meta: { isHipaa: false, attempts: [] } }
  }

  const attempts = []
  let currentDraft = await callClaude(originalPrompt, apiKey, 500)

  for (let attemptNum = 1; attemptNum <= maxAttempts; attemptNum++) {
    const checkResults = await runNarrowChecks(currentDraft, apiKey)
    const failedChecks = checkResults.filter((c) => c.violates)

    // Deterministic blocklist still runs underneath everything — the hard
    // backstop for phrases we already know about, regardless of what the
    // narrow AI checks concluded.
    const dynamicNames = extractNamedPersons(review.review_text)
    const draftLower = currentDraft.toLowerCase()
    const nameHits = dynamicNames.filter((n) => draftLower.includes(n.toLowerCase()))
    const blockedHits = [...scanForBlockedPhrases(currentDraft), ...nameHits]
    const faultHits = scanForFaultConcession(currentDraft)

    attempts.push({
      attemptNum,
      draft: currentDraft,
      checkResults,
      blockedHits,
      faultHits,
      passed: failedChecks.length === 0 && blockedHits.length === 0 && faultHits.length === 0,
    })

    const thisAttemptPassed = failedChecks.length === 0 && blockedHits.length === 0 && faultHits.length === 0
    if (thisAttemptPassed) {
      return { draft: currentDraft, complianceFlag: null, meta: { isHipaa: true, attempts } }
    }

    if (attemptNum < maxAttempts) {
      // Build combined feedback from both the narrow AI checks AND any
      // deterministic hits, so the redraft prompt has full evidence.
      const combinedIssues = [
        ...failedChecks,
        ...blockedHits.map((phrase) => ({ label: 'Known-risky phrase', quote: phrase, reason: 'this exact phrase has caused disclosure issues before' })),
        ...faultHits.map((phrase) => ({ label: 'Fault-concession phrase', quote: phrase, reason: 'this concedes fault or inadequacy in writing' })),
      ]
      const redraftPrompt = buildRedraftPrompt(originalPrompt, currentDraft, combinedIssues)
      currentDraft = await callClaude(redraftPrompt, apiKey, 500)
    }
  }

  // Exhausted all attempts without a clean pass — escalate to human review,
  // same as V1's behavior, never silently substitute anything.
  return { draft: currentDraft, complianceFlag: 'blocked_needs_human_review', meta: { isHipaa: true, attempts } }
}
