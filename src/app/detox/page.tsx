
'use client'
import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Brain, ChevronRight, Flame, BarChart2 } from 'lucide-react'
import type { BrainAnalysis, BalanceKey, DetoxSession } from '@/lib/types'
import { useStore } from '@/lib/store'

const Brain3DCanvas = dynamic(() => import('@/components/Brain3DCanvas'), { ssr: false })


const NOISE_COLORS: Record<string, string> = {
  'クリア':   '#4ade80',
  '安定':     '#2dd4bf',
  '整理中':   '#7c6aef',
  '散乱':     '#fbbf24',
  '混雑':     '#f472b6',
}

const BALANCE_COLORS: Record<BalanceKey, string> = {
  '感情過多':   '#f472b6',
  'タスク過多': '#7c6aef',
  '不安過多':   '#fbbf24',
  '情報過多':   '#2dd4bf',
  '思考ループ': '#a78bfa',
  '行動不足':   '#94a3b8',
}

const STATE_DESCRIPTIONS: Record<string, string> = {
  'クリア':   '頭の中が整理されており、集中力・判断力ともに高い状態です。今がいちばん動きやすいタイミング。',
  '安定':     '思考がまとまっており、落ち着いて物事に取り組める状態です。少し整理するとさらに良くなります。',
  '整理中':   '情報を処理しようとしているところです。書き出すほど頭が軽くなる状態です。',
  '散乱':     '複数の思考が混在し、優先度が見えにくくなっています。いちばん気になることを1つだけ選ぶのが有効です。',
  '混雑':     '情報・感情・タスクが重なり、判断力が落ちやすい状態です。まず頭を空にすることを優先しましょう。',
}

const BALANCE_DESCRIPTIONS: Record<BalanceKey, string> = {
  '感情過多':   '感情的な言葉や表現が多く、気持ちが先行しています。感情を「観察」する視点が有効です。',
  'タスク過多': '「やらなければ」「〜する必要がある」という思考が多く見られます。タスクを書き出して可視化しましょう。',
  '不安過多':   '未来への心配や「もし〜だったら」という思考パターンが多い。今できることに絞ると楽になります。',
  '情報過多':   '多くの情報や事実を同時に処理しようとしています。インプットを一時停止するのが効果的です。',
  '思考ループ': '同じ内容を繰り返し考えるパターンが見られます。思考を外に出す（書く・話す）ことで解消します。',
  '行動不足':   '停滞感や「動けない」という感覚が見られます。0か100ではなく、1%の小さな一歩が突破口になります。',
}

function noiseLevelLabel(n: number): { label: string; color: string } {
  if (n <= 20) return { label: '非常に静か', color: '#4ade80' }
  if (n <= 40) return { label: '落ち着いている', color: '#2dd4bf' }
  if (n <= 60) return { label: 'やや混雑', color: '#7c6aef' }
  if (n <= 75) return { label: 'かなり混雑', color: '#fbbf24' }
  return { label: '高負荷状態', color: '#f472b6' }
}

function clarityLabel(n: number): string {
  if (n >= 80) return '非常にクリア'
  if (n >= 60) return 'クリア'
  if (n >= 40) return 'やや濁り'
  if (n >= 20) return '要整理'
  return '混濁'
}

const DEMO_ANALYSIS: BrainAnalysis = {
  noise_level: 72,
  noise_state: '散乱',
  balance: {
    '感情過多': 65,
    'タスク過多': 80,
    '不安過多': 55,
    '情報過多': 40,
    '思考ループ': 70,
    '行動不足': 30,
  },
  dominant: 'タスク過多',
  summary: '頭の中にタスクと思考ループが混在しており、かなり散乱した状態です。一つひとつ書き出すことで整理できます。',
  advice: 'まず「今日やること」を3つだけ選んでみてください。残りは一旦脇に置きましょう。',
  clarity_score: 28,
}

