'use client'

import { useState } from 'react'

const TABS = [
  { key: 'why', label: 'Why This Works' },
  { key: 'sell', label: 'How You Sell' },
  { key: 'objections', label: 'Objections' },
  { key: 'loom', label: 'Loom Script' },
  { key: 'commission', label: 'Commission' },
  { key: 'ownership', label: 'Ownership Rules' },
]

const cardStyle = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }
const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }
const h2Style = { fontSize: '1.15rem', fontWeight: 700, color: '#1a1a1a', marginTop: '1.75rem', marginBottom: '0.75rem' }
const pStyle = { fontSize: '0.9rem', color: '#374151', lineHeight: 1.65, marginBottom: '0.75rem' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }
const thStyle = { textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }
const tdStyle = { padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f4f6', color: '#1a1a1a' }

function Stat({ n, label }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem 0.5rem' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a1a1a' }}>{n}</div>
      <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
    </div>
  )
}

export default function SalesToolkit() {
  const [tab, setTab] = useState('why')
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState('')

  const copyTemplate = (key, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(''), 2000)
    })
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Sales Toolkit</h1>
        <p className="admin-page-sub">
          Everything you need to sell RespondPal — why it works, how to sell it, what you earn, and
          how ownership works. We&apos;ll keep adding to this as new questions come up.
        </p>
      </header>

      <div className="leads-tabs-desktop" style={{ gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem',
              color: tab === t.key ? '#C2410C' : '#6b7280',
              borderBottom: tab === t.key ? '2px solid #C2410C' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="leads-tabs-mobile" style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => setMobileTabsOpen((open) => !open)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white',
            fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a', cursor: 'pointer',
          }}
        >
          <span>☰ {TABS.find((t) => t.key === tab)?.label}</span>
          <span>{mobileTabsOpen ? '▲' : '▼'}</span>
        </button>
        {mobileTabsOpen && (
          <div style={{ marginTop: '0.4rem', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setMobileTabsOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none',
                  borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: '0.9rem',
                  fontWeight: tab === t.key ? 700 : 500,
                  color: tab === t.key ? '#C2410C' : '#1a1a1a',
                  background: tab === t.key ? '#FFF7ED' : 'white',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── WHY THIS WORKS ── */}
      {tab === 'why' && (
        <div style={{ maxWidth: 720 }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', marginBottom: '0.5rem' }}>
              <Stat n="89%" label="expect a review response" />
              <Stat n="50%" label="distrust generic replies" />
              <Stat n="67%" label="of healthcare practices have HIPAA violations in responses" />
            </div>
            <p style={{ ...pStyle, marginBottom: 0, marginTop: '0.5rem' }}>
              Business owners know reviews matter and are responding at least sometimes — but the
              responses are bad: templated, defensive, or so generic that half of consumers actively
              distrust them. In healthcare specifically, well-intentioned responses routinely cross
              HIPAA lines that carry $10,000–$50,000 in real federal fines per violation. The problem
              isn&apos;t awareness — it&apos;s execution. That&apos;s the gap we fill.
            </p>
          </div>

          <h2 style={h2Style}>The market</h2>
          <p style={pStyle}>
            2 to 3 million independently-owned local service businesses in the US have 50+ reviews and
            poor or inconsistent response quality — the real target. Healthcare is our beachhead: dental,
            med spa, chiropractic, plastic surgery, pediatrics, physical therapy. The gap in the market is
            done-for-you review management that&apos;s HIPAA-compliant, industry-calibrated, human-approved,
            and under $400/month with no contract — and that gap has millions of businesses sitting in it.
          </p>

          <h2 style={h2Style}>Our AI — why it can&apos;t be copied overnight</h2>
          <p style={pStyle}>
            Anyone can plug a review into ChatGPT. What they can&apos;t get is a response engineered against
            validated failure patterns, calibrated for the industry&apos;s legal and emotional landscape, and
            customized to the client&apos;s brand voice. Three layers, in order:
          </p>
          <div style={cardStyle}>
            <div style={{ marginBottom: '0.9rem' }}>
              <div style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: '0.3rem' }}>1. Universal behavioral rules</div>
              <p style={{ ...pStyle, marginBottom: 0 }}>
                Ten rules every response follows regardless of industry — never argue with a reviewer,
                never confirm private information publicly, never claim a false resolution, and more.
                Developed from analyzing thousands of real review responses across many
                industries (HVAC, roofing, plumbing, auto repair, dental, med spa, chiropractic, physical therapy, family law, veterinary, restaurants).
              </p>
            </div>
            <div style={{ marginBottom: '0.9rem' }}>
              <div style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: '0.3rem' }}>2. Industry-specific calibration</div>
              <p style={{ ...pStyle, marginBottom: 0 }}>
                A dental response can&apos;t say &quot;sorry about your visit&quot; — that confirms patient
                status under HIPAA. A restaurant response can and should. The system knows the difference
                automatically, with calibrated instructions for dental, medical, legal, veterinary, med
                spa, chiropractic, auto repair, and more.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: '0.3rem' }}>3. Per-client customization</div>
              <p style={{ ...pStyle, marginBottom: 0 }}>
                Brand voice, signing name, tone, and things to avoid layer on top. Responses sound like
                that specific business — not a generic AI. A monthly feedback loop makes it sharper the
                longer a client stays.
              </p>
            </div>
          </div>

          <h2 style={h2Style}>The competition, honestly</h2>
          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Competitor</th>
                  <th style={thStyle}>Price/mo</th>
                  <th style={thStyle}>Model</th>
                  <th style={thStyle}>Bottom line</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={tdStyle}>Birdeye</td><td style={tdStyle}>$299–499+</td><td style={tdStyle}>DIY software</td><td style={tdStyle}>Overpriced, annual lock-in, business still does the work</td></tr>
                <tr><td style={tdStyle}>Podium</td><td style={tdStyle}>$399–800+</td><td style={tdStyle}>DIY software</td><td style={tdStyle}>No Yelp, AI replies cost extra</td></tr>
                <tr><td style={tdStyle}>RepliFast</td><td style={tdStyle}>$19–99</td><td style={tdStyle}>AI software</td><td style={tdStyle}>Business still approves every post — no real service</td></tr>
                <tr><td style={tdStyle}>BrightLocal</td><td style={tdStyle}>$7–70</td><td style={tdStyle}>Monitoring</td><td style={tdStyle}>Doesn&apos;t respond at all</td></tr>
                <tr style={{ background: '#FFF7ED' }}><td style={{ ...tdStyle, fontWeight: 700 }}>RespondPal</td><td style={{ ...tdStyle, fontWeight: 700 }}>$397–897</td><td style={{ ...tdStyle, fontWeight: 700 }}>AI-drafted + human-approved</td><td style={{ ...tdStyle, fontWeight: 700 }}>The only done-for-you, HIPAA-compliant service at this price</td></tr>
              </tbody>
            </table>
          </div>
          <p style={pStyle}>
            The real competitive threat isn&apos;t Birdeye or Podium — it&apos;s solo agencies white-labeling
            a raw ChatGPT connection for $99/month. Those produce generic, non-compliant responses that
            create real liability for healthcare clients. Our three-layer architecture and human approval
            process are the entire value proposition.
          </p>

          <h2 style={h2Style}>The HIPAA angle — your strongest opener</h2>
          <div style={{ ...cardStyle, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              HHS has fined healthcare practices $10,000–$50,000 for review responses that confirm patient
              status — phrases as simple as &quot;sorry about your visit&quot; or &quot;we haven&apos;t
              seen you since 2021.&quot; Real cases: New Vision Dental (CA, $23,000), a North Carolina
              practice ($50,000), Manasa Health Center (NJ, $30,000). In qualifying 275 healthcare
              practices across six metro areas, <b>67% had visible HIPAA violations in their existing
              responses</b> — most had no idea. That&apos;s why the free audit sells itself once a
              practice sees their own violations quoted back to them.
            </p>
          </div>
        </div>
      )}

      {/* ── HOW YOU SELL ── */}
      {tab === 'sell' && (
        <div style={{ maxWidth: 720 }}>
          <div style={cardStyle}>
            <div style={labelStyle}>The playbook</div>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              Close the deal, hand off the client, collect residuals. You never write a response, handle
              a support ticket, or manage a client relationship. The AI drafts, the team reviews and
              posts, you get paid.
            </p>
          </div>

          <h2 style={h2Style}>Step by step</h2>
          {[
            { t: 'Find businesses with bad review responses', d: 'Search Google Maps for local businesses in your target industry. Sort reviews by lowest. Check owner responses to negative AND positive reviews — look for HIPAA/privacy slips (healthcare), combative tone, generic templates, or no response at all.' },
            { t: 'Send the cold email or call', d: 'Healthcare (compliance angle): "I\'ve been researching how healthcare practices in [City] handle review responses. Most accidentally include details that create compliance exposure. I noticed a few on your profile that follow the same pattern — can I send over a quick report?" General business (reputation angle): "Your Google responses are either missing or feel generic. We fix that with AI built for your industry, reviewed by a human before it posts. $397/month, no contract."' },
            { t: 'Deliver the report', d: 'Healthcare leads → submit via Request an Audit, Jacob reviews every finding personally. Everyone else → build a Response Examples PDF yourself using their real reviews. Either way, record a short Loom walking through it and send the PDF alongside.' },
            { t: 'Follow up and close', d: '1-2 business days after delivering, call the office. Reference the report by name — you\'re a consultant following up on a report they requested, not a cold caller. The report already did the selling; you\'re there to answer questions and take payment.' },
            { t: 'Onboard and hand off', d: 'Use your personal onboarding link (in the Onboard a Client tab) so you\'re automatically credited. Stay on the call, walk them through the form. Client grants Google/Yelp access. Live within 48 hours.' },
          ].map((step, i) => (
            <div key={i} style={{ ...cardStyle, display: 'flex', gap: '1rem' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#C2410C', minWidth: 28 }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: '0.3rem' }}>{step.t}</div>
                <p style={{ ...pStyle, marginBottom: 0 }}>{step.d}</p>
              </div>
            </div>
          ))}

          <h2 style={h2Style}>A full outreach cadence, not just a single touch</h2>
          <div style={cardStyle}>
            <p style={pStyle}>
              Most deals don&apos;t close on the first touch. This is a realistic multi-day sequence
              — spread it out, don&apos;t compress it into one day just to move faster.
            </p>
            {[
              { day: 'Day 1', t: 'Cold outreach', d: 'Cold call or cold email using the templates above. This is the first touch, not the close — the goal is just to get the report in front of them.' },
              { day: 'Day 3', t: 'The video audit email', d: 'Send the Audit or Response Examples PDF with a short Loom walking through it. This is your strongest asset — most of the real selling happens here, not on a call.' },
              { day: 'Day 5', t: 'LinkedIn follow-up', d: 'Connect with the owner or practice manager. A short note referencing the email you sent — "wanted to make sure it didn\'t get lost in a busy inbox" — works better than repeating the pitch.' },
              { day: 'Day 7', t: 'The close call', d: 'Call to close, referencing the report by name — you\'re following up on something they requested, not cold calling again. The report already did the selling; you\'re there for questions and payment.' },
              { day: 'Day 12', t: 'The breakup email', d: 'If there\'s been no response at all, one final, low-pressure note: "Wanted to check if this is still worth a look, or if now just isn\'t the right time — happy to circle back later if so." Genuinely close the loop rather than fading out — a clear final touch gets replies more often than silence does.' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: i < 4 ? '1rem' : 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#C2410C', minWidth: 55 }}>{step.day}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a', marginBottom: '0.2rem' }}>{step.t}</div>
                  <p style={{ ...pStyle, marginBottom: 0, fontSize: '0.85rem' }}>{step.d}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 style={h2Style}>Copy-paste templates</h2>
          <p style={pStyle}>
            The same scripts from the step above, as actual text you can grab directly — no retyping
            from the description.
          </p>

          {[
            {
              key: 'healthcare-email',
              label: 'Healthcare cold email (compliance angle)',
              text: "I've been researching how healthcare practices in [City] handle review responses. Most accidentally include details that create compliance exposure. I noticed a few on your profile that follow the same pattern — can I send over a quick report?",
            },
            {
              key: 'general-email',
              label: 'General business cold email (reputation angle)',
              text: 'Your Google responses are either missing or feel generic. We fix that with AI built for your industry, reviewed by a human before it posts. $397/month, no contract.',
            },
            {
              key: 'gatekeeper',
              label: 'Gatekeeper script (cold call)',
              text: "Is the owner or manager available? I'm calling about their Google reviews.",
            },
          ].map((tpl) => (
            <div key={tpl.key} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a' }}>{tpl.label}</div>
                <button
                  onClick={() => copyTemplate(tpl.key, tpl.text)}
                  className="rev-mini-btn"
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {copiedKey === tpl.key ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p style={{ ...pStyle, marginBottom: 0, fontStyle: 'italic' }}>&quot;{tpl.text}&quot;</p>
            </div>
          ))}

          <h2 style={h2Style}>Leave-behind PDFs</h2>
          <p style={pStyle}>
            A one-page summary a prospect can forward internally — to a partner, an office manager,
            anyone who wasn&apos;t on the call. Use the healthcare version for anything with a HIPAA
            angle; the general version for everyone else, since HIPAA doesn&apos;t apply outside
            healthcare and shouldn&apos;t appear on a non-healthcare prospect&apos;s copy.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <a href="/leave-behinds/RespondPal_Healthcare_One_Pager.pdf" target="_blank" rel="noreferrer" className="rev-ai-btn">
              Healthcare one-pager (PDF) ↓
            </a>
            <a href="/leave-behinds/RespondPal_General_One_Pager.pdf" target="_blank" rel="noreferrer" className="rev-mini-btn">
              General business one-pager (PDF) ↓
            </a>
          </div>

          <p style={pStyle}>
            <b>The Fine Tracker</b> is a separate, deeper document — four real, named OCR settlements
            with amounts and what actually happened in each. Use it when a healthcare prospect is
            skeptical the HIPAA risk is real, not as your default opener — the healthcare one-pager
            already covers the core pitch, this is the follow-up proof when someone specifically
            needs to see more before they believe it.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <a href="/leave-behinds/RespondPal_Fine_Tracker.pdf" target="_blank" rel="noreferrer" className="rev-mini-btn">
              Fine Tracker (PDF) ↓
            </a>
          </div>

          <h2 style={h2Style}>If a prospect insists on responding manually</h2>
          <div style={cardStyle}>
            <p style={pStyle}>
              Some healthcare prospects will want to keep responding themselves even after seeing
              the risk. These three templates are safe patterns they can copy directly — hand them
              over as a genuine, useful gift, then close with: &quot;You can copy and paste these
              every time, or let RespondPal handle it automatically so your staff never has to get
              this right on their own.&quot;
            </p>
            <a href="/leave-behinds/RespondPal_Template_Pack.pdf" target="_blank" rel="noreferrer" className="rev-mini-btn">
              Template Pack (PDF) ↓
            </a>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', marginBottom: '0.4rem' }}>Tier 1 — Responding to a positive review</div>
            <p style={{ ...pStyle, marginBottom: '0.5rem', fontStyle: 'italic' }}>
              &quot;Thank you for the kind words! We&apos;re glad to hear it. If you ever have
              questions about your care, our office is always happy to help — feel free to call us
              directly at [Phone].&quot;
            </p>
            <p style={{ ...pStyle, marginBottom: 0, fontSize: '0.78rem', color: '#6b7280' }}>
              Never confirms the reviewer is a patient — it thanks them for the review itself, which
              works regardless of who they actually are.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', marginBottom: '0.4rem' }}>Tier 2 — Responding to a negative review with a clinical complaint</div>
            <p style={{ ...pStyle, marginBottom: '0.5rem', fontStyle: 'italic' }}>
              &quot;We take all feedback seriously, as patient care is our highest priority. Due to
              privacy regulations, we can&apos;t discuss specific care details in a public forum.
              Please contact our Practice Manager at [Phone] so we can look into this directly.&quot;
            </p>
            <p style={{ ...pStyle, marginBottom: 0, fontSize: '0.78rem', color: '#6b7280' }}>
              Speaks only in general policy terms and moves the conversation offline — never confirms
              or denies a treatment relationship.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', marginBottom: '0.4rem' }}>Tier 3 — Responding to a review that might not even be a real patient</div>
            <p style={{ ...pStyle, marginBottom: '0.5rem', fontStyle: 'italic' }}>
              &quot;We take every review seriously and want to make things right wherever possible. If
              you&apos;d like to discuss this further, please reach out to us directly at [Phone] so
              we can look into it.&quot;
            </p>
            <p style={{ ...pStyle, marginBottom: 0, fontSize: '0.78rem', color: '#6b7280' }}>
              <b>Important:</b> never say anything like &quot;we have no record of you&quot; or
              &quot;you&apos;re not a patient of ours&quot; — denying someone&apos;s patient status
              is itself a HIPAA disclosure, just like confirming it would be. Stay neutral regardless
              of whether the reviewer is a real patient or not.
            </p>
          </div>

          <h2 style={h2Style}>What you don&apos;t do</h2>
          <div style={cardStyle}>
            {['Write review responses', 'Review or approve AI drafts', 'Handle client complaints or support', 'Manage ongoing client relationships', 'Deal with billing, cancellations, or account issues', 'Build your own pitch — it\'s all here already'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', color: '#374151', marginBottom: i < 5 ? '0.5rem' : 0 }}>
                <span style={{ color: '#b91c1c', fontWeight: 700 }}>✗</span> {item}
              </div>
            ))}
          </div>

          <h2 style={h2Style}>If a client contacts you directly after signing</h2>
          <div style={cardStyle}>
            <p style={pStyle}>
              It&apos;ll happen — you&apos;re the person they know. You don&apos;t need to solve
              anything yourself, just hand it off cleanly:
            </p>
            <p style={{ ...pStyle, marginBottom: 0, fontStyle: 'italic' }}>
              &quot;Thanks for reaching out! For anything account, billing, or support related, the
              fastest way to get it handled is team@respondpal.ai — they&apos;ll take care of it
              right away. Let me know if there&apos;s anything else I can help with on my end.&quot;
            </p>
          </div>

          <h2 style={h2Style}>Pro tips</h2>
          <div style={cardStyle}>
            {[
              'For healthcare prospects, check POSITIVE review responses too — providers let their guard down. "So glad your treatment went well!" is a HIPAA violation.',
              'Before you call, note the exact review count and last response date. Specific numbers are disarming.',
              'Call between 8-11am and 1-4pm local time.',
              'Gatekeeper script: "Is the owner or manager available? I\'m calling about their Google reviews."',
              'Own the onboarding — stay on the line, walk them through the form. A customer left to do it alone may never finish.',
              'Never say "you\'re violating HIPAA." Say "your responses follow the same patterns that have resulted in fines at other practices." You\'re a consultant, not a lawyer.',
            ].map((tip, i) => (
              <p key={i} style={{ ...pStyle, marginBottom: i < 5 ? '0.6rem' : 0 }}>• {tip}</p>
            ))}
          </div>

          <h2 style={h2Style}>Key facts for prospects</h2>
          <div style={cardStyle}>
            {['No contracts — cancel anytime', 'Live within 48 hours of signup', '24-hour response guarantee', 'Google AND Yelp covered', 'Industry-calibrated AI, human-approved before posting', 'HIPAA-compliant for healthcare businesses', 'No passwords shared — official manager access only'].map((fact, i) => (
              <div key={i} style={{ fontSize: '0.88rem', color: '#374151', marginBottom: '0.4rem' }}>✓ {fact}</div>
            ))}
          </div>

          <h2 style={h2Style}>Referrals</h2>
          <div style={cardStyle}>
            <p style={pStyle}>
              A referral coming directly to you — the client tells the prospect to call you
              specifically — is just a new lead. Add it, work it, close it, full commission, exactly
              like any other sale.
            </p>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              A referral that comes in blind — to team@respondpal.ai, or mentioned to Jacob or
              fulfillment without a specific rep attached — always routes back to the referring
              client&apos;s rep first, since that&apos;s directly visible on the client record. You
              get the normal opportunity to work and close it yourself, full commission, same as
              above. <b>Only if you&apos;re unavailable or don&apos;t work it, and Jacob or
              fulfillment closes it directly instead, you still get a referral bonus of 50% of month
              one</b> — recognition that the relationship you built is what generated the lead, even
              on a deal you didn&apos;t personally close.
            </p>
          </div>

          <h2 style={h2Style}>Your two email addresses</h2>
          <div style={cardStyle}>
            <p style={pStyle}>
              You&apos;ll have access to two separate email identities, and which one you use matters
              — mixing them up risks the whole team&apos;s deliverability, not just your own.
            </p>
            <p style={pStyle}>
              <b>yourname@getrespondpal.com — for cold outreach only.</b> This is a dedicated sending
              domain, kept deliberately separate from our main business domain specifically so that
              if it ever gets flagged, nothing else is affected. It runs through a shared Instantly
              workspace Jacob manages centrally — you get your own mailbox and sending identity
              within it, but the whole domain&apos;s health is a shared resource across everyone
              using it, so daily volume is capped per mailbox to keep the domain healthy for
              everyone, not just you. New mailboxes go through a warm-up period before touching real
              prospects — Jacob will let you know when yours is ready for full volume.
            </p>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              <b>yourname@respondpal.ai — never for bulk or cold sending.</b> This is your real,
              branded identity for everything else: replying once a prospect is already engaged,
              sending a contract or follow-up material, LinkedIn and networking, anything where
              looking official actually helps. Sending cold volume from this address risks the same
              domain our transactional email — onboarding confirmations, commission statements —
              depends on, which is exactly why the two stay separate.
            </p>
          </div>
        </div>
      )}

      {/* ── OBJECTIONS ── */}
      {tab === 'objections' && (
        <div style={{ maxWidth: 720 }}>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              These aren&apos;t scripts to recite word-for-word — they&apos;re the actual reasoning
              behind each objection, so you can respond in your own words and adapt to what the
              prospect is really saying. Reciting a memorized line usually sounds like a memorized
              line. Understanding *why* the objection doesn&apos;t hold up lets you respond naturally,
              even when they phrase it differently than you expected.
            </p>
          </div>

          <h2 style={h2Style}>&quot;We already respond ourselves&quot;</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              This isn&apos;t really about whether they respond — it&apos;s about whether the
              responses are actually good, consistent, and every single time. Most owners who say
              this haven&apos;t looked critically at their own response history recently: some
              reviews get answered, many don&apos;t, and the tone varies depending on how busy or
              frustrated they were that day. Ask if they&apos;ve checked their own response rate
              lately — most people are surprised how many reviews slipped through unanswered. The
              value isn&apos;t &quot;doing it&quot; versus &quot;not doing it,&quot; it&apos;s doing
              it well, consistently, without it being one more thing they have to remember.
            </p>
          </div>

          <h2 style={h2Style}>&quot;I already put responses into ChatGPT&quot;</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              This person is already sold on AI helping — that part of the pitch is done for you.
              What raw ChatGPT doesn&apos;t have is any of the three layers that actually make a
              response safe and effective: it doesn&apos;t know industry-specific failure patterns,
              it has zero awareness of what constitutes a HIPAA violation in a healthcare response
              (arguably more dangerous than not responding at all, since they&apos;re now actively
              generating language with no compliance guardrails), and it doesn&apos;t know their
              brand voice. They&apos;re also still doing all the manual work — copying the review in,
              writing a prompt, copying the output out, remembering to do this for every single
              review. Ask honestly: do they do this every time, within 24 hours, for every review on
              both platforms? Most people admit it&apos;s inconsistent. That&apos;s the actual gap —
              not whether AI can write a response, but whether it&apos;s actually happening, safely,
              every time, without them thinking about it.
            </p>
          </div>

          <h2 style={h2Style}>&quot;I need to check with my partner&quot;</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              Often genuine, not always a brush-off — don&apos;t push back hard on it. Respect it,
              but get something concrete rather than leaving it open-ended: ask when they think
              they&apos;ll have a chance to talk, and set your follow-up around that specific time
              rather than a vague &quot;I&apos;ll check back.&quot; This is exactly where the
              one-page leave-behind earns its keep — give them something they can actually forward,
              rather than making them explain the pitch secondhand from memory.
            </p>
          </div>

          <h2 style={h2Style}>&quot;How do I know this isn&apos;t a scam&quot;</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              Skepticism toward cold outreach is a reasonable default, not something to argue
              someone out of. Trying to talk them out of it usually backfires — point at something
              concrete instead. The report itself already contains their own real reviews, not
              generic examples. There&apos;s no upfront commitment — no contract, cancel anytime.
              And they can independently verify anything — look up the company, check the website,
              ask you direct questions. Give them something they can check themselves rather than
              asking them to just trust you.
            </p>
          </div>

          <h2 style={h2Style}>&quot;Can I see more examples first&quot;</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              Usually a good sign — they&apos;re engaged, not rejecting. But the report they already
              have shows their own real reviews with real drafted responses, which is more relevant
              than any generic example from another business could be. If they push for more, ask
              specifically what they&apos;d want to see that isn&apos;t already in front of them —
              often this surfaces a real, specific concern worth addressing directly, rather than a
              vague stall that more examples wouldn&apos;t actually resolve.
            </p>
          </div>

          <h2 style={h2Style}>&quot;We don&apos;t have budget right now&quot;</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              At this price point with no contract, this is usually about priority, not literal
              budget — they don&apos;t yet see it as important enough to fund. Reconnect to the
              actual stakes (AI increasingly deciding who gets recommended, HIPAA risk for
              healthcare) rather than arguing about price itself. If someone genuinely can&apos;t
              afford $397/month, that&apos;s a real constraint worth respecting — but the more
              common case is they haven&apos;t yet been convinced it&apos;s worth it, which is a
              different problem than budget.
            </p>
          </div>
        </div>
      )}

      {/* ── LOOM SCRIPT ── */}
      {tab === 'loom' && (
        <div style={{ maxWidth: 720 }}>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              Whether you&apos;re delivering an Audit or a Response Examples PDF, a short Loom walking
              through it does more work than the PDF alone — it&apos;s the difference between an email
              they might skim and a report they actually watch someone explain. Keep it under 3 minutes.
              Screen-share the report, don&apos;t just talk about it.
            </p>
          </div>

          <div style={{ ...cardStyle, background: '#FFF7ED', border: '1px solid #FDBA74' }}>
            <div style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: '0.5rem' }}>Example recording</div>
            <p style={{ ...pStyle, marginBottom: '0.5rem' }}>
              <a href="https://www.loom.com/share/900902a7880e49ffbf9f91cbd61b7941" target="_blank" rel="noreferrer" style={{ color: '#C2410C', fontWeight: 700 }}>
                Watch on Loom →
              </a>
            </p>
            <p style={{ ...pStyle, marginBottom: 0, fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
              * This is just a quick example of what this might look like — not a script to copy
              exactly, more a sense of the pacing and tone that works.
            </p>
          </div>

          <h2 style={h2Style}>Opening</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0, fontStyle: 'italic' }}>
              &quot;Hey [Name], this is [Your Name] with RespondPal. I put together a quick report on
              your Google reviews — figured a short video would be faster than a wall of text, so let
              me walk you through what I found.&quot;
            </p>
          </div>

          <h2 style={h2Style}>Walking through the report</h2>
          <div style={cardStyle}>
            <p style={pStyle}>
              <b>For an Audit (healthcare):</b> Lead with the stat bar — response rate and critical
              finding count. Then open one of the flagged findings and read the highlighted phrase out
              loud. Let the violation speak for itself; don&apos;t over-explain the compliance angle,
              just point at it: &quot;this response here — see this line — that&apos;s the kind of
              phrase that&apos;s actually resulted in fines at other practices.&quot;
            </p>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              <b>For Response Examples (everyone else):</b> Open with one of their real reviews, then
              show the drafted response right next to it. The contrast between what they have now
              (nothing, or something generic) and what a real response looks like is the whole pitch —
              let them see it side by side rather than describing it.
            </p>
          </div>

          <h2 style={h2Style}>Closing</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0, fontStyle: 'italic' }}>
              &quot;That&apos;s the gist of it — I&apos;ll follow up in a day or two, but if you want to
              chat sooner just reply to my email or call me back. No pressure either way, just wanted
              you to actually see this instead of a report sitting unopened in your inbox.&quot;
            </p>
          </div>

          <h2 style={h2Style}>What to avoid</h2>
          <div style={cardStyle}>
            {[
              'Reading the report out loud top to bottom — pick the one or two most compelling findings and stop there',
              'Sounding like you\'re selling something — you\'re a consultant sharing something you noticed, not pitching',
              'Going over 3 minutes — if it runs long, they won\'t finish it',
              'Naming a specific dollar fine amount for their practice — reference the pattern, not a guaranteed outcome',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', color: '#374151', marginBottom: i < 3 ? '0.5rem' : 0 }}>
                <span style={{ color: '#b91c1c', fontWeight: 700 }}>✗</span> {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── COMMISSION ── */}
      {tab === 'commission' && (
        <div style={{ maxWidth: 720 }}>
          <div style={{ ...cardStyle, background: '#111827', color: 'white' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 0 }}>
              You keep 100% of the first month&apos;s revenue on every client you close.
            </div>
          </div>

          <h2 style={h2Style}>Your commission structure</h2>
          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr><th style={thStyle}>Period</th><th style={thStyle}>You earn</th><th style={thStyle}>Notes</th></tr>
              </thead>
              <tbody>
                <tr><td style={tdStyle}>Month 1</td><td style={{ ...tdStyle, fontWeight: 700 }}>100%</td><td style={tdStyle}>Full first month — yours entirely</td></tr>
                <tr><td style={tdStyle}>Month 2</td><td style={{ ...tdStyle, fontWeight: 700 }}>75%</td><td style={tdStyle}>Strong early earnings reward fast starts</td></tr>
                <tr><td style={tdStyle}>Month 3</td><td style={{ ...tdStyle, fontWeight: 700 }}>50%</td><td style={tdStyle}>Even split as the relationship establishes</td></tr>
                <tr><td style={tdStyle}>Months 4–12</td><td style={{ ...tdStyle, fontWeight: 700 }}>25%</td><td style={tdStyle}>Passive residual — client stays, you keep earning</td></tr>
                <tr><td style={tdStyle}>Months 13–24</td><td style={{ ...tdStyle, fontWeight: 700 }}>15%</td><td style={tdStyle}>Reduced residual as the account matures</td></tr>
                <tr><td style={tdStyle}>Month 25+</td><td style={{ ...tdStyle, fontWeight: 700 }}>10%</td><td style={tdStyle}>Indefinite residual, for as long as the client stays active</td></tr>
              </tbody>
            </table>
          </div>
          <p style={pStyle}>
            <b>Year 1 per client ($397/mo): you earn $1,786 — 37.5% of revenue.</b> Year 2: $715 (15%).
            Year 3+: $476/year (10%) as indefinite passive residual. This scales cleanly across every
            pricing tier — close a 3-location client at $897/month and you earn $897 on day one, no
            separate commission table needed.
          </p>

          <h2 style={h2Style}>Pricing for 4+ locations</h2>
          <div style={{ ...cardStyle, background: '#FFF7ED', border: '1px solid #FDBA74' }}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              <b>No cap, no different rules.</b> A 10-location chain still pays you 100% of month one —
              on whatever the final negotiated price actually is. The bigger the deal, the bigger that
              first payout. This is the deal worth actually chasing, not one where the upside gets
              capped right when it gets interesting.
            </p>
          </div>

          <p style={pStyle}>
            Beyond 3 locations there&apos;s no fixed price — it&apos;s a range you negotiate within.
            Use the table below: <b>Anchor</b> is where you open the conversation, <b>Target</b> is
            where you&apos;re happy to land if they push back. Don&apos;t go below Target without
            looping in Jacob first — for anything past 10 locations, always loop him in before quoting
            anything.
          </p>

          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr><th style={thStyle}>Locations</th><th style={thStyle}>Anchor (open here)</th><th style={thStyle}>Target (land here)</th></tr>
              </thead>
              <tbody>
                <tr><td style={tdStyle}>4</td><td style={tdStyle}>$1,250/mo</td><td style={{ ...tdStyle, fontWeight: 700 }}>$1,100/mo</td></tr>
                <tr><td style={tdStyle}>5</td><td style={tdStyle}>$1,450/mo</td><td style={{ ...tdStyle, fontWeight: 700 }}>$1,300/mo</td></tr>
                <tr><td style={tdStyle}>6</td><td style={tdStyle}>$1,700/mo</td><td style={{ ...tdStyle, fontWeight: 700 }}>$1,550/mo</td></tr>
                <tr><td style={tdStyle}>7</td><td style={tdStyle}>$1,900/mo</td><td style={{ ...tdStyle, fontWeight: 700 }}>$1,750/mo</td></tr>
                <tr><td style={tdStyle}>8</td><td style={tdStyle}>$2,100/mo</td><td style={{ ...tdStyle, fontWeight: 700 }}>$1,900/mo</td></tr>
                <tr><td style={tdStyle}>9</td><td style={tdStyle}>$2,300/mo</td><td style={{ ...tdStyle, fontWeight: 700 }}>$2,100/mo</td></tr>
                <tr><td style={tdStyle}>10</td><td style={tdStyle}>$2,500/mo</td><td style={{ ...tdStyle, fontWeight: 700 }}>$2,300/mo</td></tr>
              </tbody>
            </table>
          </div>
          <p style={pStyle}>
            Where these numbers come from: going from 1→2 locations adds $252 to the price ($397 →
            $649); 2→3 adds another $248 ($649 → $897) — call it roughly $250 of additional cost for
            each extra location, even though the average across all 3 locations works out higher
            ($897 ÷ 3 = $299/location), since the first location alone carries a bigger share of the
            fixed setup cost. Locations 4-6 continue that marginal pattern at roughly $220/location;
            7-10 tapers further to roughly $190/location, since scale savings compound rather than
            staying flat forever. Anchor sits about 10% above Target, giving you real room to negotiate
            down without ever landing below what the account is actually worth.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            <b>Past 10 locations, there&apos;s no table — that&apos;s Jacob territory.</b> Loop him in
            before you quote anything. Deals at that scale are worth getting right individually, not
            forcing into a formula.
          </p>

          <h2 style={h2Style}>Commission on the $197 Reputation Cleanup</h2>
          <div style={{ ...cardStyle, background: '#FFF7ED', border: '1px solid #FDBA74' }}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              <b>This is not part of month one, even when it's sold in the same call.</b> It's a
              separate product with its own 50/50 split: you keep <b>$98.50</b> of every Cleanup you
              close, whether it's sold standalone or as the checkout add-on on a new subscription. The
              other half stays with the company — Cleanup is real, one-time labor (not an ongoing
              relationship the tiered schedule can spread cost across), so this isn't the same 100%
              rule that applies to a subscription's first month.
            </p>
          </div>
          <p style={pStyle}>
            <b>What's actually included:</b> responding to a client's unanswered reviews from the last
            180 days, plus rewriting any existing responses that raise privacy, tone, or compliance
            issues. <b>It's priced and scoped per location</b> — a 3-location client needing Cleanup
            pays (and you earn commission on) $197 for each location, not one flat fee for all three.
          </p>
          <p style={pStyle}>
            <b>Cleanup covers up to 30 combined review actions per location.</b> Most backlogs fall
            well under this. If a client's backlog is genuinely larger — the kind of thing that comes
            up occasionally with a practice that's never responded to anything — loop in Jacob for a
            custom quote on the excess rather than assuming the standard $197 covers it.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            <b>Don't promise a fast turnaround on Cleanup specifically.</b> It's completed over 2-3
            weeks, deliberately paced rather than done all at once — posting or editing dozens of
            responses in a short window can look automated to Google and Yelp's own systems, even
            though the work is completely legitimate. If a client asks why it's not instant, that's the
            honest answer: the pace is protecting their profile, not a slower version of the 24-hour
            guarantee, which is a separate promise that only applies to new reviews coming in going
            forward.
          </p>

          <h2 style={h2Style}>What a real book looks like over time</h2>
          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <p style={{ ...pStyle, fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.75rem' }}>
              Example: a rep who closes 3 clients/month at $397/mo, until their book reaches 50 clients
              around month 17 — then holds there. Every number below is modeled client-by-client through
              the actual tier schedule in Exhibit A, not estimated.
            </p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Month</th>
                  <th style={thStyle}>New closed</th>
                  <th style={thStyle}>Total book</th>
                  <th style={thStyle}>From new closes</th>
                  <th style={thStyle}>Residual</th>
                  <th style={thStyle}>Total that month</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={tdStyle}>1</td><td style={tdStyle}>3</td><td style={tdStyle}>3</td><td style={tdStyle}>$1,191</td><td style={tdStyle}>$0</td><td style={{ ...tdStyle, fontWeight: 700 }}>$1,191</td></tr>
                <tr><td style={tdStyle}>6</td><td style={tdStyle}>3</td><td style={tdStyle}>18</td><td style={tdStyle}>$1,191</td><td style={tdStyle}>$2,382</td><td style={{ ...tdStyle, fontWeight: 700 }}>$3,573</td></tr>
                <tr><td style={tdStyle}>12</td><td style={tdStyle}>3</td><td style={tdStyle}>36</td><td style={tdStyle}>$1,191</td><td style={tdStyle}>$4,168</td><td style={{ ...tdStyle, fontWeight: 700 }}>$5,360</td></tr>
                <tr><td style={tdStyle}>18</td><td style={tdStyle}>0</td><td style={tdStyle}>50 (capped)</td><td style={tdStyle}>$0</td><td style={tdStyle}>$4,943</td><td style={{ ...tdStyle, fontWeight: 700 }}>$4,943</td></tr>
                <tr><td style={tdStyle}>24</td><td style={tdStyle}>0</td><td style={tdStyle}>50</td><td style={tdStyle}>$0</td><td style={tdStyle}>$3,533</td><td style={{ ...tdStyle, fontWeight: 700 }}>$3,533</td></tr>
                <tr><td style={tdStyle}>36</td><td style={tdStyle}>0</td><td style={tdStyle}>50</td><td style={tdStyle}>$0</td><td style={tdStyle}>$2,263</td><td style={{ ...tdStyle, fontWeight: 700 }}>$2,263</td></tr>
                <tr><td style={tdStyle}>60</td><td style={tdStyle}>0</td><td style={tdStyle}>50</td><td style={tdStyle}>$0</td><td style={tdStyle}>$1,985</td><td style={{ ...tdStyle, fontWeight: 700 }}>$1,985</td></tr>
                <tr style={{ background: '#F0FDF4' }}><td colSpan={5} style={{ ...tdStyle, fontWeight: 700 }}>5-year total, 50-client book</td><td style={{ ...tdStyle, fontWeight: 700, color: '#15803d' }}>$180,953</td></tr>
              </tbody>
            </table>
          </div>
          <p style={pStyle}>
            The dip after month 18 isn't the book losing value — it's the same 50 clients aging through
            lower tiers exactly as designed. What matters is the floor: once every client is past month
            24, this settles at roughly $1,985/mo, indefinitely, from a book you already built — that's
            the passive part of the model. In practice you wouldn't stop at 50; every additional client
            you keep closing adds directly on top of that floor.
          </p>
        </div>
      )}

      {/* ── OWNERSHIP RULES ── */}
      {tab === 'ownership' && (
        <div style={{ maxWidth: 720 }}>
          <p style={pStyle}>
            One consistent rule, applied the same way everywhere: <b>you own anything — a lead or a
            client who canceled — exclusively while there&apos;s been activity within the last 90 days.
            No activity for 90 days, it opens up to any rep.</b> A won client is the one exception —
            permanent, no timer, for as long as they stay a client.
          </p>

          <h2 style={h2Style}>Leads</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              A lead you add is yours exclusively as long as you&apos;ve logged real contact — a call, a
              note, a status change — within the last 90 days. The clock is based on when you last
              actually reached out, not when you first added the lead, so a long healthcare sales cycle
              you&apos;re genuinely working never costs you the lead just because time passed. If 90 days
              go by with no logged activity, the lead opens up in the Open Leads pool for any rep to pick
              up — whoever takes the first real action on it becomes the new owner.
            </p>
          </div>

          <h2 style={h2Style}>Won clients</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              Once a lead converts to a paying client, it&apos;s yours — permanently, no timer — for as
              long as that client stays active.
            </p>
          </div>

          <h2 style={h2Style}>If a client cancels</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              You get a 90-day exclusive window to win them back on the same commission terms. If you
              don&apos;t reactivate them within 90 days, the account opens up and any rep can re-pursue
              it. If someone else successfully resells them after that window, commission rights transfer
              to that rep going forward.
            </p>
          </div>

          <h2 style={h2Style}>Commission on a reactivated client</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              Commission resumes where it left off — it doesn&apos;t reset to month 1. If a client
              canceled partway through month 2 and gets reactivated later, commission starts back up at
              month 3 and continues counting forward from there, regardless of whether the same rep or a
              new rep closes the reactivation. <b>The one exception:</b> if 24 months or more have passed
              since the client canceled, commission resets to month 1 on reactivation. At that point,
              winning them back is treated like a new sale, not a continuation — so a lead that&apos;s
              been dark that long is still very much worth chasing, at full first-month commission.
            </p>
          </div>

          <h2 style={h2Style}>Referrals</h2>
          <div style={cardStyle}>
            <p style={{ ...pStyle, marginBottom: 0 }}>
              A referral follows the same ownership logic as everything else here. If a client sends
              a prospect directly to you, it&apos;s just a new lead you own and work normally. If it
              comes in without a specific rep attached, it&apos;s first offered to the referring
              client&apos;s current rep — you — before anyone else can work it. Full details,
              including the referral bonus if someone else closes it instead, are in the How You
              Sell tab.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
