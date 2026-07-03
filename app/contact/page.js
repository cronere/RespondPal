import Image from 'next/image'

export const metadata = {
  title: 'Contact — RespondPal',
  description: 'Get in touch with the RespondPal team.',
}

export default function Contact() {
  return (
    <main>
      <nav className="nav" style={{ position: 'relative' }}>
        <div className="nav-inner">
          <a href="/">
            <Image src="/logo-white.png" alt="RespondPal" className="nav-logo" width={180} height={36} />
          </a>
          <div className="desktop-links">
            <a href="/#how">How it works</a>
            <a href="/#pricing">Pricing</a>
            <a href="/#pricing" className="nav-cta">Get started</a>
          </div>
        </div>
      </nav>

      <section className="hero" style={{ minHeight: '70vh' }}>
        <div className="container" style={{ maxWidth: 560 }}>
          <div className="hero-eyebrow">Contact</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
            We&apos;re here to help.
          </h1>
          <p className="hero-sub" style={{ fontSize: '1.05rem', maxWidth: 480 }}>
            Questions about your account, your audit report, or our service?
            Reach out anytime — we typically respond within a few hours.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            padding: '1.75rem',
            textAlign: 'left',
            marginTop: '2rem',
          }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ color: '#C2410C', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                Email
              </div>
              <a href="mailto:jacob@respondpal.ai" style={{ color: 'white', fontSize: '1.05rem', textDecoration: 'none' }}>
                jacob@respondpal.ai
              </a>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ color: '#C2410C', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                General inquiries
              </div>
              <a href="mailto:team@respondpal.ai" style={{ color: 'white', fontSize: '1.05rem', textDecoration: 'none' }}>
                team@respondpal.ai
              </a>
            </div>

            <div>
              <div style={{ color: '#C2410C', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                Response time
              </div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', margin: 0 }}>
                We respond to all inquiries within one business day, usually much faster.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <img src="/jacob-merkley.png" alt="Jacob Merkley" style={{
              width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
              display: 'block', margin: '0 auto 0.5rem',
            }} />
            <p style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 2px' }}>Jacob Merkley</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>Founder, RespondPal</p>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>&copy; {new Date().getFullYear()} RespondPal LLC · respondpal.ai</p>
          <div className="footer-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/">Home</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
