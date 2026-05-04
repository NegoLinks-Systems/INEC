import type { Metadata } from 'next'
import { Inter, Space_Mono, Syne } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'INEC 2.0 — Electoral Operations Command',
  description: 'National Electoral Operations & Logistics Monitoring System — NegoLinks Systems Ltd',
  icons: { icon: '/inec-logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} ${syne.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#00a651" />
      </head>
      <body>{children}</body>
    </html>
  )
}