function BrainGauge({ level, state }: { level: number; state: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setDisplay(level), 60)
    return () => clearTimeout(t)
  }, [level])

  const color = NOISE_COLORS[state] ?? '#7c6aef'
  const act   = display / 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 280, height: 280 }}>
        {/* 脳キャンバス — 中央配置 */}
        <div style={{ position: 'absolute', top: 26, left: 26, width: 228, height: 228 }}>
          <Brain3DCanvas color={color} act={act} />
        </div>

        {/* スコアオーバーレイ（脳の中央） */}
        <div style={{
          position: 'absolute', top: 26, left: 26, width: 228, height: 228,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1,
            textShadow: `0 0 24px ${color}, 0 0 60px ${color}66, 0 2px 8px rgba(0,0,0,0.99)`,
          }}>
            {level}
          </div>
          <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 6, letterSpacing: '0.14em', textShadow: `0 0 14px ${color}` }}>
            NOISE
          </div>
        </div>
      </div>

      <div style={{
        padding: '6px 28px', borderRadius: 24,
        background: `${color}12`, color, fontSize: 15, fontWeight: 700,
        border: `1px solid ${color}44`, letterSpacing: '0.5px',
        boxShadow: `0 0 18px ${color}28`,
      }}>
        {state}
      </div>
    </div>
  )
}

