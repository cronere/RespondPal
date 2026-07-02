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

  const filtered = audits.filter(matchesTab)

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
  const [stats, setStats] = useState({
    total_reviews: audit.total_reviews || '',
    reviews_with_text: audit.reviews_with_text || '',
    reviews_with_responses: audit.reviews_with_responses || '',
    avg_star_rating: audit.avg_star_rating || '',
    google_url: audit.google_url || '',
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
    }, 'Saved.')
  }

  const setStat = (k, v) => setStats((s) => ({ ...s, [k]: v }))

  const runAnalysis = async () => {
    if (!rawInput.trim()) { setMsg('Paste their existing responses first.'); return }
    setAnalyzing(true); setMsg('')
    // Save the input first so it's not lost if analysis fails.
    await patch({ raw_input: rawInput })
    try {
      const res = await fetch(`/api/admin/audits/${audit.id}/analyze`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) { onUpdate(data.audit); setMsg('Analysis complete.') }
      else setMsg(data.error || 'Analysis failed.')
    } catch {
      setMsg('Analysis failed.')
    }
    setAnalyzing(false)
  }

  const markDelivered = () => patch({ status: 'delivered' }, 'Marked delivered.')
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

  const findings = (audit.findings || []).slice().sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  )

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
            <div className="drawer-section-label">Profile stats (from your CSV — fill in before running audit)</div>
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
                <span className="field-label">Avg star rating</span>
                <input type="number" step="0.1" value={stats.avg_star_rating} onChange={(e) => setStat('avg_star_rating', e.target.value)} placeholder="e.g. 3.8" />
              </label>
            </div>
            <label className="field">
              <span className="field-label">Google Maps URL</span>
              <input value={stats.google_url} onChange={(e) => setStat('google_url', e.target.value)} placeholder="https://maps.google.com/..." />
            </label>
            {stats.total_reviews && stats.reviews_with_responses && (
              <div className="qd-voice" style={{ marginTop: '0.5rem' }}>
                <strong>Response rate:</strong>{' '}
                {stats.reviews_with_text
                  ? `${((stats.reviews_with_responses / stats.reviews_with_text) * 100).toFixed(1)}% of text reviews, `
                  : ''}
                {((stats.reviews_with_responses / stats.total_reviews) * 100).toFixed(1)}% of all reviews
              </div>
            )}
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
              <button className="rev-ai-btn" onClick={runAnalysis} disabled={analyzing || saving || !rawInput.trim()}>
                {analyzing ? 'Analyzing…' : '🔍 Run audit'}
              </button>
            </div>
          </div>

          {audit.summary && (
            <div className="drawer-section">
              <div className="drawer-section-label">Summary</div>
              <p className="rev-review-text">{audit.summary}</p>
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
                    <div className="audit-finding-head">
                      <span className={`audit-severity-badge audit-severity-${f.severity}`}>
                        {f.severity}
                      </span>
                      {f.issues?.map((iss, j) => (
                        <span key={j} className="pill audit-issue-pill">{iss}</span>
                      ))}
                    </div>
                    <p className="audit-finding-excerpt">&ldquo;{f.original_excerpt}&rdquo;</p>
                    <p className="audit-finding-explanation">{f.explanation}</p>
                    {f.rewrite && (
                      <div className="audit-rewrite">
                        <div className="audit-rewrite-label">Suggested rewrite</div>
                        <p>{f.rewrite}</p>
                        <button className="rev-mini-btn" onClick={() => copyRewrite(f.rewrite)}>Copy</button>
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
          {audit.status === 'ready' && (
            <button className="drawer-btn-secondary" onClick={markDelivered} disabled={saving}>Mark delivered</button>
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
