'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Brain, History, Home, Settings, Target, FileText, CheckSquare, BookOpen, Sparkles, Menu, X, ChevronRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { DetoxSession, DiscoverySession } from '@/lib/types'

// PC サイドバー用（セクション分け）
const PERSONAL_NAV = [
  { href: '/',          icon: Home,        label: 'ホーム' },
  { href: '/analysis',  icon: Sparkles,    label: '統合AI分析' },
  { href: '/checkin',   icon: CheckSquare, label: 'デイリーチェックイン' },
  { href: '/detox',     icon: Brain,       label: '脳内デトックス' },
  { href: '/history',   icon: History,     label: '記録' },
  { href: '/diagnosis', icon: Target,      label: '診断' },
  { href: '/notes',     icon: BookOpen,    label: 'コーチングノート' },
]

const COACH_NAV = [
  { href: '/reports', icon: FileText, label: '分析レポート' },
]

// スマホ ボトムナビ用
const BOTTOM_NAV = [
  { href: '/',         icon: Home,        label: 'ホーム' },
  { href: '/detox',    icon: Brain,       label: 'デトックス' },
  { href: '/checkin',  icon: CheckSquare, label: '日記' },
  { href: '/notes',    icon: BookOpen,    label: 'ノート' },
  { href: '/settings', icon: Settings,    label: '設定' },
]

function NavLink({ href, icon: Icon, label, pathname, onClick }: { href: string; icon: React.ElementType; label: string; pathname: string; onClick?: () => void }) {
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 10, marginBottom: 2,
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
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { colorTheme, isAuthenticated, currentUser, setSessions, setDiscoverySessions } = useStore()

  const [drawerOpen,       setDrawerOpen]       = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // 保存済みテーマを document に適用（上書きしない）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return
    supabase
      .from('sessions')
      .select('*')
      .eq('user_id', currentUser.email)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('Supabase sessions fetch error:', error); return }
        if (data && data.length > 0) setSessions(data as DetoxSession[])
      })
    supabase
      .from('discovery_sessions')
      .select('*')
      .eq('user_id', currentUser.email)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('Supabase discovery fetch error:', error); return }
        if (data && data.length > 0) setDiscoverySessions(data as DiscoverySession[])
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

  // ドロワーが開いている間、背景スクロールを止める
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  if (pathname === '/login') return <>{children}</>
  if (!isAuthenticated) return null

  const sidebarContent = (onLinkClick?: () => void) => (
    <>
      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', marginBottom: 28, letterSpacing: '-0.3px' }}>
        Clarity
      </div>
      <nav style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6, padding: '0 4px' }}>
          個人の記録
        </div>
        {PERSONAL_NAV.map(item => <NavLink key={item.href} {...item} pathname={pathname} onClick={onLinkClick} />)}
        <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0 12px' }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6, padding: '0 4px' }}>
          コーチから
        </div>
        {COACH_NAV.map(item => <NavLink key={item.href} {...item} pathname={pathname} onClick={onLinkClick} />)}
      </nav>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 'auto' }}>
        <NavLink href="/settings" icon={Settings} label="設定" pathname={pathname} onClick={onLinkClick} />
        <div style={{ marginTop: 10, padding: '0 4px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{currentUser?.name ?? 'ユーザー'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{currentUser?.email}</div>
        </div>
      </div>
    </>
  )

  return (
    <div className={`app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* PC サイドバー */}
      <aside className="sidebar">
        <button
          type="button"
          title="サイドバーを閉じる"
          onClick={() => setSidebarCollapsed(true)}
          style={{ alignSelf: 'flex-end', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 16px', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
        >
          <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> 閉じる
        </button>
        {sidebarContent()}
      </aside>

      {/* PC サイドバーが閉じているとき: 展開ボタン */}
      {sidebarCollapsed && (
        <button
          type="button"
          title="サイドバーを開く"
          className="sidebar-expand-btn"
          onClick={() => setSidebarCollapsed(false)}
        >
          <ChevronRight size={14} />
        </button>
      )}

      <main className="main-content">{children}</main>

      {/* スマホ ボトムナビ */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`bnav-item${active ? ' active' : ''}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* スマホ ハンバーガーボタン */}
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setDrawerOpen(true)}
        aria-label="メニューを開く"
      >
        <Menu size={20} />
      </button>

      {/* スマホ ドロワー */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="mobile-drawer">
            <button
              type="button"
              title="メニューを閉じる"
              onClick={() => setDrawerOpen(false)}
              style={{ alignSelf: 'flex-end', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', marginBottom: 16, padding: 4 }}
            >
              <X size={20} />
            </button>
            {sidebarContent(() => setDrawerOpen(false))}
          </aside>
        </>
      )}
    </div>
  )
}
