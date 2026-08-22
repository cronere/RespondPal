'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SalesLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sales/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        router.push('/sales')
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Incorrect email or password.')
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
        <div className="admin-login-label">Sales HQ</div>
        <p className="admin-login-sub">Sign in with your rep account to continue.</p>

        <input
          type="email"
          className="admin-login-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
          autoFocus
          style={{ marginBottom: '0.75rem' }}
        />
        <input
          type="password"
          className="admin-login-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
        />

        {error && <div className="admin-login-error">{error}</div>}

        <button className="admin-login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? 'Checking…' : 'Sign in'}
        </button>

        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '1.25rem', textAlign: 'center' }}>
          Don&apos;t have an account? Ask Jacob to set one up for you.
        </p>
      </div>
    </div>
  )
}
