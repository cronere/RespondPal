'use client'

import { useState } from 'react'

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [formState, setFormState] = useState({ name: '', business: '', email: '', phone: '', interest: 'Monthly Plan ($397/mo) + Profile Cleanup ($197)' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const faqs = [
    {
      q: 'Which review platforms do you cover?',
      a: "Our standard plan covers both Google Business Profile and Yelp. We get added as a Manager on Google and a Team Member on Yelp — no passwords shared on either platform.",
    },
    {
      q: 'How do you get access to respond to my reviews?',
      a: "For Google, we get added as a Manager on your Google Business Profile — takes about 2 minutes. For Yelp, you add us as a Team Member in your Yelp Business dashboard — another 2 minutes. You stay the owner on both platforms. Remove our access instantly if you ever cancel.",
    },
    {
      q: 'What is the Profile Cleanup add-on?',
      a: "When you sign up, you likely have months of unanswered reviews sitting on your profile — especially negative ones. Our one-time Profile Cleanup responds to every 1–3 star review from the last 180 days, so your profile looks professionally managed from day one, not just going forward.",
    },
    {
      q: 'What if I get a really negative or complicated review?',
      a: "That's exactly where we shine. Negative reviews get extra care — professional, measured responses that acknowledge the concern, protect your reputation, and invite resolution offline. We never argue, never get defensive, on any platform.",
    },
    {
      q: 'Will the responses sound like they came from me?',
      a: "Yes. We tailor responses to your business type, your tone, and your brand. They'll sound like you wrote them — but better, and without lifting a finger.",
    },
    {
      q: 'What if I want to approve a response before it goes live?',
      a: "By default we post within 24 hours to meet your guarantee. If you'd prefer an approval step, reach out after signing up and we'll configure that for your account.",
    },
    {
      q: 'Is there a contract?',
      a: 'No contracts. Month-to-month. Cancel anytime and your billing stops at the end of that month.',
    },
    {
      q: 'Does this work for multiple locations?',
      a: "Yes — each location is $397/month. If you have 3 or more locations, contact us for a discounted multi-location rate.",
    },
  ]

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i)
  const closeMenu = () => setMenuOpen(false)

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formState),
      })
      if (res.ok) setSubmitted(true)
    } catch (err) {
      console.error(err)
    }
    setSubmitting(false)
  }

  return (
    <>
      {/* NAV */}
      <nav className="nav" style={{ position: 'relative' }}>
        <div className="nav-inner">
          <div className="logo">Respond<span>Pal</span></div>
          <div className="desktop-links">
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="#contact" className="nav-cta">Get started</a>
          </div>
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-menu open">
            <a href="#how" onClick={closeMenu}>How it works</a>
            <a href="#pricing" onClick={closeMenu}>Pricing</a>
            <a href="#faq" onClick={closeMenu}>FAQ</a>
            <a href="#contact" onClick={closeMenu}>Get started →</a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">Done-for-you review management</div>
          <h1>
            Every review.<br />
            <em>Google &amp; Yelp.</em><br />
            You do nothing.
          </h1>
          <p className="hero-sub">
            We respond to every Google and Yelp review your business receives —
            professionally, promptly, and on-brand — within 24 hours, every time.
          </p>
          <div className="hero-cta-group">
            <a href="#contact" className="btn-orange">Get started today →</a>
            <a href="#how" className="btn-outline">See how it works</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">95%<sup>1</sup></div>
              <div className="label">of businesses don&apos;t respond to reviews</div>
            </div>
            <div className="hero-stat">
              <div className="num">24hr</div>
              <div className="label">response guarantee on every review</div>
            </div>
            <div className="hero-stat">
              <div className="num">18%<sup>2</sup></div>
              <div className="label">more revenue from responding to all reviews</div>
            </div>
            <div className="hero-stat">
              <div className="num">89%<sup>1</sup></div>
              <div className="label">of consumers expect a business response</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="problem" id="problem">
        <div className="container">
          <div className="section-label">The problem</div>
          <h2 className="section-h2">
            Every unanswered review<br />is a missed sale.
          </h2>
          <p className="section-sub">
            When a potential customer is choosing between you and a competitor,
            they read your reviews on Google and Yelp. If your competitor responds
            and you don&apos;t, you lose. It&apos;s that simple.
          </p>
          <div className="stat-grid">
            <div className="stat-box">
              <div className="big">89%<sup>1</sup></div>
              <div className="desc">of consumers expect businesses to respond to their review</div>
              <div className="stat-source">BrightLocal Local Consumer Review Survey</div>
            </div>
            <div className="stat-box">
              <div className="big">2.7<sup>3</sup></div>
              <div className="desc">days — average time a business takes to respond (when they respond at all)</div>
              <div className="stat-source">ReplyOnTheFly Benchmark Report</div>
            </div>
            <div className="stat-box">
              <div className="big">41%<sup>1</sup></div>
              <div className="desc">of consumers always read reviews before choosing a local business</div>
              <div className="stat-source">BrightLocal Local Consumer Review Survey</div>
            </div>
            <div className="stat-box">
              <div className="big">18%<sup>2</sup></div>
              <div className="desc">more revenue correlates with businesses that respond to every review</div>
              <div className="stat-source">Harvard Business Review</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="container">
          <div className="section-label">How it works</div>
          <h2 className="section-h2">Live in 48 hours.<br />Hands-off forever.</h2>
          <p className="section-sub">
            You&apos;re up and running before the week is out. After that, you
            never think about review responses again.
          </p>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3>You sign up</h3>
              <p>Takes 5 minutes. You add us as a manager on Google and a team member on Yelp — we walk you through both, step by step.</p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <h3>We get to work</h3>
              <p>Every review that comes in across Google and Yelp — 5-star praise, 1-star complaint, no text at all — gets a professional, thoughtful response from our team.</p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <h3>Responses go live</h3>
              <p>Within 24 hours of each review posting, a response publishes under your business on that platform. On-brand, on-time, every time.</p>
            </div>
            <div className="step">
              <div className="step-num">04</div>
              <h3>You stay in the loop</h3>
              <p>Log into your dashboard anytime to see every review and every response across both platforms. Full visibility, zero effort.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="demo" id="demo">
        <div className="container">
          <div className="section-label">Real examples</div>
          <h2 className="section-h2">What your profiles<br />will look like.</h2>
          <p className="section-sub">Professional. Specific. Human. Never templated.</p>
          <div className="demo-card">
            <div className="review-item">
              <div className="review-meta">
                <div className="avatar">SR</div>
                <div>
                  <div className="reviewer-name">Sarah R. <span style={{fontSize:'0.7rem',color:'var(--muted2)',fontWeight:400}}>· Google</span></div>
                  <div className="stars">★★★★★</div>
                </div>
              </div>
              <div className="review-text">
                &ldquo;Absolutely love this place. Best service I&apos;ve had in years. Will definitely be back and telling all my friends!&rdquo;
              </div>
              <div className="response-box">
                <div className="response-label">Owner response · posted within 24 hrs</div>
                <div className="response-text">
                  Thank you so much, Sarah — this genuinely made our day! We&apos;ll make sure to pass along the kind words to the team. We can&apos;t wait to see you again soon.
                </div>
              </div>
            </div>
            <div className="review-item">
              <div className="review-meta">
                <div className="avatar neg">TK</div>
                <div>
                  <div className="reviewer-name">Tom K. <span style={{fontSize:'0.7rem',color:'var(--muted2)',fontWeight:400}}>· Yelp</span></div>
                  <div className="stars low">★★☆☆☆</div>
                </div>
              </div>
              <div className="review-text">
                &ldquo;Service was slow and nobody checked in on us. The food itself was good but the experience was frustrating.&rdquo;
              </div>
              <div className="response-box">
                <div className="response-label">Owner response · posted within 24 hrs</div>
                <div className="response-text">
                  Tom, thank you for being honest — we&apos;re sorry we let you down on the service side. That&apos;s not the experience we work hard to deliver, and we hear you. Please reach out directly and we&apos;ll make it right on your next visit.
                </div>
              </div>
            </div>
            <div className="demo-note">
              <div className="dot" />
              Responses posted directly from your Google Business Profile and Yelp Business account
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-label">What&apos;s included</div>
          <h2 className="section-h2">Everything you need.<br />Nothing you don&apos;t.</h2>
          <div className="feat-grid">
            <div className="feat">
              <div className="feat-icon">⚡</div>
              <h3>24-hour response guarantee</h3>
              <p>Every review on every platform gets a response within 24 hours. No exceptions.</p>
            </div>
            <div className="feat">
              <div className="feat-icon">✍️</div>
              <h3>Human-reviewed responses</h3>
              <p>Our team reviews every response before it goes live. No generic copy-paste — written for your business and your reviewer.</p>
            </div>
            <div className="feat">
              <div className="feat-icon">⭐</div>
              <h3>All star ratings covered</h3>
              <p>5-star, 1-star, no-text reviews on Google and Yelp. We respond to them all.</p>
            </div>
            <div className="feat">
              <div className="feat-icon">📊</div>
              <h3>Unified dashboard</h3>
              <p>See every review and every response from Google and Yelp in one clean place. Full transparency, zero effort.</p>
            </div>
            <div className="feat">
              <div className="feat-icon">🔒</div>
              <h3>Secure access management</h3>
              <p>Manager access on Google, Team Member access on Yelp — no passwords shared. You stay the owner. Cancel anytime.</p>
            </div>
            <div className="feat">
              <div className="feat-icon">📍</div>
              <h3>Any local business</h3>
              <p>HVAC, dental office, auto repair, law firm, med spa — if customers are reviewing you, we can manage it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section className="compare-sec">
        <div className="container">
          <div className="section-label">Be honest with yourself</div>
          <h2 className="section-h2">
            You&apos;re not going to do<br />this yourself. That&apos;s fine.
          </h2>
          <p className="section-sub">
            Business owners know they should respond to reviews. They just never
            get to it. Between staff, customers, and operations — it falls off
            the list every time.
          </p>
          <div className="compare-grid">
            <div className="compare-col bad">
              <h4>Without RespondPal</h4>
              <ul className="clist">
                <li>Reviews pile up unanswered on Google and Yelp</li>
                <li>Negative reviews sit with no reply</li>
                <li>Competitors look more engaged</li>
                <li>It&apos;s on the to-do list. It never gets done.</li>
                <li>You feel it every time you check your profiles</li>
              </ul>
            </div>
            <div className="compare-col good">
              <h4>With RespondPal</h4>
              <ul className="clist">
                <li>Every review answered within 24 hours</li>
                <li>Negative reviews handled with care on every platform</li>
                <li>You look more responsive than any competitor</li>
                <li>Zero time. Zero mental load.</li>
                <li>One flat fee. Cancel anytime.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI VISIBILITY */}
      <section className="ai-section">
        <div className="container">
          <div className="section-label">The bigger picture</div>
          <h2 className="section-h2">Reviews aren&apos;t just<br />for humans anymore.</h2>
          <p className="section-sub">
            AI search tools like Google&apos;s AI Overviews, ChatGPT, and Perplexity
            now synthesize your reviews to decide whether to recommend your business.
            Response rate, recency, and sentiment all factor in. An unanswered review
            isn&apos;t just a missed conversation — it&apos;s a signal to AI that
            your business is disengaged.
          </p>
          <div className="ai-cards">
            <div className="ai-card">
              <div className="ai-card-icon">🤖</div>
              <h3>AI reads your responses</h3>
              <p>When you respond professionally to a negative review, that response becomes part of how AI characterizes your business — often neutralizing the bad review in AI-generated summaries.</p>
            </div>
            <div className="ai-card">
              <div className="ai-card-icon">📈</div>
              <h3>Response rate affects rankings</h3>
              <p>Google&apos;s local ranking algorithm factors in review engagement. Businesses that respond consistently rank higher in Maps and get cited more favorably in AI Overviews.</p>
            </div>
            <div className="ai-card">
              <div className="ai-card-icon">🔍</div>
              <h3>Silence is now a liability</h3>
              <p>As AI compresses local search into recommendations, unmanaged reputations are riskier than ever. One unanswered 1-star review can define you in an AI summary to thousands of potential customers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="container">
          <div className="section-label">Pricing</div>
          <h2 className="section-h2">Simple pricing.<br />No surprises.</h2>
          <p className="section-sub" style={{ margin: '0.5rem auto 0' }}>
            Flat monthly rate. No setup fees. No contracts. Cancel anytime.
          </p>
          <div className="pricing-cards">
            <div className="price-card price-card-featured">
              <div className="price-badge">Monthly plan</div>
              <div className="price-amount"><span>$</span>397</div>
              <div className="price-period">per month, per location</div>
              <ul className="price-list">
                <li>Google <strong>and</strong> Yelp review responses</li>
                <li>Unlimited reviews covered</li>
                <li>24-hour response guarantee</li>
                <li>Human-reviewed, never templated</li>
                <li>All star ratings (1–5 stars)</li>
                <li>Client dashboard access</li>
                <li>Dedicated account setup</li>
                <li>Cancel anytime, no penalty</li>
              </ul>
              <a href="#contact" className="price-cta">Get started →</a>
              <div className="price-note">Setup takes less than 10 minutes. Live within 48 hours.</div>
            </div>
            <div className="price-card">
              <div className="price-badge-alt">One-time add-on</div>
              <div className="price-plan-label">Profile Cleanup</div>
              <div className="price-amount"><span>$</span>197</div>
              <div className="price-period">one-time fee</div>
              <ul className="price-list">
                <li>Responds to all 1–3 star reviews</li>
                <li>Covers last 180 days of reviews</li>
                <li>Google and Yelp profiles covered</li>
                <li>Completed within 5 business days</li>
                <li>Professional, on-brand responses</li>
                <li>Makes your profile look managed from day one</li>
                <li>Available at signup or anytime</li>
              </ul>
              <a href="#contact" className="price-cta price-cta-secondary">Add to my plan →</a>
              <div className="price-note">Most clients add this at signup. Highly recommended.</div>
            </div>
          </div>
          <p className="multi-note">
            Manage multiple locations?{' '}
            <a href="#contact">Contact us for a multi-location rate.</a>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="container">
          <div className="section-label">FAQ</div>
          <h2 className="section-h2">Questions answered.</h2>
          <div className="faq-list">
            {faqs.map((item, i) => (
              <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                <button className="faq-q" onClick={() => toggleFaq(i)}>
                  {item.q}
                  <span className="faq-icon">+</span>
                </button>
                <div className="faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section className="contact-sec" id="contact">
        <div className="container">
          <div className="section-label">Get started</div>
          <h2 className="section-h2">Ready to hand this off?</h2>
          <p className="section-sub">
            Fill out the form below and we&apos;ll reach out within one business day
            to get your account set up.
          </p>
          <div className="contact-card">
            {submitted ? (
              <div className="form-success">
                <div className="success-icon">✓</div>
                <h3>You&apos;re on your way.</h3>
                <p>We&apos;ll be in touch within one business day to get everything set up.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Your name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Jane Smith"
                      value={formState.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="business">Business name</label>
                    <input
                      type="text"
                      id="business"
                      name="business"
                      required
                      placeholder="Smith HVAC Services"
                      value={formState.business}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="jane@smithhvac.com"
                      value={formState.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="(555) 555-5555"
                      value={formState.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="interest">I&apos;m interested in</label>
                  <select
                    id="interest"
                    name="interest"
                    value={formState.interest}
                    onChange={handleChange}
                  >
                    <option>Monthly Plan ($397/mo)</option>
                    <option>Monthly Plan ($397/mo) + Profile Cleanup ($197)</option>
                    <option>Profile Cleanup only ($197)</option>
                    <option>Multi-location pricing</option>
                    <option>Just have questions</option>
                  </select>
                </div>
                <button type="submit" className="form-submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Get started →'}
                </button>
                <p className="form-note">No commitment. We&apos;ll reach out to answer any questions and get you set up.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* SOURCES */}
      <section className="sources-sec">
        <div className="container sources-inner">
          <div className="sources-label">Sources</div>
          <ul className="sources-list">
            <li><sup>1</sup> BrightLocal Local Consumer Review Survey (2024)</li>
            <li><sup>2</sup> Harvard Business Review — &ldquo;Responding to Customer Reviews&rdquo; (2022)</li>
            <li><sup>3</sup> ReplyOnTheFly Benchmark Report (2023)</li>
          </ul>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <h2>Your reviews are going<br />unanswered right now.</h2>
        <p>
          Every day without a response is a day a potential customer chose
          someone else. Let&apos;s fix that — starting today.
        </p>
        <a href="#contact" className="btn-white">Get started today →</a>
      </section>

      {/* FOOTER */}
      <footer>
        <p>
          © 2026 RespondPal LLC · respondpal.ai ·{' '}
          <a href="mailto:jacob@respondpal.ai">jacob@respondpal.ai</a>
        </p>
      </footer>
    </>
  )
}
