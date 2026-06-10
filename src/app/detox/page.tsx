
'use client'
import { useState, useEffect, useId, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Brain, ChevronRight, Flame, BarChart2 } from 'lucide-react'
import type { BrainAnalysis, BalanceKey, DetoxSession } from '@/lib/types'
import { useStore } from '@/lib/store'

interface Star { x: number; y: number; r: number; o: number; twinkle: boolean; dur: number; del: number }

function StarField() {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    // body背景を透明にして fixed z-index:-1 の星を見えるようにする
    const prev = document.body.style.background
    document.body.style.background = 'transparent'
    return () => { document.body.style.background = prev }
  }, [])

  useEffect(() => {
    const arr: Star[] = []
    for (let i = 0; i < 220; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: i < 180 ? 0.4 + Math.random() * 0.8 : 1.0 + Math.random() * 1.4,
        o: 0.2 + Math.random() * 0.8,
        twinkle: Math.random() > 0.55,
        dur: 1.6 + Math.random() * 3.2,
        del: Math.random() * 6,
      })
    }
    setStars(arr)
  }, [])

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: -2,
        background: 'radial-gradient(ellipse 120% 80% at 50% 30%, #05071a 0%, #000005 70%, #000000 100%)',
        pointerEvents: 'none',
      }} />
      <svg
        style={{ position: 'fixed', inset: 0, zIndex: -1, width: '100vw', height: '100vh', pointerEvents: 'none' }}
      >
        {stars.map((s, i) => (
          <circle
            key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
            fill="white"
            style={{ opacity: s.o, ...(s.twinkle ? { animation: `stTw ${s.dur}s ${s.del}s ease-in-out infinite` } : {}) }}
          />
        ))}
      </svg>
      <style>{`
        @keyframes stTw {
          0%, 100% { opacity: 0.04; }
          50%       { opacity: 1; }
        }
      `}</style>
    </>
  )
}

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

  // 二葉が明確に見えるシルエット（大脳縦裂のくぼみ付き）
  const outerPath = [
    'M 80,22',
    'C 84,14 96,8 106,8',
    'C 118,6 130,14 136,24',
    'C 142,30 148,44 150,58',
    'C 152,68 150,82 148,92',
    'C 148,102 144,114 138,122',
    'C 130,132 118,138 106,142',
    'C 98,145 90,146 84,147',
    'C 82,148 81,148 80,148',
    'C 79,148 78,148 76,147',
    'C 70,146 62,145 54,142',
    'C 42,138 30,132 22,122',
    'C 16,114 12,102 12,92',
    'C 10,82 8,68 10,58',
    'C 12,44 18,30 24,24',
    'C 30,14 42,6 54,8',
    'C 64,6 76,14 80,22 Z',
  ].join(' ')

  // ニューロン（ノード）座標 — 新しいシルエットに合わせて配置
  const nodes: [number, number][] = [
    [80,36], [62,22],[98,22], [50,38],[110,38],
    [34,54],[66,46],[94,46],[126,54],
    [20,74],[50,64],[74,60],[86,60],[110,64],[140,74],
    [26,92],[52,84],[76,88],[84,88],[108,84],[134,92],
    [34,110],[60,104],[78,110],[82,110],[100,104],[126,110],
    [52,126],[72,128],[88,128],[108,126],
  ]

  // シナプス接続
  const edges: [number, number][] = [
    [0,1],[0,2],[0,6],[0,7],[1,3],[2,4],[1,6],[2,7],[3,5],[4,8],[1,5],[2,8],
    [5,9],[5,6],[6,10],[7,10],[7,11],[6,11],[7,12],[8,12],[8,13],[8,14],[3,6],[4,7],
    [9,15],[9,10],[10,16],[11,16],[11,17],[12,17],[12,18],[13,18],[13,19],[14,19],[14,20],
    [15,21],[16,22],[17,22],[17,23],[18,23],[18,24],[19,24],[19,25],[20,25],[20,26],
    [21,27],[22,27],[22,28],[23,28],[24,28],[24,29],[25,29],[25,30],[26,30],
    [27,28],[28,29],[29,30],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 240, height: 240 }}>
        <svg width={240} height={240} viewBox="0 0 160 160">
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
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
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

