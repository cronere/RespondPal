import Image from 'next/image'

export const metadata = {
  title: 'Reputation Risk Audit — RespondPal',
  description:
    'We scan every response on your Google and Yelp profile for privacy violations, combative replies, and tone-deaf templates. Custom report delivered in 48 hours.',
}

export default function AuditLanding() {
  return (
    <main>
      <nav className="nav" style={{ position: 'relative' }}>
        <div className="nav-inner">
          <a href="/">
            <Image src="/logo-white.png" alt="RespondPal" className="nav-logo" width={180} height={36} />
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" style={{ paddingBottom: '3rem' }}>
        <div className="container">
          <div className="hero-eyebrow">Reputation Risk Audit</div>
          <h1>
            Are your review responses<br />
            <em>helping or hurting you?</em>
          </h1>
          <p className="hero-sub" style={{ maxWidth: 620 }}>
            We scan every response on your Google and Yelp profile for privacy violations,
            combative replies, and tone-deaf templates — the kind of mistakes that cost you
            customers and create real liability. You get a custom report with exactly what
            needs fixing, delivered to your inbox within 48 hours.
          </p>
          <div className="hero-cta-group">
            <a href="#order" className="btn-orange">Get your audit — $47 →</a>
          </div>
          <p className="hero-sub" style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7 }}>
            Use code <strong>AUDIT47</strong> at checkout &nbsp;|&nbsp; Regularly $97
          </p>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="features" id="what">
        <div className="container">
          <div className="section-label">What you get</div>
          <h2 className="section-h2">A custom diagnostic report<br />for your business.</h2>
          <div className="feat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="feat">
              <div className="feat-icon">🔍</div>
              <h3>Full response scan</h3>
              <p>Every response on your Google and Yelp profiles, checked against the 10 most common failure patterns — from HIPAA-adjacent privacy slips to combative rebuttals.</p>
            </div>
            <div className="feat">
              <div className="feat-icon">🚨</div>
              <h3>Critical findings flagged</h3>
              <p>Each problem response identified with a severity rating and the exact quote that's hurting you — so you can see what your customers see.</p>
            </div>
            <div className="feat">
              <div className="feat-icon">📊</div>
              <h3>Profile stats</h3>
              <p>Your response rate, unanswered negative count, and platform-by-platform breakdown — the numbers that show how AI search tools and customers judge your business.</p>
            </div>
            <div className="feat">
              <div className="feat-icon">✅</div>
              <h3>Example rewrite</h3>
              <p>A sample professional rewrite showing how your worst response should actually read — proof that the problem is fixable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE FIND */}
      <section className="compare-sec">
        <div className="container">
          <div className="section-label">What we typically find</div>
          <h2 className="section-h2">Most businesses have no idea<br />their responses are this bad.</h2>
          <div className="bad-examples">
            <div className="bad-card">
              <div className="bad-label bad-label-red">Privacy violation</div>
              <div className="bad-review">
                <span className="bad-text">A dental practice publicly stated &ldquo;we have not seen you since 2021&rdquo; — confirming the reviewer&apos;s patient status and visit history on a public forum.</span>
              </div>
              <div className="bad-verdict">This is a HIPAA-adjacent liability sitting on a live Google profile right now.</div>
            </div>
            <div className="bad-card">
              <div className="bad-label bad-label-red">Combative tone</div>
              <div className="bad-review">
                <span className="bad-text">A business called a 1-star review &ldquo;fake&rdquo; with &ldquo;malicious intent&rdquo; — publicly accusing the reviewer of lying.</span>
              </div>
              <div className="bad-verdict">Every future customer reads this and sees a business that fights with people.</div>
            </div>
            <div className="bad-card">
              <div className="bad-label bad-label-red">Tone-deaf template</div>
              <div className="bad-review">
                <span className="bad-text">A vet clinic responded &ldquo;We hope your pet is doing well and feeling better!&rdquo; — on a review about a pet that had died.</span>
              </div>
              <div className="bad-verdict">No human read this review before a template was pasted on it.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ORDER */}
      <section className="pricing" id="order">
        <div className="container">
          <div className="section-label">Order your audit</div>
          <h2 className="section-h2">Custom report. 48-hour delivery.<br />No contracts, no calls required.</h2>
          <div className="pricing-cards" style={{ justifyContent: 'center' }}>
            <div className="price-card featured" style={{ maxWidth: 420 }}>
              <div className="price-name">Reputation Risk Audit</div>
              <div className="price-amount" style={{ fontSize: '3rem' }}>
                <span style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: '#6b7280', marginRight: 8 }}>$97</span>
                $47
              </div>
              <div className="price-save">Use code AUDIT47</div>
              <div className="pricing-includes">
                <div>✓ Full Google &amp; Yelp response scan</div>
                <div>✓ Critical findings with exact quotes</div>
                <div>✓ Response rate &amp; profile stats</div>
                <div>✓ Example professional rewrite</div>
                <div>✓ Delivered to your inbox in 48 hours</div>
              </div>
              <a href="https://buy.stripe.com/3cI14pey34tBg9Z5RDebu03" className="btn-orange" style={{ marginTop: 'auto', fontSize: '1.05rem' }}>Get your audit →</a>
            </div>
          </div>
          <p className="section-sub" style={{ marginTop: '1.5rem', fontSize: '0.85rem', opacity: 0.7 }}>
            After purchase, you&apos;ll be asked to share your business name and review profile links. We handle the rest.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how">
        <div className="container">
          <div className="section-label">How it works</div>
          <h2 className="section-h2">Three steps. Zero effort.</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3>Purchase your audit</h3>
              <p>Pay $47 and tell us your business name and where to find your Google and Yelp profiles. That&apos;s all we need.</p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <h3>We scan everything</h3>
              <p>Our proprietary AI — calibrated across dental, legal, veterinary, auto repair, and more — reviews every response on your profiles.</p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <h3>Your report arrives</h3>
              <p>Within 48 hours, you receive a branded PDF with your critical findings, profile stats, and a clear path to fix what&apos;s broken.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="founder-sec">
        <div className="container founder-inner">
          <img src="/jacob-merkley.png" alt="Jacob Merkley, Founder & CEO of RespondPal" className="founder-photo" />
          <div className="founder-label">From the founder</div>
          <blockquote className="founder-quote" style={{ fontSize: '1rem' }}>
            &ldquo;I built this audit after studying thousands of real business review responses
            and seeing the same mistakes over and over — privacy violations, defensive arguments,
            cookie-cutter templates. Most business owners have no idea these are sitting on their
            profile right now. This report shows you exactly what&apos;s there and what to do about it.&rdquo;
          </blockquote>
          <div className="founder-name">Jacob Merkley</div>
          <div className="founder-title">Founder, RespondPal</div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Find out what your<br />responses are really saying.</h2>
          <p>Custom audit. 48-hour delivery. $47 with code AUDIT47.</p>
          <a href="#order" className="btn-outline" style={{ background: 'white', color: '#111827', borderColor: 'white', fontWeight: 700 }}>Get your audit →</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <p>&copy; {new Date().getFullYear()} RespondPal LLC · respondpal.ai</p>
          <div className="footer-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/">Home</a>
            <a href="mailto:jacob@respondpal.ai">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
