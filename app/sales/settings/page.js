'use client'

import { useState } from 'react'

export default function SalesSettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const changePassword = async () => {
    setError('')
    setSuccess(false)
    if (newPassword !== confirmPassword) {
      setError('New passwords don\u2019t match.')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/sales/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data.error || 'Failed to change password.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSaving(false)
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Settings</h1>
        <p className="admin-page-sub">Change your Sales HQ password.</p>
      </header>

      <div style={{ maxWidth: 420, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400E', marginBottom: '0.4rem' }}>
          Complete your tax & payment setup
        </div>
        <p style={{ fontSize: '0.82rem', color: '#92400E', marginBottom: '0.75rem' }}>
          Required before your first commission payout — fill out your W-9 and add your banking
          details so we can pay you directly.
        </p>
        <a
          href="https://quickbooks.intuit.com/payroll/contractor-payments/"
          target="_blank"
          rel="noreferrer"
          className="rev-mini-btn"
        >
          Set up payment info →
        </a>
      </div>

      <div className="drawer-section" style={{ maxWidth: 420 }}>
        <label className="field">
          <span className="field-label">Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        {error && <div className="admin-error">{error}</div>}
        {success && (
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '0.75rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            Password updated.
          </div>
        )}

        <button className="rev-ai-btn" onClick={changePassword} disabled={saving}>
          {saving ? 'Saving\u2026' : 'Change Password'}
        </button>
      </div>
    </div>
  )
}
