
'use client'
import { useState, useEffect, useId, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Brain, ChevronRight, Flame, BarChart2 } from 'lucide-react'
import type { BrainAnalysis, BalanceKey, DetoxSession } from '@/lib/types'
import { useStore } from '@/lib/store'


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
  const uid    = useId()
  const clipId = `bc${uid.replace(/[^a-zA-Z0-9]/g, '')}`
  const glowId = `bg${uid.replace(/[^a-zA-Z0-9]/g, '')}`
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setDisplay(level), 60)
    return () => clearTimeout(t)
  }, [level])

  const color = NOISE_COLORS[state] ?? '#7c6aef'
  const act   = display / 100   // 0..1

  // 脳幹付き・縦溝強調の脳シルエット（お尻に見えない形）
  const outerPath = [
    'M 80,20',                         // 上部の縦溝（深め）
    'C 85,10 103,4 118,6',             // 右半球上部の内斜面
    'C 132,4 146,16 150,30',           // 右上外側
    'C 155,44 154,62 150,76',          // 右上側面
    'C 148,90 142,104 132,114',        // 右下側面
    'C 120,126 106,132 92,135',        // 右下
    'C 87,137 84,140 82,146',          // 右→脳幹
    'C 81,150 80,155 80,155',          // 脳幹先端
    'C 80,155 79,150 78,146',          // 脳幹左
    'C 76,140 73,137 68,135',          // 左から脳幹
    'C 54,132 40,126 28,114',          // 左下
    'C 18,104 12,90 10,76',            // 左下側面
    'C 6,62 5,44 10,30',              // 左上側面
    'C 14,16 28,4 42,6',              // 左上外側
    'C 57,4 75,10 80,20 Z',           // 左半球上部の内斜面
  ].join(' ')

  // ニューロン（ノード）座標 — 脳幹付きシルエットに合わせて配置
  const nodes: [number, number][] = [
    // 右半球
    [100,18],[120,14],[140,26],
    [104,36],[126,38],[148,50],
    [92,52],[116,54],[140,64],
    [96,70],[120,74],[146,78],
    [100,90],[124,94],[142,98],
    [106,108],[128,112],[138,118],
    [112,122],[130,126],
    // 左半球
    [60,18],[40,14],[20,26],
    [56,36],[34,38],[12,50],
    [68,52],[44,54],[20,64],
    [64,70],[40,74],[14,78],
    [60,90],[36,94],[18,98],
    [54,108],[32,112],[22,118],
    [48,122],[30,126],
  ]

  // シナプス接続（右半球0-19、左半球20-39）
  const edges: [number, number][] = [
    // 右半球内
    [0,1],[1,2],[0,3],[1,3],[1,4],[2,4],[2,5],
    [3,6],[4,6],[4,7],[5,7],[5,8],
    [6,9],[7,9],[7,10],[8,10],[8,11],
    [9,12],[10,12],[10,13],[11,13],[11,14],
    [12,15],[13,15],[13,16],[14,16],[14,17],
    [15,18],[16,18],[16,19],[17,19],
    [18,19],
    // 左半球内
    [20,21],[21,22],[20,23],[21,23],[21,24],[22,24],[22,25],
    [23,26],[24,26],[24,27],[25,27],[25,28],
    [26,29],[27,29],[27,30],[28,30],[28,31],
    [29,32],[30,32],[30,33],[31,33],[31,34],
    [32,35],[33,35],[33,36],[34,36],[34,37],
    [35,38],[36,38],[36,39],[37,39],
    [38,39],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 240, height: 252 }}>
        <svg width={240} height={252} viewBox="0 0 160 168">
          <defs>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id={`${glowId}h`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="7" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <clipPath id={clipId}><path d={outerPath}/></clipPath>
          </defs>

          {/* 脳内部：深い暗闇 */}
          <path d={outerPath} fill="#020310"/>
          {/* 大脳縦裂（中央の溝） */}
          <path d="M 80,20 C 78,36 78,56 80,76 C 82,96 80,112 80,120"
            fill="none" stroke={color} strokeWidth={2}
            strokeOpacity={0.15 + act * 0.25} strokeLinecap="round"/>
          {/* 脳幹 */}
          <path d="M 76,138 C 74,144 74,150 76,155 L 84,155 C 86,150 86,144 84,138 Z"
            fill="#020310" stroke={color} strokeWidth={1} strokeOpacity={0.3 + act * 0.3}/>

          {/* ─── ニューラルネットワーク（クリップ内） ─── */}
          <g clipPath={`url(#${clipId})`}>

            {/* シナプス接続ライン + 信号パーティクル */}
            {edges.map(([a, b], i) => {
              const [x1, y1] = nodes[a], [x2, y2] = nodes[b]
              const dur   = 1.2 + (i % 6) * 0.32
              const delay = (i % 13) * 0.18
              return (
                <g key={i}>
                  {/* 常時表示の薄いベースライン */}
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={color} strokeWidth={0.45}
                    strokeOpacity={0.08 + act * 0.26}/>
                  {/* 走る信号（半数のエッジに） */}
                  {i % 2 === 0 && (
                    <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={color} strokeWidth={1.5}
                      strokeDasharray="3 300"
                      strokeOpacity={0.5 + act * 0.4}
                      filter={`url(#${glowId})`}
                      style={{ animation: `flowN ${dur}s ${delay}s linear infinite` }}/>
                  )}
                </g>
              )
            })}

            {/* ニューロンノード */}
            {nodes.map(([x, y], i) => {
              const tier  = i % 5 === 0 ? 'A' : i % 3 === 0 ? 'B' : 'C'
              const r     = tier === 'A' ? 2.4 : tier === 'B' ? 1.7 : 1.1
              const dur   = 1.0 + (i % 7) * 0.28
              const delay = (i % 11) * 0.17
              const baseOp = tier === 'A' ? 0.55 : tier === 'B' ? 0.35 : 0.2
              return (
                <g key={i} filter={`url(#${glowId})`}>
                  {/* リップル（Aノードのみ） */}
                  {tier === 'A' && (
                    <circle cx={x} cy={y} r={5} fill="none" stroke={color} strokeWidth={0.7}
                      style={{
                        transformOrigin: `${x}px ${y}px`,
                        animation: `rippleN ${dur * 1.9}s ${delay}s ease-out infinite`,
                        opacity: 0.25 + act * 0.5,
                      }}/>
                  )}
                  {/* コアドット */}
                  <circle cx={x} cy={y} r={r} fill={color}
                    style={{
                      transformOrigin: `${x}px ${y}px`,
                      animation: `pulseN ${dur}s ${delay}s ease-in-out infinite`,
                      opacity: baseOp + act * 0.45,
                    }}/>
                </g>
              )
            })}
          </g>

          {/* 外枠グロー */}
          <path d={outerPath} fill="none" stroke={color} strokeWidth={1.5}
            opacity={0.4 + act * 0.4} filter={`url(#${glowId})`}/>
          <path d={outerPath} fill="none" stroke={color} strokeWidth={6}
            opacity={0.05 + act * 0.08} filter={`url(#${glowId}h)`}/>
        </svg>

        {/* スコアオーバーレイ */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{
            fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1,
            textShadow: `0 0 22px ${color}, 0 0 55px ${color}55, 0 2px 8px rgba(0,0,0,0.98)`,
          }}>
            {level}
          </div>
          <div style={{
            fontSize: 12, color, fontWeight: 700, marginTop: 6,
            letterSpacing: '0.1em', textShadow: `0 0 14px ${color}`,
          }}>
            ノイズ量
          </div>
        </div>
      </div>

      <div style={{
        padding: '7px 28px', borderRadius: 24,
        background: `${color}14`, color, fontSize: 16, fontWeight: 700,
        border: `1px solid ${color}44`, letterSpacing: '0.5px',
        boxShadow: `0 0 18px ${color}28`,
      }}>
        {state}
      </div>

      <style>{`
        @keyframes flowN {
          from { stroke-dashoffset: 0;    }
          to   { stroke-dashoffset: -303; }
        }
        @keyframes pulseN {
          0%, 100% { transform: scale(0.7);  }
          50%       { transform: scale(1.5);  }
        }
        @keyframes rippleN {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(4.5); opacity: 0;   }
        }
      `}</style>
    </div>
  )
}

