import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'RespondPal — Company Overview',
  description: 'Why this service exists, why it wins, and where it\'s going.',
  robots: { index: false, follow: false },
}

export default function Market() {
  return (
    <main className="market-page">
      {/* Nav */}
      <nav className="details-nav">
        <div className="details-nav-inner">
          <Link href="/">
            <Image src="/logo-white.png" alt="RespondPal" className="details-nav-logo" width={180} height={36} />
          </Link>
          <span className="market-nav-tag">Confidential · Company Overview</span>
        </div>
      </nav>

      {/* Hero */}
      <header className="market-hero">
        <div className="market-container">
          <div className="market-eyebrow">Company Overview</div>
          <h1>Why this service exists.<br />Why it wins.</h1>
          <p className="market-hero-sub">
            The market, the technology, the competitive landscape, and
            the business model — everything you need to understand the opportunity.
          </p>
        </div>
      </header>

      <div className="market-container market-body">

        {/* Table of Contents */}
        <section className="market-toc">
          <div className="market-toc-label">What you&apos;ll find in this document</div>
          <ul>
            <li>Why review responses are a non-negotiable business function</li>
            <li>The market size and why it&apos;s massively underserved</li>
            <li>Our proprietary AI — the three-layer architecture that creates the moat</li>
            <li>The competitive landscape and why we win</li>
            <li>The HIPAA compliance advantage for healthcare verticals</li>
            <li>Business model, unit economics, and growth path</li>
          </ul>
        </section>

        {/* SECTION 1 */}
        <SectionLabel n="01" title="Why review responses are non-negotiable" />

        <div className="market-stat-grid">
          <Stat n="89%" label="of consumers expect a response to their review" src="BrightLocal 2026" />
          <Stat n="50%" label="of consumers are put off by generic, templated replies" src="BrightLocal 2026" />
          <Stat n="81%" label="expect a response within a week of leaving a review" src="BrightLocal 2026" />
          <Stat n="$10K+" label="in federal fines for HIPAA violations in review responses" src="HHS OCR enforcement" />
        </div>

        <p className="market-p">
          Business owners know reviews matter. Most of them are responding at least sometimes.
          But the responses are <strong>bad</strong> — templated, defensive, tone-deaf, or so
          generic that half of consumers actively distrust them. In healthcare specifically,
          well-intentioned responses routinely cross HIPAA compliance lines that carry $10,000
          to $50,000 in federal fines per violation.
        </p>
        <p className="market-p">
          The problem isn&apos;t awareness — it&apos;s execution. Business owners don&apos;t have
          the time, the training, or the legal knowledge to respond correctly to every review,
          every time. That&apos;s the gap RespondPal fills.
        </p>

        {/* SECTION 2 */}
        <SectionLabel n="02" title="The market opportunity" />

        <p className="market-p">
          The United States has <strong>36.2 million</strong> small businesses (SBA 2025 Small Business
          Profile) — 99.9% of all businesses in America. About <strong>6.3 million</strong> are employer
          firms with staff, revenue, and enough customer volume to care about reviews. The best targets —
          independently owned local service businesses with 50+ reviews and poor or inconsistent response
          quality — number a conservative <strong>2 to 3 million</strong>.
        </p>

        <div className="market-table-wrap">
          <table className="market-table">
            <thead>
              <tr><th>Market</th><th>Businesses</th><th>Revenue Potential</th><th>Notes</th></tr>
            </thead>
            <tbody>
              <tr><td>TAM — Total Addressable</td><td>6.3M employer SMBs</td><td>$30B+/yr</td><td>All US employer small businesses with Google profiles</td></tr>
              <tr><td>SAM — Serviceable</td><td>~2.5M local service</td><td>$12B+/yr</td><td>Independents with review volume — the real target</td></tr>
              <tr><td>Initial Beachhead</td><td>Healthcare verticals</td><td>—</td><td>Dental, med spa, chiropractic, plastic surgery, pediatrics, PT</td></tr>
              <tr><td>Just 0.01% of SAM</td><td>~250 businesses</td><td>$1.2M/yr</td><td>250 clients at $397/mo = $1.2M ARR</td></tr>
            </tbody>
          </table>
        </div>

        <div className="market-callout market-callout-accent">
          <p>
            The gap in the market: done-for-you review management that&apos;s HIPAA-compliant,
            industry-calibrated, human-approved, and under $400/month with no contract.
            <strong> That gap has 2.5 million businesses sitting in it.</strong>
          </p>
        </div>

        {/* SECTION 3 */}
        <SectionLabel n="03" title="Our proprietary AI — the three-layer architecture" />

        <p className="market-p">
          Anyone can plug a review into ChatGPT and get a response. What they can&apos;t get is
          a response that&apos;s been engineered against validated failure patterns, calibrated for
          their industry&apos;s legal and emotional landscape, and customized to their brand voice.
          Our AI is purpose-built for review responses — not repurposed from a general chatbot.
        </p>

        <div className="market-callout">
          <div className="market-callout-label">Layer 1 — Universal behavioral rules</div>
          <p>
            Ten rules that govern every response the system writes, regardless of industry. Developed
            by analyzing thousands of real business review responses across 44 companies in 10 industries.
            These rules cover: never argue with a reviewer, never confirm private information publicly,
            never claim a false resolution, match the emotional weight of the review, never ask for review
            removal, and more. The last six industries tested added zero new rules — saturation was reached.
            The ruleset is complete and validated.
          </p>
        </div>

        <div className="market-callout">
          <div className="market-callout-label">Layer 2 — Industry-specific calibration</div>
          <p>
            A dental practice needs different response logic than a restaurant. A dental response
            cannot say &ldquo;sorry about your visit&rdquo; because that confirms patient status
            under HIPAA. A restaurant response can and should. Our system knows the difference and
            applies the right rules automatically based on the client&apos;s industry. We have
            calibrated instruction files for dental, medical, legal, veterinary, med spa, chiropractic,
            auto repair, plumbing, roofing, HVAC, and restaurants — each built from real failure
            analysis specific to that vertical.
          </p>
        </div>

        <div className="market-callout">
          <div className="market-callout-label">Layer 3 — Per-client customization</div>
          <p>
            Each client&apos;s brand voice, signing name, tone preferences, and things they want to
            avoid are layered on top. The system produces responses that sound like that specific
            business — not like a generic AI. A monthly feedback loop refines the instructions based
            on every response we craft. The longer a client stays, the sharper their responses get.
          </p>
        </div>

        <div className="market-callout">
          <div className="market-callout-label">Why this can&apos;t be replicated quickly</div>
          <p>
            Building what we built requires analyzing thousands of real reviews across multiple
            industries, identifying the failure patterns, stress-testing the rules against the hardest
            edge cases, and iterating until the system handles every scenario correctly. That&apos;s months
            of intensive analytical work that&apos;s already been done and baked into the system. A new
            competitor would be starting from zero — and getting the HIPAA compliance layer wrong exposes
            their clients to federal fines. The knowledge is in the calibration, not the technology.
          </p>
        </div>

        {/* SECTION 4 */}
        <SectionLabel n="04" title="The competitive landscape" />

        <div className="market-table-wrap">
          <table className="market-table market-table-compact">
            <thead>
              <tr><th>Competitor</th><th>Price/mo</th><th>Contract</th><th>Model</th><th>Yelp?</th><th>Bottom line</th></tr>
            </thead>
            <tbody>
              <tr><td>Birdeye</td><td>$299–499+</td><td>Annual</td><td>DIY Software</td><td>Limited</td><td>Overpriced. Annual lock-in. Business still does the work.</td></tr>
              <tr><td>Podium</td><td>$399–800+</td><td>Annual</td><td>DIY Software</td><td>No</td><td>Expensive. No Yelp. AI replies cost an extra $99/mo.</td></tr>
              <tr><td>Marqii</td><td>Volume-based</td><td>Yes</td><td>Done-for-you</td><td>Yes</td><td>Restaurants only. High volume required.</td></tr>
              <tr><td>RepliFast</td><td>$19–99</td><td>No</td><td>AI Software</td><td>No</td><td>Cheapest. Business still approves every post. No real service.</td></tr>
              <tr><td>BrightLocal</td><td>$7–70</td><td>No</td><td>Monitoring</td><td>No</td><td>Doesn&apos;t respond at all. Just tells you reviews exist.</td></tr>
              <tr className="market-row-highlight"><td>RespondPal</td><td>$397–897</td><td>None</td><td>AI-drafted + human-approved</td><td>Yes</td><td>The ONLY done-for-you, AI-calibrated, HIPAA-compliant service at this price.</td></tr>
            </tbody>
          </table>
        </div>

        <p className="market-p">
          The biggest competitive threat isn&apos;t Birdeye or Podium — it&apos;s solo marketing agencies
          white-labeling GoHighLevel with a raw ChatGPT connection for $99/month. Our defense: those tools
          produce generic, non-compliant responses that create liability for healthcare clients. Our
          three-layer architecture, HIPAA conditional logic, and human approval process are fundamentally
          different — and that difference is the entire value proposition.
        </p>

        {/* SECTION 5 */}
        <SectionLabel n="05" title="The HIPAA compliance advantage" />

        <p className="market-p">
          Healthcare practices face an impossible choice: respond to reviews and risk HIPAA violations,
          or stay silent and lose patients to competitors who engage. Our system is the third option
          they didn&apos;t know existed — empathetic, professional, and fully compliant on every response.
        </p>

        <div className="market-callout">
          <div className="market-callout-label">Documented enforcement actions</div>
          <p>
            HHS has fined dental practices $10,000 to $50,000 for responding to reviews in ways that
            confirm patient status — phrases as simple as &ldquo;sorry about your visit&rdquo; or
            &ldquo;we haven&apos;t seen you since 2021.&rdquo; Specific cases include New Vision Dental
            (CA, $23,000), a North Carolina dental practice ($50,000), and Manasa Health Center
            (NJ, $30,000). Our AI automatically prevents these violations through a conditional HIPAA
            compliance layer that activates for healthcare clients.
          </p>
        </div>

        <p className="market-p">
          In qualifying 275 healthcare practices across six metro areas, <strong>67% had visible HIPAA
          violations in their existing review responses</strong>. Most had no idea. This creates an
          extraordinarily strong inbound sales motion: we show a practice their own violations in a
          branded audit report, and the service sells itself.
        </p>

        {/* SECTION 6 */}
        <SectionLabel n="06" title="Business model and unit economics" />

        <p className="market-p">For $397/month per location, every client receives:</p>

        <div className="market-deliver-grid">
          {[
            'Every Google and Yelp review responded to within 24 hours',
            'Industry-calibrated AI drafting (HIPAA-compliant for healthcare)',
            'Human-approved — every response reviewed before posting',
            'On-brand voice calibrated for their specific business',
            'Gets smarter each month through feedback loop',
            'Quarterly Reputation & Business Intelligence Report',
            'No passwords shared — official manager access',
            'Cancel anytime — no contract, no penalty',
          ].map((item, i) => (
            <div key={i} className="market-deliver-item">
              <span className="market-check">✓</span> {item}
            </div>
          ))}
        </div>

        <div className="market-callout">
          <div className="market-callout-label">Unit economics</div>
          <div className="market-table-wrap" style={{ marginTop: '0.75rem' }}>
            <table className="market-table">
              <thead>
                <tr><th>Metric</th><th>Per Client</th><th>Notes</th></tr>
              </thead>
              <tbody>
                <tr><td>Monthly revenue</td><td>$397</td><td>$649 for 2 locations, $897 for 3</td></tr>
                <tr><td>AI cost (Claude API)</td><td>~$2–5/mo</td><td>Per client, based on review volume</td></tr>
                <tr><td>Human review time</td><td>~15–20 min/mo</td><td>Average time per client for quality review</td></tr>
                <tr><td>Gross margin</td><td>~95%+</td><td>At scale with part-time QA support</td></tr>
                <tr><td>Customer acquisition cost</td><td>&lt;$50</td><td>Cold email + audit report delivery</td></tr>
                <tr><td>Payback period</td><td>Month 1</td><td>First month&apos;s revenue covers CAC</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="market-callout">
          <div className="market-callout-label">Growth path</div>
          <div className="market-table-wrap" style={{ marginTop: '0.75rem' }}>
            <table className="market-table">
              <thead>
                <tr><th>Phase</th><th>Clients</th><th>MRR</th><th>ARR</th></tr>
              </thead>
              <tbody>
                <tr><td>Validation (Months 1–3)</td><td>10–20</td><td>$4K–8K</td><td>$48K–96K</td></tr>
                <tr><td>Growth (Months 4–8)</td><td>50+</td><td>$20K+</td><td>$240K+</td></tr>
                <tr className="market-row-highlight"><td>Scale (Month 12+)</td><td>150+</td><td>$50K+</td><td>$600K+</td></tr>
              </tbody>
            </table>
          </div>
          <p className="market-p" style={{ marginTop: '0.75rem' }}>
            Scale phase incorporates whitelabel agency partnerships at $249–279/month per location,
            where agencies resell the service under their own brand. Each agency partner adds 10–20
            clients with zero direct sales effort. At 150+ locations, one part-time quality reviewer
            handles the human-approval bottleneck at ~$3K/month — maintaining 90%+ gross margins.
          </p>
        </div>

        <div className="market-callout">
          <div className="market-callout-label">Revenue diversification</div>
          <p>
            Beyond the monthly subscription, RespondPal generates revenue through the Reputation
            Risk Audit ($47–97 one-time diagnostic, primarily used as a sales tool with 95%+ margins),
            the Reputation Cleanup ($197 one-time profile remediation), and the Quarterly Intelligence
            Report (included in the subscription, drives retention by proving ongoing value). Each
            product serves a specific stage of the customer lifecycle: audit → cleanup → subscription → retention.
          </p>
        </div>

        {/* Bottom line */}
        <div className="market-bottomline">
          <div className="market-bottomline-label">The bottom line</div>
          <p>
            A massive market of businesses responding badly to reviews — or not responding at all.
            A proprietary AI system calibrated on thousands of real reviews with a HIPAA compliance
            layer that no competitor offers. 95%+ gross margins with a product that gets stickier
            over time. A clear path from founder-led sales to agency-partnered scale. And the hardest
            part — building the intelligence engine — is already done.
          </p>
        </div>

        <footer className="market-footer">
          <p>RespondPal LLC · respondpal.ai · team@respondpal.ai</p>
          <p className="market-confidential">Confidential — for internal use only.</p>
        </footer>
      </div>
    </main>
  )
}

function SectionLabel({ n, title }) {
  return (
    <div className="market-section-label">
      <span className="market-section-n">{n}</span>
      <span className="market-section-title">{title}</span>
    </div>
  )
}

function Stat({ n, label, src }) {
  return (
    <div className="market-stat">
      <div className="market-stat-n">{n}</div>
      <div className="market-stat-label">{label}</div>
      <div className="market-stat-src">{src}</div>
    </div>
  )
}
