'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ReportRadarChart, AXES } from '@/components/ReportRadarChart'
import { Sparkles, ClipboardPaste } from 'lucide-react'

const initScores = () => Object.fromEntries(AXES.map(k => [k, 3])) as Record<string, number>

interface ReportData {
  theme: string; session_date: string; current_state: string; core_theme: string
  thinking_patterns: { title: string; description: string }[]
  natural_strengths: string[]; word_conversions: { before: string; after: string }[]
  challenges: string[]; overall: string; scores: Record<string, number>
}

const emptyData = (): ReportData => ({
  theme: '', session_date: new Date().toISOString().split('T')[0],
  current_state: '', core_theme: '',
  thinking_patterns: [{ title: '', description: '' }],
  natural_strengths: [''], word_conversions: [{ before: '', after: '' }],
  challenges: [''], overall: '', scores: initScores(),
})

const DRAFT_KEY = 'coach_report_draft'
const SL = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>{children}</div>
)

function NewReportForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab]             = useState<'text' | 'form'>('text')
  const [clientCode, setClientCode] = useState(searchParams.get('client') ?? '')
  const [pasteText, setPasteText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [data, setData]           = useState<ReportData>(emptyData())
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState('')
  const [hasDraft, setHasDraft]   = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try { const d = JSON.parse(saved); if (d.data?.theme || d.clientCode) setHasDraft(true) }
      catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (data.theme || clientCode) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, clientCode, pasteText, tab }))
    }
  }, [data, clientCode, pasteText, tab])

  function restoreDraft() {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (!saved) return
    try {
      const d = JSON.parse(saved)
      if (d.data) setData({ ...emptyData(), ...d.data, scores: { ...initScores(), ...d.data.scores } })
      if (d.clientCode) setClientCode(d.clientCode)
      if (d.pasteText) setPasteText(d.pasteText)
      if (d.tab) setTab(d.tab)
    } catch { /* ignore */ }
    setHasDraft(false)
  }

  function clearDraft() { localStorage.removeItem(DRAFT_KEY); setHasDraft(false) }

  async function handleAnalyze() {
    if (!pasteText.trim()) return
    setAnalyzing(true); setAnalyzeError('')
    try {
      const res = await fetch('/api/reports/analyze-text', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      })
      const json = await res.json()
      if (!res.ok) { setAnalyzeError(json.error ?? '解析に失敗しました'); return }
      setData({ ...emptyData(), ...json.data, scores: { ...initScores(), ...json.data.scores } })
      setTab('form')
    } catch { setAnalyzeError('通信エラーが発生しました') }
    finally { setAnalyzing(false) }
  }

  async function handleSave() {
    if (!clientCode || !data.theme) return
    setSaving(true); setSaveError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, client_code: clientCode.trim().toUpperCase() }),
      })
      if (!res.ok) { const j = await res.json(); setSaveError(j.error ?? '保存に失敗しました'); return }
      clearDraft()
      router.push('/admin/reports')
    } catch { setSaveError('通信エラーが発生しました') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button type="button" onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-faint)' }}>← 戻る</button>
        <div className="page-title" style={{ marginTop: 8 }}>新規レポート作成</div>
      </div>

      {hasDraft && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#fefce8', border: '1px solid #fde047', marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: '#713f12', fontWeight: 600 }}>📝 前回の入力途中データがあります</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={restoreDraft} className="btn btn-primary" style={{ fontSize: 12, padding: '5px 14px' }}>復元する</button>
            <button type="button" onClick={clearDraft} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 14px' }}>破棄</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 5 }}>クライアントID / 招待コード *</label>
        <input style={{ maxWidth: 300 }} value={clientCode} onChange={e => setClientCode(e.target.value)} placeholder="CL-XXXXXXXX" />
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', width: 'fit-content' }}>
        {(['text', 'form'] as const).map(id => (
          <button key={id} type="button" onClick={() => setTab(id)} style={{ padding: '9px 20px', background: tab === id ? 'var(--primary)' : '#fff', color: tab === id ? '#fff' : 'var(--text-sub)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === id ? 700 : 400 }}>
            {id === 'text' ? '📋 テキストから生成' : '✏️ 手動入力'}
          </button>
        ))}
      </div>

      {tab === 'text' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>ChatGPTの分析結果を貼り付け</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 16, lineHeight: 1.7 }}>
            ChatGPTから出力した分析テキストをそのまま貼り付けてください。AIが自動でスコア・テーマ・パターンなどに変換します。
          </div>
          <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={14}
            placeholder={`【セッション分析】\nテーマ：自己価値・恋愛パターン\n\n■ 8軸スコア（1〜5）\n自己理解度：3\n...\n\n■ 思考パターン\n・〇〇パターン：...`}
            style={{ resize: 'vertical', lineHeight: 1.7, fontFamily: 'monospace', fontSize: 12 }} />
          {analyzeError && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--rose)' }}>{analyzeError}</div>}
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <button type="button" onClick={handleAnalyze} disabled={analyzing || !pasteText.trim()} className="btn btn-primary" style={{ opacity: !pasteText.trim() ? 0.4 : 1 }}>
              <Sparkles size={15} />{analyzing ? 'AIが解析中...' : 'AIで解析してフォームに入力'}
            </button>
            <button type="button" onClick={() => setTab('form')} className="btn btn-ghost">手動で入力する</button>
          </div>
        </div>
      )}

      {tab === 'form' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <SL>基本情報</SL>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 5 }}>テーマ *</label>
                  <input value={data.theme} onChange={e => setData({ ...data, theme: e.target.value })} placeholder="恋愛・自己価値" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 5 }}>セッション日</label>
                  <input type="date" value={data.session_date} onChange={e => setData({ ...data, session_date: e.target.value })} />
                </div>
              </div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 5 }}>核となるテーマ</label>
              <input value={data.core_theme} onChange={e => setData({ ...data, core_theme: e.target.value })} placeholder="「明るい自分」で愛されようとしている" />
            </div>
            <div><SL>現在の状態</SL>
              <textarea style={{ minHeight: 80, resize: 'vertical' }} value={data.current_state} onChange={e => setData({ ...data, current_state: e.target.value })} placeholder="現在の状態を入力..." />
            </div>
            <div><SL>8軸スコア（1〜5）</SL>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {AXES.map(axis => (
                  <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, width: 90, flexShrink: 0 }}>{axis}</span>
                    <input type="range" min={1} max={5} step={1} value={data.scores[axis] ?? 3} aria-label={axis}
                      onChange={e => setData({ ...data, scores: { ...data.scores, [axis]: Number(e.target.value) } })}
                      style={{ flex: 1, accentColor: 'var(--primary)', border: 'none', padding: 0, background: 'none' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', width: 18, textAlign: 'right' }}>{data.scores[axis] ?? 3}</span>
                  </div>
                ))}
              </div>
            </div>
            <div><SL>思考パターン</SL>
              {data.thinking_patterns.map((p, i) => (
                <div key={i} style={{ marginBottom: 10, padding: 10, background: 'var(--bg)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input style={{ flex: 1 }} value={p.title} onChange={e => { const n = [...data.thinking_patterns]; n[i] = { ...n[i], title: e.target.value }; setData({ ...data, thinking_patterns: n }) }} placeholder={`パターン${i + 1}`} />
                    {data.thinking_patterns.length > 1 && <button type="button" onClick={() => setData({ ...data, thinking_patterns: data.thinking_patterns.filter((_, j) => j !== i) })} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>削除</button>}
                  </div>
                  <textarea style={{ minHeight: 56, resize: 'vertical' }} value={p.description} onChange={e => { const n = [...data.thinking_patterns]; n[i] = { ...n[i], description: e.target.value }; setData({ ...data, thinking_patterns: n }) }} placeholder="説明..." />
                </div>
              ))}
              <button type="button" onClick={() => setData({ ...data, thinking_patterns: [...data.thinking_patterns, { title: '', description: '' }] })} className="btn btn-ghost" style={{ fontSize: 12 }}>＋ 追加</button>
            </div>
            <div><SL>本来の魅力</SL>
              {data.natural_strengths.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input style={{ flex: 1 }} value={s} onChange={e => { const n = [...data.natural_strengths]; n[i] = e.target.value; setData({ ...data, natural_strengths: n }) }} placeholder={`強み${i + 1}`} />
                  {data.natural_strengths.length > 1 && <button type="button" onClick={() => setData({ ...data, natural_strengths: data.natural_strengths.filter((_, j) => j !== i) })} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>削除</button>}
                </div>
              ))}
              <button type="button" onClick={() => setData({ ...data, natural_strengths: [...data.natural_strengths, ''] })} className="btn btn-ghost" style={{ fontSize: 12 }}>＋ 追加</button>
            </div>
            <div><SL>言葉の変換</SL>
              {data.word_conversions.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input style={{ flex: 1 }} value={w.before} onChange={e => { const n = [...data.word_conversions]; n[i] = { ...n[i], before: e.target.value }; setData({ ...data, word_conversions: n }) }} placeholder="変換前" />
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>→</span>
                  <input style={{ flex: 1 }} value={w.after} onChange={e => { const n = [...data.word_conversions]; n[i] = { ...n[i], after: e.target.value }; setData({ ...data, word_conversions: n }) }} placeholder="変換後" />
                  {data.word_conversions.length > 1 && <button type="button" onClick={() => setData({ ...data, word_conversions: data.word_conversions.filter((_, j) => j !== i) })} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>削除</button>}
                </div>
              ))}
              <button type="button" onClick={() => setData({ ...data, word_conversions: [...data.word_conversions, { before: '', after: '' }] })} className="btn btn-ghost" style={{ fontSize: 12 }}>＋ 追加</button>
            </div>
            <div><SL>今後の課題</SL>
              {data.challenges.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input style={{ flex: 1 }} value={c} onChange={e => { const n = [...data.challenges]; n[i] = e.target.value; setData({ ...data, challenges: n }) }} placeholder={`課題${i + 1}`} />
                  {data.challenges.length > 1 && <button type="button" onClick={() => setData({ ...data, challenges: data.challenges.filter((_, j) => j !== i) })} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>削除</button>}
                </div>
              ))}
              <button type="button" onClick={() => setData({ ...data, challenges: [...data.challenges, ''] })} className="btn btn-ghost" style={{ fontSize: 12 }}>＋ 追加</button>
            </div>
            <div><SL>総評</SL>
              <textarea style={{ minHeight: 80, resize: 'vertical' }} value={data.overall} onChange={e => setData({ ...data, overall: e.target.value })} placeholder="総評を入力..." />
            </div>
            {saveError && <div style={{ fontSize: 13, color: 'var(--rose)' }}>{saveError}</div>}
            <button type="button" onClick={handleSave} disabled={saving || !clientCode || !data.theme} className="btn btn-primary" style={{ opacity: (!clientCode || !data.theme) ? 0.4 : 1, alignSelf: 'flex-start' }}>
              {saving ? '保存中...' : '✓ レポートを保存'}
            </button>
          </div>

          <div style={{ position: 'sticky', top: 24 }}>
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 14, letterSpacing: '0.5px' }}>8軸 リアルタイムプレビュー</div>
              <ReportRadarChart scores={data.scores} size={220} />
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {AXES.map(axis => (
                  <div key={axis} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-sub)' }}>
                    <span>{axis}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{data.scores[axis] ?? 3}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewReportPage() {
  return <Suspense><NewReportForm /></Suspense>
}
