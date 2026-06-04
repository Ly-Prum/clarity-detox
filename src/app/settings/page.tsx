'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { LogOut } from 'lucide-react'

const COLOR_GROUPS = [
  {
    id: 'pastel',
    label: 'パステル',
    colors: [
      { key: 'p-sakura',   label: '桜',         hex: '#d4789a' },
      { key: 'p-lavender', label: 'ラベンダー', hex: '#9b82c8' },
      { key: 'p-mint',     label: 'ミント',     hex: '#52b896' },
      { key: 'p-sky',      label: 'スカイ',     hex: '#5aace0' },
      { key: 'p-peach',    label: 'ピーチ',     hex: '#d08060' },
      { key: 'p-butter',   label: 'バター',     hex: '#c8a030' },
      { key: 'p-lilac',    label: 'ライラック', hex: '#b080c8' },
      { key: 'p-rose',     label: 'ローズ',     hex: '#e07090' },
      { key: 'p-sage',     label: 'セージ',     hex: '#7ab07a' },
      { key: 'p-powder',   label: 'パウダー',   hex: '#6888c8' },
    ],
  },
  {
    id: 'main',
    label: 'メイン',
    colors: [
      { key: 'sand',       label: 'サンド',       hex: '#c9a96e' },
      { key: 'blue',       label: 'ブルー',       hex: '#3b82f6' },
      { key: 'sky',        label: 'スカイ',       hex: '#0ea5e9' },
      { key: 'purple',     label: 'パープル',     hex: '#8b5cf6' },
      { key: 'emerald',    label: 'エメラルド',   hex: '#10b981' },
      { key: 'rose',       label: 'ローズ',       hex: '#f43f5e' },
      { key: 'teal',       label: 'ティール',     hex: '#14b8a6' },
      { key: 'orange',     label: 'オレンジ',     hex: '#f97316' },
      { key: 'indigo',     label: 'インディゴ',   hex: '#6366f1' },
      { key: 'terracotta', label: 'テラコッタ',   hex: '#c2694f' },
    ],
  },
  {
    id: 'dark',
    label: 'ダーク',
    colors: [
      { key: 'd-navy',    label: 'ネイビー',       hex: '#1e40af' },
      { key: 'd-violet',  label: 'バイオレット',   hex: '#5b21b6' },
      { key: 'd-teal',    label: 'ダークティール', hex: '#0f766e' },
      { key: 'd-crimson', label: 'クリムゾン',     hex: '#991b1b' },
      { key: 'd-forest',  label: 'フォレスト',     hex: '#15803d' },
      { key: 'd-rose',    label: 'ダークローズ',   hex: '#9d174d' },
      { key: 'd-slate',   label: 'スレート',       hex: '#1e3a5f' },
      { key: 'd-copper',  label: 'コッパー',       hex: '#92400e' },
      { key: 'd-olive',   label: 'オリーブ',       hex: '#3f6212' },
      { key: 'd-charcoal',label: 'チャコール',     hex: '#374151' },
    ],
  },
]

export default function SettingsPage() {
  const { currentUser, login, logout, sessions, clearSessions, colorTheme, setColorTheme } = useStore()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput]     = useState('')
  const [openColor, setOpenColor]     = useState<string | null>(null)
  const router = useRouter()

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  function startEdit() {
    setNameInput(currentUser?.name ?? '')
    setEditingName(true)
  }

  function saveName() {
    const trimmed = nameInput.trim()
    if (trimmed) login(currentUser?.email ?? 'local@clarity.app', trimmed)
    setEditingName(false)
  }

  function cancelEdit() { setEditingName(false) }

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ユーザー情報 */}
      <div className="card" style={{ padding: '20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: '#fff', border: '1px solid var(--border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/clarity-logo.png" alt="Clarity" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  autoFocus title="名前を入力" placeholder="名前を入力"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEdit() }}
                  style={{ flex: 1, fontSize: 15, fontWeight: 700, color: 'var(--text)', background: 'var(--bg3)', border: '1.5px solid var(--primary)', borderRadius: 8, padding: '5px 10px', fontFamily: 'inherit', outline: 'none' }}
                />
                <button type="button" title="保存" onClick={saveName} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
                </button>
                <button type="button" title="キャンセル" onClick={cancelEdit} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-faint)' }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{currentUser?.name ?? 'あなたの名前'}</span>
                <button type="button" title="名前を編集" onClick={startEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-faint)', display: 'flex', alignItems: 'center' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4, fontWeight: 600 }}>
              {sessions.length}セッション記録済み
            </div>
          </div>
        </div>
      </div>

      {/* 招待コード */}
      {currentUser?.inviteCode && (
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>あなたの招待コード</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
              {currentUser.inviteCode}
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(currentUser.inviteCode)}
              style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-faint)', fontFamily: 'inherit', flexShrink: 0 }}
            >
              コピー
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8, lineHeight: 1.6 }}>
            別のデバイスでログインするときに必要です。
          </div>
        </div>
      )}

      {/* カラーテーマ（開閉式） */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setOpenColor(openColor ? null : 'open')}
          style={{ width: '100%', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: COLOR_GROUPS.flatMap(g => g.colors).find(c => c.key === colorTheme)?.hex ?? '#c9a96e', border: '2px solid rgba(0,0,0,0.08)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>カラーテーマ</span>
          </div>
          <span style={{ fontSize: 18, color: 'var(--text-faint)', transform: openColor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>∨</span>
        </button>

        {openColor && (
          <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
            {COLOR_GROUPS.map(group => (
              <div key={group.id} style={{ marginTop: 16 }}>
                {/* グループ見出し（開閉式） */}
                <button
                  type="button"
                  onClick={() => setOpenColor(openColor === group.id ? 'open' : group.id)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', marginBottom: 4 }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{group.label}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-faint)', transform: openColor === group.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>∨</span>
                </button>

                {openColor === group.id && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    {group.colors.map(color => {
                      const active = colorTheme === color.key
                      return (
                        <button
                          key={color.key}
                          type="button"
                          title={color.label}
                          onClick={() => setColorTheme(color.key)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                            background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit',
                          }}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: color.hex,
                            border: active ? `3px solid ${color.hex}` : '2px solid transparent',
                            boxShadow: active ? `0 0 0 2px #fff, 0 0 0 4px ${color.hex}` : '0 1px 4px rgba(0,0,0,0.15)',
                            transition: 'all 0.15s',
                          }} />
                          <span style={{ fontSize: 9, color: active ? 'var(--primary)' : 'var(--text-faint)', fontWeight: active ? 700 : 400, textAlign: 'center', lineHeight: 1.2 }}>
                            {color.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
            type="button"
            onClick={() => { if (confirm('すべての記録を削除しますか？')) clearSessions() }}
            style={{ fontSize: 13, color: 'var(--rose)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
          >
            すべての記録を削除
          </button>
        </div>
      </div>

      {/* ログアウト */}
      <button
        type="button"
        onClick={handleLogout}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 48, fontSize: 14, fontWeight: 600, color: 'var(--text-sub)', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}
      >
        <LogOut size={16} />
        ログアウト
      </button>

      <div style={{ height: 8 }} />
    </div>
  )
}
