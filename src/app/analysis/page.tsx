'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { CoachingNote, IntegratedAnalysis, IntegratedAnalysisContent, SelfAcceptanceContent, PermissionContent } from '@/lib/types'

const RESULT_SECTIONS: { key: keyof IntegratedAnalysisContent; icon: string; label: string; accent?: boolean }[] = [
  { key: 'core_pattern',            icon: '🔍', label: '核となるパターン' },
  { key: 'insight',                 icon: '💡', label: '統合的な気づき' },
  { key: 'self_acceptance_message', icon: '🌱', label: 'あなたへのメッセージ', accent: true },
  { key: 'permission',              icon: '✨', label: 'あなたへの許可' },
  { key: 'next_step',               icon: '🪜', label: '次のステップ' },
  { key: 'affirmation',             icon: '💫', label: 'アファーメーション', accent: true },
]

const LOADING_MESSAGES = [
  'あなたのデータを読み込んでいます…',
  '深層パターンを分析しています…',
  '自己受容メッセージを生成しています…',
  'あなたへの言葉を紡いでいます…',
]

function DataBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: ok ? 'var(--primary-lt)' : 'var(--bg4)', border: `1px solid ${ok ? 'rgba(180,149,108,0.3)' : 'var(--border)'}` }}>
      <span style={{ fontSize: 14 }}>{ok ? '✓' : '○'}</span>
      <span style={{ fontSize: 12, color: ok ? 'var(--primary)' : 'var(--text-faint)', fontWeight: ok ? 700 : 400 }}>{label}</span>
    </div>
  )
}

