import type { Metadata, Viewport } from 'next'
import './globals.css'
import AppLayout from '@/components/AppLayout'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Clarity',
  description: '自分を知り、前に進む。Clarity inner coaching app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Clarity',
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: '/icon-192.png',
  },
  openGraph: {
    title: 'Clarity',
    description: '自分を知り、前に進む。Clarity inner coaching app',
    siteName: 'Clarity',
    images: [
      {
        url: 'https://clarity-detox.vercel.app/clarity-logo-beige.png',
        width: 1024,
        height: 1024,
        alt: 'Clarity inner coach',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Clarity',
    description: '自分を知り、前に進む。Clarity inner coaching app',
    images: ['https://clarity-detox.vercel.app/clarity-logo-beige.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#b4956c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AppShell>
          <AppLayout>{children}</AppLayout>
        </AppShell>
      </body>
    </html>
  )
}
