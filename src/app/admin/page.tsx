'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { ThinkingPattern, WordConversion, ClarityReport } from '@/lib/types'

const AXES = ['自己理解度', '感情理解度', '課題認識度', '原因理解度', '本音把握度', '方向性明確度', '自己受容度', '行動明確度'] as const
const initScores = () => Object.fromEntries(AXES.map(k => [k, 3])) as Record<string, number>

function ScoreRadar({ scores }: { scores: Record<string, number> }) {
  const cx = 100, cy = 100, maxR = 72, labelR = 88
  const n = AXES.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) })
  const dataPath = AXES.map((k, i) => {
    const p = pt((scores[k] / 5) * maxR, i)
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ') + 'Z'
  return (
    <svg width={200} height={200} viewBox="0 0 200 200" style={{ overflow: 'visible', flexShrink: 0 }}>
      {[1,2,3,4,5].map(lv => {
        const pts = AXES.map((_, i) => { const p = pt((lv/5)*maxR, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
        return <polygon key={lv} points={pts} fill="none" stroke={lv===5?'#e0d8ce':'#ece8e0'} strokeWidth={lv===5?1.5:0.8} />
      })}
      {AXES.map((_, i) => { const p = pt(maxR, i); return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#ece8e0" strokeWidth="1" /> })}
      <path d={dataPath} fill="var(--primary)" fillOpacity="0.18" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
      {AXES.map((k, i) => { const r = (scores[k]/5)*maxR; const p = pt(r, i); return <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--primary)" stroke="#fff" strokeWidth="1.5" /> })}
      {AXES.map((k, i) => {
        const p = pt(labelR, i)
        const short = k.replace('度', '')
        return <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#8a7060">{short}</text>
      })}
    </svg>
  )
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }
const addBtn: React.CSSProperties = { fontSize: 12, padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--primary)', fontFamily: 'inherit', marginTop: 4 }
const delBtn: React.CSSProperties = { fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca', background: 'transparent', cursor: 'pointer', color: '#e11d48', fontFamily: 'inherit', flexShrink: 0 }
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)', letterSpacing: '0.5px' }}>{children}</div>
)

export default function AdminPage() {
  const { isAuthenticated } = useStore()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [reports, setReports] = useState<Pick<ClarityReport, 'id' | 'client_code' | 'session_date' | 'theme'>[]>([])

  const [clientCode, setClientCode] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [theme, setTheme] = useState('')
  const [currentState, setCurrentState] = useState('')
  const [coreTheme, setCoreTheme] = useState('')
  const [thinkingPatterns, setThinkingPatterns] = useState<ThinkingPattern[]>([{ title: '', description: '' }])
  const [naturalStrengths, setNaturalStrengths] = useState<string[]>([''])
  const [wordConversions, setWordConversions] = useState<WordConversion[]>([{ before: '', after: '' }])
  const [challenges, setChallenges] = useState<string[]>([''])
  const [overall, setOverall] = useState('')
  const [scores, setScores] = useState<Record<string, number>>(initScores())

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return }
    loadReports()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  async function loadReports() {
    const { data } = await supabase.from('reports').select('id, client_code, session_date, theme').order('created_at', { ascending: false })
    if (data) setReports(data)
  }

  async function handleSave() {
    if (!clientCode.trim() || !theme.trim()) { setError('招待コードとテーマは必須です'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('reports').insert({
      client_code: clientCode.trim().toUpperCase(),
      session_date: sessionDate,
      theme: theme.trim(),
      current_state: currentState.trim(),
      core_theme: coreTheme.trim(),
      thinking_patterns: thinkingPatterns.filter(p => p.title.trim()),
      natural_strengths: naturalStrengths.filter(s => s.trim()),
      word_conversions: wordConversions.filter(w => w.before.trim()),
      challenges: challenges.filter(c => c.trim()),
      overall: overall.trim(),
      scores,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    await loadReports()
    setClientCode(''); setTheme(''); setCurrentState(''); setCoreTheme('')
    setThinkingPatterns([{ title: '', description: '' }]); setNaturalStrengths([''])
    setWordConversions([{ before: '', after: '' }]); setChallenges(['']); setOverall(''); setScores(initScores())
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 80px' }}>
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 2 }}>レポート作成</div>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 24 }}>Clarity 自己分析レポート</div>

      {/* 作成済みレポート */}
      {reports.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-sub)' }}>作成済み（{reports.length}件）</div>
          {reports.map(r => (
            <div key={r.id} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{r.client_code} — {r.theme}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{r.session_date}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        {/* 基本情報 */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>基本情報</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 5 }}>会員の招待コード *</div>
              <input style={inp} value={clientCode} onChange={e => setClientCode(e.target.value)} placeholder="CLARITY-AYAKA" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 5 }}>セッション日</div>
              <input type="date" style={inp} value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 5 }}>テーマ *</div>
          <input style={inp} value={theme} onChange={e => setTheme(e.target.value)} placeholder="恋愛・自己価値・本音との向き合い方" />
        </div>

        {/* 現在の状態 */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>現在の状態</SectionTitle>
          <textarea style={{ ...inp, minHeight: 120, resize: 'vertical' }} value={currentState} onChange={e => setCurrentState(e.target.value)} placeholder="現在の状態を入力..." />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', margin: '12px 0 5px' }}>◆ 核となるテーマ</div>
          <input style={inp} value={coreTheme} onChange={e => setCoreTheme(e.target.value)} placeholder="「明るい自分」で愛されようとしている" />
        </div>

        {/* 思考パターン */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>思考パターン分析</SectionTitle>
          {thinkingPatterns.map((p, i) => (
            <div key={i} style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: 'var(--bg3)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input style={{ ...inp, flex: 1 }} value={p.title} onChange={e => { const n = [...thinkingPatterns]; n[i] = { ...n[i], title: e.target.value }; setThinkingPatterns(n) }} placeholder={`パターン${i+1} タイトル`} />
                {thinkingPatterns.length > 1 && <button style={delBtn} onClick={() => setThinkingPatterns(thinkingPatterns.filter((_, j) => j !== i))}>削除</button>}
              </div>
              <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={p.description} onChange={e => { const n = [...thinkingPatterns]; n[i] = { ...n[i], description: e.target.value }; setThinkingPatterns(n) }} placeholder="説明..." />
            </div>
          ))}
          <button style={addBtn} onClick={() => setThinkingPatterns([...thinkingPatterns, { title: '', description: '' }])}>＋ パターンを追加</button>
        </div>

        {/* 本来の魅力 */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>本来の魅力</SectionTitle>
          {naturalStrengths.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={{ ...inp, flex: 1 }} value={s} onChange={e => { const n = [...naturalStrengths]; n[i] = e.target.value; setNaturalStrengths(n) }} placeholder={`魅力${i+1}（例：素直）`} />
              {naturalStrengths.length > 1 && <button style={delBtn} onClick={() => setNaturalStrengths(naturalStrengths.filter((_, j) => j !== i))}>削除</button>}
            </div>
          ))}
          <button style={addBtn} onClick={() => setNaturalStrengths([...naturalStrengths, ''])}>＋ 追加</button>
        </div>

        {/* 言葉の変換 */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>言葉の変換</SectionTitle>
          {wordConversions.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input style={{ ...inp, flex: 1 }} value={w.before} onChange={e => { const n = [...wordConversions]; n[i] = { ...n[i], before: e.target.value }; setWordConversions(n) }} placeholder="現在の言葉" />
              <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <input style={{ ...inp, flex: 1 }} value={w.after} onChange={e => { const n = [...wordConversions]; n[i] = { ...n[i], after: e.target.value }; setWordConversions(n) }} placeholder="変換後" />
              {wordConversions.length > 1 && <button style={delBtn} onClick={() => setWordConversions(wordConversions.filter((_, j) => j !== i))}>削除</button>}
            </div>
          ))}
          <button style={addBtn} onClick={() => setWordConversions([...wordConversions, { before: '', after: '' }])}>＋ 追加</button>
        </div>

        {/* 今後の課題 */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>今後の課題</SectionTitle>
          {challenges.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={{ ...inp, flex: 1 }} value={c} onChange={e => { const n = [...challenges]; n[i] = e.target.value; setChallenges(n) }} placeholder={`課題${i+1}`} />
              {challenges.length > 1 && <button style={delBtn} onClick={() => setChallenges(challenges.filter((_, j) => j !== i))}>削除</button>}
            </div>
          ))}
          <button style={addBtn} onClick={() => setChallenges([...challenges, ''])}>＋ 追加</button>
        </div>

        {/* 総評 */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>総評</SectionTitle>
          <textarea style={{ ...inp, minHeight: 120, resize: 'vertical' }} value={overall} onChange={e => setOverall(e.target.value)} placeholder="総評を入力..." />
        </div>

        {/* 8軸スコア */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>8軸スコア（1〜5）</SectionTitle>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              {AXES.map(axis => (
                <div key={axis} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{axis}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', minWidth: 16, textAlign: 'right' }}>{scores[axis]}</span>
                  </div>
                  <input type="range" min={1} max={5} step={1} value={scores[axis]}
                    onChange={e => setScores({ ...scores, [axis]: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
              ))}
            </div>
            <ScoreRadar scores={scores} />
          </div>
        </div>

        {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#e11d48', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        {saved && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✓ レポートを保存しました</div>}

        <button className="btn-pill" onClick={handleSave} disabled={saving || !clientCode || !theme} style={{ opacity: (!clientCode || !theme) ? 0.4 : 1 }}>
          {saving ? '保存中...' : 'レポートを保存する'}
        </button>
      </div>
    </div>
  )
}
