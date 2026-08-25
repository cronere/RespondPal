'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AuditRequest() {
  const [pageTab, setPageTab] = useState('submit')
  const [leads, setLeads] = useState([])
  const [mode, setMode] = useState('existing')
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [form, setForm] = useState({
    business_name: '', contact_name: '', contact_email: '', contact_phone: '',
    industry: '', google_url: '', yelp_url: '', notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(null)

  const [deliveries, setDeliveries] = useState([])
  const [loadingDeliveries, setLoadingDeliveries] = useState(false)
  const [markingId, setMarkingId] = useState(null)

  const loadDeliveries = async () => {
    setLoadingDeliveries(true)
    try {
      const res = await fetch('/api/sales/audit-deliveries')
      const data = await res.json()
      if (res.ok) setDeliveries(data.audits || [])
    } catch {
      setError('Failed to load your audit requests.')
    }
    setLoadingDeliveries(false)
  }

  useEffect(() => {
    if (pageTab === 'track' && deliveries.length === 0) loadDeliveries()
  }, [pageTab])

  const markRepDelivered = async (auditId) => {
    setMarkingId(auditId)
    try {
      const res = await fetch(`/api/sales/audit-deliveries/${auditId}/deliver`, { method: 'POST' })
      if (res.ok) loadDeliveries()
      else setError('Failed to mark delivered.')
    } catch {
      setError('Something went wrong.')
    }
    setMarkingId(null)
  }

  useEffect(() => {
    fetch('/api/sales/leads')
      .then((r) => r.json())
      .then((d) => {
        const fetchedLeads = d.leads || []
        setLeads(fetchedLeads)
        if (fetchedLeads.length === 0) setMode('new')
      })
      .catch(() => {})
  }, [])

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const submit = async () => {
    if (mode === 'existing' && !selectedLeadId) return
    if (mode === 'new' && !form.business_name.trim()) return
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const payload = mode === 'existing' ? { lead_id: selectedLeadId } : form
      const res = await fetch('/api/sales/audit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        const name = mode === 'existing'
          ? leads.find((l) => l.id === selectedLeadId)?.business_name
          : form.business_name
        setSubmitted(name)
        setForm({ business_name: '', contact_name: '', contact_email: '', contact_phone: '', industry: '', google_url: '', yelp_url: '', notes: '' })
        setSelectedLeadId('')
      } else {
        setError(data.error || 'Failed to submit audit request.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSubmitting(false)
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Request an Audit</h1>
        <p className="admin-page-sub">
          For healthcare leads only — dental, chiropractic, med spa, physical therapy, and similar.
          Jacob personally reviews every finding for HIPAA compliance before anything goes out, so
          your part ends at submitting the business — no compliance judgment calls needed on your end.
        </p>
      </header>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
        {[
          { key: 'submit', label: 'Submit a Request' },
          { key: 'track', label: 'My Audit Requests' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setPageTab(t.key)}
            style={{
              padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem',
              color: pageTab === t.key ? '#C2410C' : '#6b7280',
              borderBottom: pageTab === t.key ? '2px solid #C2410C' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}

      {pageTab === 'submit' && (
      <>
        {submitted && (
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', maxWidth: 560, color: '#166534' }}>
            <strong>Submitted — {submitted}</strong> is now in the queue and logged in your Leads
            pipeline. Jacob will review it and the report typically goes out within 48 hours.
            {' '}
            <Link href="/sales/leads" style={{ color: '#15803d', fontWeight: 700 }}>View your leads →</Link>
          </div>
        )}

        <div className="drawer-section" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            type="button"
            className={mode === 'existing' ? 'rev-ai-btn' : 'rev-mini-btn'}
            onClick={() => setMode('existing')}
            disabled={leads.length === 0}
          >
            Pick an existing lead
          </button>
          <button
            type="button"
            className={mode === 'new' ? 'rev-ai-btn' : 'rev-mini-btn'}
            onClick={() => setMode('new')}
          >
            + New business
          </button>
        </div>

        {mode === 'existing' ? (
          leads.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              No leads yet — add one in My Leads first, or switch to &quot;New business&quot; and
              it&apos;ll be added to your leads automatically.
            </p>
          ) : (
            <label className="field">
              <span className="field-label">Which lead is this for? *</span>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                style={{ padding: '0.55rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', width: '100%' }}
              >
                <option value="">Select a lead…</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.business_name}{l.industry ? ` (${l.industry})` : ''}</option>
                ))}
              </select>
            </label>
          )
        ) : (
          <>
            <label className="field">
              <span className="field-label">Business name *</span>
              <input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="e.g. Mesa Dental" />
            </label>

            <div className="drawer-grid">
              <label className="field">
                <span className="field-label">Contact name</span>
                <input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Industry</span>
                <input value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="e.g. Dental, Chiropractic" />
              </label>
            </div>

            <div className="drawer-grid">
              <label className="field">
                <span className="field-label">Email</span>
                <input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Phone</span>
                <input value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} />
              </label>
            </div>

            <label className="field">
              <span className="field-label">Google Maps link</span>
              <input value={form.google_url} onChange={(e) => set('google_url', e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Yelp link</span>
              <input value={form.yelp_url} onChange={(e) => set('yelp_url', e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Notes</span>
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} style={{ minHeight: 70 }} />
            </label>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '-0.3rem' }}>
              This will also be added to your leads automatically.
            </p>
          </>
        )}

        <button
          className="rev-ai-btn"
          onClick={submit}
          disabled={submitting || (mode === 'existing' ? !selectedLeadId : !form.business_name.trim())}
          style={{ marginTop: '0.5rem' }}
        >
          {submitting ? 'Submitting…' : 'Submit Audit Request'}
        </button>
        </div>
      </>
      )}

      {pageTab === 'track' && (
        loadingDeliveries ? (
          <p className="admin-page-sub">Loading…</p>
        ) : deliveries.length === 0 ? (
          <p className="admin-page-sub">
            Nothing here yet — audits show up once Jacob finishes reviewing and pushes them to you.
          </p>
        ) : (
          <>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.75rem' }}>
              Ready to Deliver
            </h2>
            {deliveries.filter((a) => !a.rep_delivered_at).length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.5rem' }}>Nothing waiting right now.</p>
            ) : (
              <div className="demo-list" style={{ marginBottom: '2rem' }}>
                {deliveries.filter((a) => !a.rep_delivered_at).map((a) => (
                  <div className="response-demo-card" key={a.id} style={{ cursor: 'default' }}>
                    <div>
                      <div className="demo-card-name">{a.business_name}</div>
                      <div className="demo-card-meta">{a.industry || 'Industry not set'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a
                        href={`/sales/audit-deliveries/${a.id}/report`}
                        target="_blank"
                        rel="noreferrer"
                        className="rev-mini-btn"
                      >
                        View Report
                      </a>
                      <button className="rev-ai-btn" onClick={() => markRepDelivered(a.id)} disabled={markingId === a.id}>
                        {markingId === a.id ? 'Marking…' : 'Mark Delivered'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '0.75rem' }}>
              Delivered
            </h2>
            {deliveries.filter((a) => a.rep_delivered_at).length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>None delivered yet.</p>
            ) : (
              <div className="demo-list">
                {deliveries.filter((a) => a.rep_delivered_at).map((a) => (
                  <div className="response-demo-card" key={a.id} style={{ cursor: 'default' }}>
                    <div>
                      <div className="demo-card-name">{a.business_name}</div>
                      <div className="demo-card-meta">
                        {a.industry || 'Industry not set'} · Delivered {new Date(a.rep_delivered_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <a
                        href={`/sales/audit-deliveries/${a.id}/report`}
                        target="_blank"
                        rel="noreferrer"
                        className="rev-mini-btn"
                      >
                        View Report
                      </a>
                      {a.status === 'converted' && (
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d' }}>Converted 🎉</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}
    </div>
  )
}
