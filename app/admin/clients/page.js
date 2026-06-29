'use client'

import { useState, useEffect } from 'react'

const STATUS_OPTIONS = ['onboarding', 'active', 'paused', 'cancelled']
const PLAN_LABELS = {
  monthly: 'Monthly',
  cleanup_only: 'Cleanup only',
  monthly_plus_cleanup: 'Monthly + Cleanup',
}
const TONE_OPTIONS = ['professional_friendly', 'warm_personal', 'formal', 'casual']
const CLEANUP_OPTIONS = ['not_applicable', 'not_started', 'in_progress', 'completed']

function StatusPill({ status }) {
  return <span className={`pill pill-${status}`}>{status}</span>
}

function AccessDot({ on }) {
  return <span className={`access-dot${on ? ' on' : ''}`} title={on ? 'Granted' : 'Not granted'} />
}

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const loadClients = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/clients')
      const data = await res.json()
      if (res.ok) setClients(data.clients)
      else setError(data.error || 'Failed to load clients.')
    } catch (err) {
      setError('Failed to load clients.')
    }
    setLoading(false)
  }

  useEffect(() => { loadClients() }, [])

  const filtered = clients.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (c.business_name || '').toLowerCase().includes(q) ||
        (c.owner_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.rep_name || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const counts = {
    all: clients.length,
    onboarding: clients.filter((c) => c.status === 'onboarding').length,
    active: clients.filter((c) => c.status === 'active').length,
    paused: clients.filter((c) => c.status === 'paused').length,
    cancelled: clients.filter((c) => c.status === 'cancelled').length,
  }

  const onSaved = (updated) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setSelected(null)
  }

  return (
    <div className="admin-page admin-page-wide">
      <header className="admin-page-head">
        <h1>Clients</h1>
        <p className="admin-page-sub">
          {loading ? 'Loading…' : `${clients.length} client${clients.length === 1 ? '' : 's'} total`}
        </p>
      </header>

      <div className="clients-toolbar">
        <input
          className="clients-search"
          placeholder="Search by business, owner, email, or rep…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="clients-filters">
          {['all', ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              className={`clients-filter${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s} <span className="filter-count">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {loading ? (
        <div className="clients-empty">Loading clients…</div>
      ) : filtered.length === 0 ? (
        <div className="clients-empty">
          {clients.length === 0
            ? 'No clients yet. They appear here once they complete onboarding.'
            : 'No clients match this filter.'}
        </div>
      ) : (
        <div className="clients-table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Owner</th>
                <th>Plan</th>
                <th>Loc.</th>
                <th>Status</th>
                <th>Access</th>
                <th>Rep</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)}>
                  <td className="cell-strong">{c.business_name}</td>
                  <td>{c.owner_name}</td>
                  <td>{PLAN_LABELS[c.plan] || c.plan}</td>
                  <td>{c.locations}</td>
                  <td><StatusPill status={c.status} /></td>
                  <td>
                    <span className="access-pair">
                      <AccessDot on={c.google_access} /> G
                      <AccessDot on={c.yelp_access} /> Y
                    </span>
                  </td>
                  <td className="cell-muted">{c.rep_name || '—'}</td>
                  <td className="cell-arrow">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ClientDrawer client={selected} onClose={() => setSelected(null)} onSaved={onSaved} />
      )}
    </div>
  )
}

function ClientDrawer({ client, onClose, onSaved }) {
  const [form, setForm] = useState(client)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) onSaved(data.client)
      else { setSaveError(data.error || 'Failed to save.'); setSaving(false) }
    } catch (err) {
      setSaveError('Failed to save.'); setSaving(false)
    }
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <h2>{client.business_name}</h2>
            <p className="drawer-sub">{client.email}</p>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-section-label">Status &amp; plan</div>
            <div className="drawer-grid">
              <Field label="Status">
                <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Plan">
                <select value={form.plan} onChange={(e) => set('plan', e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="monthly_plus_cleanup">Monthly + Cleanup</option>
                  <option value="cleanup_only">Cleanup only</option>
                </select>
              </Field>
              <Field label="Locations">
                <input type="number" min="1" value={form.locations || 1}
                  onChange={(e) => set('locations', parseInt(e.target.value) || 1)} />
              </Field>
              <Field label="Monthly rate ($)">
                <input type="number" value={form.monthly_rate || 0}
                  onChange={(e) => set('monthly_rate', parseInt(e.target.value) || 0)} />
              </Field>
              <Field label="Cleanup status">
                <select value={form.cleanup_status || 'not_applicable'}
                  onChange={(e) => set('cleanup_status', e.target.value)}>
                  {CLEANUP_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Access</div>
            <div className="drawer-toggles">
              <Toggle label="Google access granted" on={!!form.google_access}
                onChange={(v) => set('google_access', v)} />
              <Toggle label="Yelp access granted" on={!!form.yelp_access}
                onChange={(v) => set('yelp_access', v)} />
            </div>
            <Field label="Live date">
              <input type="date"
                value={form.live_date ? String(form.live_date).slice(0, 10) : ''}
                onChange={(e) => set('live_date', e.target.value || null)} />
            </Field>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Contact</div>
            <div className="drawer-grid">
              <Field label="Owner name">
                <input value={form.owner_name || ''} onChange={(e) => set('owner_name', e.target.value)} />
              </Field>
              <Field label="Phone">
                <input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
              </Field>
              <Field label="Email">
                <input value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field label="Industry">
                <input value={form.industry || ''} onChange={(e) => set('industry', e.target.value)} />
              </Field>
              <Field label="Sales rep">
                <input value={form.rep_name || ''} onChange={(e) => set('rep_name', e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Profiles</div>
            <Field label="Google Business Profile email">
              <input value={form.google_profile_email || ''}
                onChange={(e) => set('google_profile_email', e.target.value)} />
            </Field>
            <Field label="Yelp URL">
              <input value={form.yelp_url || ''} onChange={(e) => set('yelp_url', e.target.value)} />
            </Field>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Brand voice</div>
            <div className="drawer-grid">
              <Field label="Signs responses as">
                <input value={form.response_signer || ''}
                  onChange={(e) => set('response_signer', e.target.value)} />
              </Field>
              <Field label="Tone">
                <select value={form.response_tone || 'professional_friendly'}
                  onChange={(e) => set('response_tone', e.target.value)}>
                  {TONE_OPTIONS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Things to avoid">
              <textarea rows={2} value={form.things_to_avoid || ''}
                onChange={(e) => set('things_to_avoid', e.target.value)} />
            </Field>
            <Field label="Business tagline">
              <input value={form.business_tagline || ''}
                onChange={(e) => set('business_tagline', e.target.value)} />
            </Field>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Internal notes</div>
            <Field label="">
              <textarea rows={3} value={form.notes || ''}
                onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="drawer-foot">
          {saveError && <div className="drawer-error">{saveError}</div>}
          <button className="drawer-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="drawer-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
    </label>
  )
}

function Toggle({ label, on, onChange }) {
  return (
    <button type="button" className={`toggle${on ? ' on' : ''}`} onClick={() => onChange(!on)}>
      <span className="toggle-track"><span className="toggle-knob" /></span>
      {label}
    </button>
  )
}
