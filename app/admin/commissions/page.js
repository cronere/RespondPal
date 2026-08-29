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
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingPeriods, setLoadingPeriods] = useState(false)
  const [approving, setApproving] = useState(null)
  const [error, setError] = useState('')
  const [resolving, setResolving] = useState(null)
  const [resolveForm, setResolveForm] = useState({ sales_rep_id: '', client_id: '' })
  const [editing, setEditing] = useState(null)
  const [resolvingChargeback, setResolvingChargeback] = useState(null)
  const [editForm, setEditForm] = useState({ commission_amount_cents: '', adjustment_note: '' })
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [adjustmentForm, setAdjustmentForm] = useState({ sales_rep_id: '', client_id: '', amount_dollars: '', effective_date: '', note: '' })
  const [savingAdjustment, setSavingAdjustment] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const url = tab === 'all' ? '/api/admin/commission-events'
        : tab === 'disputed' ? '/api/admin/commission-events?disputed=true'
        : `/api/admin/commission-events?status=${tab}`
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) setEvents(data.events || [])
      else setError(data.error || 'Failed to load.')
    } catch {
      setError('Something went wrong.')
    }
    setLoading(false)
  }

  const loadPeriods = async () => {
    setLoadingPeriods(true)
    setError('')
    try {
      const res = await fetch('/api/admin/payout-periods')
      const data = await res.json()
      if (res.ok) setPeriods(data.periods || [])
      else setError(data.error || 'Failed to load payout periods.')
    } catch {
      setError('Something went wrong.')
    }
    setLoadingPeriods(false)
  }

  const approvePeriod = async (period, rep) => {
    const approvalKey = `${period.period_start}::${rep.sales_rep_id}`
    setApproving(approvalKey)
    try {
      const res = await fetch('/api/admin/payout-periods/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: period.period_start,
          period_end: period.period_end,
          payout_date: period.payout_date,
          sales_rep_id: rep.sales_rep_id,
        }),
      })
      if (res.ok) loadPeriods()
      else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to approve.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setApproving(null)
  }

  const markPaid = async (period, rep) => {
    const key = `${period.period_start}::${rep.sales_rep_id}`
    setApproving(key)
    try {
      const res = await fetch('/api/admin/payout-periods/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_start: period.period_start, sales_rep_id: rep.sales_rep_id }),
      })
      if (res.ok) loadPeriods()
      else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to mark as paid.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setApproving(null)
  }

  const unlockPeriod = async (period, rep) => {
    if (!confirm(`Unlock ${rep.name}'s ${period.period_start} to ${period.period_end} period? This reverts it to pending — you'll need to re-approve after making corrections.`)) return
    const key = `${period.period_start}::${rep.sales_rep_id}`
    setApproving(key)
    try {
      const res = await fetch('/api/admin/payout-periods/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_start: period.period_start, sales_rep_id: rep.sales_rep_id }),
      })
      if (res.ok) loadPeriods()
      else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to unlock period.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setApproving(null)
  }

  useEffect(() => {
    if (tab === 'payout_periods') loadPeriods()
    else load()
  }, [tab])

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

  const openEdit = (event) => {
    setEditing(event.id)
    setEditForm({
      commission_amount_cents: event.commission_amount_cents != null ? (event.commission_amount_cents / 100).toFixed(2) : '',
      adjustment_note: '',
    })
  }

  const submitEdit = async (eventId) => {
    const cents = Math.round(parseFloat(editForm.commission_amount_cents) * 100)
    if (isNaN(cents)) {
      setError('Enter a valid dollar amount.')
      return
    }
    if (!editForm.adjustment_note.trim()) {
      setError('A note explaining the correction is required.')
      return
    }
    try {
      const res = await fetch(`/api/admin/commission-events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commission_amount_cents: cents, adjustment_note: editForm.adjustment_note }),
      })
      if (res.ok) {
        setEditing(null)
        load()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to save correction.')
      }
    } catch {
      setError('Something went wrong.')
    }
  }

  const resolveDispute = async (eventId) => {
    try {
      const res = await fetch(`/api/admin/commission-events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolveDispute: true }),
      })
      if (res.ok) load()
      else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to resolve dispute.')
      }
    } catch {
      setError('Something went wrong.')
    }
  }

  const resolveChargeback = async (eventId) => {
    if (!confirm('Apply the correct clawback treatment for this chargeback? If the original payment was already paid out, this creates a deduction against a future payout instead of touching the paid record.')) return
    setResolvingChargeback(eventId)
    try {
      const res = await fetch(`/api/admin/commission-events/${eventId}/resolve-chargeback`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        load()
      } else {
        setError(data.error || 'Failed to resolve chargeback.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setResolvingChargeback(null)
  }

  const submitAdjustment = async () => {
    const cents = Math.round(parseFloat(adjustmentForm.amount_dollars) * 100)
    if (!adjustmentForm.sales_rep_id) {
      setError('Choose a sales rep.')
      return
    }
    if (isNaN(cents) || cents === 0) {
      setError('Enter a non-zero dollar amount (negative is fine, for a deduction).')
      return
    }
    if (!adjustmentForm.note.trim()) {
      setError('A note explaining this adjustment is required.')
      return
    }
    setSavingAdjustment(true)
    try {
      const res = await fetch('/api/admin/commission-events/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_rep_id: adjustmentForm.sales_rep_id,
          client_id: adjustmentForm.client_id || null,
          amount_cents: cents,
          effective_date: adjustmentForm.effective_date || null,
          note: adjustmentForm.note,
        }),
      })
      if (res.ok) {
        setShowAdjustment(false)
        setAdjustmentForm({ sales_rep_id: '', client_id: '', amount_dollars: '', effective_date: '', note: '' })
        if (tab === 'payout_periods') loadPeriods()
        else load()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to create adjustment.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSavingAdjustment(false)
  }

  // Clients don't inherently belong to whichever rep is selected in a
  // form — any client could theoretically need reassigning to a
  // different rep than what's on file, so nothing gets hidden. But
  // showing all clients with no regard to the selected rep meant Jacob
  // had to scroll the entire client list every time, regardless of who
  // he'd already picked. This groups the selected rep's own clients
  // (via clients.rep_name) to the top, everyone else below.
  const groupedClientOptions = (selectedRepId) => {
    const selectedRep = reps.find((r) => r.id === selectedRepId)
    if (!selectedRep) {
      return clients.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)
    }
    const repNameLower = selectedRep.name.trim().toLowerCase()
    const theirs = clients.filter((c) => c.rep_name && c.rep_name.trim().toLowerCase() === repNameLower)
    const theirIds = new Set(theirs.map((c) => c.id))
    const others = clients.filter((c) => !theirIds.has(c.id))
    return (
      <>
        {theirs.length > 0 && (
          <optgroup label={`${selectedRep.name}'s clients`}>
            {theirs.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </optgroup>
        )}
        <optgroup label={theirs.length > 0 ? 'All other clients' : 'All clients'}>
          {others.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
        </optgroup>
      </>
    )
  }

  const needsReviewCount = events.filter((e) => e.status === 'needs_review').length

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Commission Events</h1>
        <p className="admin-page-sub">
          Every payment, chargeback, and manual adjustment. Matched and reviewed payments show
          their calculated commission automatically. Approve a rep&apos;s portion of a payout
          period on the Payout Periods tab once you&apos;re confident it&apos;s correct.
        </p>
        <button className="rev-mini-btn" onClick={() => setShowAdjustment(true)} style={{ marginTop: '0.75rem' }}>
          + Add Manual Adjustment
        </button>
      </header>

      {showAdjustment && (
        <div className="drawer-overlay" onClick={() => setShowAdjustment(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <h2>Manual Adjustment</h2>
              <button className="drawer-close" onClick={() => setShowAdjustment(false)}>×</button>
            </div>
            <div className="drawer-body">
              <div className="drawer-section">
                <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.9rem' }}>
                  For a one-off correction, bonus, or manually-applied clawback that isn&apos;t tied
                  to a real Stripe payment. Flows into the same payout period and approval workflow
                  as everything else. Use a negative amount for a deduction.
                </p>
                <label className="field">
                  <span className="field-label">Sales rep *</span>
                  <select
                    value={adjustmentForm.sales_rep_id}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, sales_rep_id: e.target.value })}
                    style={{ padding: '0.55rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', width: '100%' }}
                  >
                    <option value="">Select a rep…</option>
                    {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Client (optional)</span>
                  <select
                    value={adjustmentForm.client_id}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, client_id: e.target.value })}
                    style={{ padding: '0.55rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', width: '100%' }}
                  >
                    <option value="">— none —</option>
                    {groupedClientOptions(adjustmentForm.sales_rep_id)}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Amount ($) *</span>
                  <input
                    value={adjustmentForm.amount_dollars}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount_dollars: e.target.value })}
                    placeholder="e.g. 50.00 or -25.00"
                  />
                </label>
                <label className="field">
                  <span className="field-label">Effective date (defaults to today)</span>
                  <input
                    type="date"
                    value={adjustmentForm.effective_date}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, effective_date: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Note *</span>
                  <textarea
                    value={adjustmentForm.note}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, note: e.target.value })}
                    placeholder="Why this adjustment exists"
                    style={{ minHeight: 70 }}
                  />
                </label>
                {error && <div className="admin-error">{error}</div>}
                <button className="rev-ai-btn" onClick={submitAdjustment} disabled={savingAdjustment} style={{ marginTop: '0.5rem' }}>
                  {savingAdjustment ? 'Saving…' : 'Add Adjustment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
        {[
          { key: 'needs_review', label: 'Needs Review' },
          { key: 'matched', label: 'Matched' },
          { key: 'reviewed', label: 'Reviewed' },
          { key: 'disputed', label: 'Disputed' },
          { key: 'all', label: 'All' },
          { key: 'payout_periods', label: 'Payout Periods' },
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

      {tab === 'payout_periods' ? null : loading ? (
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
                    {e.commission_amount_cents != null && (
                      <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700 }}>
                        → {formatMoney(e.commission_amount_cents)} commission
                        {e.commission_month != null && ` (month ${e.commission_month}, ${(e.commission_rate * 100).toFixed(0)}%)`}
                      </span>
                    )}
                    {e.adjusted && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400E', background: '#FFFBEB', padding: '0.1rem 0.4rem', borderRadius: 999 }}>
                        manually adjusted
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                    Rep: {e.sales_reps?.name || <span style={{ color: '#9ca3af' }}>unassigned</span>}
                    {' · '}
                    Client: {e.clients?.business_name || <span style={{ color: '#9ca3af' }}>unassigned</span>}
                    {e.match_method && ` · matched via ${e.match_method}`}
                  </div>
                  {e.payout_date && (
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.1rem' }}>
                      Payout window: {e.payout_period_start} to {e.payout_period_end} · scheduled {e.payout_date}
                    </div>
                  )}
                  {e.review_note && (
                    <div style={{ fontSize: '0.8rem', color: '#92400E', marginTop: '0.3rem' }}>{e.review_note}</div>
                  )}
                  {e.adjustment_note && (
                    <div style={{ fontSize: '0.8rem', color: '#92400E', marginTop: '0.3rem' }}>Adjustment: {e.adjustment_note}</div>
                  )}
                  {e.disputed && (
                    <div style={{ fontSize: '0.8rem', color: '#b23b30', marginTop: '0.3rem', fontWeight: 600 }}>
                      🚩 Disputed by rep: {e.dispute_note}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem' }}>{formatDate(e.created_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {e.status === 'needs_review' && resolving !== e.id && (
                    <button className="rev-mini-btn" onClick={() => openResolve(e)}>Resolve</button>
                  )}
                  {e.event_type !== 'chargeback' && editing !== e.id && (
                    <button className="rev-mini-btn" onClick={() => openEdit(e)}>Correct Amount</button>
                  )}
                  {e.event_type === 'chargeback' && e.status === 'needs_review' && (
                    <button className="rev-ai-btn" onClick={() => resolveChargeback(e.id)} disabled={resolvingChargeback === e.id}>
                      {resolvingChargeback === e.id ? 'Resolving…' : 'Resolve Chargeback'}
                    </button>
                  )}
                  {e.disputed && (
                    <button className="rev-mini-btn" onClick={() => resolveDispute(e.id)}>Mark Dispute Resolved</button>
                  )}
                </div>
              </div>

              {editing === e.id && (
                <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.8rem' }}>
                    <span style={{ display: 'block', color: '#6b7280', marginBottom: '0.2rem' }}>Correct commission amount ($)</span>
                    <input
                      value={editForm.commission_amount_cents}
                      onChange={(ev) => setEditForm({ ...editForm, commission_amount_cents: ev.target.value })}
                      style={{ padding: '0.45rem 0.6rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem', width: 120 }}
                    />
                  </label>
                  <label style={{ fontSize: '0.8rem', flex: 1, minWidth: 200 }}>
                    <span style={{ display: 'block', color: '#6b7280', marginBottom: '0.2rem' }}>Why is this being corrected?</span>
                    <input
                      value={editForm.adjustment_note}
                      onChange={(ev) => setEditForm({ ...editForm, adjustment_note: ev.target.value })}
                      style={{ padding: '0.45rem 0.6rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem', width: '100%' }}
                    />
                  </label>
                  <button className="rev-ai-btn" onClick={() => submitEdit(e.id)}>Save</button>
                  <button className="rev-mini-btn" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              )}

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
                      {groupedClientOptions(resolveForm.sales_rep_id)}
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

      {tab === 'payout_periods' && (
        loadingPeriods ? (
          <p className="admin-page-sub">Loading…</p>
        ) : periods.length === 0 ? (
          <p className="admin-page-sub">No payout periods yet — these appear once at least one commission has been calculated.</p>
        ) : (
          <div className="demo-list">
            {periods.map((p) => (
              <div key={p.period_start} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.1rem', marginBottom: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1a1a1a' }}>{p.period_start} to {p.period_end}</div>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Payout date: {p.payout_date}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1a1a1a' }}>{formatMoney(p.total_cents)}</div>
                </div>
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.6rem' }}>
                  {p.reps.map((r) => (
                    <div key={r.sales_rep_id || 'unassigned'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>
                      <span>
                        {r.name} ({r.count} payment{r.count === 1 ? '' : 's'})
                        <span style={{
                          marginLeft: '0.5rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                          color: r.status === 'paid' ? '#1e3a8a' : r.status === 'approved' ? '#15803d' : '#92400E',
                          background: r.status === 'paid' ? '#EFF6FF' : r.status === 'approved' ? '#F0FDF4' : '#FFFBEB',
                          padding: '0.1rem 0.4rem', borderRadius: 999,
                        }}>
                          {r.status}
                        </span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontWeight: 700 }}>{formatMoney(r.total_cents)}</span>
                        {r.status === 'pending' && r.sales_rep_id && (
                          <button
                            className="rev-mini-btn"
                            onClick={() => approvePeriod(p, r)}
                            disabled={approving === `${p.period_start}::${r.sales_rep_id}`}
                          >
                            {approving === `${p.period_start}::${r.sales_rep_id}` ? 'Approving…' : 'Approve'}
                          </button>
                        )}
                        {r.status === 'approved' && r.sales_rep_id && (
                          <>
                            <span title="Locked — corrections are blocked until unlocked" style={{ fontSize: '0.9rem' }}>🔒</span>
                            <button
                              className="rev-mini-btn"
                              onClick={() => unlockPeriod(p, r)}
                              disabled={approving === `${p.period_start}::${r.sales_rep_id}`}
                            >
                              {approving === `${p.period_start}::${r.sales_rep_id}` ? '…' : 'Unlock'}
                            </button>
                            <button
                              className="rev-ai-btn"
                              onClick={() => markPaid(p, r)}
                              disabled={approving === `${p.period_start}::${r.sales_rep_id}`}
                            >
                              {approving === `${p.period_start}::${r.sales_rep_id}` ? 'Marking…' : 'Mark as Paid'}
                            </button>
                          </>
                        )}
                        {r.status === 'paid' && (
                          <span title="Paid — locked permanently" style={{ fontSize: '0.9rem' }}>🔒</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab !== 'payout_periods' && needsReviewCount > 0 && tab !== 'needs_review' && (
        <p style={{ fontSize: '0.8rem', color: '#92400E', marginTop: '1rem' }}>
          {needsReviewCount} event{needsReviewCount === 1 ? '' : 's'} on this tab still need review.
        </p>
      )}
    </div>
  )
}
