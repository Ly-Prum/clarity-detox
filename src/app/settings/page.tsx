'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { LogOut } from 'lucide-react'

const COLOR_GROUPS = {
  'シンプル': [
    { id: 'blue',    label: 'ブルー',    hex: '#3b82f6' },
    { id: 'sky',     label: 'スカイ',    hex: '#0ea5e9' },
    { id: 'teal',    label: 'ティール',  hex: '#14b8a6' },
    { id: 'emerald', label: 'エメラルド',hex: '#10b981' },
    { id: 'indigo',  label: 'インジゴ',  hex: '#6366f1' },
    { id: 'purple',  label: 'パープル',  hex: '#8b5cf6' },
    { id: 'rose',    label: 'ローズ',    hex: '#f43f5e' },
  ],
  'タン・ベージュ': [
    { id: 'beige',      label: 'ベージュ',    hex: '#c8956c' },
    { id: 'sand',       label: 'サンド',      hex: '#c9a96e' },
    { id: 'mustard',    label: 'マスタード',  hex: '#ca8a04' },
    { id: 'terracotta', label: 'テラコッタ',  hex: '#c2694f' },
    { id: 'caramel',    label: 'キャラメル',  hex: '#b47c3a' },
    { id: 'khaki',      label: 'カーキ',      hex: '#8b9c4a' },
  ],
  'パステル': [
    { id: 'pastel-pink',     label: 'ピンク',     hex: '#ec4899' },
    { id: 'pastel-lavender', label: 'ラベンダー', hex: '#8b5cf6' },
    { id: 'pastel-lilac',    label: 'ライラック', hex: '#a855f7' },
    { id: 'pastel-mint',     label: 'ミント',     hex: '#10b981' },
    { id: 'pastel-sky',      label: 'スカイ',     hex: '#0ea5e9' },
    { id: 'pastel-peach',    label: 'ピーチ',     hex: '#f97316' },
    { id: 'pastel-butter',   label: 'バター',     hex: '#ca8a04' },
  ],
} as const

type GroupKey = keyof typeof COLOR_GROUPS

export default function SettingsPage() {
  const { colorTheme, setColorTheme, currentUser, logout, sessions, clearSessions } = useStore()
  const [activeGroup, setActiveGroup] = useState<GroupKey>('シンプル')
  const router = useRouter()

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  const currentColors = COLOR_GROUPS[activeGroup]

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ユーザー情報 */}
      <div className="card" style={{ padding: '20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>
            {currentUser?.name?.slice(0, 2).toUpperCase() ?? 'ME'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{currentUser?.name ?? 'ユーザー'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{currentUser?.email}</div>
            <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4, fontWeight: 600 }}>
              {sessions.length}セッション記録済み
            </div>
          </div>
        </div>
      </div>

      {/* アクセントカラー */}
      <div className="card" style={{ padding: '18px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>アクセントカラー</div>

        {/* タブ */}
        <div className="period-selector" style={{ marginBottom: 14 }}>
          {(Object.keys(COLOR_GROUPS) as GroupKey[]).map(group => (
            <button
              key={group}
              className={`period-btn${activeGroup === group ? ' active' : ''}`}
              onClick={() => setActiveGroup(group)}
            >
              {group}
            </button>
          ))}
        </div>

        {/* スウォッチ */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {currentColors.map(({ id, label, hex }) => {
            const active = colorTheme === id
            return (
              <button
                key={id}
                title={label}
                onClick={() => setColorTheme(id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '8px 10px', borderRadius: 12, minWidth: 54,
                  border: `2px solid ${active ? hex : 'var(--border)'}`,
                  background: active ? `${hex}14` : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: hex,
                  boxShadow: active ? `0 0 0 3px ${hex}40` : 'none',
                }} />
                <span style={{ fontSize: 9, color: active ? hex : 'var(--text-faint)', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* データ管理 */}
      <div className="card" style={{ padding: '18px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>データ管理</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>セッション数</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>ローカルに保存中</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{sessions.length}件</div>
        </div>
        <div style={{ paddingTop: 12 }}>
          <button
            onClick={() => { if (confirm('すべての記録を削除しますか？')) clearSessions() }}
            style={{
              fontSize: 13, color: 'var(--rose)', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
            }}
          >
            すべての記録を削除
          </button>
        </div>
      </div>

      {/* ログアウト */}
      <button
        onClick={handleLogout}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '14px',
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 48, fontSize: 14, fontWeight: 600,
          color: 'var(--text-sub)', cursor: 'pointer', fontFamily: 'inherit',
          marginTop: 4,
        }}
      >
        <LogOut size={16} />
        ログアウト
      </button>

      <div style={{ height: 8 }} />
    </div>
  )
}
