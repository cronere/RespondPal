'use client'
import { useState } from 'react'
import Image from 'next/image'

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <main>
      {/* NAV */}
      <nav className="nav" style={{ position: 'relative' }}>
        <div className="nav-inner">
          <Image src="/logo-white.png" alt="RespondPal" className="nav-logo" width={180} height={36} />
          <div className="desktop-links">
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#pricing" className="nav-cta">Get started</a>
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
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Get started</a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">Intelligent review response management</div>
          <h1>
            AI-Drafted. Human-Approved.<br />
            <em>Every review. Every time.</em>
          </h1>
          <p className="hero-sub">
            Our proprietary AI crafts on-brand responses to every Google and Yelp review your
            business receives — calibrated across dental, legal, veterinary, auto repair, the trades,
            restaurants, and more. A human approves every response before it goes live. You do nothing.
          </p>
          <div className="hero-cta-group">
            <a href="#pricing" className="btn-orange">Get started today →</a>
            <a href="#demo" className="btn-outline">See a live example</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">24hr</div>
              <div className="label">response guarantee on every review</div>
            </div>
            <div className="hero-stat">
              <div className="num">89%<sup>1</sup></div>
              <div className="label">of consumers expect a business response</div>
            </div>
            <div className="hero-stat">
              <div className="num">50%<sup>1</sup></div>
              <div className="label">are put off by generic, templated replies</div>
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
            Setup takes less than 10 minutes. We handle every review from there —
            Google and Yelp, 1 through 5 stars, every single one.
          </p>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3>Quick setup</h3>
              <p>Add us as a manager on Google and a team member on Yelp. We walk you through both — takes about 5 minutes.</p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <h3>We respond to everything</h3>
              <p>Every review gets a professional, on-brand response — crafted by our industry-calibrated AI and reviewed by a human before it goes live.</p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <h3>Your reputation stays sharp</h3>
              <p>Responses publish within 24 hours. You look responsive, professional, and engaged — without spending a minute on it.</p>
            </div>
          </div>
        </div>
      </section>


      {/* HOW WE'RE DIFFERENT — the AI + Human + Calibration story */}
      <section className="ai-section" id="different">
        <div className="container">
          <div className="section-label">How we&apos;re different</div>
          <h2 className="section-h2">Purpose-built AI.<br />Human-approved quality.</h2>
          <p className="section-sub">
            This isn&apos;t a chatbot writing your responses. Our AI has been engineered on
            thousands of real business reviews — studying what works, what backfires, and what
            makes customers trust you more. It&apos;s calibrated across dental, legal, veterinary,
            auto repair, the trades, restaurants, and more.
          </p>
          <div className="ai-cards">
            <div className="ai-card">
              <div className="ai-card-icon">🧠</div>
              <h3>AI-Drafted</h3>
              <p>Our proprietary AI is engineered specifically for review responses — not repurposed from a generic chatbot. It knows the difference between a billing complaint, a safety concern, and a rave review, and it handles each one differently for your industry.</p>
            </div>
            <div className="ai-card">
              <div className="ai-card-icon">👤</div>
              <h3>Human-Approved</h3>
              <p>Every response is reviewed by a human before it goes live on your profile. No auto-posting, no "set it and forget it" risk. You get the speed and consistency of AI with the judgment and trust of a real person.</p>
            </div>
            <div className="ai-card">
              <div className="ai-card-icon">📈</div>
              <h3>Gets Smarter Each Month</h3>
              <p>We analyze every response we craft for your business and refine our AI&apos;s instructions monthly. The longer you&apos;re with us, the sharper your responses get — tuned to your brand, your industry, and your customers.</p>
            </div>
          </div>
        </div>
      </section>


      {/* WHAT BAD RESPONSES LOOK LIKE */}
      <section className="compare-sec" id="bad-responses">
        <div className="container">
          <div className="section-label">The real problem</div>
          <h2 className="section-h2">Most businesses respond.<br />Most responses hurt them.</h2>
          <p className="section-sub">
            The issue isn&apos;t silence anymore — it&apos;s what businesses actually say when they reply.
            These are real patterns we see every day. Does any of this look familiar?
          </p>
          <div className="bad-examples">
            <div className="bad-card">
              <div className="bad-label bad-label-red">The Auto-Gush</div>
              <div className="bad-review">
                <span className="bad-stars">★☆☆☆☆</span>
                <span className="bad-text">&ldquo;Pushy, rude, and overcharged me. I won&apos;t be back.&rdquo;</span>
              </div>
              <div className="bad-response">
                &ldquo;Thank you so much for your wonderful review! We&apos;re thrilled you had a great experience!&rdquo;
              </div>
              <div className="bad-verdict">They didn&apos;t read the review. A 1-star complaint got a 5-star thank-you. Every future customer sees it.</div>
            </div>
            <div className="bad-card">
              <div className="bad-label bad-label-red">The Public Fight</div>
              <div className="bad-review">
                <span className="bad-stars">★☆☆☆☆</span>
                <span className="bad-text">&ldquo;The work was sloppy and they left a mess on my property...&rdquo;</span>
              </div>
              <div className="bad-response">
                &ldquo;Your claims are false. We have photos proving our work was excellent. You refused to pay and were rude to our staff...&rdquo;
              </div>
              <div className="bad-verdict">They argued back. Every future customer now sees a business that fights with people publicly.</div>
            </div>
            <div className="bad-card">
              <div className="bad-label bad-label-red">The Template Machine</div>
              <div className="bad-review">
                <span className="bad-stars">★☆☆☆☆</span>
                <span className="bad-text">&ldquo;Our pet passed away during a routine visit. We are devastated...&rdquo;</span>
              </div>
              <div className="bad-response">
                &ldquo;Thanks for your feedback! We hope your pet is doing well and feeling better!&rdquo;
              </div>
              <div className="bad-verdict">A generic template on a devastating loss. No human ever read this review before responding.</div>
            </div>
          </div>
          <p className="bad-bottom">RespondPal is built to prevent every one of these mistakes — automatically.</p>
        </div>
      </section>


      {/* REAL EXAMPLES / DEMO */}
      <section className="demo" id="demo">
        <div className="container">
          <div className="section-label">Real examples</div>
          <h2 className="section-h2">What your profiles<br />will look like.</h2>
          <div className="demo-card">
            {[
              { stars: '★★★★★', name: 'Sarah M.', platform: 'Google', neg: false,
                review: 'Best experience I\'ve had in years. Everyone on the team was friendly and professional. Will definitely be back!',
                response: 'Thank you so much, Sarah — this genuinely made our day! We\'ll pass along the kind words to the team. Can\'t wait to see you again soon.' },
              { stars: '★★☆☆☆', name: 'David R.', platform: 'Yelp', neg: true,
                review: 'Waited over 45 minutes past my appointment time. When I finally got in, everything felt rushed. Very frustrating.',
                response: 'David, thank you for being upfront — that kind of wait isn\'t the experience we want for anyone. We\'d like to look into what happened and make it right. Please reach out to us directly when you have a chance.' },
              { stars: '★★★★★', name: 'Michelle T.', platform: 'Google', neg: false,
                review: 'So glad I found this place. They were thorough, honest, and the pricing was completely transparent. Already recommended them to two friends.',
                response: 'Michelle, this means the world to us — especially the part about honesty and transparency. That\'s exactly what we want every visit to feel like. Thank you for the referrals, too!' },
            ].map((r, i) => (
              <div key={i} className="review-item">
                <div className="review-meta">
                  <span className={`avatar${r.neg ? ' neg' : ''}`}>{r.name[0]}</span>
                  <div>
                    <div className="reviewer-name">{r.name} · {r.platform}</div>
                    <div className={`stars${r.neg ? ' low' : ''}`}>{r.stars}</div>
                  </div>
                </div>
                <p className="review-text">&ldquo;{r.review}&rdquo;</p>
                <div className="response-block">
                  <div className="response-label">Owner response · within 24 hrs</div>
                  <p>{r.response}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* WHAT'S INCLUDED */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-label">What&apos;s included</div>
          <h2 className="section-h2">Everything you need.<br />Nothing you don&apos;t.</h2>
          <div className="feat-grid">
            {[
              { icon: '💬', title: 'Every review, every platform', desc: 'Google and Yelp. 1-star complaints to 5-star raves. Every single one gets a response.' },
              { icon: '⚡', title: '24-hour response guarantee', desc: 'Every review answered within 24 hours of posting. Your profile never looks neglected.' },
              { icon: '🧠', title: 'Industry-calibrated AI', desc: 'Purpose-built for your industry — dental, legal, trades, restaurants, and more. Not a generic chatbot.' },
              { icon: '👤', title: 'Human-approved', desc: 'Every response reviewed by a human before it goes live. No auto-posting, no risk.' },
              { icon: '🔒', title: 'Secure access', desc: 'Official manager/team access on Google and Yelp. No passwords shared. You stay in control.' },
              { icon: '📊', title: 'Quarterly intelligence report', desc: 'What your customers are actually telling you — trends, patterns, and insights most owners never see.' },
            ].map((f, i) => (
              <div key={i} className="feat">
                <div className="feat-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* FOUNDER */}
      <section className="founder-sec">
        <div className="container founder-inner">
          <img src="/jacob-merkley.png" alt="Jacob Merkley, Founder & CEO of RespondPal" className="founder-photo" />
          <div className="founder-label">From the founder</div>
          <blockquote className="founder-quote">
            &ldquo;Business owners are swamped — responding to reviews moves to the back
            burner every day. I built RespondPal to take that off your plate completely.
            Our AI has been engineered on thousands of real reviews to craft responses that
            are on-brand and calibrated for your industry. <strong>Every response is reviewed
            by a human before it goes live.</strong> And it gets smarter for your business
            each month. Your reputation stays sharp — and it costs you zero time.&rdquo;
          </blockquote>
          <div className="founder-name">Jacob Merkley</div>
          <div className="founder-title">Founder &amp; CEO, RespondPal</div>
        </div>
      </section>


      {/* TESTIMONIALS */}
      <section className="testimonials-sec">
        <div className="container">
          <div className="section-label">What clients say</div>
          <h2 className="section-h2">Real businesses.<br />Real results.</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">&ldquo;I had over 200 Google reviews and hadn&apos;t responded to a single one. Within 48 hours of signing up, every new review was getting a response. My only regret is not doing this sooner.&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">MR</div>
                <div>
                  <div className="testimonial-name">Marcus R.</div>
                  <div className="testimonial-biz">Owner, Riverside HVAC — Los Angeles, CA</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">&ldquo;We got a scathing 1-star review on a Friday night. By Saturday morning there was a professional, calm response up. That&apos;s exactly what I needed — someone handling this so I don&apos;t have to react emotionally.&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">DK</div>
                <div>
                  <div className="testimonial-name">Dr. Dana K.</div>
                  <div className="testimonial-biz">Owner, Coastal Veterinary Clinic — San Diego, CA</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">&ldquo;$397 a month is nothing compared to what one new client is worth to us. The responses sound exactly like me — my team has asked who&apos;s been writing them. Highly recommend.&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">SL</div>
                <div>
                  <div className="testimonial-name">Stephanie L.</div>
                  <div className="testimonial-biz">Owner, Luminary Med Spa — Scottsdale, AZ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* AI VISIBILITY */}
      <section className="features" style={{ background: 'var(--dark2)' }}>
        <div className="container">
          <div className="section-label">The bigger picture</div>
          <h2 className="section-h2">AI search is reading<br />your responses now.</h2>
          <p className="section-sub">
            Google&apos;s AI Overviews, ChatGPT, and Perplexity now synthesize your reviews to decide
            whether to recommend your business. Response rate, recency, and sentiment all factor in.
            An unanswered review isn&apos;t just a missed conversation — it&apos;s a signal to AI that
            your business is disengaged.
          </p>
        </div>
      </section>


      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="container">
          <div className="section-label">Pricing</div>
          <h2 className="section-h2">Simple pricing.<br />No surprises.</h2>
          <p className="section-sub">
            Flat monthly rate. No contracts. No setup fees. Cancel anytime.
          </p>
          <div className="pricing-cards">
            <div className="price-card">
              <div className="price-name">1 Location</div>
              <div className="price-amount">$397<span>/mo</span></div>
              <div className="pricing-includes">
                <div>✓ Google &amp; Yelp responses</div>
                <div>✓ Unlimited reviews</div>
                <div>✓ 24-hour guarantee</div>
                <div>✓ Industry-calibrated AI</div>
                <div>✓ Human-approved</div>
                <div>✓ Quarterly intelligence report</div>
              </div>
              <a href="mailto:team@respondpal.ai" className="btn-orange" style={{ marginTop: 'auto' }}>Get started →</a>
            </div>
            <div className="price-card featured">
              <div className="price-name">2 Locations</div>
              <div className="price-amount">$649<span>/mo</span></div>
              <div className="price-save">Save $145/mo</div>
              <div className="pricing-includes">
                <div>✓ Everything in 1 Location</div>
                <div>✓ Both locations covered</div>
                <div>✓ Unified brand voice</div>
              </div>
              <a href="mailto:team@respondpal.ai" className="btn-orange" style={{ marginTop: 'auto' }}>Get started →</a>
            </div>
            <div className="price-card">
              <div className="price-name">3 Locations</div>
              <div className="price-amount">$897<span>/mo</span></div>
              <div className="price-save">Save $294/mo</div>
              <div className="pricing-includes">
                <div>✓ Everything in 1 Location</div>
                <div>✓ All three locations covered</div>
                <div>✓ Unified brand voice</div>
              </div>
              <a href="mailto:team@respondpal.ai" className="btn-orange" style={{ marginTop: 'auto' }}>Get started →</a>
            </div>
          </div>
          <p className="section-sub" style={{ marginTop: '1.5rem', fontSize: '0.95rem' }}>
            <strong>4+ locations or enterprise?</strong> Contact us for custom pricing — high-volume accounts welcome.
          </p>
          <div className="pricing-addon">
            <div className="pricing-addon-badge">Add-on</div>
            <p><strong>Profile Cleanup — $197 one-time.</strong> We respond to every unanswered 1–3 star review from the last 180 days so your profile looks professionally managed from day one.</p>
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section className="faq">
        <div className="container">
          <div className="section-label">FAQ</div>
          <h2 className="section-h2">Questions answered.</h2>
          <div className="faq-list">
            {[
              { q: 'How does RespondPal write responses that sound like my business?',
                a: 'During onboarding, you share your brand voice preferences — tone, do\'s and don\'ts, and any specifics about your business. Our AI uses these along with industry-specific calibration to craft responses that sound like you. The longer you\'re with us, the sharper it gets.' },
              { q: 'Is a human actually reviewing every response?',
                a: 'Yes. Every response is reviewed by a human before it goes live on your profile. We never auto-post. You get the speed and consistency of AI with the quality control of a real person.' },
              { q: 'What if I don\'t like a response after it\'s posted?',
                a: 'Just let us know. We\'ll revise or replace it — no questions asked. You can also submit ongoing guidance through our feedback form to refine future responses.' },
              { q: 'How do you handle negative reviews?',
                a: 'Carefully. Our AI is specifically engineered to handle complaints — it never argues, never gets defensive, never concedes fault inappropriately, and never uses a generic template. Every negative review gets a composed, professional response that protects your reputation.' },
              { q: 'Do I need to give you my password?',
                a: 'No. We use Google\'s official Manager access and Yelp\'s Team Member feature. No passwords are ever shared. You stay in complete control of your profiles.' },
              { q: 'Can I cancel anytime?',
                a: 'Yes. No contracts, no cancellation fees. If you cancel, you simply won\'t be charged again. We keep it simple.' },
            ].map((item, i) => (
              <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {item.q}
                  <span className="faq-icon">{openFaq === i ? '−' : '+'}</span>
                </button>
                <div className="faq-a"><p>{item.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* SOURCES */}
      <section className="sources-sec">
        <div className="container">
          <div className="sources-label">Sources</div>
          <ul className="sources-list">
            <li><sup>1</sup> BrightLocal Local Consumer Review Survey (2026)</li>
            <li><sup>1</sup> Business response-rate data via BrightLocal &amp; Upfirst (2025)</li>
          </ul>
        </div>
      </section>


      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Your reviews deserve better<br />than silence — or templates.</h2>
          <p>AI-drafted. Human-approved. Live within 48 hours. Cancel anytime.</p>
          <a href="mailto:team@respondpal.ai" className="btn-orange">Get started today →</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <p>&copy; {new Date().getFullYear()} RespondPal LLC · respondpal.ai</p>
          <div className="footer-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/details">How it works</a>
            <a href="mailto:team@respondpal.ai">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
