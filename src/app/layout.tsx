// src/app/layout.tsx
import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'INEC 2.0 — Electoral Operations Command',
  description: 'National Electoral Operations & Logistics Monitoring System — NegoLinks Systems Ltd',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#00a651" />
      </head>
      <body>{children}</body>
    </html>
  )
}
