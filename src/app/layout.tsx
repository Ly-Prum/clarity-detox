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