function BalanceMap({ balance, dominant, isDark }: { balance: Record<BalanceKey, number>; dominant: BalanceKey | null; isDark: boolean }) {
  const keys = Object.keys(balance) as BalanceKey[]
  const sorted = [...keys].sort((a, b) => balance[b] - balance[a])

  // Radar
  const cx = 130, cy = 120, maxR = 82, labelR = 106
  const n = keys.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) })
  const gridColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const dataPath = keys.map((k, i) => {
    const p = pt((balance[k] / 100) * maxR, i)
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ') + 'Z'

  return (
    <div>
      {/* Radar Chart */}
      <svg viewBox="0 0 260 240" style={{ width: '100%', maxWidth: 300, display: 'block', margin: '0 auto' }}>
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c6aef" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7c6aef" stopOpacity="0.05" />
          </radialGradient>
        </defs>
        {[25, 50, 75, 100].map(lv => {
          const pts = keys.map((_, i) => { const p = pt((lv / 100) * maxR, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
          return <polygon key={lv} points={pts} fill={lv < 100 ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)') : 'none'}
            stroke={gridColor} strokeWidth={lv === 100 ? 1.5 : 0.8} />
        })}
        {[0, 25, 50, 75].map(lv => (
          <text key={lv} x={cx + 4} y={cy - (lv / 100) * maxR - 2} fontSize={7}
            fill={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'} textAnchor="start">{lv}</text>
        ))}
        {keys.map((_, i) => {
          const p = pt(maxR, i)
          return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke={gridColor} strokeWidth={0.8} />
        })}
        <path d={dataPath} fill="url(#radarFill)" stroke="#7c6aef" strokeWidth={2.5} strokeLinejoin="round" />
        {keys.map((k, i) => {
          const r = (balance[k] / 100) * maxR
          const p = pt(r, i)
          const color = BALANCE_COLORS[k]
          const isMain = k === dominant
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={isMain ? 7 : 5} fill={color} stroke={isDark ? '#08090f' : '#fff'} strokeWidth={2} />
              {isMain && <circle cx={p.x} cy={p.y} r={11} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />}
            </g>
          )
        })}
        {keys.map((k, i) => {
          const p = pt(labelR, i)
          const isMain = k === dominant
          const color = isMain ? BALANCE_COLORS[k] : (isDark ? 'rgba(255,255,255,0.55)' : '#4a4a60')
          const label = k.replace('過多', '').replace('ループ', '').replace('不足', '')
          return (
            <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle"
              fontSize={isMain ? 11.5 : 10} fontWeight={isMain ? 800 : 500} fill={color}>
              {label}
            </text>
          )
        })}
      </svg>

      {/* Bar chart breakdown */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {sorted.map(k => {
          const val = balance[k]
          const color = BALANCE_COLORS[k]
          const isMain = k === dominant
          return (
            <div key={k}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: isMain ? 700 : 500, color: isMain ? color : 'var(--text-sub)' }}>{k}</span>
                  {isMain && <span style={{ fontSize: 9, fontWeight: 700, color, background: `${color}18`, padding: '1px 6px', borderRadius: 8, border: `1px solid ${color}30` }}>主要因</span>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{val}</span>
              </div>
              <div style={{ height: 7, background: isDark ? 'rgba(255,255,255,0.1)' : '#eff0f6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 4, transition: 'width 1s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
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
      <div style={{ background: '#0d0f1a', minHeight: '100vh' }}>

        {/* ── 結果ヘッダー ── */}
        <div style={{ background: '#0d0f1a', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '28px 20px 20px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>Brain Scan Result</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: stateColor, letterSpacing: '-1px' }}>{analysis.noise_state}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                  {new Date().toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Clarity Score</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 56, fontWeight: 900, color: stateColor, lineHeight: 1, letterSpacing: '-2px' }}>{analysis.clarity_score}</span>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>/100</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px 60px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── 脳ゲージ + 状態説明 ── */}
          <div style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px 20px' }}>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0 }}>
                <BrainGauge level={analysis.noise_level} state={analysis.noise_state} />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Status</div>
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                  {analysis.summary.split('。').filter(Boolean).map((s, i) => (
                    <p key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.85, margin: 0 }}>{s}。</p>
                  ))}
                </div>
                {/* ノイズバー */}
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>NOISE LEVEL</span>
                    <span style={{ fontSize: 11, color: stateColor, fontWeight: 700 }}>{analysis.noise_level}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${analysis.noise_level}%`, background: stateColor, borderRadius: 4, transition: 'width 1s ease' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── カテゴリ内訳 ── */}
          <div style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>Category Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(Object.entries(analysis.balance) as [BalanceKey, number][])
                .sort(([,a],[,b]) => b - a)
                .map(([key, val]) => {
                  const color = BALANCE_COLORS[key]
                  const isMain = key === analysis.dominant
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 13, fontWeight: isMain ? 700 : 400, color: isMain ? color : 'rgba(255,255,255,0.5)' }}>{key}</span>
                          {isMain && <span style={{ fontSize: 9, fontWeight: 800, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 6, padding: '1px 6px', letterSpacing: '0.5px' }}>MAIN</span>}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isMain ? color : 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>{val}</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 3, opacity: isMain ? 1 : 0.5, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* ── バランスマップ ── */}
          <div style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Balance Map</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <BalanceMap balance={analysis.balance} dominant={analysis.dominant} isDark={true} />
            </div>
          </div>

          {/* ── アドバイス ── */}
          <div style={{ background: '#161820', border: `1px solid ${stateColor}30`, borderRadius: 16, padding: '20px', borderLeft: `3px solid ${stateColor}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: stateColor, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14, opacity: 0.8 }}>AI Advice</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {analysis.advice.split('。').filter(Boolean).map((s, i) => (
                <p key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.85, margin: 0 }}>{s}。</p>
              ))}
            </div>
          </div>

          {/* ── ボタン ── */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={handleReset}
              style={{ flex: 1, padding: '13px 0', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              もう一度書く
            </button>
            <button type="button" onClick={handleSave}
              style={{ flex: 2, padding: '13px 0', borderRadius: 10, background: '#4f46e5', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              完了・保存
            </button>
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
