'use client'

import { useState, useEffect } from 'react'

const STAGES = [
  { key: 'lead', label: 'Lead' },
  { key: 'contacting', label: 'Contacting' },
  { key: 'response_sent', label: 'Response Examples / Audit Sent' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
]

export default function SalesLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newLead, setNewLead] = useState({
    business_name: '', contact_name: '', contact_email: '', contact_phone: '',
    industry: '', google_url: '', yelp_url: '', notes: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/leads')
      const data = await res.json()
      if (res.ok) setLeads(data.leads || [])
    } catch {
      setError('Failed to load leads.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const createLead = async () => {
    if (!newLead.business_name.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/sales/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      })
      const data = await res.json()
      if (res.ok) {
        setShowAdd(false)
        setNewLead({ business_name: '', contact_name: '', contact_email: '', contact_phone: '', industry: '', google_url: '', yelp_url: '', notes: '' })
        load()
      } else {
        setError(data.error || 'Failed to create lead.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSaving(false)
  }

  const changeStage = async (leadId, stage) => {
    // Optimistic update — the pipeline should feel instant on a live call.
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage } : l)))
    try {
      await fetch(`/api/sales/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
    } catch {
      load() // fall back to a real refresh if the update failed silently
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>My Leads</h1>
        <p className="admin-page-sub">Your own pipeline. Only you can see these.</p>
        <button className="rev-ai-btn" onClick={() => setShowAdd(true)} style={{ marginTop: '1rem' }}>+ Add Lead</button>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p className="admin-page-sub">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="admin-page-sub">No leads yet. Add your first one above.</p>
      ) : (
        <div className="demo-list">
          {leads.map((l) => (
            <div className="response-demo-card" key={l.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="demo-card-name">{l.business_name}</div>
                  <div className="demo-card-meta">
                    {l.industry || 'Industry not set'}
                    {l.contact_name ? ` · ${l.contact_name}` : ''}
                    {l.contact_phone ? ` · ${l.contact_phone}` : ''}
                  </div>
                </div>
                <select
                  value={l.stage}
                  onChange={(e) => changeStage(l.id, e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
              {l.notes && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{l.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="drawer-overlay" onClick={() => setShowAdd(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="drawer-head">
              <h2>Add Lead</h2>
              <button className="drawer-close" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <div className="drawer-body">
              <div className="drawer-section">
                <label className="field">
                  <span className="field-label">Business name *</span>
                  <input value={newLead.business_name} onChange={(e) => setNewLead({ ...newLead, business_name: e.target.value })} placeholder="e.g. Mesa Dental" />
                </label>
                <div className="drawer-grid">
                  <label className="field">
                    <span className="field-label">Contact name</span>
                    <input value={newLead.contact_name} onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="field-label">Industry</span>
                    <input value={newLead.industry} onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })} placeholder="e.g. Restaurant" />
                  </label>
                </div>
                <div className="drawer-grid">
                  <label className="field">
                    <span className="field-label">Email</span>
                    <input type="email" value={newLead.contact_email} onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="field-label">Phone</span>
                    <input value={newLead.contact_phone} onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })} />
                  </label>
                </div>
                <label className="field">
                  <span className="field-label">Google Maps link</span>
                  <input value={newLead.google_url} onChange={(e) => setNewLead({ ...newLead, google_url: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">Yelp link</span>
                  <input value={newLead.yelp_url} onChange={(e) => setNewLead({ ...newLead, yelp_url: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">Notes</span>
                  <textarea value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} style={{ minHeight: 70 }} />
                </label>

                {error && <div className="admin-error">{error}</div>}

                <button className="rev-ai-btn" onClick={createLead} disabled={saving} style={{ marginTop: '0.5rem' }}>
                  {saving ? 'Adding…' : 'Add Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
