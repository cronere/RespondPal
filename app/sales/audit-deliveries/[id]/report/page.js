'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { isHipaaIndustry } from '../../../../lib/aiDrafting'

// Deliberately near-identical to app/admin/audits/[id]/report — same
// tradeoff as the Response Examples report duplication: this is a
// client-facing document, the brand experience should be the same whether
// Jacob or a rep is viewing/downloading it, and duplicating a template
// that rarely changes is simpler and lower-risk than forcing a shared
// component across two separate auth-gated route trees. The one
// meaningful difference is the data source: this fetches from
// /api/sales/audit-deliveries/[id], which only returns an audit once
// Jacob has actually pushed it to this specific rep (status
// delivered/converted) — a rep can't view a report for an audit still
// sitting in Jacob's own queue, or one pushed to a different rep.
export default function SalesAuditReport() {
  const { id } = useParams()
  const [audit, setAudit] = useState(null)
  const [rep, setRep] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const reportRef = useRef(null)

  useEffect(() => {
    fetch('/api/sales/me').then((r) => r.json()).then((d) => setRep(d.rep)).catch(() => {})
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.html2pdf) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.onload = () => setScriptLoaded(true)
      document.head.appendChild(script)
    } else if (window.html2pdf) {
      setScriptLoaded(true)
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sales/audit-deliveries/${id}`)
        const data = await res.json()
        if (res.ok) {
          setAudit(data.audit)
        } else {
          setError(data.error || 'Failed to load audit.')
        }
      } catch {
        setError('Failed to load audit.')
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{ padding: '2rem', fontFamily: 'Helvetica, Arial, sans-serif' }}>Loading report...</div>
  if (error) return <div style={{ padding: '2rem', fontFamily: 'Helvetica, Arial, sans-serif', color: '#b91c1c' }}>{error}</div>
  if (!audit) return null

  const findings = audit.findings || []

  // Findings are stored in whatever order the AI produced them, which roughly
  // tracks the order reviews were pasted in — NOT how compelling they are.
  // Score each finding so the most PERSUASIVE ones surface first for the
  // client-facing report. Critically: a short, self-evident violation (e.g.
  // "trusting us with your care") is often MORE convincing to a prospect than
  // a multi-issue finding that needs a paragraph of explanation to justify —
  // even though the multi-issue one may carry more raw issue tags. Clarity is
  // weighted heavily; issue-tag count is a secondary factor, not the primary one.
  const impactScore = (f) => {
    const issues = (f.issues || []).map(i => i.toLowerCase())
    let score = 0
    if (issues.some(i => i.includes('privacy'))) score += 20
    if (issues.some(i => i.includes('grave') || i.includes('grief'))) score += 25
    if (issues.some(i => i.includes('combative'))) score += 4
    if (issues.some(i => i.includes('billing'))) score += 4
    if (issues.some(i => i.includes('staff'))) score += 4
    if (issues.some(i => i.includes('false resolution'))) score += 4
    const phraseWords = (f.violating_phrase || '').trim().split(/\s+/).filter(Boolean).length
    if (phraseWords > 0 && phraseWords <= 6) score += 18
    else if (phraseWords > 0 && phraseWords <= 10) score += 8
    score += Math.min((f.original_excerpt || '').length / 100, 3)
    return score
  }

  const allCritical = findings
    .filter(f => (f.severity || '').toLowerCase() === 'critical')
    .sort((a, b) => impactScore(b) - impactScore(a))
  const featuredCritical = allCritical.filter(f => f.featured && !f.needsManualReview)
  const unfeaturedCritical = allCritical.filter(f => !f.featured && !f.needsManualReview)
  const flaggedCritical = allCritical.filter(f => f.needsManualReview)
  const critical = [...featuredCritical, ...unfeaturedCritical, ...flaggedCritical]
  const moderate = findings.filter(f => (f.severity || '').toLowerCase() === 'moderate')
  const minor = findings.filter(f => (f.severity || '').toLowerCase() === 'minor')

  const featuredNonCritical = findings
    .filter(f => (f.severity || '').toLowerCase() !== 'critical' && f.featured && !f.needsManualReview)
    .sort((a, b) => impactScore(b) - impactScore(a))

  const gTotal = audit.total_reviews || 0
  const gResp = audit.reviews_with_responses || 0
  const gText = audit.reviews_with_text || 0
  const gNeg = audit.negative_unresponded || 0
  const yTotal = audit.yelp_total_reviews || 0
  const yResp = audit.yelp_reviews_with_responses || 0
  const yText = audit.yelp_reviews_with_text || yTotal
  const yNeg = audit.yelp_negative_unresponded || 0

  const combinedTotal = gTotal + yTotal
  const combinedResp = gResp + yResp
  const combinedNeg = gNeg + yNeg
  const combinedText = gText + yText
  const combinedRate = combinedText > 0 ? ((combinedResp / combinedText) * 100).toFixed(1) + '%' : 'N/A'

  const shown = [...featuredCritical, ...featuredNonCritical, ...unfeaturedCritical].slice(0, 5)
  const shownCriticalCount = shown.filter(f => (f.severity || '').toLowerCase() === 'critical').length
  const overflow = critical.length - shownCriticalCount

  const summaryParts = (audit.summary || '').split('--- Batch')
  const summary = summaryParts[summaryParts.length - 1].replace(/^\s*\d+\s*---\s*/, '').trim()

  const categoryOf = (f) => {
    const issues = (f.issues || []).map(i => i.toLowerCase())
    if (issues.some(i => i.includes('grave') || i.includes('grief'))) return 'grave'
    if (issues.some(i => i.includes('staff'))) return 'staff'
    if (issues.some(i => i.includes('combative'))) return 'combative'
    if (issues.some(i => i.includes('billing'))) return 'billing'
    if (issues.some(i => i.includes('false resolution'))) return 'resolution'
    return 'privacy'
  }
  const rewritableShown = shown.filter(f => f.rewrite)
  const priority = ['grave', 'combative', 'staff', 'resolution', 'privacy', 'billing']
  const inlineRewriteIds = (() => {
    if (rewritableShown.length === 0) return new Set()
    if (rewritableShown.length === 1) return new Set([shown.indexOf(rewritableShown[0])])
    const first = [...rewritableShown].sort((a, b) => priority.indexOf(categoryOf(a)) - priority.indexOf(categoryOf(b)))[0]
    const firstCat = categoryOf(first)
    const second = rewritableShown.find(f => f !== first && categoryOf(f) !== firstCat) || rewritableShown.find(f => f !== first)
    const idxs = [shown.indexOf(first)]
    if (second) idxs.push(shown.indexOf(second))
    return new Set(idxs)
  })()

  const normalizeForMatch = (s) =>
    (s || '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()

  const highlightExcerpt = (text, phrase) => {
    if (!text) return null
    if (!phrase) return text
    let idx = text.indexOf(phrase)
    let matchLen = phrase.length
    if (idx === -1) {
      const normText = normalizeForMatch(text)
      const normPhrase = normalizeForMatch(phrase)
      if (normPhrase && normText.includes(normPhrase)) {
        const escaped = normPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')
        const re = new RegExp(escaped, 'i')
        const match = text.match(re)
        if (match) {
          idx = match.index
          matchLen = match[0].length
        }
      }
    }
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <b>{text.slice(idx, idx + matchLen)}</b>
        {text.slice(idx + matchLen)}
      </>
    )
  }

  const hasYelp = yTotal > 0
  const platforms = hasYelp ? 'Google & Yelp' : 'Google'
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const isHipaa = isHipaaIndustry(audit.industry)

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .report { padding: 0; }
          .page-break { page-break-before: always; }
          @page {
            margin: 0.5in 0.6in;
          }
        }
        .report {
          font-family: Helvetica, Arial, sans-serif;
          max-width: 780px;
          margin: 0 auto;
          padding: 1.5rem;
          color: #374151;
          font-size: 10pt;
          line-height: 1.5;
        }
        .top-bar { height: 6px; background: #C2410C; margin: -1.5rem -1.5rem 1.5rem -1.5rem; }
        .logo { height: 26px; margin-bottom: 1rem; display: block; }
        .label { font-size: 8pt; font-weight: 700; color: #C2410C; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
        .title { font-size: 22pt; font-weight: 700; color: #111827; margin: 0 0 2px 0; }
        .subtitle { font-size: 11pt; color: #6b7280; margin-bottom: 1rem; }
        .stats-bar { display: flex; background: #FFF7ED; border: 1px solid #e5e7eb; margin-bottom: 1rem; }
        .stat { flex: 1; text-align: center; padding: 10px 8px 8px; border-right: 1px solid #e5e7eb; }
        .stat:last-child { border-right: none; }
        .stat-num { font-size: 22pt; font-weight: 700; color: #111827; }
        .stat-num.red { color: #b91c1c; }
        .stat-num.orange { color: #C2410C; }
        .stat-label { font-size: 7.5pt; color: #6b7280; margin-top: 2px; }
        .body { font-size: 9.5pt; color: #374151; margin-bottom: 8px; }
        .platform-line { font-size: 8pt; color: #6b7280; margin-bottom: 4px; }
        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
        .finding-wrap { margin-bottom: 8px; border: 1px solid #e5e7eb; }
        .finding { display: flex; }
        .finding-bar { width: 4px; background: #b91c1c; flex-shrink: 0; }
        .finding-content { padding: 8px 12px; flex: 1; }
        .finding-header { font-size: 9pt; font-weight: 700; margin-bottom: 4px; }
        .finding-header .crit { color: #b91c1c; }
        .finding-header .mod { color: #C2410C; }
        .finding-header .tags { color: #6b7280; font-weight: 400; font-size: 8pt; margin-left: 8px; }
        .finding-review { font-size: 8.5pt; color: #6b7280; font-style: italic; margin-bottom: 3px; }
        .finding-response { font-size: 9pt; color: #374151; margin-bottom: 0; }
        .finding-response b { color: #b91c1c; }
        .overflow { font-size: 9.5pt; font-weight: 700; color: #374151; margin: 8px 0; }
        .neg-note { font-size: 9.5pt; margin: 8px 0; }
        .neg-note b { color: #111827; }
        .example-section { margin-top: 12px; }
        .rewrite-card { display: flex; border: 1px solid #e5e7eb; margin-top: 6px; }
        .rewrite-bar { width: 4px; background: #15803d; flex-shrink: 0; }
        .rewrite-content { padding: 8px 12px; flex: 1; }
        .rewrite-label { font-size: 7.5pt; font-weight: 700; color: #15803d; text-transform: uppercase; margin-bottom: 2px; }
        .rewrite-text { font-size: 8.5pt; color: #374151; }
        .rewrite-note { font-size: 8pt; color: #6b7280; font-style: italic; margin-top: 4px; }
        .reco-section { margin-top: 1rem; }
        .reco-h2 { font-size: 15pt; font-weight: 700; color: #111827; margin-bottom: 8px; }
        .reco-step { font-size: 9.5pt; margin-bottom: 6px; }
        .cta-box { background: #FFF7ED; border: 2px solid #C2410C; padding: 20px; text-align: center; margin: 16px 0; border-radius: 8px; }
        .cta-head { font-size: 15pt; font-weight: 700; color: #111827; margin-bottom: 6px; }
        .cta-body { font-size: 10pt; color: #374151; margin-bottom: 8px; }
        .cta-price { font-size: 13pt; font-weight: 700; color: #C2410C; margin-bottom: 4px; }
        .fine-print { font-size: 8pt; color: #6b7280; font-style: italic; margin-top: 16px; }
        .footer { font-size: 7.5pt; color: #6b7280; text-align: center; margin-top: 20px; padding-top: 8px; border-top: 1px solid #e5e7eb; }
        .print-btn { background: #C2410C; color: white; border: none; padding: 10px 24px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; margin: 1rem auto; display: block; }
        .print-btn:hover { background: #a3360a; }
      `}</style>

      <div className="no-print" style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <button className="print-btn" disabled={generating || !scriptLoaded} onClick={() => {
          if (!reportRef.current || !window.html2pdf) return
          setGenerating(true)
          const filename = `${(audit.business_name || 'Audit').replace(/[^a-zA-Z0-9]/g, '_')}_Reputation_Risk_Audit.pdf`
          const opt = {
            margin: [0.4, 0.5, 0.4, 0.5],
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          }
          window.html2pdf().set(opt).from(reportRef.current).save().then(() => setGenerating(false)).catch(() => setGenerating(false))
        }}>
          {generating ? 'Generating PDF...' : scriptLoaded ? 'Download PDF' : 'Loading...'}
        </button>
      </div>

      {audit.loom_talking_points && audit.loom_talking_points.length > 0 && (
        <div className="no-print" style={{ maxWidth: 780, margin: '0 auto', padding: '1rem 1.5rem' }}>
          <div style={{ background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 8, padding: '0.85rem 1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#C2410C' }}>
              🎥 Loom Script <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#9A3412' }}>(for you only — never shown to the client, and not included in the PDF above)</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#9A3412', marginTop: '0.2rem', marginBottom: '0.75rem' }}>
              Read the opening and close as written. Ad-lib through the bullets in the middle using this report on screen.
            </p>

            <p style={{ fontSize: '0.85rem', color: '#1a1a1a', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              Hi {audit.contact_name ? `Dr. ${audit.contact_name.split(' ').pop()}` : 'Dr. [LastName]'} — It&apos;s {rep?.name || '[Your Name]'} here from RespondPal.
              <br />I put together a Reputation Risk Audit for you and wanted to walk you through what I found.
              In particular I saw very similar patterns in your reviews that have resulted in HHS fines at other
              practices, so hopefully this is valuable intel for you.
            </p>

            <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.1rem' }}>
              {audit.loom_talking_points.map((point, i) => (
                <li key={i} style={{ fontSize: '0.85rem', color: '#1a1a1a', marginBottom: '0.4rem', lineHeight: 1.5 }}>
                  {point}
                </li>
              ))}
            </ul>

            <hr style={{ border: 'none', borderTop: '1px solid #FDBA74', margin: '0.6rem 0' }} />

            <p style={{ fontSize: '0.85rem', color: '#1a1a1a', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              Honestly, you&apos;re in a hard spot in today&apos;s world. AI is using review responses — or the
              lack of a response, not just the rating — to decide whether to promote you in search engines. But
              you also need to stay HIPAA and privacy compliant.
              <br /><br />
              That&apos;s where we come in. Our proprietary AI has reviewed tens of thousands of healthcare
              reviews to identify how to respond without confirming patient status, never referencing treatment
              or billing.
              <br /><br />
              Yet it still provides empathy for negative reviews, stays on brand for your business, and
              doesn&apos;t rotate the same five canned templates. And then we boost your reputation in the
              marketplace with a 24-hour response guarantee — all while staying compliant and simply taking this
              task off your plate.
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid #FDBA74', margin: '0.6rem 0' }} />

            <p style={{ fontSize: '0.85rem', color: '#1a1a1a', lineHeight: 1.6 }}>
              If you want us to simply help clean up the flagged reviews, we charge a one-time $197 fee. We do
              have a monthly service to protect you and take this off your plate moving forward.
              <br /><br />
              Either way, this report is yours to keep.
              <br /><br />
              If working together makes sense, let me know. Enjoy the day.
            </p>
          </div>
        </div>
      )}

      <div className="report" ref={reportRef}>
        <div className="top-bar" />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-dark.png" alt="RespondPal" style={{ height: 26, marginBottom: '1rem', display: 'block' }} />

        <div className="label">Reputation Risk Audit</div>
        <h1 className="title">{audit.business_name}</h1>
        <div className="subtitle">{now} &nbsp;|&nbsp; Platforms: {platforms}</div>

        <div className="stats-bar">
          <div className="stat">
            <div className="stat-num">{combinedTotal}</div>
            <div className="stat-label">Reviews audited</div>
          </div>
          <div className="stat">
            <div className="stat-num orange">{combinedRate}</div>
            <div className="stat-label">Response rate</div>
          </div>
          <div className="stat">
            <div className="stat-num red">{critical.length}</div>
            <div className="stat-label">Critical findings</div>
          </div>
          <div className="stat">
            <div className="stat-num orange">{combinedNeg}</div>
            <div className="stat-label">Negative unanswered</div>
          </div>
        </div>

        {summary && summary.split(/\n\s*\n/).map((para, i) => (
          para.trim() ? <p className="body" key={i} style={{ marginBottom: 10 }}>{para.trim()}</p> : null
        ))}

        {(moderate.length > 0 || minor.length > 0) && (
          <p className="body">
            <b>Beyond the critical items below, this audit also identified{' '}
            {[moderate.length > 0 && `${moderate.length} moderate`, minor.length > 0 && `${minor.length} minor`].filter(Boolean).join(' and ')}{' '}
            findings</b> that should be addressed — including defensive tone, billing arguments, and templated responses.
          </p>
        )}

        <p className="body">
          <b>Why this matters:</b> Google's AI Overviews, ChatGPT, and Perplexity now read your review responses to decide whether to recommend your business. Response quality directly shapes how AI represents you. A combative or privacy-violating response doesn't just hurt you with the one person who reads it — it trains AI to characterize your business negatively.
        </p>

        {isHipaa && critical.length > 0 && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6,
            padding: '0.75rem 1rem', margin: '0.5rem 0 0.75rem', fontSize: '8.5pt', color: '#7f1d1d',
          }}>
            <b>HIPAA enforcement context:</b> The privacy violations flagged in this report are the same patterns
            that have resulted in federal enforcement actions against other healthcare practices — including a
            $23,000 fine against a California dental practice (New Vision Dental, 2022), a $50,000 fine against
            a North Carolina dental practice (2022), and a $30,000 settlement with a New Jersey healthcare provider
            (Manasa Health Center, 2023) — all for disclosing protected health information in online review responses.
            Even confirming someone is a patient is a violation under the HIPAA Privacy Rule.
          </div>
        )}

        {gTotal > 0 && (
          <>
            <div className="label" style={{ marginTop: 12 }}>Google Business Profile</div>
            <div className="platform-line">
              {gTotal} visible reviews &nbsp;|&nbsp; {gText} with text &nbsp;|&nbsp;{' '}
              {gResp} responded to ({gText > 0 ? ((gResp / gText) * 100).toFixed(1) : 0}% of reviews with text) &nbsp;|&nbsp;{' '}
              {gNeg} negative unanswered
            </div>
          </>
        )}

        {hasYelp && (
          <>
            <div className="label" style={{ marginTop: 8 }}>Yelp Business Profile</div>
            <div className="platform-line">
              {yTotal} visible reviews &nbsp;|&nbsp; {yText} with text &nbsp;|&nbsp;{' '}
              {yResp} responded to ({yText > 0 ? ((yResp / yText) * 100).toFixed(1) : 0}% of reviews with text) &nbsp;|&nbsp;{' '}
              {yNeg} negative unanswered
            </div>
          </>
        )}

        {critical.length > 0 && (
          <>
            <hr className="divider" style={{ marginTop: 20 }} />
            <div className="label">Critical Findings</div>
            <h2 className="reco-h2" style={{ fontSize: '14pt' }}>
              {critical.length} responses on your profile require immediate attention.
            </h2>

            {shown.map((f, i) => (
              <div key={i} className="finding-wrap">
                <div className="finding">
                  <div className="finding-bar" />
                  <div className="finding-content">
                    <div className="finding-header">
                      <span className={(f.severity || '').toLowerCase() === 'critical' ? 'crit' : 'mod'}>
                        {(f.severity || 'CRITICAL').toUpperCase()}
                      </span>
                      <span className="tags">{(f.issues || []).join(', ')}</span>
                    </div>
                    {f.review_summary && (
                      <div className="finding-review">{f.review_summary}</div>
                    )}
                    {f.original_excerpt && (
                      <p className="finding-response">
                        <b>Your response:</b> &ldquo;{highlightExcerpt(f.original_excerpt, f.violating_phrase)}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
                {inlineRewriteIds.has(i) && f.rewrite && (
                  <div className="rewrite-card" style={{ margin: '0' }}>
                    <div className="rewrite-bar" />
                    <div className="rewrite-content">
                      <div className="rewrite-label">How we'd fix it</div>
                      <div className="rewrite-text">{f.rewrite}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {overflow > 0 && (
              <p className="overflow">
                + {overflow} additional critical finding{overflow > 1 ? 's' : ''} identified.{' '}
                Full details and rewrites are included with our Reputation Cleanup service.
              </p>
            )}
          </>
        )}

        {combinedNeg > 0 && (
          <p className="neg-note">
            <b>{combinedNeg} negative reviews (1-3★) have no response at all</b> across your profiles — each one visible to every potential customer and to AI search tools.
          </p>
        )}

        {critical.length > 0 && (
          <p className="rewrite-note" style={{ marginTop: 10 }}>
            The highlighted text above shows the exact language creating risk. Recommended rewrites for all {critical.length} critical findings are included with our Reputation Cleanup.
          </p>
        )}

        <div className="page-break" />
        <div className="reco-section">
          <h2 className="reco-h2">What I'd Recommend</h2>
          <p className="body">
            {critical.length > 0
              ? 'The critical responses flagged above carry real risk — privacy violations and combative tone that are visible to every potential customer and to AI search tools right now. Here\'s what I\'d do:'
              : 'Your profile is in solid shape overall. Here\'s what I\'d focus on to keep it that way and sharpen it further:'}
          </p>
          {(() => {
            const steps = []
            if (critical.length > 0) {
              steps.push({
                lead: 'Rewrite the flagged responses.',
                rest: ` The ${inlineRewriteIds.size} example${inlineRewriteIds.size === 1 ? '' : 's'} above show${inlineRewriteIds.size === 1 ? 's' : ''} what a compliant rewrite looks like — all ${critical.length} critical finding${critical.length === 1 ? '' : 's'} need the same treatment before they're safe to leave live. Getting the language exactly right without creating a new compliance risk is real work.`
              })
            }
            if (combinedNeg > 0) {
              steps.push({
                lead: `Respond to the ${combinedNeg} unanswered negative${combinedNeg === 1 ? '' : 's'}.`,
                rest: ' Every one is an opportunity to show future customers and AI that your business engages professionally.'
              })
            }
            if (moderate.length > 0) {
              steps.push({
                lead: `Clean up the ${moderate.length} moderate finding${moderate.length === 1 ? '' : 's'}.`,
                rest: ' Tone and consistency issues that are worth fixing even though they\'re lower risk than the critical items.'
              })
            }
            steps.push({
              lead: 'Protect it going forward.',
              rest: ' A clean profile doesn\'t stay clean on its own — new reviews need timely, on-brand responses every time.'
            })
            return steps.map((step, i) => (
              <p className="reco-step" key={i}>{i + 1}. <b>{step.lead}</b>{step.rest}</p>
            ))
          })()}
        </div>

        <div className="cta-box">
          <div className="cta-head">Want us to handle this for you?</div>
          <div className="cta-body">
            {(() => {
              const totalActions = critical.length + combinedNeg
              if (critical.length > 0) {
                return totalActions <= 30
                  ? `We'll rewrite all ${critical.length} flagged response${critical.length === 1 ? '' : 's'} — not just the ${inlineRewriteIds.size} shown above — and respond to all ${combinedNeg} unanswered negative${combinedNeg === 1 ? '' : 's'}.`
                  : `We'll rewrite your flagged responses and respond to your unanswered negatives — up to 30 combined — covering the bulk of what's here. With ${totalActions} total, we'll follow up with a quote for the rest.`
              }
              if (combinedNeg > 0) {
                return combinedNeg <= 30
                  ? `We'll respond to all ${combinedNeg} unanswered negative${combinedNeg === 1 ? '' : 's'} and keep your profile sharp going forward.`
                  : `We'll respond to your unanswered negatives — up to 30 — and follow up with a quote for the rest. Then we'll keep your profile sharp going forward.`
              }
              return 'We\'ll take every future review off your plate — responded to within 24 hours, every time.'
            })()}
          </div>
          <div className="cta-price">Reputation Cleanup — $197 one-time</div>
          <div style={{ marginTop: 10, marginBottom: 4 }}>
            <a href="https://buy.stripe.com/9B6fZj61x2lt7Dt7ZLebu04" style={{
              display: 'inline-block', background: '#111827', color: 'white',
              padding: '10px 28px', borderRadius: 6, fontWeight: 700, fontSize: '11pt',
              textDecoration: 'none'
            }}>Get your cleanup →</a>
          </div>
          <div className="cta-body" style={{ marginTop: 10 }}>
            And if you want it handled permanently — every new review, every platform, within 24 hours — our monthly service starts at $397/mo.
          </div>
        </div>

        <p className="fine-print">
          This report was generated by RespondPal's proprietary AI, calibrated across thousands of real business review responses in dental, legal, veterinary, auto repair, the trades, restaurants, and more.
        </p>

        <div className="footer">
          Confidential &nbsp;|&nbsp; respondpal.ai
        </div>
      </div>
    </>
  )
}
