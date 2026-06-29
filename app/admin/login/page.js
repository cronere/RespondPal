'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!password || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Incorrect password.')
        setLoading(false)
      }
    } catch (err) {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          Respond<span>Pal</span>
        </div>
        <div className="admin-login-label">Operations HQ</div>
        <p className="admin-login-sub">Enter the team password to continue.</p>

        <input
          type="password"
          className="admin-login-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
          autoFocus
        />

        {error && <div className="admin-login-error">{error}</div>}

        <button className="admin-login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? 'Checking…' : 'Enter HQ'}
        </button>
      </div>
    </div>
  )
}
