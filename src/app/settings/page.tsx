'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { LogOut } from 'lucide-react'

export default function SettingsPage() {
  const { currentUser, login, logout, sessions, clearSessions } = useStore()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
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

  function cancelEdit() {
    setEditingName(false)
  }

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ユーザー情報 */}
      <div className="card" style={{ padding: '20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* ロゴ */}
          <div style={{ width: 60, height: 60, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: '#fff', border: '1px solid var(--border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/clarity-logo.png" alt="Clarity" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  autoFocus
                  title="名前を入力"
                  placeholder="名前を入力"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEdit() }}
                  style={{
                    flex: 1, fontSize: 15, fontWeight: 700, color: 'var(--text)',
                    background: 'var(--bg3)', border: '1.5px solid var(--primary)',
                    borderRadius: 8, padding: '5px 10px', fontFamily: 'inherit', outline: 'none',
                  }}
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
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {currentUser?.name ?? 'あなたの名前'}
                </span>
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
