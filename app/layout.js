import { Inter, Barlow_Condensed } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-barlow',
  display: 'swap',
})

export const metadata = {
  title: 'RespondPal — AI-Drafted, Human-Approved Review Responses',
  description:
    'AI-drafted, human-approved responses to every Google and Yelp review — calibrated for your industry, posted within 24 hours. $397/month, no contracts.',
  metadataBase: new URL('https://respondpal.ai'),
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'RespondPal — AI-Drafted, Human-Approved Review Responses',
    description:
      'Industry-calibrated AI crafts on-brand responses to every Google and Yelp review. A human approves every one. $397/month, no contracts.',
    url: 'https://respondpal.ai',
    siteName: 'RespondPal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RespondPal — AI-Drafted, Human-Approved Review Responses',
    description: 'Industry-calibrated AI + human approval on every review response. Faster, better, and cheaper than doing it yourself. $397/month.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body>{children}</body>
    </html>
  )
}
