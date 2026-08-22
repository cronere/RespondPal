import IndustryAuditLanding from '../_components/IndustryAuditLanding'

export const metadata = {
  title: 'Free HIPAA Risk Audit for Chiropractic Practices — RespondPal',
  description:
    'We scan every response on your chiropractic practice\'s Google and Yelp profile for HIPAA privacy violations, combative replies, and tone-deaf templates. Custom report delivered in 48 hours.',
}

export default function ChiroAuditLanding() {
  return (
    <IndustryAuditLanding
      headlineLine1="Is Your Chiropractic Practice"
      headlineLine2="Accidentally Violating HIPAA?"
      badExample={{
        label: 'Privacy violation',
        text: (
          <>
            A chiropractic practice publicly replied &ldquo;we respect that you sought a second
            opinion&rdquo; — confirming a patient relationship and implicitly validating a disputed
            diagnosis, both in a single reply.
          </>
        ),
        verdict: 'This is exactly the kind of disclosure HHS has fined healthcare providers $10,000–$50,000 for.',
      }}
    />
  )
}
