'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { ThinkingPattern, WordConversion, ClarityReport } from '@/lib/types'

const AXES = ['自己理解度', '感情理解度', '課題認識度', '原因理解度', '本音把握度', '方向性明確度', '自己受容度', '行動明確度'] as const
const initScores = () => Object.fromEntries(AXES.map(k => [k, 3])) as Record<string, number>

function ScoreRadar({ scores }: { scores: Record<string, number> }) {
  const cx = 130, cy = 130, maxR = 96, labelR = 116
  const n = AXES.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) })
  const dataPath = AXES.map((k, i) => {
    const p = pt((scores[k] / 5) * maxR, i)
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ') + 'Z'
  return (
    <svg width={260} height={260} viewBox="0 0 260 260" style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}>
      {[1,2,3,4,5].map(lv => {
        const pts = AXES.map((_, i) => { const p = pt((lv/5)*maxR, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
        return <polygon key={lv} points={pts} fill="none" stroke={lv===5?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.07)'} strokeWidth={lv===5?1.5:0.8} />
      })}
      {AXES.map((_, i) => { const p = pt(maxR, i); return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" /> })}
      <path d={dataPath} fill="var(--primary)" fillOpacity="0.2" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
      {AXES.map((k, i) => { const r = (scores[k]/5)*maxR; const p = pt(r, i); return <circle key={i} cx={p.x} cy={p.y} r={5} fill="var(--primary)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" /> })}
      {AXES.map((k, i) => {
        const p = pt(labelR, i)
        const short = k.replace('度', '')
        return <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="rgba(255,255,255,0.5)">{short}</text>
      })}
    </svg>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit',
  background: 'rgba(255,255,255,0.05)', color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
}
const addBtn: React.CSSProperties = {
  fontSize: 12, padding: '6px 14px', borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
  cursor: 'pointer', color: 'var(--primary)', fontFamily: 'inherit', marginTop: 4,
}
const delBtn: React.CSSProperties = {
  fontSize: 11, padding: '4px 8px', borderRadius: 6,
  border: '1px solid rgba(225,29,72,0.4)', background: 'transparent',
  cursor: 'pointer', color: '#f87171', fontFamily: 'inherit', flexShrink: 0,
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 5, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{children}</div>
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  )
}
const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: 20,
}

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

  const canSave = !!clientCode.trim() && !!theme.trim()

  return (
    <div>
      {/* ページヘッダー */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>レポート作成</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Clarity 自己分析レポート</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {error && <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>}
          {saved && <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>✓ 保存しました</div>}
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            style={{
              padding: '10px 28px', borderRadius: 24, background: canSave ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              color: canSave ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: canSave ? 'pointer' : 'not-allowed',
              fontWeight: 700, fontSize: 14, fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {saving ? '保存中...' : 'レポートを保存する'}
          </button>
        </div>
      </div>

      {/* 2カラムグリッド */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

        {/* 左列：メインフォーム */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 基本情報 */}
          <div style={card}>
            <Section title="基本情報">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <Label>会員の招待コード *</Label>
                  <input style={inp} value={clientCode} onChange={e => setClientCode(e.target.value)} placeholder="CLARITY-AYAKA" />
                </div>
                <div>
                  <Label>セッション日</Label>
                  <input type="date" style={inp} value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
                </div>
                <div>
                  <Label>テーマ *</Label>
                  <input style={inp} value={theme} onChange={e => setTheme(e.target.value)} placeholder="恋愛・自己価値" />
                </div>
              </div>
            </Section>
          </div>

          {/* 現在の状態 */}
          <div style={card}>
            <Section title="現在の状態">
              <textarea style={{ ...inp, minHeight: 140, resize: 'vertical' }} value={currentState} onChange={e => setCurrentState(e.target.value)} placeholder="現在の状態を詳しく入力..." />
              <div style={{ marginTop: 12 }}>
                <Label>◆ 核となるテーマ</Label>
                <input style={inp} value={coreTheme} onChange={e => setCoreTheme(e.target.value)} placeholder="「明るい自分」で愛されようとしている" />
              </div>
            </Section>
          </div>

          {/* 思考パターン */}
          <div style={card}>
            <Section title="思考パターン分析">
              {thinkingPatterns.map((p, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input style={{ ...inp, flex: 1 }} value={p.title} onChange={e => { const n = [...thinkingPatterns]; n[i] = { ...n[i], title: e.target.value }; setThinkingPatterns(n) }} placeholder={`パターン${i+1} タイトル`} />
                    {thinkingPatterns.length > 1 && <button type="button" style={delBtn} onClick={() => setThinkingPatterns(thinkingPatterns.filter((_, j) => j !== i))}>削除</button>}
                  </div>
                  <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={p.description} onChange={e => { const n = [...thinkingPatterns]; n[i] = { ...n[i], description: e.target.value }; setThinkingPatterns(n) }} placeholder="説明..." />
                </div>
              ))}
              <button type="button" style={addBtn} onClick={() => setThinkingPatterns([...thinkingPatterns, { title: '', description: '' }])}>＋ パターンを追加</button>
            </Section>
          </div>

          {/* 2列：本来の魅力 + 今後の課題 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <Section title="本来の魅力">
                {naturalStrengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input style={{ ...inp, flex: 1 }} value={s} onChange={e => { const n = [...naturalStrengths]; n[i] = e.target.value; setNaturalStrengths(n) }} placeholder={`魅力${i+1}`} />
                    {naturalStrengths.length > 1 && <button type="button" style={delBtn} onClick={() => setNaturalStrengths(naturalStrengths.filter((_, j) => j !== i))}>削除</button>}
                  </div>
                ))}
                <button type="button" style={addBtn} onClick={() => setNaturalStrengths([...naturalStrengths, ''])}>＋ 追加</button>
              </Section>
            </div>
            <div style={card}>
              <Section title="今後の課題">
                {challenges.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input style={{ ...inp, flex: 1 }} value={c} onChange={e => { const n = [...challenges]; n[i] = e.target.value; setChallenges(n) }} placeholder={`課題${i+1}`} />
                    {challenges.length > 1 && <button type="button" style={delBtn} onClick={() => setChallenges(challenges.filter((_, j) => j !== i))}>削除</button>}
                  </div>
                ))}
                <button type="button" style={addBtn} onClick={() => setChallenges([...challenges, ''])}>＋ 追加</button>
              </Section>
            </div>
          </div>

          {/* 言葉の変換 */}
          <div style={card}>
            <Section title="言葉の変換">
              {wordConversions.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <input style={{ ...inp, flex: 1 }} value={w.before} onChange={e => { const n = [...wordConversions]; n[i] = { ...n[i], before: e.target.value }; setWordConversions(n) }} placeholder="現在の言葉" />
                  <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0, fontSize: 18 }}>→</span>
                  <input style={{ ...inp, flex: 1 }} value={w.after} onChange={e => { const n = [...wordConversions]; n[i] = { ...n[i], after: e.target.value }; setWordConversions(n) }} placeholder="変換後" />
                  {wordConversions.length > 1 && <button type="button" style={delBtn} onClick={() => setWordConversions(wordConversions.filter((_, j) => j !== i))}>削除</button>}
                </div>
              ))}
              <button type="button" style={addBtn} onClick={() => setWordConversions([...wordConversions, { before: '', after: '' }])}>＋ 追加</button>
            </Section>
          </div>

          {/* 総評 */}
          <div style={card}>
            <Section title="総評">
              <textarea style={{ ...inp, minHeight: 160, resize: 'vertical' }} value={overall} onChange={e => setOverall(e.target.value)} placeholder="セッション全体の総評を入力..." />
            </Section>
          </div>
        </div>

        {/* 右列：スコア + 履歴 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 0 }}>

          {/* 8軸スコア */}
          <div style={card}>
            <Section title="8軸スコア（1〜5）">
              <ScoreRadar scores={scores} />
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {AXES.map(axis => (
                  <div key={axis}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{axis}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', minWidth: 16, textAlign: 'right' }}>{scores[axis]}</span>
                    </div>
                    <input type="range" min={1} max={5} step={1} value={scores[axis]}
                      aria-label={axis}
                      onChange={e => setScores({ ...scores, [axis]: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--primary)', height: 4 }} />
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* 作成済みレポート */}
          {reports.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 12, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                作成済み（{reports.length}件）
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                {reports.map(r => (
                  <div key={r.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.client_code}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{r.theme}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{r.session_date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
