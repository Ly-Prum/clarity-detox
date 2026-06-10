'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Brain, History, Home, Settings, FileText, CheckSquare, BookOpen, Sparkles, Menu, X, ChevronLeft, ChevronRight, Wallet } from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { DetoxSession, DiscoverySession } from '@/lib/types'

const PERSONAL_NAV = [
  { href: '/',          icon: Home,        label: 'ホーム' },
  { href: '/kakeibo',   icon: Wallet,      label: '家計簿' },
  { href: '/analysis',  icon: Sparkles,    label: '統合AI分析' },
  { href: '/checkin',   icon: CheckSquare, label: '今日の気分メモ' },
  { href: '/detox',     icon: Brain,       label: '脳内デトックス' },
  { href: '/history',   icon: History,     label: '記録' },
  { href: '/notes',     icon: BookOpen,    label: 'コーチングノート' },
]

const COACH_NAV: { href: string; icon: React.ElementType; label: string }[] = []


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
  const { colorTheme, applyColorTheme, isAuthenticated, currentUser, setSessions, setDiscoverySessions } = useStore()

  const [drawerOpen,       setDrawerOpen]       = useState(false)
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

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  if (pathname === '/login') return <>{children}</>
  if (pathname.startsWith('/admin')) return <>{children}</>
  if (!isAuthenticated) return null

  // ドロワー（スマホ）用サイドバー内容
  const drawerContent = (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, marginBottom: 28 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/clarity-logo.png" alt="Clarity" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'contain' }} />
        <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)' }}>Clarity</span>
        <span style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.3px', textAlign: 'center', lineHeight: 1.5 }}>頭の中をスッキリ、毎日をもっと楽に</span>
      </div>
      <nav style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6, padding: '0 4px' }}>個人の記録</div>
        {PERSONAL_NAV.map(item => <NavLink key={item.href} {...item} pathname={pathname} onClick={() => setDrawerOpen(false)} />)}
      </nav>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 'auto' }}>
        <NavLink href="/settings" icon={Settings} label="設定" pathname={pathname} onClick={() => setDrawerOpen(false)} />
        <div style={{ marginTop: 10, padding: '0 4px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{currentUser?.name ?? 'ユーザー'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{currentUser?.email}</div>
        </div>
      </div>
    </>
  )

  const c = sidebarCollapsed

  return (
    <div className={`app-layout${c ? ' sidebar-collapsed' : ''}`}>

      {/* ── PC サイドバー ── */}
      <aside className="sidebar">
        {/* ブランド＋トグル行 */}
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
            <img src="/clarity-logo.png" alt="Clarity" style={{ width: c ? 52 : 96, height: c ? 52 : 96, borderRadius: '50%', objectFit: 'contain' }} />
            {!c && <span style={{ fontSize: 19, fontWeight: 900, color: 'var(--primary)' }}>Clarity</span>}
            {!c && <span style={{ fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.3px', textAlign: 'center', lineHeight: 1.5 }}>頭の中をスッキリ、毎日をもっと楽に</span>}
          </div>
        </div>

        {/* 個人ナビ */}
        <nav style={{ flex: 1 }}>
          {!c && (
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6, padding: '0 4px' }}>
              個人の記録
            </div>
          )}
          {PERSONAL_NAV.map(item => (
            <NavLink key={item.href} {...item} pathname={pathname} collapsed={c} />
          ))}

        </nav>

        {/* フッター */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <NavLink href="/settings" icon={Settings} label="設定" pathname={pathname} collapsed={c} />
          {!c && (
            <div style={{ marginTop: 10, padding: '0 4px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{currentUser?.name ?? 'ユーザー'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{currentUser?.email}</div>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">{children}</main>

      {/* ── スマホ ハンバーガーボタン ── */}
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setDrawerOpen(true)}
        aria-label="メニューを開く"
      >
        <Menu size={20} />
      </button>

      {/* ── スマホ ドロワー ── */}
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
            {drawerContent}
          </aside>
        </>
      )}
    </div>
  )
}
