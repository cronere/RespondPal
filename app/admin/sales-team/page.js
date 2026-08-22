'use client'

import { useState, useEffect } from 'react'

const STAGE_LABELS = {
  lead: 'Lead',
  contacting: 'Contacting',
  response_sent: 'Response Sent',
  won: 'Won',
  lost: 'Lost',
}

function generateTempPassword() {
  // Readable-ish random password: two short words + a number, easy for
  // Jacob to read aloud or text to a new rep, not meant to be memorable
  // long-term since reps should change it eventually (no forced-change
  // flow yet — noted as a follow-up, not built today).
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export default function SalesTeam() {
  const [reps, setReps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newRep, setNewRep] = useState({ name: '', email: '', password: generateTempPassword() })
  const [justCreated, setJustCreated] = useState(null)
  const [selectedRep, setSelectedRep] = useState(null)
  const [repLeads, setRepLeads] = useState([])
  const [loadingLeads, setLoadingLeads] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sales-reps')
      const data = await res.json()
      if (res.ok) setReps(data.reps || [])
    } catch {
      setError('Failed to load sales reps.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const viewRepLeads = async (rep) => {
    setSelectedRep(rep)
    setLoadingLeads(true)
    setRepLeads([])
    try {
      const res = await fetch(`/api/admin/sales-reps/${rep.id}/leads`)
      const data = await res.json()
      if (res.ok) setRepLeads(data.leads || [])
    } catch {
      // drawer just shows empty state — not worth a separate error UI here
    }
    setLoadingLeads(false)
  }

  const openAdd = () => {
    setNewRep({ name: '', email: '', password: generateTempPassword() })
    setError('')
    setJustCreated(null)
    setShowAdd(true)
  }

  const createRep = async () => {
    if (!newRep.name.trim() || !newRep.email.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/sales-reps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRep),
      })
      const data = await res.json()
      if (res.ok) {
        setJustCreated({ ...newRep })
        load()
      } else {
        setError(data.error || 'Failed to create rep.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSaving(false)
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Sales Team</h1>
        <p className="admin-page-sub">
          Issue login credentials for Sales HQ. Reps sign in at{' '}
          <code style={{ background: '#f3f4f6', padding: '0.1rem 0.4rem', borderRadius: 4 }}>respondpal.ai/sales/login</code>{' '}
          with the email and password you set here.
        </p>
        <button className="rev-ai-btn" onClick={openAdd} style={{ marginTop: '1rem' }}>+ Add Sales Rep</button>
      </header>

      {loading ? (
        <p className="admin-page-sub">Loading…</p>
      ) : reps.length === 0 ? (
        <p className="admin-page-sub">No sales reps yet. Add your first one above.</p>
      ) : (
        <>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>Click a rep to see their leads.</p>
        <div className="demo-list">
          {reps.map((r) => (
            <div className="response-demo-card" key={r.id} onClick={() => viewRepLeads(r)} style={{ cursor: 'pointer' }}>
              <div>
                <div className="demo-card-name">{r.name}</div>
                <div className="demo-card-meta">{r.email} · added {new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <div className={`demo-status ${r.active ? 'demo-status-generated' : 'demo-status-draft'}`}>
                {r.active ? 'Active' : 'Inactive'}
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {showAdd && (
        <div className="drawer-overlay" onClick={() => setShowAdd(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="drawer-head">
              <h2>Add Sales Rep</h2>
              <button className="drawer-close" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <div className="drawer-body">

            {justCreated ? (
              <div className="drawer-section">
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
                  <strong>{justCreated.name}</strong> can now sign in at <code>respondpal.ai/sales/login</code>
                </div>
                <label className="field">
                  <span className="field-label">Email</span>
                  <input value={justCreated.email} readOnly />
                </label>
                <label className="field">
                  <span className="field-label">Temporary password — send this to them now, it won&apos;t be shown again</span>
                  <input value={justCreated.password} readOnly style={{ fontFamily: 'monospace', fontWeight: 700 }} />
                </label>
                <button className="rev-ai-btn" onClick={() => setShowAdd(false)} style={{ marginTop: '0.5rem' }}>Done</button>
              </div>
            ) : (
              <div className="drawer-section">
                <label className="field">
                  <span className="field-label">Full name</span>
                  <input
                    value={newRep.name}
                    onChange={(e) => setNewRep({ ...newRep, name: e.target.value })}
                    placeholder="Jane Smith"
                  />
                </label>
                <label className="field">
                  <span className="field-label">Email</span>
                  <input
                    type="email"
                    value={newRep.email}
                    onChange={(e) => setNewRep({ ...newRep, email: e.target.value })}
                    placeholder="jane@example.com"
                  />
                </label>
                <label className="field">
                  <span className="field-label">Temporary password</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      value={newRep.password}
                      onChange={(e) => setNewRep({ ...newRep, password: e.target.value })}
                      style={{ fontFamily: 'monospace' }}
                    />
                    <button
                      type="button"
                      className="rev-mini-btn"
                      onClick={() => setNewRep({ ...newRep, password: generateTempPassword() })}
                    >
                      Regenerate
                    </button>
                  </div>
                </label>

                {error && <div className="admin-error">{error}</div>}

                <button className="rev-ai-btn" onClick={createRep} disabled={saving} style={{ marginTop: '0.5rem' }}>
                  {saving ? 'Creating…' : 'Create Rep'}
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {selectedRep && (
        <div className="drawer-overlay" onClick={() => setSelectedRep(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="drawer-head">
              <h2>{selectedRep.name}&apos;s Leads</h2>
              <button className="drawer-close" onClick={() => setSelectedRep(null)}>×</button>
            </div>
            <div className="drawer-body">
              {loadingLeads ? (
                <p className="admin-page-sub">Loading…</p>
              ) : repLeads.length === 0 ? (
                <p className="admin-page-sub">No leads yet for this rep.</p>
              ) : (
                <div className="demo-list">
                  {repLeads.map((l) => (
                    <div className="response-demo-card" key={l.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem', cursor: 'default' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="demo-card-name">{l.business_name}</div>
                          <div className="demo-card-meta">
                            {l.industry || 'Industry not set'}
                            {l.contact_name ? ` · ${l.contact_name}` : ''}
                            {l.contact_email ? ` · ${l.contact_email}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize', color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {STAGE_LABELS[l.stage] || l.stage}
                        </span>
                      </div>
                      {l.notes && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{l.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
