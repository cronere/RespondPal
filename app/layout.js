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
  title: 'RespondPal — Google Review Responses, Done For You',
  description:
    'We respond to every Google review your business receives within 24 hours. Done-for-you review management for $297/month. No contracts.',
  metadataBase: new URL('https://respondpal.ai'),
  openGraph: {
    title: 'RespondPal — Google Review Responses, Done For You',
    description:
      '95% of businesses never respond to reviews. We do it for you — every review, within 24 hours, $297/month.',
    url: 'https://respondpal.ai',
    siteName: 'RespondPal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RespondPal — Google Review Responses, Done For You',
    description: '95% of businesses never respond to reviews. We handle every review within 24 hours so you don\'t have to.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body>{children}</body>
    </html>
  )
}
