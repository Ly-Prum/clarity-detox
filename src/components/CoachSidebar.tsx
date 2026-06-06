'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Users, FileText, Key, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/lib/store'

const NAV = [
  { href: '/admin',          icon: LayoutDashboard, label: 'ダッシュボード' },
  { href: '/admin/clients',  icon: Users,           label: 'クライアント' },
  { href: '/admin/reports',  icon: FileText,        label: 'レポート' },
  { href: '/admin/invites',  icon: Key,             label: '招待コード' },
]

export default function CoachSidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const { logout } = useStore()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className={`coach-sidebar${collapsed ? ' collapsed' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', marginBottom: 28 }}>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Clarity</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>Coach</div>
          </div>
        )}
        <button
          type="button"
          title={collapsed ? 'サイドバーを開く' : 'サイドバーを閉じる'}
          onClick={() => setCollapsed(c => !c)}
          style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, padding: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <nav style={{ flex: 1 }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '10px 0' : '9px 12px',
                borderRadius: 8, marginBottom: 2, textDecoration: 'none',
                fontSize: 13, fontWeight: active ? 700 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                background: active ? 'rgba(59,130,246,0.25)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={collapsed ? 20 : 16} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        title={collapsed ? 'ログアウト' : undefined}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 8,
          padding: collapsed ? '10px 0' : '9px 12px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 8, width: '100%',
        }}
      >
        <LogOut size={collapsed ? 18 : 15} style={{ flexShrink: 0 }} />
        {!collapsed && <span>ログアウト</span>}
      </button>
    </aside>
  )
}
