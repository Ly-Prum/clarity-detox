'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Brain, History, Home, Settings, Target } from 'lucide-react'
import { useStore } from '@/lib/store'

const NAV = [
  { href: '/',          icon: Home,     label: 'ホーム' },
  { href: '/diagnosis', icon: Target,   label: '診断' },
  { href: '/detox',     icon: Brain,    label: 'デトックス' },
  { href: '/history',   icon: History,  label: '記録' },
  { href: '/settings',  icon: Settings, label: '設定' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { colorTheme, isAuthenticated, currentUser } = useStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-color', colorTheme)
  }, [colorTheme])

  if (pathname === '/login') return <>{children}</>

  if (!isAuthenticated) {
    router.replace('/login')
    return null
  }

  return (
    <div className="app-layout">
      {/* PC サイドバー（CSS で mobile 非表示） */}
      <aside className="sidebar">
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', marginBottom: 32, letterSpacing: '-0.3px' }}>
          Clarity
        </div>
        <nav style={{ flex: 1 }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 10, marginBottom: 4,
                textDecoration: 'none',
                background: active ? 'var(--primary-lt)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-sub)',
                fontWeight: active ? 700 : 400, fontSize: 14,
                transition: 'all 0.15s',
              }}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
            {currentUser?.name ?? 'ユーザー'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{currentUser?.email}</div>
        </div>
      </aside>

      <main className="main-content">{children}</main>

      {/* スマホ ボトムナビ */}
      <nav className="bottom-nav">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`bnav-item${active ? ' active' : ''}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