function BalanceMap({ balance, dominant, isDark, fillColor }: {
  balance: Record<BalanceKey, number>
  dominant: BalanceKey | null
  isDark: boolean
  fillColor?: string
}) {
  const keys = Object.keys(balance) as BalanceKey[]
  const cx = 140, cy = 130, maxR = 96, labelR = 124
  const n = keys.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) })
  const gridColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const fill = dominant ? BALANCE_COLORS[dominant] : (fillColor ?? '#7c6aef')
  const dataPath = keys.map((k, i) => {
    const p = pt((balance[k] / 100) * maxR, i)
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ') + 'Z'
  // 高負荷ゾーン(70%)の多角形
  const dangerPts = keys.map((_, i) => { const p = pt(0.70 * maxR, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')

  return (
    <svg viewBox="0 0 280 260" style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={fill} stopOpacity="0.42" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.07" />
        </radialGradient>
      </defs>

      {/* グリッド多角形 */}
      {[25, 50, 75, 100].map(lv => {
        const pts = keys.map((_, i) => { const p = pt((lv / 100) * maxR, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
        return <polygon key={lv} points={pts} fill="none" stroke={gridColor} strokeWidth={lv === 100 ? 1.4 : 0.7} />
      })}

      {/* 高負荷ゾーン(70%以上)の網掛け */}
      <polygon points={dangerPts} fill="rgba(239,68,68,0.07)" stroke="rgba(239,68,68,0.28)" strokeWidth={0.9} strokeDasharray="4 2" />

      {/* グリッドラベル */}
      {[25, 50, 75].map(lv => (
        <text key={lv} x={cx + 4} y={cy - (lv / 100) * maxR - 3} fontSize={8}
          fill={lv === 75 ? 'rgba(239,68,68,0.55)' : (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)')}
          textAnchor="start" fontWeight={lv === 75 ? 700 : 400}>
          {lv === 75 ? '高負荷' : lv}
        </text>
      ))}

      {/* 軸線 — カテゴリ色 */}
      {keys.map((k, i) => {
        const p = pt(maxR, i)
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)}
          stroke={BALANCE_COLORS[k]} strokeWidth={0.7} opacity={0.35} />
      })}

      {/* データエリア */}
      <path d={dataPath} fill="url(#radarFill)" stroke={fill} strokeWidth={2.5} strokeLinejoin="round" />

      {/* データポイント — カテゴリ色 */}
      {keys.map((k, i) => {
        const r = (balance[k] / 100) * maxR
        const p = pt(r, i)
        const color = BALANCE_COLORS[k]
        const isMain = k === dominant
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={isMain ? 7 : 5} fill={color} stroke={isDark ? '#08090f' : '#fff'} strokeWidth={2} />
            {isMain && <circle cx={p.x} cy={p.y} r={12} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />}
            {balance[k] >= 70 && !isMain && (
              <circle cx={p.x} cy={p.y} r={8} fill="none" stroke="rgba(239,68,68,0.5)" strokeWidth={1} />
            )}
          </g>
        )
      })}

      {/* ラベル — フルネーム・カテゴリ色 */}
      {keys.map((k, i) => {
        const p = pt(labelR, i)
        const isMain = k === dominant
        const color = isMain ? BALANCE_COLORS[k] : (isDark ? 'rgba(255,255,255,0.52)' : '#4a4a60')
        return (
          <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle"
            fontSize={isMain ? 11 : 9.5} fontWeight={isMain ? 800 : 500} fill={color}>
            {k}
          </text>
        )
      })}
    </svg>
  )
}

function CategoryAnalysis({ balance, dominant, isDark }: { balance: Record<BalanceKey, number>; dominant: BalanceKey | null; isDark: boolean }) {
  const sorted = (Object.entries(balance) as [BalanceKey, number][]).sort(([, a], [, b]) => b - a)
  const defaultBg  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  const defaultBdr = 'transparent'

  return (
    <div className="ca-grid">
      {sorted.map(([key, val]) => {
        const color  = BALANCE_COLORS[key]
        const isMain = key === dominant
        const lv = val >= 70
          ? { label: '高い', bg: 'rgba(239,68,68,0.14)', color: '#f87171' }
          : val >= 40
          ? { label: '普通', bg: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)' }
          : { label: '低い', bg: 'rgba(74,222,128,0.12)', color: '#4ade80' }
        return (
          <div key={key} className="ca-item" style={{
            background: isMain ? `${color}0d` : defaultBg,
            border: `1px solid ${isMain ? `${color}28` : defaultBdr}`,
          }}>
            <div className="ca-item-head">
              <div className="ca-item-labels">
                <span className="ca-item-name" style={{ fontWeight: isMain ? 700 : 500, color: isMain ? color : (isDark ? 'rgba(255,255,255,0.68)' : '#4a4a60') }}>
                  {key}
                </span>
                {isMain && (
                  <span className="ca-badge-main" style={{ color, background: `${color}1a`, border: `1px solid ${color}35` }}>
                    主要因
                  </span>
                )}
                <span className="ca-badge-level" style={{ color: lv.color, background: lv.bg }}>
                  {lv.label}
                </span>
              </div>
              <span className="ca-score" style={{ color }}>{val}</span>
            </div>
            <div className="ca-bar-track" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#eff0f6' }}>
              <div className="ca-bar-fill" style={{ width: `${val}%`, background: color, opacity: isMain ? 1 : 0.55 }} />
            </div>
            <p className="ca-desc">{BALANCE_DESCRIPTIONS[key]}</p>
          </div>
        )
      })}
    </div>
  )
}


// ─── 記録タブ用コンポーネント ──────────────────────────────────────────

const NOISE_COLORS_HUB: Record<string, string> = {
  'クリア': '#16a34a', '安定': '#0891b2', '整理中': '#6366f1',
  '散乱': '#d97706', '混雑': '#e11d48',
}
const DAY_LABELS_HUB = ['日', '月', '火', '水', '木', '金', '土']

function calcStreak(ss: DetoxSession[]) {
  if (!ss.length) return 0
  const dates = new Set(ss.map(s => s.created_at.split('T')[0]))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 366; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    if (dates.has(d.toISOString().split('T')[0])) streak++
    else if (streak > 0) break
  }
  return streak
}

function HubScoreRing({ score, noSession }: { score: number; noSession?: boolean }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => { const t = setTimeout(() => setDisplay(score), 150); return () => clearTimeout(t) }, [score])
  const R = 72, CIRC = 2 * Math.PI * R
  const offset = CIRC - (display / 100) * CIRC
  return (
    <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
      <svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={90} cy={90} r={R} fill="none" stroke="var(--primary-lt)" strokeWidth={12} />
        <circle cx={90} cy={90} r={R} fill="none" stroke="var(--primary)" strokeWidth={12} strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Brain size={18} color="var(--primary)" strokeWidth={1.4} style={{ opacity: 0.7 }} />
        {noSession
          ? <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.6, marginTop: 4 }}>まだ<br />未記録</div>
          : <><div style={{ fontSize: 44, fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-2px' }}>{display}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>/100</div></>
        }
      </div>
    </div>
  )
}

function HubWeekBars({ sessions }: { sessions: DetoxSession[] }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const bars = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    const s = sessions.find(sx => sx.created_at.startsWith(key))
    return { label: DAY_LABELS_HUB[d.getDay()], isToday: key === todayStr, session: s }
  }), [sessions, todayStr])
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 72 }}>
      {bars.map(({ label, isToday, session }, i) => {
        const score = session?.analysis.clarity_score ?? 0
        const h = session ? Math.max(8, (score / 100) * 52) : 4
        const color = isToday ? 'var(--primary)' : session ? (NOISE_COLORS_HUB[session.analysis.noise_state] ?? 'var(--primary)') : 'var(--bg4)'
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ width: '100%', height: 52, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ width: '100%', height: h, borderRadius: '5px 5px 2px 2px', background: color, opacity: isToday ? 1 : session ? 0.75 : 1, transition: 'height 0.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
            </div>
            <div style={{ fontSize: 10, color: isToday ? 'var(--primary)' : 'var(--text-faint)', fontWeight: isToday ? 700 : 400 }}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DetoxPage() {
  const { addSession, sessions } = useStore()
  const router = useRouter()
  const [hubTab, setHubTab] = useState<'detox' | 'records' | 'analysis'>('detox')
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<BrainAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const charCount = text.length

  const today = new Date().toISOString().split('T')[0]
  const todaySession = sessions.find(s => s.created_at.startsWith(today))
  const streak = useMemo(() => calcStreak(sessions), [sessions])
  const avgScore = sessions.length
    ? Math.round(sessions.slice(0, 10).reduce((a, s) => a + s.analysis.clarity_score, 0) / Math.min(sessions.length, 10))
    : null
  const avgBalance = useMemo(() => {
    if (!sessions.length) return null
    const keys = Object.keys(BALANCE_COLORS) as BalanceKey[]
    return keys.reduce<Record<BalanceKey, number>>((acc, k) => {
      acc[k] = Math.round(sessions.reduce((s, sess) => s + (sess.analysis.balance[k] ?? 0), 0) / sessions.length)
      return acc
    }, {} as Record<BalanceKey, number>)
  }, [sessions])

  function handleDemo() {
    setAnalysis(DEMO_ANALYSIS)
    setError('')
  }

  function handleSave() {
    if (!analysis) return
    addSession(text, analysis)
    router.push('/')
  }

  async function handleAnalyze() {
    if (!text.trim() || loading) return
    setLoading(true)
    setError('')
    setAnalysis(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysis(data.analysis)
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setText('')
    setAnalysis(null)
    setError('')
  }

  const stateColor = NOISE_COLORS[analysis?.noise_state ?? ''] ?? '#6366f1'

  if (analysis) {
    return (
      <div className="sr-wrap">
        <style>{`
          /* ─── Result Screen ─────────────────────────────── */
          .sr-wrap { background: #0d0f1a; min-height: 100vh; }

          /* Header */
          .sr-hdr { background: #0d0f1a; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 20px 20px 16px; }
          .sr-hdr-in { max-width: 800px; margin: 0 auto; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
          .sr-section-label { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.3); letter-spacing: 2.5px; text-transform: uppercase; }
          .sr-state-name { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
          .sr-hdr-time { font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 500; }
          .sr-cs-num { font-size: 40px; font-weight: 900; line-height: 1; letter-spacing: -2px; }
          .sr-cs-denom { font-size: 13px; color: rgba(255,255,255,0.3); font-weight: 600; }

          /* Body */
          .sr-body { max-width: 800px; margin: 0 auto; padding: 14px 16px 80px; display: flex; flex-direction: column; gap: 10px; }

          /* Cards */
          .sr-card { background: #161820; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px; }
          .sr-card-head { margin-bottom: 12px; }
          .sr-card-head p { font-size: 10.5px; color: rgba(255,255,255,0.25); margin: 3px 0 0; line-height: 1.5; }

          /* Brain row */
          .sr-brain-row { display: flex; gap: 18px; flex-wrap: wrap; align-items: flex-start; }
          .sr-brain-side { flex-shrink: 0; display: flex; justify-content: center; }
          .sr-stat-side { flex: 1; min-width: 200px; }

          /* 段落テキスト共通 */
          .sr-paras { margin: 0 0 14px; }
          .sr-paras p { font-size: 12px; line-height: 1.75; margin: 0 0 0.9em; }
          .sr-paras p:last-child { margin-bottom: 0; }
          .sr-paras-body { margin: 0 0 14px; }
          .sr-paras-body p { font-size: 12.5px; color: rgba(255,255,255,0.75); line-height: 1.75; margin: 0 0 0.9em; }
          .sr-paras-body p:last-child { margin-bottom: 0; }

          .sr-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
          .sr-mini-box { background: rgba(255,255,255,0.045); border-radius: 9px; padding: 9px 11px; }
          .sr-mini-key { font-size: 8.5px; color: rgba(255,255,255,0.28); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
          .sr-mini-val { font-size: 20px; font-weight: 800; line-height: 1; }
          .sr-mini-sub { font-size: 10px; margin-top: 4px; font-weight: 600; }
          .sr-dominant { padding: 10px 12px; border-radius: 9px; }
          .sr-dominant-row { display: flex; justify-content: space-between; align-items: center; margin: 4px 0 4px; }
          .sr-dominant-name { font-size: 13px; font-weight: 700; }
          .sr-dominant-score { font-size: 18px; font-weight: 800; }
          .sr-dominant-desc { font-size: 11px; color: rgba(255,255,255,0.42); margin: 0; line-height: 1.6; }

          /* Category grid */
          .ca-grid { display: flex; flex-direction: column; gap: 8px; }
          .ca-item { padding: 10px 12px; border-radius: 10px; }
          .ca-item-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
          .ca-item-labels { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
          .ca-item-name { font-size: 12px; }
          .ca-badge-main { font-size: 8.5px; font-weight: 800; border-radius: 5px; padding: 2px 6px; }
          .ca-badge-level { font-size: 8.5px; font-weight: 700; border-radius: 5px; padding: 2px 6px; }
          .ca-score { font-size: 16px; font-weight: 800; }
          .ca-bar-track { height: 4px; border-radius: 3px; margin-bottom: 7px; }
          .ca-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }
          .ca-desc { font-size: 11px; margin: 0; line-height: 1.65; color: rgba(255,255,255,0.38); }

          /* Advice */
          .sr-advice-intro { font-size: 11px; color: rgba(255,255,255,0.3); margin: 3px 0 14px; line-height: 1.6; }
          .sr-advice-list { display: flex; flex-direction: column; gap: 12px; }
          .sr-advice-item { display: flex; gap: 11px; align-items: flex-start; }
          .sr-advice-num { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; font-size: 9px; font-weight: 800; }
          .sr-advice-text { font-size: 12.5px; color: rgba(255,255,255,0.82); line-height: 1.85; margin: 0; }

          /* Buttons */
          .sr-btn-row { display: flex; gap: 10px; padding-top: 4px; }
          .sr-btn-reset { flex: 1; padding: 12px 0; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.55); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
          .sr-btn-save { flex: 2; padding: 12px 0; border-radius: 10px; background: #4f46e5; border: none; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.15s; }
          .sr-btn-save:hover { background: #5b52f5; }

          /* PC (640px+) */
          @media (min-width: 640px) {
            .sr-hdr { padding: 24px 32px 20px; }
            .sr-state-name { font-size: 26px; }
            .sr-cs-num { font-size: 48px; }
            .sr-cs-denom { font-size: 15px; }
            .sr-body { padding: 18px 32px 80px; gap: 12px; }
            .sr-card { padding: 20px 24px; border-radius: 16px; }
            .sr-paras p { font-size: 12.5px; }
            .sr-paras-body p { font-size: 13.5px; }
            .sr-mini-val { font-size: 22px; }
            .sr-dominant-name { font-size: 14px; }
            .sr-dominant-score { font-size: 20px; }
            .sr-dominant-desc { font-size: 11.5px; }
            .ca-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .ca-item-name { font-size: 12.5px; }
            .ca-score { font-size: 17px; }
            .ca-desc { font-size: 11.5px; }
            .sr-advice-intro { font-size: 11.5px; }
            .sr-advice-text { font-size: 13.5px; }
            .sr-btn-reset, .sr-btn-save { font-size: 14px; padding: 13px 0; }
          }

          /* Very small phones */
          @media (max-width: 360px) {
            .sr-hdr-in { flex-direction: column; align-items: flex-start; }
            .sr-stat-side { min-width: 100%; }
            .sr-cs-num { font-size: 34px; }
          }

          @keyframes dtSpin { to { transform: rotate(360deg) } }
        `}</style>

        {/* ── 結果ヘッダー ── */}
        <div className="sr-hdr">
          <div className="sr-hdr-in">
            <div>
              <div className="sr-section-label" style={{ marginBottom: 8 }}>Brain Scan Result</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="sr-state-name" style={{ color: stateColor }}>{analysis.noise_state}</span>
                <span className="sr-hdr-time">
                  {new Date().toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="sr-section-label" style={{ marginBottom: 5 }}>Clarity Score</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="sr-cs-num" style={{ color: stateColor }}>{analysis.clarity_score}</span>
                <span className="sr-cs-denom">/100</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sr-body">

          {/* ── 脳ゲージ + 状態詳細 ── */}
          <div className="sr-card">
            <div className="sr-brain-row">
              <div className="sr-brain-side">
                <BrainGauge level={analysis.noise_level} state={analysis.noise_state} />
              </div>
              <div className="sr-stat-side">
                <div className="sr-section-label" style={{ marginBottom: 10 }}>Status</div>

                <div className="sr-paras">
                  {STATE_DESCRIPTIONS[analysis.noise_state].split('。').filter(Boolean).map((s, i) => (
                    <p key={i} style={{ color: stateColor, opacity: 0.9 }}>{s}。</p>
                  ))}
                </div>

                <div className="sr-paras-body">
                  {analysis.summary.split('。').filter(Boolean).map((s, i) => (
                    <p key={i}>{s}。</p>
                  ))}
                </div>

                <div className="sr-mini-grid">
                  <div className="sr-mini-box">
                    <div className="sr-mini-key">Noise Level</div>
                    <div className="sr-mini-val" style={{ color: stateColor }}>{analysis.noise_level}</div>
                    <div className="sr-mini-sub" style={{ color: noiseLevelLabel(analysis.noise_level).color }}>
                      {noiseLevelLabel(analysis.noise_level).label}
                    </div>
                  </div>
                  <div className="sr-mini-box">
                    <div className="sr-mini-key">Clarity</div>
                    <div className="sr-mini-val" style={{ color: '#4ade80' }}>{analysis.clarity_score}</div>
                    <div className="sr-mini-sub" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {clarityLabel(analysis.clarity_score)}
                    </div>
                  </div>
                </div>

                {analysis.dominant && (
                  <div className="sr-dominant" style={{ background: `${BALANCE_COLORS[analysis.dominant]}0e`, border: `1px solid ${BALANCE_COLORS[analysis.dominant]}25` }}>
                    <div className="sr-section-label">主要因</div>
                    <div className="sr-dominant-row">
                      <span className="sr-dominant-name" style={{ color: BALANCE_COLORS[analysis.dominant] }}>{analysis.dominant}</span>
                      <span className="sr-dominant-score" style={{ color: BALANCE_COLORS[analysis.dominant] }}>{analysis.balance[analysis.dominant]}</span>
                    </div>
                    <p className="sr-dominant-desc">{BALANCE_DESCRIPTIONS[analysis.dominant]}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── カテゴリ分析 ── */}
          <div className="sr-card">
            <div className="sr-card-head">
              <div className="sr-section-label">Category Analysis</div>
            </div>
            <CategoryAnalysis balance={analysis.balance} dominant={analysis.dominant} isDark={true} />
          </div>

          {/* ── バランスマップ ── */}
          <div className="sr-card">
            <div className="sr-card-head">
              <div className="sr-section-label">Balance Map</div>
              <p>赤い破線より外側が高負荷ゾーンです</p>
            </div>
            <BalanceMap balance={analysis.balance} dominant={analysis.dominant} isDark={true} fillColor={stateColor} />
          </div>

          {/* ── AIアドバイス ── */}
          <div className="sr-card" style={{ borderLeft: `3px solid ${stateColor}` }}>
            <div className="sr-section-label" style={{ color: stateColor, opacity: 0.85 }}>AI Advice</div>
            <p className="sr-advice-intro">あなたが書いた内容をもとにした、今この瞬間へのアドバイスです</p>
            <div className="sr-advice-list">
              {analysis.advice.split('。').filter(s => s.trim()).map((s, i) => (
                <div key={i} className="sr-advice-item">
                  <div className="sr-advice-num" style={{ background: `${stateColor}18`, border: `1px solid ${stateColor}38`, color: stateColor }}>
                    {i + 1}
                  </div>
                  <p className="sr-advice-text">{s}。</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── ボタン ── */}
          <div className="sr-btn-row">
            <button type="button" onClick={handleReset} className="sr-btn-reset">もう一度書く</button>
            <button type="button" onClick={handleSave} className="sr-btn-save">完了・保存</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── タブバー ── */}
      <div className="page-tab-bar">
        <button type="button" className={`page-tab-btn${hubTab === 'detox' ? ' active' : ''}`} onClick={() => setHubTab('detox')}>デトックス</button>
        <button type="button" className={`page-tab-btn${hubTab === 'records' ? ' active' : ''}`} onClick={() => setHubTab('records')}>記録</button>
        <button type="button" className={`page-tab-btn${hubTab === 'analysis' ? ' active' : ''}`} onClick={() => setHubTab('analysis')}>分析</button>
      </div>

      {/* ── デトックスタブ ── */}
      {hubTab === 'detox' && (
        <div style={{ minHeight: 'calc(100vh - 48px)', background: '#0d0f1a' }}>

          {/* ヘッダー */}
          <div style={{ padding: '36px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Brain Detox</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#f0f1f8', letterSpacing: '-0.5px', marginBottom: 8 }}>脳内デトックス</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.75, margin: 0 }}>
                頭の中にあることを、そのまま書き出してください。判断しなくて大丈夫です。
              </p>
            </div>
          </div>

          {/* 入力エリア */}
          <div style={{ padding: '20px 16px 40px', maxWidth: 600, margin: '0 auto' }}>
            <div style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
              <textarea
                placeholder={'今、頭の中にあることを自由に書いてください\n\n例：明日の会議が心配。タスクが溜まっている気がする。あの件どうなったっけ...'}
                value={text}
                onChange={e => setText(e.target.value)}
                style={{ width: '100%', minHeight: 260, fontSize: 15, lineHeight: 1.85, background: 'transparent', border: 'none', outline: 'none', color: '#e8eaf0', fontFamily: 'inherit', resize: 'none', padding: '20px 20px 0', boxSizing: 'border-box' }}
                autoFocus
              />
              <div style={{ padding: '14px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 14 }}>
                <span style={{ fontSize: 12, color: charCount > 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums' }}>
                  {charCount > 0 ? `${charCount} 文字` : '20文字以上で精度が上がります'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={handleDemo}
                    style={{ fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    デモ
                  </button>
                  <button type="button" onClick={handleAnalyze} disabled={loading || text.trim().length < 5}
                    style={{ fontSize: 13, fontWeight: 700, cursor: text.trim().length < 5 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', padding: '8px 20px', borderRadius: 8, background: text.trim().length < 5 ? 'rgba(99,102,241,0.2)' : '#4f46e5', border: 'none', color: text.trim().length < 5 ? 'rgba(255,255,255,0.3)' : '#fff', display: 'flex', alignItems: 'center', gap: 7, transition: 'background 0.15s' }}>
                    {loading
                      ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'dtSpin 0.8s linear infinite', display: 'inline-block' }} />分析中</>
                      : <>分析する</>}
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
          </div>
          <style>{`@keyframes dtSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── 記録タブ ── */}
      {hubTab === 'records' && (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 14, lineHeight: 2 }}>
              まだ記録がありません。<br />「デトックス」タブからセッションを始めましょう。
            </div>
          ) : (
            <>
              {/* コンディションカード */}
              <div className="card" style={{ padding: '18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>今日のコンディション</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <HubScoreRing score={todaySession?.analysis.clarity_score ?? 0} noSession={!todaySession} />
                  <div style={{ flex: 1 }}>
                    {todaySession ? (
                      <>
                        <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'var(--primary-lt)', color: 'var(--primary)', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                          {todaySession.analysis.noise_state}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7, marginBottom: 12 }}>{todaySession.analysis.summary}</p>
                      </>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.6, marginBottom: 12 }}>今日はまだ未記録です</p>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg3)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
                        <Flame size={11} color="var(--primary)" />
                        <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{streak}日連続</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg3)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
                        <BarChart2 size={11} color="var(--primary)" />
                        <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{sessions.length}回</span>
                      </div>
                    </div>
                  </div>
                </div>
                {todaySession && (
                  <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'var(--primary-lt)', borderLeft: '3px solid var(--primary)', fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7 }}>
                    {todaySession.analysis.advice}
                  </div>
                )}
              </div>

              {/* 週間スコア */}
              <div className="card" style={{ padding: '18px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>週間スコア</div>
                <HubWeekBars sessions={sessions} />
              </div>

              {/* 直近の記録 */}
              <div className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>直近の記録</div>
                  <Link href="/history" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                    すべて <ChevronRight size={13} />
                  </Link>
                </div>
                {sessions.slice(0, 3).map((s, i) => {
                  const c = NOISE_COLORS_HUB[s.analysis.noise_state] ?? '#6366f1'
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${c}15`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: c, lineHeight: 1 }}>{s.analysis.clarity_score}</div>
                        <div style={{ fontSize: 8, color: c, fontWeight: 600 }}>pt</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                          <span style={{ padding: '2px 10px', borderRadius: 20, background: `${c}15`, color: c, fontSize: 11, fontWeight: 700 }}>{s.analysis.noise_state}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                          {new Date(s.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
          <div style={{ height: 8 }} />
        </div>
      )}

      {/* ── 分析タブ ── */}
      {hubTab === 'analysis' && (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
          {!avgBalance ? (
            <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 14, lineHeight: 2 }}>
              記録を積み重ねると分析が表示されます
            </div>
          ) : (
            <>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>過去10回の平均スコア</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: 'var(--primary)', lineHeight: 1, letterSpacing: '-2px' }}>{avgScore ?? '--'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 6 }}>/100</div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>バランスマップ（平均）</div>
                <BalanceMap balance={avgBalance} dominant={null} isDark={false} />
              </div>
            </>
          )}
          <div style={{ height: 8 }} />
        </div>
      )}
    </div>
  )
}
