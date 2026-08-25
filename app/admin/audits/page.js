'use client'

import { useState, useEffect } from 'react'

const STATUS_TABS = [
  { key: 'needs_work', label: 'Needs work' },
  { key: 'ready', label: 'Ready to deliver' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'converted', label: 'Converted' },
  { key: 'all', label: 'All' },
]

const SEVERITY_ORDER = { critical: 0, moderate: 1, minor: 2, clean: 3 }

export default function AdminAudits() {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('needs_work')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/audits', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setAudits(data.audits)
      else setError(data.error || 'Failed to load audits.')
    } catch {
      setError('Failed to load.')
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const matchesTab = (a) => {
    if (tab === 'all') return true
    if (tab === 'ready') return a.status === 'ready'
    if (tab === 'delivered') return a.status === 'delivered'
    if (tab === 'converted') return a.status === 'converted'
    // needs_work = new, awaiting_input, or analyzing
    return ['new', 'awaiting_input', 'analyzing'].includes(a.status)
  }

  const filtered = audits.filter(matchesTab).filter((a) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (a.business_name || '').toLowerCase().includes(q) ||
      (a.contact_name || '').toLowerCase().includes(q) ||
      (a.contact_email || '').toLowerCase().includes(q) ||
      (a.industry || '').toLowerCase().includes(q)
    )
  })

  const counts = {
    needs_work: audits.filter((a) => ['new', 'awaiting_input', 'analyzing'].includes(a.status)).length,
    ready: audits.filter((a) => a.status === 'ready').length,
    delivered: audits.filter((a) => a.status === 'delivered').length,
    converted: audits.filter((a) => a.status === 'converted').length,
    all: audits.length,
  }

  const upsertAudit = (updated) =>
    setAudits((prev) => {
      const exists = prev.some((a) => a.id === updated.id)
      return exists ? prev.map((a) => (a.id === updated.id ? updated : a)) : [updated, ...prev]
    })

  const removeAudit = (id) => setAudits((prev) => prev.filter((a) => a.id !== id))

  return (
    <div className="admin-page admin-page-wide">
      <header className="admin-page-head admin-page-head-row">
        <div>
          <h1>Reputation Risk Audits</h1>
          <p className="admin-page-sub">
            {loading ? 'Loading…' : `${counts.needs_work} in progress · ${counts.ready} ready to deliver`}
          </p>
        </div>
        <div className="rev-head-actions">
          <button className="admin-refresh-btn" onClick={loadAll} disabled={loading}>↻ Refresh</button>
          <button className="rev-add-btn" onClick={() => setAdding(true)}>+ Add lead</button>
        </div>
      </header>

      <input
        className="clients-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by business, contact, email, or industry…"
        style={{ marginBottom: '1rem' }}
      />

      <div className="clients-filters rev-tabs">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            className={`clients-filter${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span className="filter-count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {loading ? (
        <div className="clients-empty">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="clients-empty">
          {tab === 'needs_work'
            ? 'No audits in progress. New requests from the audit landing page will show up here.'
            : 'No audits in this view.'}
        </div>
      ) : (
        <div className="rev-list">
          {filtered.map((a) => (
            <AuditCard key={a.id} audit={a} onOpen={() => setSelected(a)} />
          ))}
        </div>
      )}

      {adding && (
        <AddAuditModal
          onClose={() => setAdding(false)}
          onAdded={(a) => { upsertAudit(a); setAdding(false); setSelected(a) }}
        />
      )}

      {selected && (
        <AuditDrawer
          audit={selected}
          onClose={() => setSelected(null)}
          onUpdate={(a) => { upsertAudit(a); setSelected(a) }}
          onDelete={(id) => { removeAudit(id); setSelected(null) }}
        />
      )}
    </div>
  )
}

function statusLabel(status) {
  return {
    new: 'New lead',
    awaiting_input: 'Awaiting input',
    analyzing: 'Analyzing…',
    ready: 'Ready to deliver',
    delivered: 'Delivered',
    converted: 'Converted',
    archived: 'Archived',
  }[status] || status
}

function AuditCard({ audit, onOpen }) {
  const findings = audit.findings || []
  const criticalCount = findings.filter((f) => f.severity === 'critical').length
  return (
    <button className="rev-card" onClick={onOpen}>
      <div className="rev-card-top">
        <span className="rev-platform">{audit.source || 'direct'}</span>
        {audit.promo_code && <span className="pill">{audit.promo_code}</span>}
        <span className={`pill rev-status-${audit.status}`}>{statusLabel(audit.status)}</span>
        {criticalCount > 0 && <span className="pill audit-critical-pill">{criticalCount} critical</span>}
      </div>
      <div className="rev-card-biz">{audit.business_name}</div>
      <div className="rev-card-reviewer">{audit.contact_name || audit.contact_email}</div>
      <p className="rev-card-text">
        {audit.summary || (audit.raw_input ? <em>Not yet analyzed — click Analyze to run the scan.</em> : <em>Waiting on the business to send their existing responses.</em>)}
      </p>
    </button>
  )
}

function AddAuditModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    business_name: '', contact_name: '', contact_email: '', contact_phone: '', industry: '', source: 'direct',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.business_name.trim()) { setErr('Business name is required.'); return }
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/admin/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) onAdded(data.audit)
      else { setErr(data.error || 'Failed to add.'); setSaving(false) }
    } catch { setErr('Failed to add.'); setSaving(false) }
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="modal">
        <div className="modal-head">
          <h2>Add an audit lead</h2>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="field">
            <span className="field-label">Business name</span>
            <input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="e.g. Riverside HVAC" />
          </label>
          <div className="drawer-grid">
            <label className="field">
              <span className="field-label">Contact name</span>
              <input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Industry</span>
              <input value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="e.g. Dental" />
            </label>
          </div>
          <div className="drawer-grid">
            <label className="field">
              <span className="field-label">Email</span>
              <input value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Phone</span>
              <input value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span className="field-label">Source</span>
            <select value={form.source} onChange={(e) => set('source', e.target.value)}>
              <option value="direct">Direct / manual</option>
              <option value="facebook_ad">Facebook ad</option>
              <option value="cold_call">Cold call</option>
              <option value="referral">Referral</option>
            </select>
          </label>
          {err && <div className="drawer-error">{err}</div>}
        </div>
        <div className="modal-foot">
          <button className="drawer-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="drawer-btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Adding…' : 'Add lead'}
          </button>
        </div>
      </div>
    </>
  )
}

function AuditDrawer({ audit, onClose, onUpdate, onDelete }) {
  const [rawInput, setRawInput] = useState(audit.raw_input || '')
  const [summaryDraft, setSummaryDraft] = useState(audit.summary || '')
  const [editingSummary, setEditingSummary] = useState(false)
  const [editingRewriteIdx, setEditingRewriteIdx] = useState(null)
  const [rewriteDraft, setRewriteDraft] = useState('')
  const [regeneratingSummary, setRegeneratingSummary] = useState(false)
  const [stats, setStats] = useState({
    total_reviews: audit.total_reviews || '',
    reviews_with_text: audit.reviews_with_text || '',
    reviews_with_responses: audit.reviews_with_responses || '',
    avg_star_rating: audit.avg_star_rating || '',
    google_url: audit.google_url || '',
    negative_unresponded: audit.negative_unresponded || '',
    yelp_total_reviews: audit.yelp_total_reviews || '',
    yelp_reviews_with_text: audit.yelp_reviews_with_text || '',
    yelp_reviews_with_responses: audit.yelp_reviews_with_responses || '',
    yelp_avg_star_rating: audit.yelp_avg_star_rating || '',
    yelp_url: audit.yelp_url || '',
    yelp_negative_unresponded: audit.yelp_negative_unresponded || '',
  })
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [msg, setMsg] = useState('')

  const patch = async (payload, successMsg) => {
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`/api/admin/audits/${audit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) { onUpdate(data.audit); if (successMsg) setMsg(successMsg) }
      else setMsg(data.error || 'Save failed.')
    } catch { setMsg('Save failed.') }
    setSaving(false)
  }

  const saveInput = () => {
    const total = parseInt(stats.total_reviews) || 0
    const withText = parseInt(stats.reviews_with_text) || 0
    const withResp = parseInt(stats.reviews_with_responses) || 0
    patch({
      raw_input: rawInput,
      status: 'awaiting_input',
      total_reviews: total || null,
      reviews_with_text: withText || null,
      reviews_with_responses: withResp || null,
      response_rate_text: withText > 0 ? parseFloat(((withResp / withText) * 100).toFixed(1)) : null,
      response_rate_all: total > 0 ? parseFloat(((withResp / total) * 100).toFixed(1)) : null,
      avg_star_rating: parseFloat(stats.avg_star_rating) || null,
      google_url: stats.google_url || null,
      negative_unresponded: parseInt(stats.negative_unresponded) || null,
      yelp_total_reviews: parseInt(stats.yelp_total_reviews) || null,
      yelp_reviews_with_text: parseInt(stats.yelp_reviews_with_text) || null,
      yelp_reviews_with_responses: parseInt(stats.yelp_reviews_with_responses) || null,
      yelp_response_rate_text: (parseInt(stats.yelp_reviews_with_text) || 0) > 0
        ? parseFloat(((parseInt(stats.yelp_reviews_with_responses) / parseInt(stats.yelp_reviews_with_text)) * 100).toFixed(1))
        : null,
      yelp_response_rate_all: (parseInt(stats.yelp_total_reviews) || 0) > 0
        ? parseFloat(((parseInt(stats.yelp_reviews_with_responses) / parseInt(stats.yelp_total_reviews)) * 100).toFixed(1))
        : null,
      yelp_avg_star_rating: parseFloat(stats.yelp_avg_star_rating) || null,
      yelp_url: stats.yelp_url || null,
      yelp_negative_unresponded: parseInt(stats.yelp_negative_unresponded) || null,
    }, 'Saved.')
  }

  const saveStats = () => {
    const total = parseInt(stats.total_reviews) || 0
    const withText = parseInt(stats.reviews_with_text) || 0
    const withResp = parseInt(stats.reviews_with_responses) || 0
    patch({
      total_reviews: total || null,
      reviews_with_text: withText || null,
      reviews_with_responses: withResp || null,
      response_rate_text: withText > 0 ? parseFloat(((withResp / withText) * 100).toFixed(1)) : null,
      response_rate_all: total > 0 ? parseFloat(((withResp / total) * 100).toFixed(1)) : null,
      avg_star_rating: parseFloat(stats.avg_star_rating) || null,
      google_url: stats.google_url || null,
      negative_unresponded: parseInt(stats.negative_unresponded) || null,
      yelp_total_reviews: parseInt(stats.yelp_total_reviews) || null,
      yelp_reviews_with_text: parseInt(stats.yelp_reviews_with_text) || null,
      yelp_reviews_with_responses: parseInt(stats.yelp_reviews_with_responses) || null,
      yelp_response_rate_text: (parseInt(stats.yelp_reviews_with_text) || 0) > 0
        ? parseFloat(((parseInt(stats.yelp_reviews_with_responses) / parseInt(stats.yelp_reviews_with_text)) * 100).toFixed(1))
        : null,
      yelp_response_rate_all: (parseInt(stats.yelp_total_reviews) || 0) > 0
        ? parseFloat(((parseInt(stats.yelp_reviews_with_responses) / parseInt(stats.yelp_total_reviews)) * 100).toFixed(1))
        : null,
      yelp_avg_star_rating: parseFloat(stats.yelp_avg_star_rating) || null,
      yelp_url: stats.yelp_url || null,
      yelp_negative_unresponded: parseInt(stats.yelp_negative_unresponded) || null,
    }, 'Stats saved.')
  }

  const setStat = (k, v) => setStats((s) => ({ ...s, [k]: v }))

  const runAnalysis = async (mode = 'fresh') => {
    if (!rawInput.trim()) { setMsg('Paste their existing responses first.'); return }
    if (mode === 'fresh' && (audit.findings || []).length > 0) {
      const ok = window.confirm(
        `This audit already has ${audit.findings.length} findings saved. "Run audit" will REPLACE all of them with a fresh analysis of exactly what's currently in the text box below.\n\nIf you're adding MORE reviews on top of what's already been analyzed, click Cancel, ADD your new reviews to the END of what's already in the text box (don't remove the existing text), then use "+ Append as new batch".\n\nContinue and replace all existing findings?`
      )
      if (!ok) return
    }
    setAnalyzing(true); setMsg('')
    // raw_input is always saved as EXACTLY what's in the text box — no
    // separate history tracking, no accumulation behind the scenes. What you
    // see in the box is what gets analyzed and what gets stored. Simple and
    // predictable. If you're appending a second batch, paste it into the SAME
    // box below your first batch before clicking Append — don't clear and
    // replace, or the earlier batch won't be part of what's analyzed.
    const total = parseInt(stats.total_reviews) || 0
    const withText = parseInt(stats.reviews_with_text) || 0
    const withResp = parseInt(stats.reviews_with_responses) || 0
    await patch({
      raw_input: rawInput,
      total_reviews: total || null,
      reviews_with_text: withText || null,
      reviews_with_responses: withResp || null,
      response_rate_text: withText > 0 ? parseFloat(((withResp / withText) * 100).toFixed(1)) : null,
      response_rate_all: total > 0 ? parseFloat(((withResp / total) * 100).toFixed(1)) : null,
      avg_star_rating: parseFloat(stats.avg_star_rating) || null,
      google_url: stats.google_url || null,
      negative_unresponded: parseInt(stats.negative_unresponded) || null,
      yelp_total_reviews: parseInt(stats.yelp_total_reviews) || null,
      yelp_reviews_with_text: parseInt(stats.yelp_reviews_with_text) || null,
      yelp_reviews_with_responses: parseInt(stats.yelp_reviews_with_responses) || null,
      yelp_response_rate_text: (parseInt(stats.yelp_reviews_with_text) || 0) > 0
        ? parseFloat(((parseInt(stats.yelp_reviews_with_responses) / parseInt(stats.yelp_reviews_with_text)) * 100).toFixed(1))
        : null,
      yelp_response_rate_all: (parseInt(stats.yelp_total_reviews) || 0) > 0
        ? parseFloat(((parseInt(stats.yelp_reviews_with_responses) / parseInt(stats.yelp_total_reviews)) * 100).toFixed(1))
        : null,
      yelp_avg_star_rating: parseFloat(stats.yelp_avg_star_rating) || null,
      yelp_url: stats.yelp_url || null,
      yelp_negative_unresponded: parseInt(stats.yelp_negative_unresponded) || null,
    })
    try {
      const res = await fetch(`/api/admin/audits/${audit.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const data = await res.json()
      if (res.ok) {
        onUpdate(data.audit)
        setMsg(mode === 'append' ? 'Batch added to existing findings.' : 'Analysis complete — previous findings replaced.')
      }
      else setMsg(data.error || 'Analysis failed.')
    } catch {
      setMsg('Analysis failed.')
    }
    setAnalyzing(false)
  }

  const markDelivered = () => {
    // For rep-sourced audits, this same action IS "Push to Sales Rep" —
    // status becomes 'delivered' either way (admin's job is done), but the
    // rep gets their own separate ready-to-deliver/delivered tracking on
    // top of this via rep_delivered_at, which starts null the moment this
    // fires and only gets set when the rep confirms THEY'VE sent it.
    const message = audit.sales_rep_id
      ? 'Pushed to sales rep — they can now see and deliver this report.'
      : 'Marked delivered.'
    patch({ status: 'delivered' }, message)
  }
  const markConverted = () => patch({ status: 'converted' }, 'Marked converted — nice close!')
  const archive = () => patch({ status: 'archived' }, 'Archived.')

  const del = async () => {
    if (!confirm('Delete this audit lead?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/audits/${audit.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(audit.id)
    } catch {}
    setSaving(false)
  }

  // Same impact heuristic used on the client-facing report — ranks the most
  // PERSUASIVE findings first within each severity tier (clarity-weighted,
  // not just raw issue-tag count — see report page for full rationale), so
  // what's reviewed here in HQ matches what surfaces at the top of the report.
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

  const findings = (audit.findings || []).slice().sort((a, b) => {
    const sevDiff = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
    if (sevDiff !== 0) return sevDiff
    return impactScore(b) - impactScore(a)
  })

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
        <b style={{ color: '#b91c1c' }}>{text.slice(idx, idx + matchLen)}</b>
        {text.slice(idx + matchLen)}
      </>
    )
  }

  const regenerateSummary = async () => {
    if (regeneratingSummary) return
    setRegeneratingSummary(true); setMsg('')
    try {
      const res = await fetch(`/api/admin/audits/${audit.id}/regenerate-summary`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        onUpdate(data.audit)
        setMsg('Summary reformatted into paragraphs — no findings were changed.')
      } else {
        setMsg(data.error || 'Failed to regenerate summary.')
      }
    } catch {
      setMsg('Failed to regenerate summary.')
    }
    setRegeneratingSummary(false)
  }

  const toggleFeatured = (findingObj) => {
    const raw = audit.findings || []
    const idx = raw.indexOf(findingObj)
    if (idx === -1) return
    const updated = raw.map((item, i) => i === idx ? { ...item, featured: !item.featured } : item)
    patch({ findings: updated }, updated[idx].featured ? 'Featured for report — will show first.' : 'Unfeatured.')
  }

  const startEditRewrite = (findingObj) => {
    const raw = audit.findings || []
    const idx = raw.indexOf(findingObj)
    if (idx === -1) return
    setRewriteDraft(findingObj.rewrite || '')
    setEditingRewriteIdx(idx)
  }

  const saveRewrite = () => {
    if (editingRewriteIdx === null) return
    const raw = audit.findings || []
    // Editing manually clears needsManualReview/blockedPhrases — the human
    // has now personally reviewed and approved this exact text, which is
    // the actual point of a human-in-the-loop review step. If the new text
    // still contains something risky, that's on the next read-through, not
    // a stale flag left over from the AI's earlier attempt.
    const updated = raw.map((item, i) =>
      i === editingRewriteIdx
        ? { ...item, rewrite: rewriteDraft, needsManualReview: false, blockedPhrases: [] }
        : item
    )
    patch({ findings: updated }, 'Rewrite updated.')
    setEditingRewriteIdx(null)
  }

  const cancelEditRewrite = () => {
    setEditingRewriteIdx(null)
    setRewriteDraft('')
  }

  const copyRewrite = (text) => {
    navigator.clipboard?.writeText(text)
    setMsg('Rewrite copied to clipboard.')
  }

  const copyFullReport = () => {
    const lines = [
      `Reputation Risk Audit — ${audit.business_name}`,
      '',
      audit.summary || '',
      '',
      ...findings.map((f, i) =>
        `${i + 1}. [${(f.severity || '').toUpperCase()}] ${f.original_excerpt || ''}\n` +
        (f.issues?.length ? `   Issues: ${f.issues.join(', ')}\n` : '') +
        `   ${f.explanation || ''}\n` +
        (f.rewrite ? `   Suggested rewrite: ${f.rewrite}\n` : '   No changes needed.\n')
      ),
    ]
    navigator.clipboard?.writeText(lines.join('\n'))
    setMsg('Full report copied to clipboard.')
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <h2>{audit.business_name}</h2>
            <p className="drawer-sub">
              {audit.contact_name || 'No contact name'} · {audit.contact_email}
              {audit.industry ? ` · ${audit.industry}` : ''}
            </p>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-section-label">Google profile stats</div>
            <div className="drawer-grid">
              <label className="field">
                <span className="field-label">Total reviews (visible)</span>
                <input type="number" value={stats.total_reviews} onChange={(e) => setStat('total_reviews', e.target.value)} placeholder="e.g. 534" />
              </label>
              <label className="field">
                <span className="field-label">Reviews with text</span>
                <input type="number" value={stats.reviews_with_text} onChange={(e) => setStat('reviews_with_text', e.target.value)} placeholder="e.g. 389" />
              </label>
            </div>
            <div className="drawer-grid">
              <label className="field">
                <span className="field-label">Reviews with a response</span>
                <input type="number" value={stats.reviews_with_responses} onChange={(e) => setStat('reviews_with_responses', e.target.value)} placeholder="e.g. 28" />
              </label>
              <label className="field">
                <span className="field-label">1-3★ NOT responded to</span>
                <input type="number" value={stats.negative_unresponded} onChange={(e) => setStat('negative_unresponded', e.target.value)} placeholder="e.g. 22" />
              </label>
            </div>
            <div className="drawer-grid">
              <label className="field">
                <span className="field-label">Avg star rating</span>
                <input type="number" step="0.1" value={stats.avg_star_rating} onChange={(e) => setStat('avg_star_rating', e.target.value)} placeholder="e.g. 3.8" />
              </label>
              <label className="field">
                <span className="field-label">Google Maps URL</span>
                <input value={stats.google_url} onChange={(e) => setStat('google_url', e.target.value)} placeholder="https://maps.google.com/..." />
              </label>
            </div>
            {stats.total_reviews && stats.reviews_with_responses && (
              <div className="qd-voice" style={{ marginTop: '0.5rem' }}>
                <strong>Google response rate:</strong>{' '}
                {stats.reviews_with_text
                  ? `${((stats.reviews_with_responses / stats.reviews_with_text) * 100).toFixed(1)}% of text reviews, `
                  : ''}
                {((stats.reviews_with_responses / stats.total_reviews) * 100).toFixed(1)}% of all reviews
                {stats.negative_unresponded ? ` · ${stats.negative_unresponded} negative reviews unanswered` : ''}
              </div>
            )}
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Yelp profile stats</div>
            <div className="drawer-grid">
              <label className="field">
                <span className="field-label">Total reviews</span>
                <input type="number" value={stats.yelp_total_reviews} onChange={(e) => setStat('yelp_total_reviews', e.target.value)} placeholder="e.g. 85" />
              </label>
              <label className="field">
                <span className="field-label">Reviews with text</span>
                <input type="number" value={stats.yelp_reviews_with_text} onChange={(e) => setStat('yelp_reviews_with_text', e.target.value)} placeholder="e.g. 72" />
              </label>
            </div>
            <div className="drawer-grid">
              <label className="field">
                <span className="field-label">Reviews with a response</span>
                <input type="number" value={stats.yelp_reviews_with_responses} onChange={(e) => setStat('yelp_reviews_with_responses', e.target.value)} placeholder="e.g. 10" />
              </label>
              <label className="field">
                <span className="field-label">1-3★ NOT responded to</span>
                <input type="number" value={stats.yelp_negative_unresponded} onChange={(e) => setStat('yelp_negative_unresponded', e.target.value)} placeholder="e.g. 15" />
              </label>
            </div>
            <div className="drawer-grid">
              <label className="field">
                <span className="field-label">Avg star rating</span>
                <input type="number" step="0.1" value={stats.yelp_avg_star_rating} onChange={(e) => setStat('yelp_avg_star_rating', e.target.value)} placeholder="e.g. 3.5" />
              </label>
              <label className="field">
                <span className="field-label">Yelp URL</span>
                <input value={stats.yelp_url} onChange={(e) => setStat('yelp_url', e.target.value)} placeholder="https://yelp.com/biz/..." />
              </label>
            </div>
            {stats.yelp_total_reviews && stats.yelp_reviews_with_responses && (
              <div className="qd-voice" style={{ marginTop: '0.5rem' }}>
                <strong>Yelp response rate:</strong>{' '}
                {stats.yelp_reviews_with_text
                  ? `${((stats.yelp_reviews_with_responses / stats.yelp_reviews_with_text) * 100).toFixed(1)}% of text reviews, `
                  : ''}
                {((stats.yelp_reviews_with_responses / stats.yelp_total_reviews) * 100).toFixed(1)}% of all reviews
                {stats.yelp_negative_unresponded ? ` · ${stats.yelp_negative_unresponded} negative reviews unanswered` : ''}
              </div>
            )}
            <button
              className="rev-mini-btn"
              style={{ marginTop: '0.75rem', background: '#C2410C', color: 'white', border: 'none' }}
              onClick={saveStats}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Stats'}
            </button>
            {msg && <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>{msg}</span>}
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Their existing review responses</div>
            <p className="admin-page-sub" style={{ marginBottom: '0.6rem' }}>
              Paste in everything they've already posted publicly — copy/paste from screenshots or their profile. One response per block works best.
            </p>
            <textarea
              className="rev-draft"
              rows={8}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={'[5★] "Great service!" → "Thanks so much!"\n\n[1★] "Terrible experience..." → "We\'re sorry you feel that way, but..."'}
            />
            <div className="rev-draft-actions">
              <button className="rev-mini-btn" onClick={saveInput} disabled={saving || !rawInput.trim()}>Save</button>
              <button className="rev-ai-btn" onClick={() => runAnalysis('fresh')} disabled={analyzing || saving || !rawInput.trim()}>
                {analyzing ? 'Analyzing…' : '🔍 Run audit'}
              </button>
              {(audit.findings || []).length > 0 && (
                <button
                  className="rev-mini-btn"
                  onClick={() => runAnalysis('append')}
                  disabled={analyzing || saving || !rawInput.trim()}
                  title="Keeps existing findings and merges in this run's results — exact duplicates of already-found findings are automatically skipped."
                >
                  + Append as new batch
                </button>
              )}
            </div>
            {(audit.findings || []).length > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.35rem' }}>
                &quot;Run audit&quot; replaces all existing findings with a fresh analysis of exactly what&apos;s in the box above.
                To add more reviews without losing what&apos;s already found, keep the existing text in the box, add your
                new reviews to the end of it, then click &quot;Append as new batch&quot; — duplicates are automatically filtered out.
              </p>
            )}
          </div>

          {(audit.summary || editingSummary) && (
            <div className="drawer-section">
              <div className="rev-response-head">
                <div className="drawer-section-label">Summary</div>
                {!editingSummary && (
                  <>
                    <button
                      className="rev-mini-btn"
                      onClick={regenerateSummary}
                      disabled={regeneratingSummary}
                      title="Rewrites just the summary paragraph(s) using the findings already saved — does not re-analyze reviews or change any findings. Use this if a summary is stuck as one dense block."
                    >
                      {regeneratingSummary ? 'Reformatting…' : '↻ Reformat into paragraphs'}
                    </button>
                    <button className="rev-mini-btn" onClick={() => { setSummaryDraft(audit.summary || ''); setEditingSummary(true) }}>
                      Edit
                    </button>
                  </>
                )}
              </div>
              {editingSummary ? (
                <>
                  <textarea
                    className="rev-textarea"
                    style={{ minHeight: 140 }}
                    value={summaryDraft}
                    onChange={(e) => setSummaryDraft(e.target.value)}
                    placeholder="Top summary paragraph shown at the top of the client-facing report…"
                  />
                  <div className="rev-draft-actions">
                    <button
                      className="rev-mini-btn"
                      onClick={() => { setSummaryDraft(audit.summary || ''); setEditingSummary(false) }}
                    >
                      Cancel
                    </button>
                    <button
                      className="rev-ai-btn"
                      onClick={async () => {
                        await patch({ summary: summaryDraft }, 'Summary saved.')
                        setEditingSummary(false)
                      }}
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save Summary'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.4rem' }}>
                    Tip: if this audit was run in multiple batches, clean up any &quot;--- Batch 2 ---&quot; dividers here so the report reads as one cohesive paragraph.
                  </p>
                </>
              ) : (
                <div>
                  {audit.summary.split(/\n\s*\n/).map((para, i) => (
                    para.trim() ? <p className="rev-review-text" key={i} style={{ marginBottom: 8 }}>{para.trim()}</p> : null
                  ))}
                </div>
              )}
            </div>
          )}

          {audit.loom_talking_points && audit.loom_talking_points.length > 0 && (
            <div className="drawer-section" style={{ background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 8, padding: '0.85rem 1rem' }}>
              <div className="drawer-section-label" style={{ color: '#C2410C' }}>
                🎥 Loom Script <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#9A3412' }}>(internal only — not shown to the client)</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9A3412', marginTop: '0.2rem', marginBottom: '0.75rem' }}>
                Read the opening and close as written. Ad-lib through the bullets in the middle using this audit&apos;s report on screen.
              </p>

              <p style={{ fontSize: '0.85rem', color: '#1a1a1a', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                Hi {audit.contact_name ? `Dr. ${audit.contact_name.split(' ').pop()}` : 'Dr. [LastName]'} — It&apos;s Jacob Merkley here from RespondPal.
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
          )}

          {findings.length > 0 && (
            <div className="drawer-section">
              <div className="rev-response-head">
                <div className="drawer-section-label">Findings ({findings.length})</div>
                <button className="rev-mini-btn" onClick={copyFullReport}>Copy full report</button>
              </div>
              <div className="audit-findings">
                {findings.map((f, i) => (
                  <div key={i} className={`audit-finding audit-finding-${f.severity}`}>
                    {f.needsManualReview && (
                      <div style={{
                        background: '#FEF2F2', border: '1px solid #B91C1C', borderRadius: 6,
                        padding: '0.5rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#991B1B',
                      }}>
                        ⚠️ <b>Flagged after both compliance passes</b> — the rewrite below still contains a known-risky
                        phrase ({(f.blockedPhrases || []).join(', ')}). Do not feature or send as-is — edit manually first.
                      </div>
                    )}
                    <div className="audit-finding-head">
                      <span className={`audit-severity-badge audit-severity-${f.severity}`}>
                        {f.severity}
                      </span>
                      {f.issues?.map((iss, j) => (
                        <span key={j} className="pill audit-issue-pill">{iss}</span>
                      ))}
                      <button
                        className="rev-mini-btn"
                        style={{
                          marginLeft: 'auto',
                          background: f.featured ? '#C2410C' : undefined,
                          color: f.featured ? 'white' : undefined,
                          borderColor: f.featured ? '#C2410C' : undefined,
                        }}
                        onClick={() => toggleFeatured(f)}
                        disabled={saving}
                        title="Pin this finding to show in the client-facing report's top findings, regardless of its severity — its true severity badge still displays honestly."
                      >
                        {f.featured ? '★ Featured' : '☆ Feature in report'}
                      </button>
                    </div>
                    <p className="audit-finding-excerpt">&ldquo;{highlightExcerpt(f.original_excerpt, f.violating_phrase)}&rdquo;</p>
                    <p className="audit-finding-explanation">{f.explanation}</p>
                    {f.rewrite && (
                      <div className="audit-rewrite" style={f.needsManualReview ? { borderColor: '#B91C1C' } : undefined}>
                        <div className="audit-rewrite-label">Suggested rewrite</div>
                        {editingRewriteIdx === (audit.findings || []).indexOf(f) ? (
                          <>
                            <textarea
                              className="rev-textarea"
                              style={{ minHeight: 90 }}
                              value={rewriteDraft}
                              onChange={(e) => setRewriteDraft(e.target.value)}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                              <button className="rev-mini-btn" onClick={cancelEditRewrite} disabled={saving}>Cancel</button>
                              <button className="rev-ai-btn" onClick={saveRewrite} disabled={saving}>
                                {saving ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p>{f.rewrite}</p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="rev-mini-btn" onClick={() => startEditRewrite(f)}>Edit</button>
                              <button className="rev-mini-btn" onClick={() => copyRewrite(f.rewrite)}>Copy</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {msg && <div className="onb-message success">{msg}</div>}
        </div>

        <div className="drawer-foot rev-foot">
          <button className="rev-del-btn" onClick={del} disabled={saving}>Delete</button>
          {(audit.findings || []).length > 0 && (
            <a
              href={`/admin/audits/${audit.id}/report`}
              target="_blank"
              rel="noopener noreferrer"
              className="rev-mini-btn"
              style={{ padding: '0.6rem 1rem', textDecoration: 'none' }}
            >
              View Report ↗
            </a>
          )}
          {(audit.findings || []).length > 0 && audit.status !== 'ready' && audit.status !== 'delivered' && audit.status !== 'converted' && (
            <button
              className="rev-mini-btn"
              onClick={() => patch({ status: 'ready' }, 'Marked ready — findings were already there, just fixing the status.')}
              disabled={saving}
              title="Use this if the status got knocked back to 'needs work' by a failed re-run, but the findings below are still intact."
            >
              Mark ready
            </button>
          )}
          {audit.status === 'ready' && (
            <button className="drawer-btn-secondary" onClick={markDelivered} disabled={saving}>
              {audit.sales_rep_id ? 'Push to Sales Rep' : 'Mark delivered'}
            </button>
          )}
          {audit.status === 'delivered' && (
            <button className="drawer-btn-primary" onClick={markConverted} disabled={saving}>Mark converted ✓</button>
          )}
          {!['converted', 'archived'].includes(audit.status) && (
            <button className="drawer-btn-secondary" onClick={archive} disabled={saving}>Archive</button>
          )}
        </div>
      </div>
    </>
  )
}
