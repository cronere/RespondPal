'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

// This page exists as a dedicated URL specifically so Meta's Pixel can fire a
// custom conversion event on it via a simple URL-based rule in Ads Manager —
// no manual fbq() event call needed in code, and it's easy to verify/debug
// directly in Events Manager. Reached only via a real redirect after a
// successful audit submission on /audit/thankyou, carrying the contact email
// through as a query param since this is a genuinely separate page now, not
// a client-side state toggle sharing the same in-memory form data.
//
// Known, accepted tradeoff: like any URL-based conversion rule, a visit to
// this URL by any means (a bookmarked link, a crawler, someone typing it
// directly) would also register as a conversion in Ads Manager. This is
// standard practice for this tracking method — the alternative (a manual
// fbq('track', 'Lead') call tied to the actual form-success event) avoids
// that edge case but is harder to verify/debug without code changes. Worth
// knowing about, not worth over-engineering against.

function StartedContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <main>
      <nav className="nav" style={{ position: 'relative' }}>
        <div className="nav-inner">
          <a href="/">
            <Image src="/logo-white.png" alt="RespondPal" className="nav-logo" width={180} height={36} />
          </a>
        </div>
      </nav>

      <section className="hero" style={{ paddingBottom: '2rem', minHeight: 'auto' }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <div className="hero-eyebrow" style={{ fontSize: '1.1rem' }}>✓ You&apos;re all set!</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
            Your audit is<br />
            <em>in progress.</em>
          </h1>
          <p className="hero-sub" style={{ fontSize: '1rem', maxWidth: 500 }}>
            We&apos;re scanning your Google and Yelp profiles now. Your custom
            Reputation Risk Audit report will be delivered to{' '}
            {email ? (
              <strong style={{ color: 'white' }}>{email}</strong>
            ) : (
              'the email you provided'
            )}{' '}
            within 48 hours.
          </p>
          <p className="hero-sub" style={{ fontSize: '0.95rem', maxWidth: 500, marginTop: '1rem' }}>
            Questions? Reach out anytime at{' '}
            <a href="mailto:team@respondpal.ai" style={{ color: '#C2410C' }}>team@respondpal.ai</a>
          </p>
          <a
            href="/"
            className="btn-outline"
            style={{ marginTop: '1.5rem' }}
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
            <a href="mailto:team@respondpal.ai">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

// useSearchParams() requires a Suspense boundary in Next.js App Router,
// otherwise the build will warn and the route deopts to fully client-side
// rendering for the whole page rather than just this part.
export default function AuditStarted() {
  return (
    <Suspense fallback={null}>
      <StartedContent />
    </Suspense>
  )
}
