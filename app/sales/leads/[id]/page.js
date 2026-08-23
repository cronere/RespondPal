'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

const STAGES = [
  { key: 'lead', label: 'Lead' },
  { key: 'contacting', label: 'Contacting' },
  { key: 'response_sent', label: 'Response Examples / Audit Sent' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
]

function formatDate(iso) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export default function LeadDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingContact, setLoggingContact] = useState(false)
  const [contactNote, setContactNote] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [leadRes, activitiesRes] = await Promise.all([
        fetch(`/api/sales/leads/${id}`),
        fetch(`/api/sales/leads/${id}/activities`),
      ])
      const leadData = await leadRes.json()
      if (leadRes.ok) {
        setLead(leadData.lead)
      } else {
        setError(leadData.error || 'Failed to load this lead.')
      }
      const activitiesData = await activitiesRes.json()
      if (activitiesRes.ok) setActivities(activitiesData.activities || [])
    } catch {
      setError('Something went wrong.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const set = (field, value) => setLead((prev) => ({ ...prev, [field]: value }))

  const save = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/sales/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: lead.business_name,
          industry: lead.industry,
          contact_name: lead.contact_name,
          contact_email: lead.contact_email,
          contact_phone: lead.contact_phone,
          google_url: lead.google_url,
          yelp_url: lead.yelp_url,
          notes: lead.notes,
          stage: lead.stage,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setLead(data.lead)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setError(data.error || 'Failed to save.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSaving(false)
  }

  const logContact = async () => {
    if (!contactNote.trim() || contactNote.trim().length < 3) {
      setError('Add a brief note about the contact first — even "left voicemail" counts.')
      return
    }
    setLoggingContact(true)
    setError('')
    try {
      const res = await fetch(`/api/sales/leads/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: contactNote.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setLead(data.lead)
        setContactNote('')
        load() // refresh full activity history, not just prepend locally
      } else {
        setError(data.error || 'Failed to log contact.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setLoggingContact(false)
  }

  if (loading) {
    return <div className="admin-page"><p className="admin-page-sub">Loading…</p></div>
  }
  if (error && !lead) {
    return (
      <div className="admin-page">
        <div className="admin-error">{error}</div>
        <button className="rev-mini-btn" onClick={() => router.push('/sales/leads')} style={{ marginTop: '1rem' }}>← Back to Leads</button>
      </div>
    )
  }
  if (!lead) return null

  return (
    <div className="admin-page">
      <button className="rev-mini-btn" onClick={() => router.push('/sales/leads')} style={{ marginBottom: '1rem' }}>← Back to Leads</button>

      <header className="admin-page-head">
        <h1>{lead.business_name}</h1>
        <p className="admin-page-sub">
          Last contacted: <strong>{formatDate(lead.last_contacted_at)}</strong>
          {' · '}Added {formatDate(lead.created_at)}
        </p>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {saved && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.85rem', marginBottom: '1rem', maxWidth: 480 }}>
          Saved.
        </div>
      )}

      <div className="drawer-section" style={{ maxWidth: 560, background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.6rem', color: '#1a1a1a' }}>Log a contact</div>
        <textarea
          value={contactNote}
          onChange={(e) => setContactNote(e.target.value)}
          placeholder="What happened? e.g. &quot;Left voicemail, will try again Thursday&quot; or &quot;Spoke with office manager, wants pricing details&quot;"
          style={{ minHeight: 60, width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #d1d5db', fontFamily: 'inherit', fontSize: '0.9rem', marginBottom: '0.6rem' }}
        />
        <button className="rev-ai-btn" onClick={logContact} disabled={loggingContact}>
          {loggingContact ? 'Logging…' : '📞 Log Contact'}
        </button>

        {activities.length > 0 && (
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.9rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Contact history
            </div>
            {activities.map((a) => (
              <div key={a.id} style={{ fontSize: '0.85rem', marginBottom: '0.6rem' }}>
                <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                  {formatDate(a.created_at)}{a.sales_reps?.name ? ` · ${a.sales_reps.name}` : ''}
                </div>
                <div style={{ color: '#1a1a1a' }}>{a.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="drawer-section" style={{ maxWidth: 560 }}>
        <label className="field">
          <span className="field-label">Business name</span>
          <input value={lead.business_name || ''} onChange={(e) => set('business_name', e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">Stage</span>
          <select
            value={lead.stage}
            onChange={(e) => set('stage', e.target.value)}
            style={{ padding: '0.55rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', width: '100%' }}
          >
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>

        <div className="drawer-grid">
          <label className="field">
            <span className="field-label">Industry</span>
            <input value={lead.industry || ''} onChange={(e) => set('industry', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Point of contact</span>
            <input value={lead.contact_name || ''} onChange={(e) => set('contact_name', e.target.value)} />
          </label>
        </div>

        <div className="drawer-grid">
          <label className="field">
            <span className="field-label">Email</span>
            <input type="email" value={lead.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Phone</span>
            <input value={lead.contact_phone || ''} onChange={(e) => set('contact_phone', e.target.value)} />
          </label>
        </div>

        <label className="field">
          <span className="field-label">Google Maps link</span>
          <input value={lead.google_url || ''} onChange={(e) => set('google_url', e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Yelp link</span>
          <input value={lead.yelp_url || ''} onChange={(e) => set('yelp_url', e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Notes</span>
          <textarea value={lead.notes || ''} onChange={(e) => set('notes', e.target.value)} style={{ minHeight: 120 }} />
        </label>

        <button className="rev-ai-btn" onClick={save} disabled={saving} style={{ marginTop: '0.5rem' }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
