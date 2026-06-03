'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { CoachingNote, SelfAcceptanceContent, PermissionContent } from '@/lib/types'

const QUICK_PERMISSIONS = [
  '休んでいい', '泣いていい', '怒っていい', '弱くていい',
  '失敗していい', '遅くていい', '助けを求めていい', '変わっていい',
  '断っていい', '自分を優先していい', '不安でいい', 'できなくていい',
]

const SELF_ACCEPTANCE_PROMPTS = [
  { key: 'state',   label: '今の自分の状態を、素直に書いてみてください',    placeholder: '疲れている、焦っている、なんか気分が乗らない…など' },
  { key: 'blame',   label: '最近、自分を責めてしまったことは何ですか？',      placeholder: 'もっとできたはずなのに、とか、なんであんなこと言ったんだろう…など' },
  { key: 'message', label: 'そんな自分に、どんな言葉をかけてあげたいですか？', placeholder: 'よく頑張ったね、それでいいんだよ…など' },
]

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit',
  background: 'var(--bg3)', color: 'var(--text)', outline: 'none',
  resize: 'vertical', boxSizing: 'border-box',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── 自己受容ノート ─────────────────────────────────────────
function SelfAcceptanceTab({ userId }: { userId: string }) {
  const [form, setForm] = useState<SelfAcceptanceContent>({ state: '', blame: '', message: '' })
  const [notes, setNotes] = useState<CoachingNote[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('coaching_notes').select('*')
      .eq('user_id', userId).eq('type', 'self_acceptance')
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setNotes(data as CoachingNote[]) })
  }, [userId])

  const canSave = form.state.trim().length > 0 || form.message.trim().length > 0

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    const { data, error } = await supabase.from('coaching_notes').insert({
      user_id: userId, type: 'self_acceptance', content: form,
    }).select().single()
    setSaving(false)
    if (!error && data) {
      setNotes(prev => [data as CoachingNote, ...prev])
      setForm({ state: '', blame: '', message: '' })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div>
      {/* 入力フォーム */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.7, marginBottom: 20 }}>
          今の自分をそのまま受け取る時間です。正しく書こうとしなくていいです。
        </div>
        {SELF_ACCEPTANCE_PROMPTS.map(({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
              {label}
            </div>
            <textarea
              rows={3}
              style={inp}
              placeholder={placeholder}
              value={(form as unknown as Record<string, string>)[key]}
              onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
            />
          </div>
        ))}
        {saved && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            ✓ 保存しました
          </div>
        )}
        <button
          type="button" className="btn-pill"
          onClick={handleSave}
          disabled={saving || !canSave}
          style={{ opacity: !canSave ? 0.4 : 1 }}
        >
          {saving ? '保存中...' : '記録する'}
        </button>
      </div>

      {/* 過去のノート */}
      {notes.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 10 }}>過去の記録（{notes.length}件）</div>
          {notes.map(n => {
            const c = n.content as SelfAcceptanceContent
            return (
              <div key={n.id} className="card" style={{ marginBottom: 8, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === n.id ? null : n.id)}
                  style={{ width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginBottom: 2 }}>{formatDate(n.created_at)}</div>
                    <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{c.state || c.message || '（記録あり）'}</div>
                  </div>
                  <span style={{ color: 'var(--text-faint)', fontSize: 18, flexShrink: 0 }}>{openId === n.id ? '∧' : '∨'}</span>
                </button>
                {openId === n.id && (
                  <div style={{ padding: '0 14px 16px', borderTop: '1px solid var(--border)' }}>
                    {SELF_ACCEPTANCE_PROMPTS.map(({ key, label }) => {
                      const val = (c as unknown as Record<string, string>)[key]
                      if (!val) return null
                      return (
                        <div key={key} style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 4 }}>{label}</div>
                          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{val}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 許可ノート ──────────────────────────────────────────────
function PermissionTab({ userId }: { userId: string }) {
  const [selected, setSelected] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [notes, setNotes] = useState<CoachingNote[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('coaching_notes').select('*')
      .eq('user_id', userId).eq('type', 'permission')
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setNotes(data as CoachingNote[]) })
  }, [userId])

  function toggleQuick(p: string) {
    setSelected(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function addCustom() {
    const val = custom.trim()
    if (!val) return
    const label = val.endsWith('いい') || val.endsWith('いい。') ? val : `${val}していい`
    if (!selected.includes(label)) setSelected(prev => [...prev, label])
    setCustom('')
  }

  const canSave = selected.length > 0

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    const { data, error } = await supabase.from('coaching_notes').insert({
      user_id: userId, type: 'permission', content: { permissions: selected },
    }).select().single()
    setSaving(false)
    if (!error && data) {
      setNotes(prev => [data as CoachingNote, ...prev])
      setSelected([])
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div>
      {/* 入力フォーム */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.7, marginBottom: 16 }}>
          「私は、___していい」。自分に許可を出す練習です。タップして選んでください。
        </div>

        {/* クイック選択 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {QUICK_PERMISSIONS.map(p => (
            <button
              key={p} type="button"
              onClick={() => toggleQuick(p)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                border: `1.5px solid ${selected.includes(p) ? 'var(--primary)' : 'var(--border)'}`,
                background: selected.includes(p) ? 'var(--primary-lt)' : 'var(--bg3)',
                color: selected.includes(p) ? 'var(--primary)' : 'var(--text-sub)',
                fontWeight: selected.includes(p) ? 700 : 400,
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {selected.includes(p) ? '✓ ' : ''}{p}
            </button>
          ))}
        </div>

        {/* カスタム入力 */}
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 6 }}>
          他にある場合は追加
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            style={{ ...inp, resize: undefined, flex: 1 }}
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="例：泣き言を言って"
          />
          <button
            type="button"
            onClick={addCustom}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg3)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'var(--primary)', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            追加
          </button>
        </div>

        {/* 選択済みリスト */}
        {selected.length > 0 && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: 'var(--primary-lt)', border: '1px solid rgba(180,149,108,0.2)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>今日の許可リスト</div>
            {selected.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>私は、{p}</span>
                <button type="button" onClick={() => setSelected(prev => prev.filter(x => x !== p))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 16, padding: '0 4px' }}>×</button>
              </div>
            ))}
          </div>
        )}

        {saved && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            ✓ 保存しました
          </div>
        )}
        <button
          type="button" className="btn-pill"
          onClick={handleSave}
          disabled={saving || !canSave}
          style={{ opacity: !canSave ? 0.4 : 1 }}
        >
          {saving ? '保存中...' : '記録する'}
        </button>
      </div>

      {/* 過去のノート */}
      {notes.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 10 }}>過去の記録（{notes.length}件）</div>
          {notes.map(n => {
            const c = n.content as PermissionContent
            return (
              <div key={n.id} className="card" style={{ marginBottom: 8, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === n.id ? null : n.id)}
                  style={{ width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginBottom: 2 }}>{formatDate(n.created_at)}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{c.permissions.length}個の許可</div>
                  </div>
                  <span style={{ color: 'var(--text-faint)', fontSize: 18, flexShrink: 0 }}>{openId === n.id ? '∧' : '∨'}</span>
                </button>
                {openId === n.id && (
                  <div style={{ padding: '8px 14px 16px', borderTop: '1px solid var(--border)' }}>
                    {c.permissions.map((p, i) => (
                      <div key={i} style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, padding: '5px 0', borderBottom: i < c.permissions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        私は、{p}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── メインページ ────────────────────────────────────────────
export default function NotesPage() {
  const { currentUser } = useStore()
  const [tab, setTab] = useState<'self_acceptance' | 'permission'>('self_acceptance')

  if (!currentUser) return null

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 80px' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Coaching Notes</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>コーチングノート</div>
        <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>自分と向き合う、内側からの声を記録する</div>
      </div>

      {/* タブ */}
      <div className="page-tab-bar" style={{ marginBottom: 20 }}>
        <button
          className={`page-tab-btn${tab === 'self_acceptance' ? ' active' : ''}`}
          onClick={() => setTab('self_acceptance')}
        >
          🌱 自己受容ノート
        </button>
        <button
          className={`page-tab-btn${tab === 'permission' ? ' active' : ''}`}
          onClick={() => setTab('permission')}
        >
          ✨ 許可ノート
        </button>
      </div>

      {tab === 'self_acceptance' && <SelfAcceptanceTab userId={currentUser.email} />}
      {tab === 'permission' && <PermissionTab userId={currentUser.email} />}
    </div>
  )
}