function MoonOrb() {
  return (
    <div style={{
      width: 220, height: 220, flexShrink: 0,
      animation: 'breathe 4s ease-in-out infinite',
      filter: 'drop-shadow(0 0 20px rgba(253,224,71,0.45)) drop-shadow(0 0 44px rgba(253,224,71,0.18))',
    }}>
      <svg width={220} height={220} viewBox="0 0 220 220" style={{ display: 'block' }}>
        <defs>
          <radialGradient id="moonBase" cx="38%" cy="30%" r="68%">
            <stop offset="0%"   stopColor="#fffef5" />
            <stop offset="45%"  stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#d4c87a" />
          </radialGradient>
        </defs>

        {/* 月のベース（クリーン・中身なし） */}
        <circle cx="110" cy="110" r="80" fill="url(#moonBase)" />
        {/* 左上の光沢ハイライト */}
        <ellipse cx="88" cy="88" rx="24" ry="15" fill="rgba(255,255,255,0.22)" />
        {/* アウトライン */}
        <circle cx="110" cy="110" r="80" fill="none" stroke="rgba(253,224,71,0.2)" strokeWidth="1.5" />

        {/* ✦ キラキラ星（周囲に7個） */}
        <path d="M110,10 L111.5,14.8 L116,16 L111.5,17.2 L110,22 L108.5,17.2 L104,16 L108.5,14.8Z"
          fill="#fde68a" style={{ animation: 'twinkle 2.4s 0s ease-in-out infinite', transformOrigin: '110px 16px' }} />
        <path d="M187,44 L188,46.8 L191,48 L188,49.2 L187,52 L186,49.2 L183,48 L186,46.8Z"
          fill="#fde68a" style={{ animation: 'twinkle 2.4s 0.5s ease-in-out infinite', transformOrigin: '187px 48px' }} />
        <path d="M207,108 L208.4,111.6 L212,112 L208.4,113.4 L207,117 L205.6,113.4 L202,112 L205.6,111.6Z"
          fill="#fde68a" style={{ animation: 'twinkle 2.4s 1s ease-in-out infinite', transformOrigin: '207px 112px' }} />
        <path d="M185,176 L186,178.8 L189,180 L186,181.2 L185,184 L184,181.2 L181,180 L184,178.8Z"
          fill="#fde68a" style={{ animation: 'twinkle 2.4s 0.3s ease-in-out infinite', transformOrigin: '185px 180px' }} />
        <path d="M110,196 L111,199.2 L114,200 L111,200.8 L110,204 L109,200.8 L106,200 L109,199.2Z"
          fill="#fde68a" style={{ animation: 'twinkle 2.4s 0.8s ease-in-out infinite', transformOrigin: '110px 200px' }} />
        <path d="M13,108 L14.4,111.6 L18,112 L14.4,113.4 L13,117 L11.6,113.4 L8,112 L11.6,111.6Z"
          fill="#fde68a" style={{ animation: 'twinkle 2.4s 1.4s ease-in-out infinite', transformOrigin: '13px 112px' }} />
        <path d="M36,38 L37,40.6 L40,42 L37,43.4 L36,46 L35,43.4 L32,42 L35,40.6Z"
          fill="#fde68a" style={{ animation: 'twinkle 2.4s 1.8s ease-in-out infinite', transformOrigin: '36px 42px' }} />
      </svg>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.12; transform: scale(0.55); }
          50%       { opacity: 1;    transform: scale(1.2);  }
        }
      `}</style>
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
  const isDark = false
  const nightCard = isDark
    ? { background: 'rgba(14,15,26,0.82)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }
    : {}
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

  if (analysis) {
    return (
      <div className="page-wrap detox-wrap" style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
        {isDark && <StarField />}

        {/* 結果ヘッダー */}
        <div className="card fade-up" style={{ padding: '20px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, ...nightCard }}>
          <div>
            <div style={{ fontSize: 16, color: 'var(--text-faint)', marginBottom: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>脳内スキャン結果</div>
            <div style={{ fontSize: 16, color: 'var(--text-sub)' }}>
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, color: 'var(--text-faint)', marginBottom: 2, letterSpacing: '1px', textTransform: 'uppercase' }}>整理スコア</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 54, fontWeight: 900, background: 'var(--grad-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                {analysis.clarity_score}
              </span>
              <span style={{ fontSize: 18, color: 'var(--text-sub)', fontWeight: 600 }}>/100</span>
            </div>
          </div>
        </div>

        {/* メイン: 脳ゲージ + カテゴリ */}
        <div className="card fade-up-2" style={{ padding: 28, marginBottom: 20, ...nightCard }}>
          <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0 }}>
              <BrainGauge level={analysis.noise_level} state={analysis.noise_state} />
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 14, letterSpacing: '1px', textTransform: 'uppercase' }}>
                脳内カテゴリ分析
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {(Object.entries(analysis.balance) as [BalanceKey, number][]).map(([key, val]) => {
                  const color = BALANCE_COLORS[key]
                  const isMain = key === analysis.dominant
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: isMain ? `${color}14` : 'var(--bg3)', border: `1px solid ${isMain ? color + '40' : 'transparent'}` }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: isMain ? color : `${color}22`, border: `2px solid ${isMain ? color : color + '44'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: isMain ? '#fff' : color, flexShrink: 0 }}>
                        {val}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: isMain ? 700 : 500, color: isMain ? 'var(--text)' : 'var(--text-sub)' }}>{key}</div>
                        {isMain && <div style={{ fontSize: 16, color, fontWeight: 700, marginTop: 2 }}>▶ 主要因</div>}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg3)', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, letterSpacing: '0.5px' }}>今の脳内状態</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {analysis.summary.split('。').filter(Boolean).map((s, i) => (
                    <p key={i} style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.75, margin: 0 }}>{s}。</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* バランスマップ + アドバイス */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <div className="card fade-up-3" style={{ padding: 20, ...nightCard }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>バランスマップ</div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <BalanceMap balance={analysis.balance} dominant={analysis.dominant} isDark={isDark} />
            </div>
          </div>

          <div className="card fade-up-4" style={{ padding: 20, ...nightCard }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>💡</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '1px', textTransform: 'uppercase' }}>AIアドバイス</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {analysis.advice.split('。').filter(Boolean).map((s, i) => (
                <p key={i} style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.8, margin: 0 }}>{s}。</p>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-faint)' }}>
              次回のセッションで変化を確認しましょう
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <button className="btn-ghost" onClick={handleReset} style={{ flex: 1 }}>もう一度書く</button>
          <button className="btn-primary" onClick={handleSave} style={{ flex: 2 }}>完了・保存</button>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .detox-wrap {
            --text-faint: ${isDark ? 'rgba(255,255,255,0.52)' : 'var(--text-faint)'};
            --text-sub:   ${isDark ? 'rgba(255,255,255,0.78)' : 'var(--text-sub)'};
            --text:       ${isDark ? '#f0f1f8' : 'var(--text)'};
            --bg3:        ${isDark ? 'rgba(255,255,255,0.07)' : 'var(--bg3)'};
            --border:     ${isDark ? 'rgba(255,255,255,0.14)' : 'var(--border)'};
          }
        `}</style>
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
        <div style={{
          minHeight: 'calc(100vh - 48px)',
          background: 'radial-gradient(ellipse 160% 120% at 50% 0%, #0d1130 0%, #050814 60%, #000008 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {Array.from({ length: 100 }, (_, i) => (
              <circle key={i} cx={`${(i * 37 + 11) % 100}%`} cy={`${(i * 53 + 7) % 100}%`}
                r={i % 5 === 0 ? 1.4 : 0.65} fill="white" opacity={0.12 + (i % 7) * 0.11}
                style={i % 3 === 0 ? { animation: `stTw ${1.8 + (i % 4) * 0.8}s ${(i % 7) * 0.5}s ease-in-out infinite` } : undefined} />
            ))}
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 0 14px', position: 'relative' }}>
            <MoonOrb />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fef9c3', letterSpacing: '-0.3px', marginBottom: 6, textShadow: '0 0 24px rgba(253,224,71,0.5)' }}>脳内デトックス</div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7 }}>今頭の中にあることを、そのまま書き出してください。<br />判断しなくて大丈夫です。</p>
            </div>
          </div>
          <div className="fade-up" style={{ padding: '0 16px', position: 'relative' }}>
            <div style={{ borderRadius: 20, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', padding: 24 }}>
              <textarea placeholder="今、頭の中にあることを自由に書いてください&#10;&#10;例：明日の会議が心配。タスクが溜まっている気がする。あの件どうなったっけ..."
                value={text} onChange={e => setText(e.target.value)}
                style={{ width: '100%', minHeight: 220, fontSize: 15, lineHeight: 1.8, background: 'transparent', border: 'none', outline: 'none', color: '#f0f1f8', fontFamily: 'inherit', resize: 'none' }}
                autoFocus />
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
                  {charCount > 0 ? `${charCount}文字` : '20文字以上書くと精度が上がります'}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button type="button" onClick={handleDemo} style={{ fontSize: 12, flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit', padding: '9px 16px', borderRadius: 24, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>デモを見る</button>
                  <button type="button" className="btn-grad" onClick={handleAnalyze} disabled={loading || text.trim().length < 5} style={{ opacity: text.trim().length < 5 ? 0.4 : 1, flex: 1, justifyContent: 'center' }}>
                    {loading
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />分析中...</span>
                      : '✦ 脳内を分析する'}
                  </button>
                </div>
              </div>
            </div>
            {error && <div style={{ marginTop: 12, padding: '12px 18px', borderRadius: 12, background: 'rgba(244,114,182,0.15)', color: '#f9a8d4', fontSize: 13, border: '1px solid rgba(244,114,182,0.2)' }}>{error}</div>}
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes stTw{0%,100%{opacity:0.04}50%{opacity:0.9}}`}</style>
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
