'use client'

import { useState, useEffect } from 'react'

function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export default function CommissionEvents() {
  const [tab, setTab] = useState('needs_review')
  const [events, setEvents] = useState([])
  const [reps, setReps] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resolving, setResolving] = useState(null)
  const [resolveForm, setResolveForm] = useState({ sales_rep_id: '', client_id: '' })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const url = tab === 'all' ? '/api/admin/commission-events' : `/api/admin/commission-events?status=${tab}`
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) setEvents(data.events || [])
      else setError(data.error || 'Failed to load.')
    } catch {
      setError('Something went wrong.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [tab])

  useEffect(() => {
    fetch('/api/admin/sales-reps').then((r) => r.json()).then((d) => setReps(d.reps || [])).catch(() => {})
    fetch('/api/admin/clients').then((r) => r.json()).then((d) => setClients(d.clients || [])).catch(() => {})
  }, [])

  const openResolve = (event) => {
    setResolving(event.id)
    setResolveForm({ sales_rep_id: event.sales_rep_id || '', client_id: event.client_id || '' })
  }

  const submitResolve = async (eventId) => {
    try {
      const res = await fetch(`/api/admin/commission-events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolveForm),
      })
      if (res.ok) {
        setResolving(null)
        load()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to resolve.')
      }
    } catch {
      setError('Something went wrong.')
    }
  }

  const needsReviewCount = events.filter((e) => e.status === 'needs_review').length

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Commission Events</h1>
        <p className="admin-page-sub">
          Every payment and chargeback the Stripe webhook has received. This is the raw feed — the
          actual commission calculation and payout engine isn&apos;t built yet, so nothing here
          represents a finalized amount owed.
        </p>
      </header>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb' }}>
        {[
          { key: 'needs_review', label: 'Needs Review' },
          { key: 'matched', label: 'Matched' },
          { key: 'reviewed', label: 'Reviewed' },
          { key: 'all', label: 'All' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem',
              color: tab === t.key ? '#C2410C' : '#6b7280',
              borderBottom: tab === t.key ? '2px solid #C2410C' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p className="admin-page-sub">Loading…</p>
      ) : events.length === 0 ? (
        <p className="admin-page-sub">
          {tab === 'needs_review'
            ? 'Nothing needs review right now — either no events have come in yet, or everything matched automatically.'
            : 'Nothing here yet.'}
        </p>
      ) : (
        <div className="demo-list">
          {events.map((e) => (
            <div key={e.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                      color: e.event_type === 'chargeback' ? '#b23b30' : '#15803d',
                      background: e.event_type === 'chargeback' ? '#fdecea' : '#F0FDF4',
                      padding: '0.15rem 0.5rem', borderRadius: 999,
                    }}>
                      {e.event_type}
                    </span>
                    <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{formatMoney(e.amount_cents)}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                    Rep: {e.sales_reps?.name || <span style={{ color: '#9ca3af' }}>unassigned</span>}
                    {' · '}
                    Client: {e.clients?.business_name || <span style={{ color: '#9ca3af' }}>unassigned</span>}
                    {e.match_method && ` · matched via ${e.match_method}`}
                  </div>
                  {e.review_note && (
                    <div style={{ fontSize: '0.8rem', color: '#92400E', marginTop: '0.3rem' }}>{e.review_note}</div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem' }}>{formatDate(e.created_at)}</div>
                </div>
                {e.status === 'needs_review' && resolving !== e.id && (
                  <button className="rev-mini-btn" onClick={() => openResolve(e)}>Resolve</button>
                )}
              </div>

              {resolving === e.id && (
                <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.8rem' }}>
                    <span style={{ display: 'block', color: '#6b7280', marginBottom: '0.2rem' }}>Sales rep</span>
                    <select
                      value={resolveForm.sales_rep_id}
                      onChange={(ev) => setResolveForm({ ...resolveForm, sales_rep_id: ev.target.value })}
                      style={{ padding: '0.45rem 0.6rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    >
                      <option value="">— none —</option>
                      {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: '0.8rem' }}>
                    <span style={{ display: 'block', color: '#6b7280', marginBottom: '0.2rem' }}>Client</span>
                    <select
                      value={resolveForm.client_id}
                      onChange={(ev) => setResolveForm({ ...resolveForm, client_id: ev.target.value })}
                      style={{ padding: '0.45rem 0.6rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    >
                      <option value="">— none —</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                    </select>
                  </label>
                  <button className="rev-ai-btn" onClick={() => submitResolve(e.id)}>Save</button>
                  <button className="rev-mini-btn" onClick={() => setResolving(null)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {needsReviewCount > 0 && tab !== 'needs_review' && (
        <p style={{ fontSize: '0.8rem', color: '#92400E', marginTop: '1rem' }}>
          {needsReviewCount} event{needsReviewCount === 1 ? '' : 's'} on this tab still need review.
        </p>
      )}
    </div>
  )
}
