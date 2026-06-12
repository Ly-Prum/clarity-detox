'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Brain, History, Home, Settings, CheckSquare, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { DetoxSession, DiscoverySession, Todo } from '@/lib/types'

const NAV_ITEMS = [
  { href: '/',        icon: Home,        label: 'ホーム' },
  { href: '/detox',   icon: Brain,       label: 'ダンプ' },
  { href: '/todo',    icon: CheckSquare, label: 'TODO' },
  { href: '/history', icon: History,     label: 'ログ' },
  { href: '/drawers', icon: FolderOpen,  label: '引き出し' },
]

function NavLink({
  href, icon: Icon, label, pathname, onClick, collapsed,
}: {
  href: string; icon: React.ElementType; label: string
  pathname: string; onClick?: () => void; collapsed?: boolean
}) {
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 12,
        padding: collapsed ? '10px 0' : '10px 14px',
        borderRadius: 10,
        marginBottom: 2,
        textDecoration: 'none',
        background: active ? 'var(--primary-lt)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--text-sub)',
        fontWeight: active ? 700 : 400,
        fontSize: 14,
        transition: 'all 0.15s',
      }}
    >
      <Icon size={collapsed ? 22 : 18} strokeWidth={active ? 2.5 : 1.8} />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { colorTheme, applyColorTheme, isAuthenticated, currentUser, setSessions, setTodos, setDiscoverySessions } = useStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return
    supabase
      .from('sessions').select('*')
      .eq('user_id', currentUser.email)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setSessions(data as DetoxSession[])
      })
    supabase
      .from('discovery_sessions').select('*')
      .eq('user_id', currentUser.email)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setDiscoverySessions(data as DiscoverySession[])
      })
    supabase
      .from('todos').select('*')
      .eq('user_id', currentUser.email)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setTodos(data as Todo[])
      })
    supabase
      .from('user_preferences').select('color_theme')
      .eq('user_id', currentUser.email)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.color_theme) {
          applyColorTheme(data.color_theme)
          document.documentElement.setAttribute('data-color', data.color_theme)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser?.email])

  useEffect(() => {
    document.documentElement.setAttribute('data-color', colorTheme)
  }, [colorTheme])

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      router.replace('/login')
    }
  }, [isAuthenticated, pathname, router])

  if (pathname === '/login') return <>{children}</>
  if (pathname.startsWith('/admin')) return <>{children}</>
  if (!isAuthenticated) return null

  const c = sidebarCollapsed

  return (
    <div className={`app-layout${c ? ' sidebar-collapsed' : ''}`}>

      {/* ── PC サイドバー ── */}
      <aside className="sidebar">
        <div style={{ marginBottom: c ? 12 : 20 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: c ? 4 : 8 }}>
            <button
              type="button"
              title={c ? 'サイドバーを開く' : 'サイドバーを閉じる'}
              onClick={() => setSidebarCollapsed(prev => !prev)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-faint)', display: 'flex', alignItems: 'center' }}
            >
              {c ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/clarity-logo.png" alt="Clarity" style={{ width: c ? 44 : 80, height: c ? 44 : 80, borderRadius: '50%', objectFit: 'contain' }} />
            {!c && <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--primary)' }}>Clarity</span>}
            {!c && <span style={{ fontSize: 9, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.5 }}>頭の中をスッキリ、毎日をもっと楽に</span>}
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.href} {...item} pathname={pathname} collapsed={c} />
          ))}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <NavLink href="/settings" icon={Settings} label="設定" pathname={pathname} collapsed={c} />
          {!c && currentUser && (
            <div style={{ marginTop: 10, padding: '0 4px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{currentUser.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{currentUser.email}</div>
            </div>
          )}
        </div>
      </aside>

      {/* ── メインコンテンツ ── */}
      <main className="main-content">{children}</main>

      {/* ── モバイル 底部タブ ── */}
      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`mobile-tab${active ? ' active' : ''}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
