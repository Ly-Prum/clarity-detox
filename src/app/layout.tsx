import type { Metadata, Viewport } from 'next'
import './globals.css'
import AppLayout from '@/components/AppLayout'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Mind Detox',
  description: '脳内を整理して、前に進める状態をつくる',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mind Detox',
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
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
