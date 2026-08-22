import IndustryAuditLanding from '../_components/IndustryAuditLanding'

export const metadata = {
  title: 'Free HIPAA Risk Audit for Physical Therapy Practices — RespondPal',
  description:
    'We scan every response on your physical therapy practice\'s Google and Yelp profile for HIPAA privacy violations, combative replies, and tone-deaf templates. Custom report delivered in 48 hours.',
}

export default function PTAuditLanding() {
  return (
    <IndustryAuditLanding
      headlineLine1="Is Your Physical Therapy Practice"
      headlineLine2="Accidentally Violating HIPAA?"
      badExample={{
        label: 'Privacy violation',
        text: (
          <>
            A physical therapy practice replied &ldquo;we&apos;re so glad to hear about the
            progress and that you&apos;re feeling better&rdquo; — confirming a specific
            patient&apos;s health recovery status in a public reply.
          </>
        ),
        verdict: 'This is one of the most direct disclosures HHS penalizes — and it\'s usually the warmest, most well-meaning responses that do it.',
      }}
    />
  )
}
