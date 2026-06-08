import type { Metadata, Viewport } from 'next'
import './globals.css'
import AppLayout from '@/components/AppLayout'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Clarity',
  description: '自分を知り、前に進む。Clarity インナーコーチングアプリ',
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
    description: '自分を知り、前に進む。Clarity インナーコーチングアプリ',
    siteName: 'Clarity',
    images: [
      {
        url: 'https://clarity-detox.vercel.app/icon-512.png',
        width: 1024,
        height: 1024,
        alt: 'Clarity インナーコーチ',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Clarity',
    description: '自分を知り、前に進む。Clarity インナーコーチングアプリ',
    images: ['https://clarity-detox.vercel.app/icon-512.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
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
