import Image from 'next/image'

export const metadata = {
  title: 'Cleanup Confirmed — RespondPal',
}

export default function CleanupConfirmed() {
  return (
    <main>
      <nav className="nav" style={{ position: 'relative' }}>
        <div className="nav-inner">
          <a href="/">
            <Image src="/logo-white.png" alt="RespondPal" className="nav-logo" width={180} height={36} />
          </a>
        </div>
      </nav>

      <section className="hero" style={{ minHeight: '70vh' }}>
        <div className="container" style={{ maxWidth: 580 }}>
          <div className="hero-eyebrow" style={{ fontSize: '1.1rem' }}>✓ Payment received — thank you!</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
            Your cleanup is<br />
            <em>almost ready to start.</em>
          </h1>
          <p className="hero-sub" style={{ fontSize: '1.05rem', maxWidth: 500 }}>
            One quick step before we can begin: we need manager access to your profiles
            so we can edit existing responses and post new ones on your behalf. No passwords
            are shared — this uses Google and Yelp&apos;s official access features.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '1.5rem', textAlign: 'left', maxWidth: 500,
            margin: '1.5rem auto'
          }}>
            <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>
              Grant access in two steps:
            </h3>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ color: '#C2410C', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Step 1 — Google Business Profile
              </div>
              <ol style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.7, paddingLeft: '1.2rem', margin: 0 }}>
                <li>Go to <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C' }}>business.google.com</a></li>
                <li>Select your business → click <strong style={{ color: 'white' }}>Users</strong> (or Business Profile settings → People and access)</li>
                <li>Click <strong style={{ color: 'white' }}>Add user</strong></li>
                <li>Enter <strong style={{ color: 'white' }}>team@respondpal.ai</strong></li>
                <li>Set role to <strong style={{ color: 'white' }}>Manager</strong> → Save</li>
              </ol>
            </div>

            <div>
              <div style={{ color: '#C2410C', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Step 2 — Yelp (if applicable)
              </div>
              <ol style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.7, paddingLeft: '1.2rem', margin: 0 }}>
                <li>Go to <a href="https://biz.yelp.com" target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C' }}>biz.yelp.com</a></li>
                <li>Select your business → click <strong style={{ color: 'white' }}>Account Settings</strong></li>
                <li>Go to <strong style={{ color: 'white' }}>User Management</strong></li>
                <li>Click <strong style={{ color: 'white' }}>Invite User</strong></li>
                <li>Enter <strong style={{ color: 'white' }}>team@respondpal.ai</strong> → Send invite</li>
              </ol>
            </div>
          </div>

          <p className="hero-sub" style={{ fontSize: '0.95rem', maxWidth: 500, marginTop: '1rem' }}>
            Once we have access, we&apos;ll rewrite every flagged response and respond to
            your unanswered negative reviews. Your profile will be fully cleaned up within{' '}
            <strong style={{ color: 'white' }}>5 business days</strong>.
          </p>
          <p className="hero-sub" style={{ fontSize: '0.9rem', maxWidth: 500, marginTop: '0.75rem' }}>
            Need help with any of these steps? Just reply to your confirmation email or reach out directly — happy to walk you through it.
          </p>
          <p className="hero-sub" style={{ fontSize: '1rem', marginTop: '1.5rem' }}>
            <img src="/jacob-merkley.png" alt="Jacob Merkley" style={{
              width: 60, height: 60, borderRadius: '50%', objectFit: 'cover',
              display: 'block', margin: '0 auto 0.75rem',
            }} />
            <strong style={{ color: 'white' }}>Jacob Merkley</strong><br />
            <span style={{ fontSize: '0.9rem' }}>Founder, RespondPal</span><br />
            <a href="mailto:jacob@respondpal.ai" style={{ color: '#C2410C' }}>jacob@respondpal.ai</a>
          </p>
          <a
            href="/"
            className="btn-outline"
            style={{ marginTop: '2rem' }}
          >
            ← Back to RespondPal
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>&copy; {new Date().getFullYear()} RespondPal LLC · respondpal.ai</p>
          <div className="footer-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="mailto:jacob@respondpal.ai">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