export default function AnalysisPage() {
  const { currentUser, sessions, discoverySessions } = useStore()
  const [selfNotes, setSelfNotes] = useState<CoachingNote[]>([])
  const [permNotes, setPermNotes] = useState<CoachingNote[]>([])
  const [pastAnalyses, setPastAnalyses] = useState<IntegratedAnalysis[]>([])
  const [result, setResult] = useState<IntegratedAnalysisContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [error, setError] = useState('')
  const [openPastId, setOpenPastId] = useState<string | null>(null)
  const [explainOpen, setExplainOpen] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    supabase.from('coaching_notes').select('*')
      .eq('user_id', currentUser.email).eq('type', 'self_acceptance')
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => { if (data) setSelfNotes(data as CoachingNote[]) })
    supabase.from('coaching_notes').select('*')
      .eq('user_id', currentUser.email).eq('type', 'permission')
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => { if (data) setPermNotes(data as CoachingNote[]) })
    supabase.from('integrated_analyses').select('*')
      .eq('user_id', currentUser.email)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => { if (data) setPastAnalyses(data as IntegratedAnalysis[]) })
  }, [currentUser])

  useEffect(() => {
    if (!loading) return
    const id = setInterval(() => setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length), 1800)
    return () => clearInterval(id)
  }, [loading])

  const hasDetox    = sessions.length > 0
  const hasSelf     = selfNotes.length > 0
  const hasPerm     = permNotes.length > 0
  const hasDiscovery = discoverySessions.length > 0
  const canAnalyze  = hasDetox || hasSelf || hasPerm

  async function handleAnalyze() {
    if (!currentUser || !canAnalyze) return
    setLoading(true); setError(''); setResult(null); setLoadingMsg(0)
    try {
      const res = await fetch('/api/integrated-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detoxSessions:       sessions.slice(0, 5).map(s => ({ analysis: s.analysis, input_text: s.input_text })),
          selfAcceptanceNotes: selfNotes.map(n => ({ content: n.content as SelfAcceptanceContent })),
          permissionNotes:     permNotes.map(n => ({ content: n.content as PermissionContent })),
          discoveryAnalysis:   discoverySessions[0]?.analysis ?? null,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) { setError(json.error ?? '分析に失敗しました'); return }
      setResult(json.content)
      // 保存
      await supabase.from('integrated_analyses').insert({
        user_id: currentUser.email,
        content: json.content,
      }).then(({ data }) => {
        if (data) {
          const newEntry = data as unknown as IntegratedAnalysis
          setPastAnalyses(prev => [newEntry, ...prev])
        }
      })
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 80px' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Step 4</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>統合AI分析</div>
        <div style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.7 }}>これまでの記録をAIが統合し、あなたの深層パターンと次へのメッセージを届けます。</div>
      </div>

      {/* この分析でわかること（開閉式） */}
      <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setExplainOpen(o => !o)}
          style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>📖 この分析でわかること</span>
          <span style={{ fontSize: 18, color: 'var(--text-faint)', transition: 'transform 0.2s', transform: explainOpen ? 'rotate(180deg)' : 'none' }}>∨</span>
        </button>
        {explainOpen && (
          <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.7, marginBottom: 14 }}>
              脳内デトックス・自己受容ノート・許可ノート・Discoveryの記録を統合し、あなた自身も気づきにくい深層パターンを6つの視点から届けます。
            </p>
            {[
              { icon: '🔍', label: '核となるパターン',       desc: '無意識に繰り返している思考・行動のクセ。「なぜいつもこうなるのか」の答えがここに。' },
              { icon: '💡', label: '統合的な気づき',         desc: '複数のデータをまとめて見たとき初めて見えてくる本質的な洞察。' },
              { icon: '🌱', label: 'あなたへのメッセージ',   desc: '今の自分をそのまま受け取るための言葉。評価なく、ただ寄り添う視点。' },
              { icon: '✨', label: 'あなたへの許可',         desc: '「〜していいよ」という形で届く、自分を解放するための言葉。' },
              { icon: '🪜', label: '次のステップ',           desc: '今すぐできる小さな一歩。大きな変化より、明日の自分がラクになる提案。' },
              { icon: '💫', label: 'アファーメーション',     desc: '「私は〜」形式で声に出せる肯定文。繰り返すことで自己認識が変わっていく。' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.65 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ステップ案内 */}
      <div className="card" style={{ padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 12, letterSpacing: '0.5px' }}>分析に使うデータ</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <DataBadge ok={hasDetox}    label={`脳内デトックス (${sessions.length}件)`} />
          <DataBadge ok={hasSelf}     label={`自己受容ノート (${selfNotes.length}件)`} />
          <DataBadge ok={hasPerm}     label={`許可ノート (${permNotes.length}件)`} />
          <DataBadge ok={hasDiscovery} label={`Discovery分析 (${discoverySessions.length > 0 ? '済' : '未'})`} />
        </div>
        {!canAnalyze && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.6 }}>
            まずデトックスセッション、自己受容ノート、許可ノートのいずれかを記録してください。
          </div>
        )}
      </div>

      {/* 分析ボタン */}
      {!loading && !result && (
        <button
          type="button"
          className="btn-pill"
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          style={{ opacity: !canAnalyze ? 0.4 : 1, marginBottom: 24 }}
        >
          ✦ 統合分析を始める
        </button>
      )}

      {/* ローディング */}
      {loading && (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center', marginBottom: 24 }}>
          <div className="breathing-orb" style={{ width: 56, height: 56, margin: '0 auto 20px' }} />
          <div style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, marginBottom: 8 }}>AIが分析しています</div>
          <div style={{ fontSize: 13, color: 'var(--text-faint)', minHeight: 20, transition: 'opacity 0.4s' }}>
            {LOADING_MESSAGES[loadingMsg]}
          </div>
        </div>
      )}

      {/* エラー */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fef2f2', color: '#e11d48', fontSize: 13, marginBottom: 20 }}>{error}</div>
      )}

      {/* 分析結果 */}
      {result && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--primary)' }}>✦</span> 分析結果
          </div>
          {RESULT_SECTIONS.map(({ key, icon, label, accent }) => {
            const val = result[key]
            if (!val) return null
            return (
              <div
                key={key}
                className="card"
                style={{ padding: '16px 18px', marginBottom: 12, borderLeft: accent ? '3px solid var(--primary)' : undefined }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{icon}</span> {label}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0, fontWeight: accent ? 600 : 400 }}>
                  {val}
                </p>
              </div>
            )
          })}

          <button
            type="button"
            onClick={handleAnalyze}
            style={{ marginTop: 8, fontSize: 13, padding: '10px 20px', borderRadius: 20, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', fontFamily: 'inherit', fontWeight: 600 }}
          >
            もう一度分析する
          </button>
        </div>
      )}

      {/* 過去の分析 */}
      {pastAnalyses.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>過去の分析（{pastAnalyses.length}件）</div>
          {pastAnalyses.map(a => (
            <div key={a.id} className="card" style={{ marginBottom: 8, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setOpenPastId(openPastId === a.id ? null : a.id)}
                style={{ width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginBottom: 3 }}>
                    {new Date(a.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                    {a.content.core_pattern}
                  </div>
                </div>
                <span style={{ color: 'var(--text-faint)', fontSize: 18, flexShrink: 0 }}>{openPastId === a.id ? '∧' : '∨'}</span>
              </button>
              {openPastId === a.id && (
                <div style={{ padding: '0 14px 16px', borderTop: '1px solid var(--border)' }}>
                  {RESULT_SECTIONS.map(({ key, icon, label }) => {
                    const val = a.content[key]
                    if (!val) return null
                    return (
                      <div key={key} style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>{icon} {label}</div>
                        <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{val}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
