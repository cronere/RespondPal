'use client'

import { useState, useEffect } from 'react'

export default function AdminOnboarding() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showArchive, setShowArchive] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/clients')
      const data = await res.json()
      if (res.ok) setClients(data.clients)
      else setError(data.error || 'Failed to load.')
    } catch {
      setError('Failed to load.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const onboarding = clients.filter((c) => c.status === 'onboarding')
  // "Archived" = clients that have gone live (active), shown read-only here.
  const live = clients
    .filter((c) => c.status === 'active')
    .sort((a, b) => new Date(b.live_date || 0) - new Date(a.live_date || 0))

  // Single source of truth update — replaces the client in state with the
  // server's returned record. No re-fetch, so nothing can revert.
  const updateClient = (updated) =>
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))

  return (
    <div className="admin-page admin-page-wide">
      <header className="admin-page-head">
        <h1>Onboarding</h1>
        <p className="admin-page-sub">
          {loading ? 'Loading…' : `${onboarding.length} client${onboarding.length === 1 ? '' : 's'} getting ready to go live`}
        </p>
      </header>

      {error && <div className="admin-error-banner">{error}</div>}

      {loading ? (
        <div className="clients-empty">Loading…</div>
      ) : onboarding.length === 0 ? (
        <div className="clients-empty">No clients in onboarding right now. New signups appear here automatically.</div>
      ) : (
        <div className="onb-list">
          {onboarding.map((c) => (
            <OnboardingCard key={c.id} client={c} onUpdate={updateClient} />
          ))}
        </div>
      )}

      {/* Archived / recently live */}
      {live.length > 0 && (
        <div className="onb-archive">
          <button className="onb-archive-toggle" onClick={() => setShowArchive((v) => !v)}>
            {showArchive ? '▾' : '▸'} Live clients ({live.length})
          </button>
          {showArchive && (
            <div className="onb-archive-list">
              {live.map((c) => (
                <div key={c.id} className="onb-archive-row">
                  <span className="onb-archive-name">{c.business_name}</span>
                  <span className="onb-archive-meta">
                    {c.owner_name} · live {c.live_date ? new Date(c.live_date).toLocaleDateString() : '—'}
                  </span>
                  <span className="pill pill-active">active</span>
                </div>
              ))}
              <p className="onb-archive-note">
                Live clients are managed from the <strong>Clients</strong> tab.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OnboardingCard({ client, onUpdate }) {
  const [saving, setSaving] = useState(null) // which field is saving
  const [goingLive, setGoingLive] = useState(false)
  const [message, setMessage] = useState(null)

  const hasCleanup = client.plan === 'monthly_plus_cleanup' || client.plan === 'cleanup_only'
  const checklist = client.onboarding_checklist || {}

  // Patch a single field and update state from the server's response.
  const patch = async (fieldName, payload) => {
    setSaving(fieldName)
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        onUpdate(data.client) // server is source of truth — no revert
      } else {
        setMessage({ type: 'error', text: data.error || 'Save failed.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Save failed.' })
    }
    setSaving(null)
  }

  const toggleAccess = (field) => patch(field, { [field]: !client[field] })

  const toggleManual = (key) => {
    const next = { ...checklist, [key]: !checklist[key] }
    patch('onboarding_checklist', { onboarding_checklist: next })
  }

  const voiceConfigured = !!client.response_signer || !!client.response_tone
  const requiredDone = client.google_access && client.yelp_access

  const handleGoLive = async () => {
    if (goingLive || !requiredDone) return
    setGoingLive(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/go-live`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Client is now live. Welcome emails sent.' })
        onUpdate(data.client)
      } else {
        setMessage({ type: 'error', text: data.error || 'Go-live failed.' })
        setGoingLive(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'Go-live failed.' })
      setGoingLive(false)
    }
  }

  return (
    <div className="onb-card">
      <div className="onb-card-head">
        <div>
          <h3>{client.business_name}</h3>
          <p className="onb-card-sub">
            {client.owner_name} · {client.email}
            {hasCleanup && <span className="onb-tag">+ Cleanup</span>}
          </p>
        </div>
        <div className="onb-card-meta">
          {client.locations} loc · {client.rep_name ? `Rep: ${client.rep_name}` : 'No rep'}
        </div>
      </div>

      {/* ACCESS — toggled right here */}
      <div className="onb-block-label">Access</div>
      <div className="onb-access-row">
        <AccessToggle
          label="Google Manager accepted"
          on={!!client.google_access}
          saving={saving === 'google_access'}
          onClick={() => toggleAccess('google_access')}
        />
        <AccessToggle
          label="Yelp Team Member accepted"
          on={!!client.yelp_access}
          saving={saving === 'yelp_access'}
          onClick={() => toggleAccess('yelp_access')}
        />
      </div>

      {/* SETUP — derived + manual checklist */}
      <div className="onb-block-label">Setup</div>
      <div className="onb-checklist">
        <div className={`onb-check auto${voiceConfigured ? ' done' : ''}`}>
          <span className="onb-check-box">{voiceConfigured ? '✓' : ''}</span>
          <span className="onb-check-label">Brand voice configured</span>
          <span className="onb-check-auto">auto</span>
        </div>
        <button
          className={`onb-check${checklist.first_response_posted ? ' done' : ''}`}
          onClick={() => toggleManual('first_response_posted')}
          disabled={saving === 'onboarding_checklist'}
        >
          <span className="onb-check-box">{checklist.first_response_posted ? '✓' : ''}</span>
          <span className="onb-check-label">First response drafted/posted</span>
        </button>
        {hasCleanup && (
          <button
            className={`onb-check${checklist.cleanup_started ? ' done' : ''}`}
            onClick={() => toggleManual('cleanup_started')}
            disabled={saving === 'onboarding_checklist'}
          >
            <span className="onb-check-box">{checklist.cleanup_started ? '✓' : ''}</span>
            <span className="onb-check-label">Profile Cleanup started</span>
          </button>
        )}
      </div>

      {message && <div className={`onb-message ${message.type}`}>{message.text}</div>}

      <div className="onb-card-foot">
        {!requiredDone && (
          <p className="onb-hint">
            Grant Google &amp; Yelp access above to enable go-live.
          </p>
        )}
        <button
          className="onb-golive-btn"
          onClick={handleGoLive}
          disabled={!requiredDone || goingLive}
        >
          {goingLive ? 'Going live…' : 'Go Live →'}
        </button>
      </div>
    </div>
  )
}

function AccessToggle({ label, on, saving, onClick }) {
  return (
    <button
      type="button"
      className={`onb-access${on ? ' on' : ''}`}
      onClick={onClick}
      disabled={saving}
    >
      <span className="toggle-track"><span className="toggle-knob" /></span>
      <span className="onb-access-label">{label}</span>
      {saving && <span className="onb-access-saving">saving…</span>}
    </button>
  )
}
