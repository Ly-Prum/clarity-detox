'use client'
import { useState, useEffect, useCallback } from 'react'
import { Copy, RefreshCw } from 'lucide-react'

interface InviteCode {
  id: string; code: string; client_name: string
  email: string; memo: string; is_active: boolean; created_at: string
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'CL-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function InvitesPage() {
  const [invites, setInvites]       = useState<InviteCode[]>([])
  const [loading, setLoading]       = useState(true)
  const [creating, setCreating]     = useState(false)
  const [newCode, setNewCode]       = useState(generateCode())
  const [clientName, setClientName] = useState('')
  const [email, setEmail]           = useState('')
  const [memo, setMemo]             = useState('')
  const [copied, setCopied]         = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/invites')
    if (res.ok) setInvites(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!clientName.trim()) return
    setCreating(true)
    await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode, client_name: clientName, email, memo }),
    })
    setClientName(''); setEmail(''); setMemo(''); setNewCode(generateCode())
    await load()
    setCreating(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/invites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    await load()
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      <div className="page-title">招待コード管理</div>
      <div className="page-sub">クライアントへのアクセスコードを発行・管理</div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>新規発行</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 5 }}>クライアント名 *</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="山田あやか" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 5 }}>招待コード</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={newCode} onChange={e => setNewCode(e.target.value)} style={{ flex: 1 }} placeholder="CL-XXXXXXXX" title="招待コード" />
              <button type="button" title="コードを再生成" onClick={() => setNewCode(generateCode())} className="btn btn-ghost" style={{ padding: '9px 10px' }}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 5 }}>メールアドレス</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="ayaka@example.com" type="email" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 5 }}>メモ</label>
            <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="初回セッション後に発行" />
          </div>
        </div>
        <button type="button" onClick={handleCreate} disabled={creating || !clientName} className="btn btn-primary" style={{ opacity: !clientName ? 0.4 : 1 }}>
          {creating ? '発行中...' : '招待コードを発行'}
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-faint)' }}>読み込み中...</div>
        ) : (
          <table>
            <thead>
              <tr><th>クライアント名</th><th>招待コード</th><th>メール</th><th>メモ</th><th>状態</th><th>発行日</th><th></th></tr>
            </thead>
            <tbody>
              {invites.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600 }}>{inv.client_name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <code style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-lt)', padding: '2px 8px', borderRadius: 6 }}>{inv.code}</code>
                      <button type="button" title="コピー" onClick={() => copy(inv.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === inv.code ? 'var(--green)' : 'var(--text-faint)', padding: 2 }}>
                        <Copy size={13} />
                      </button>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{inv.email || '--'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-faint)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.memo || '--'}</td>
                  <td>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700, background: inv.is_active ? '#dcfce7' : '#fee2e2', color: inv.is_active ? 'var(--green)' : 'var(--rose)' }}>
                      {inv.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{new Date(inv.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</td>
                  <td>
                    <button type="button" onClick={() => toggleActive(inv.id, inv.is_active)} className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>
                      {inv.is_active ? '無効化' : '有効化'}
                    </button>
                  </td>
                </tr>
              ))}
              {invites.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '40px 0' }}>まだ招待コードがありません</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
