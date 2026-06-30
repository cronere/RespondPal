'use client'

import { useState, useEffect } from 'react'

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'all', label: 'All' },
]

export default function AdminFeedback() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('open')
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/feedback', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setItems(data.feedback)
      else setError(data.error || 'Failed to load feedback.')
    } catch {
      setError('Failed to load feedback.')
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const matches = (f) => {
    if (tab === 'all') return true
    if (tab === 'resolved') return f.status === 'resolved' || f.status === 'archived'
    return f.status === 'new' || f.status === 'in_progress'
  }
  const filtered = items.filter(matches)
  const counts = {
    open: items.filter((f) => f.status === 'new' || f.status === 'in_progress').length,
    resolved: items.filter((f) => f.status === 'resolved' || f.status === 'archived').length,
    all: items.length,
  }

  const upsert = (u) => setItems((prev) => prev.map((f) => (f.id === u.id ? u : f)))
  const remove = (id) => setItems((prev) => prev.filter((f) => f.id !== id))

  return (
    <div className="admin-page admin-page-wide">
      <header className="admin-page-head admin-page-head-row">
        <div>
          <h1>Feedback</h1>
          <p className="admin-page-sub">
            {loading ? 'Loading…' : `${counts.open} open`}
          </p>
        </div>
        <button className="admin-refresh-btn" onClick={load} disabled={loading}>↻ Refresh</button>
      </header>

      <div className="clients-filters">
        {TABS.map((t) => (
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
          {tab === 'open' ? 'No open feedback. Nice and clear.' : 'Nothing here.'}
        </div>
      ) : (
        <div className="fb-admin-list">
          {filtered.map((f) => (
            <button key={f.id} className="fb-admin-card" onClick={() => setSelected(f)}>
              <div className="fb-admin-top">
                <span className={`pill fb-type-${f.feedback_type}`}>
                  {f.feedback_type === 'change_request' ? 'Change request' : 'Guidance'}
                </span>
                <span className={`pill fb-status-${f.status}`}>{f.status.replace('_', ' ')}</span>
                {!f.client_id && <span className="fb-unmatched">unmatched</span>}
              </div>
              <div className="fb-admin-biz">{f.clients?.business_name || f.business_name}</div>
              <p className="fb-admin-snippet">
                {f.feedback_type === 'change_request' ? f.requested_change : f.guidance}
              </p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <FeedbackDrawer
          item={selected}
          onClose={() => setSelected(null)}
          onUpdate={(u) => { upsert(u); setSelected(u) }}
          onDelete={(id) => { remove(id); setSelected(null) }}
        />
      )}
    </div>
  )
}

function FeedbackDrawer({ item, onClose, onUpdate, onDelete }) {
  const [notes, setNotes] = useState(item.internal_notes || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const patch = async (payload, okMsg) => {
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`/api/admin/feedback/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) { onUpdate(data.feedback); if (okMsg) setMsg(okMsg) }
      else setMsg(data.error || 'Save failed.')
    } catch { setMsg('Save failed.') }
    setSaving(false)
  }

  const del = async () => {
    if (!confirm('Delete this feedback?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/feedback/${item.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(item.id)
    } catch {}
    setSaving(false)
  }

  const isChange = item.feedback_type === 'change_request'

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <h2>{item.clients?.business_name || item.business_name}</h2>
            <p className="drawer-sub">
              {isChange ? 'Change request' : 'Guidance for going forward'}
              {' · '}{new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {!item.client_id && (
            <div className="fb-unmatched-banner">
              No client match found for &ldquo;{item.business_name}&rdquo;. Check the business name against your client list.
            </div>
          )}

          {(item.contact_name || item.contact_email) && (
            <div className="drawer-section">
              <div className="drawer-section-label">Contact</div>
              <div className="fb-contact">
                {item.contact_name && <div className="fb-contact-name">{item.contact_name}</div>}
                {item.contact_email && (
                  <a href={`mailto:${item.contact_email}`}>{item.contact_email}</a>
                )}
              </div>
            </div>
          )}

          {isChange && item.review_reference && (
            <div className="drawer-section">
              <div className="drawer-section-label">Which response</div>
              <p className="fb-body-text">{item.review_reference}</p>
            </div>
          )}

          <div className="drawer-section">
            <div className="drawer-section-label">
              {isChange ? 'Requested change' : 'Guidance for future responses'}
            </div>
            <p className="fb-body-text">{isChange ? item.requested_change : item.guidance}</p>
            {!isChange && (
              <p className="fb-tip">
                Tip: add this to the client&apos;s Custom AI Instructions so it shapes every future response.
              </p>
            )}
            {isChange && item.contact_email && item.status !== 'resolved' && item.status !== 'archived' && (
              <p className="fb-tip">
                When you mark this resolved, we&apos;ll email {item.contact_email} to confirm the change is done.
              </p>
            )}
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Internal notes</div>
            <textarea
              className="rev-draft"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for yourself…"
            />
            <div className="rev-draft-actions">
              <button className="rev-mini-btn" onClick={() => patch({ internal_notes: notes }, 'Notes saved.')} disabled={saving}>
                Save notes
              </button>
            </div>
          </div>

          {msg && <div className="onb-message success">{msg}</div>}
        </div>

        <div className="drawer-foot rev-foot">
          <button className="rev-del-btn" onClick={del} disabled={saving}>Delete</button>
          {item.status === 'resolved' || item.status === 'archived' ? (
            <button className="drawer-btn-secondary" onClick={() => patch({ status: 'in_progress' }, 'Reopened.')} disabled={saving}>
              Reopen
            </button>
          ) : (
            <>
              {item.status === 'new' && (
                <button className="drawer-btn-secondary" onClick={() => patch({ status: 'in_progress' }, 'Marked in progress.')} disabled={saving}>
                  In progress
                </button>
              )}
              <button
                className="drawer-btn-primary"
                onClick={() => patch(
                  { status: 'resolved' },
                  isChange && item.contact_email
                    ? 'Resolved — confirmation email sent to the client.'
                    : 'Resolved.'
                )}
                disabled={saving}
              >
                Mark resolved
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
