'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Brain, ChevronRight, Flame, BarChart2,
  Plus, X, Pencil, Check, ChevronLeft,
  CheckSquare, Square, FolderOpen, Sparkles,
} from 'lucide-react'
import type { BrainAnalysis, BalanceKey, DetoxSession, TaggedItem, OrganizedGroup, ThoughtTag } from '@/lib/types'
import { useStore } from '@/lib/store'
import { loadDrawers } from '@/lib/drawerConfig'
import type { DrawerItem } from '@/lib/drawerConfig'

const Brain3DCanvas = dynamic(() => import('@/components/Brain3DCanvas'), { ssr: false })

// ─── カラー定数 ────────────────────────────────────────────────────────
const NOISE_COLORS: Record<string, string> = {
  'クリア': '#4ade80', '安定': '#2dd4bf', '整理中': '#7c6aef',
  '散乱': '#fbbf24', '混雑': '#f472b6',
}
const BALANCE_COLORS: Record<BalanceKey, string> = {
  '感情過多': '#f472b6', 'タスク過多': '#7c6aef', '不安過多': '#fbbf24',
  '情報過多': '#2dd4bf', '思考ループ': '#a78bfa', '行動不足': '#94a3b8',
}
const TAG_COLORS: Record<ThoughtTag, string> = {
  'タスク': '#3b82f6', '感情': '#ec4899', '不安': '#f59e0b',
  '人間関係': '#8b5cf6', 'アイデア': '#10b981', 'その他': '#64748b',
}
const ALL_TAGS: ThoughtTag[] = ['タスク', '感情', '不安', '人間関係', 'アイデア', 'その他']

const STATE_DESCRIPTIONS: Record<string, string> = {
  'クリア':  '頭の中が整理されており、集中力・判断力ともに高い状態です。今がいちばん動きやすいタイミング。',
  '安定':    '思考がまとまっており、落ち着いて物事に取り組める状態です。少し整理するとさらに良くなります。',
  '整理中':  '情報を処理しようとしているところです。書き出すほど頭が軽くなる状態です。',
  '散乱':    '複数の思考が混在し、優先度が見えにくくなっています。いちばん気になることを1つだけ選ぶのが有効です。',
  '混雑':    '情報・感情・タスクが重なり、判断力が落ちやすい状態です。まず頭を空にすることを優先しましょう。',
}
const BALANCE_DESCRIPTIONS: Record<BalanceKey, string> = {
  '感情過多':   '感情的な言葉や表現が多く、気持ちが先行しています。感情を「観察」する視点が有効です。',
  'タスク過多': '「やらなければ」「〜する必要がある」という思考が多く見られます。タスクを書き出して可視化しましょう。',
  '不安過多':   '未来への心配や「もし〜だったら」という思考パターンが多い。今できることに絞ると楽になります。',
  '情報過多':   '多くの情報や事実を同時に処理しようとしています。インプットを一時停止するのが効果的です。',
  '思考ループ': '同じ内容を繰り返し考えるパターンが見られます。思考を外に出す（書く・話す）ことで解消します。',
  '行動不足':   '停滞感や「動けない」という感覚が見られます。0か100ではなく、1%の小さな一歩が突破口になります。',
}

const DEMO_ANALYSIS: BrainAnalysis = {
  noise_level: 72,
  noise_state: '散乱',
  balance: { '感情過多': 65, 'タスク過多': 80, '不安過多': 55, '情報過多': 40, '思考ループ': 70, '行動不足': 30 },
  dominant: 'タスク過多',
  summary: '頭の中にタスクと思考ループが混在しており、かなり散乱した状態です。一つひとつ書き出すことで整理できます。',
  advice: 'もしよければ、今気になることを一つだけ選んで小さく動いてみてください。',
  clarity_score: 28,
  extracted_items: ['明日の会議の資料を準備しなきゃ', 'Aさんへの返信を忘れていた', '今月の予算の整理ができていない', '子どもの宿題を確認する', '最近運動できていない気がする'],
  organized_groups: [
    { theme: '仕事タスク', items: ['明日の会議の資料を準備しなきゃ', 'Aさんへの返信を忘れていた', '今月の予算の整理ができていない'] },
    { theme: '家族・自分', items: ['子どもの宿題を確認する', '最近運動できていない気がする'] },
  ],
  tagged_items: [
    { id: 't1', text: '明日の会議の資料を準備しなきゃ', tag: 'タスク', as_todo: true },
    { id: 't2', text: 'Aさんへの返信を忘れていた', tag: 'タスク', as_todo: true },
    { id: 't3', text: '今月の予算の整理ができていない', tag: 'タスク', as_todo: true },
    { id: 't4', text: '子どもの宿題を確認する', tag: 'タスク', as_todo: true },
    { id: 't5', text: '最近運動できていない気がする', tag: '感情', as_todo: false },
  ],
}

// ─── ヘルパー関数 ──────────────────────────────────────────────────────
function noiseLevelLabel(n: number) {
  if (n <= 20) return { label: '非常に静か', color: '#4ade80' }
  if (n <= 40) return { label: '落ち着いている', color: '#2dd4bf' }
  if (n <= 60) return { label: 'やや混雑', color: '#7c6aef' }
  if (n <= 75) return { label: 'かなり混雑', color: '#fbbf24' }
  return { label: '高負荷状態', color: '#f472b6' }
}
function clarityLabel(n: number) {
  if (n >= 80) return '非常にクリア'
  if (n >= 60) return 'クリア'
  if (n >= 40) return 'やや濁り'
  if (n >= 20) return '要整理'
  return '混濁'
}
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

// ─── サブコンポーネント ────────────────────────────────────────────────

function BrainGauge({ level, state }: { level: number; state: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => { const t = setTimeout(() => setDisplay(level), 60); return () => clearTimeout(t) }, [level])
  const color = NOISE_COLORS[state] ?? '#7c6aef'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 320, height: 320 }}>
        <div style={{ position: 'absolute', top: 30, left: 30, width: 260, height: 260 }}>
          <Brain3DCanvas color={color} act={display / 100} />
        </div>
        <div style={{ position: 'absolute', top: 30, left: 30, width: 260, height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1, textShadow: `0 0 24px ${color},0 0 60px ${color}66,0 2px 8px rgba(0,0,0,.99)` }}>{level}</div>
          <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 6, letterSpacing: '.14em', textShadow: `0 0 14px ${color}` }}>NOISE</div>
        </div>
      </div>
      <div style={{ padding: '6px 28px', borderRadius: 24, background: `${color}12`, color, fontSize: 15, fontWeight: 700, border: `1px solid ${color}44`, letterSpacing: '.5px', boxShadow: `0 0 18px ${color}28` }}>{state}</div>
    </div>
  )
}

function BalanceMap({ balance, dominant, isDark, fillColor }: { balance: Record<BalanceKey, number>; dominant: BalanceKey | null; isDark: boolean; fillColor?: string }) {
  const keys = Object.keys(balance) as BalanceKey[]
  const cx = 140, cy = 130, maxR = 96, labelR = 124
  const n = keys.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) })
  const gridColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const fill = dominant ? BALANCE_COLORS[dominant] : (fillColor ?? '#7c6aef')
  const dataPath = keys.map((k, i) => { const p = pt((balance[k] / 100) * maxR, i); return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ') + 'Z'
  const dangerPts = keys.map((_, i) => { const p = pt(0.70 * maxR, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
  return (
    <svg viewBox="0 0 280 260" style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>
      <defs><radialGradient id="radarFill" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={fill} stopOpacity="0.42" /><stop offset="100%" stopColor={fill} stopOpacity="0.07" /></radialGradient></defs>
      {[25, 50, 75, 100].map(lv => { const pts = keys.map((_, i) => { const p = pt((lv / 100) * maxR, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' '); return <polygon key={lv} points={pts} fill="none" stroke={gridColor} strokeWidth={lv === 100 ? 1.4 : 0.7} /> })}
      <polygon points={dangerPts} fill="rgba(239,68,68,0.07)" stroke="rgba(239,68,68,0.28)" strokeWidth={0.9} strokeDasharray="4 2" />
      {[25, 50, 75].map(lv => <text key={lv} x={cx + 4} y={cy - (lv / 100) * maxR - 3} fontSize={8} fill={lv === 75 ? 'rgba(239,68,68,0.55)' : (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)')} textAnchor="start" fontWeight={lv === 75 ? 700 : 400}>{lv === 75 ? '高負荷' : lv}</text>)}
      {keys.map((k, i) => { const p = pt(maxR, i); return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke={BALANCE_COLORS[k]} strokeWidth={0.7} opacity={0.35} /> })}
      <path d={dataPath} fill="url(#radarFill)" stroke={fill} strokeWidth={2.5} strokeLinejoin="round" />
      {keys.map((k, i) => { const r = (balance[k] / 100) * maxR; const p = pt(r, i); const color = BALANCE_COLORS[k]; const isMain = k === dominant; return (<g key={i}><circle cx={p.x} cy={p.y} r={isMain ? 7 : 5} fill={color} stroke={isDark ? '#08090f' : '#fff'} strokeWidth={2} />{isMain && <circle cx={p.x} cy={p.y} r={12} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />}{balance[k] >= 70 && !isMain && <circle cx={p.x} cy={p.y} r={8} fill="none" stroke="rgba(239,68,68,0.5)" strokeWidth={1} />}</g>) })}
      {keys.map((k, i) => { const p = pt(labelR, i); const isMain = k === dominant; const color = isMain ? BALANCE_COLORS[k] : (isDark ? 'rgba(255,255,255,0.52)' : '#4a4a60'); return <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize={isMain ? 11 : 9.5} fontWeight={isMain ? 800 : 500} fill={color}>{k}</text> })}
    </svg>
  )
}

function CategoryAnalysis({ balance, dominant, isDark }: { balance: Record<BalanceKey, number>; dominant: BalanceKey | null; isDark: boolean }) {
  const sorted = (Object.entries(balance) as [BalanceKey, number][]).sort(([, a], [, b]) => b - a)
  const defaultBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  return (
    <div className="ca-grid">
      {sorted.map(([key, val]) => {
        const color = BALANCE_COLORS[key]; const isMain = key === dominant
        const lv = val >= 70 ? { label: '高い', bg: 'rgba(239,68,68,0.14)', color: '#f87171' }
          : val >= 40 ? { label: '普通', bg: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)' }
          : { label: '低い', bg: 'rgba(74,222,128,0.12)', color: '#4ade80' }
        return (
          <div key={key} className="ca-item" style={{ background: isMain ? `${color}0d` : defaultBg, border: `1px solid ${isMain ? `${color}28` : 'transparent'}` }}>
            <div className="ca-item-head">
              <div className="ca-item-labels">
                <span className="ca-item-name" style={{ fontWeight: isMain ? 700 : 500, color: isMain ? color : (isDark ? 'rgba(255,255,255,0.68)' : '#4a4a60') }}>{key}</span>
                {isMain && <span className="ca-badge-main" style={{ color, background: `${color}1a`, border: `1px solid ${color}35` }}>主要因</span>}
                <span className="ca-badge-level" style={{ color: lv.color, background: lv.bg }}>{lv.label}</span>
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

const NOISE_COLORS_HUB: Record<string, string> = { 'クリア': '#16a34a', '安定': '#0891b2', '整理中': '#6366f1', '散乱': '#d97706', '混雑': '#e11d48' }
const DAY_LABELS_HUB = ['日', '月', '火', '水', '木', '金', '土']

function HubScoreRing({ score, noSession }: { score: number; noSession?: boolean }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => { const t = setTimeout(() => setDisplay(score), 150); return () => clearTimeout(t) }, [score])
  const R = 72, CIRC = 2 * Math.PI * R, offset = CIRC - (display / 100) * CIRC
  return (
    <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
      <svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={90} cy={90} r={R} fill="none" stroke="var(--primary-lt)" strokeWidth={12} />
        <circle cx={90} cy={90} r={R} fill="none" stroke="var(--primary)" strokeWidth={12} strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Brain size={18} color="var(--primary)" strokeWidth={1.4} style={{ opacity: 0.7 }} />
        {noSession ? <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.6, marginTop: 4 }}>まだ<br />未記録</div>
          : <><div style={{ fontSize: 44, fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-2px' }}>{display}</div><div style={{ fontSize: 11, color: 'var(--text-faint)' }}>/100</div></>}
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

// ─── ステッパー UI ─────────────────────────────────────────────────────

const STEPS = ['ダンプ', '洗い出し', '整理', '振り分け', '詳細', '完了']

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
      {STEPS.map((label, i) => {
        const done = i < current, active = i === current
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? '#4ade80' : active ? '#6366f1' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: (done || active) ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }}>
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span style={{ fontSize: 9, color: active ? '#fff' : done ? '#4ade80' : 'rgba(255,255,255,0.25)', fontWeight: active ? 700 : 400 }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 20, height: 1, background: i < current ? '#4ade8066' : 'rgba(255,255,255,0.1)', margin: '0 2px', marginBottom: 16 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Step 1: 洗い出し編集
function Step1Extracted({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  function addItem() {
    if (!newText.trim()) return
    onChange([...items, newText.trim()])
    setNewText(''); setAdding(false)
  }
  function deleteItem(i: number) { onChange(items.filter((_, idx) => idx !== i)) }
  function startEdit(i: number) { setEditIdx(i); setEditText(items[i]) }
  function saveEdit() {
    if (editIdx === null) return
    onChange(items.map((x, i) => i === editIdx ? editText.trim() || x : x))
    setEditIdx(null)
  }

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Step 2 — 洗い出し</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f1f8', margin: '0 0 6px' }}>AIが抽出した思考</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.7 }}>追加・編集・削除できます。不要なものは消してください。</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: '#1e2035', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            {editIdx === i ? (
              <div style={{ padding: '10px 12px' }}>
                <input autoFocus value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e8eaf0', fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button type="button" onClick={() => setEditIdx(null)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}>キャンセル</button>
                  <button type="button" onClick={saveEdit} style={{ flex: 2, padding: '5px 0', borderRadius: 6, background: '#4f46e5', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>保存</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                <span style={{ flex: 1, fontSize: 13, color: '#e8eaf0', lineHeight: 1.6 }}>{item}</span>
                <button type="button" onClick={() => startEdit(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}><Pencil size={13} /></button>
                <button type="button" onClick={() => deleteItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)', padding: 4 }}><X size={13} /></button>
              </div>
            )}
          </div>
        ))}

        {adding ? (
          <div style={{ background: '#1e2035', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 12, padding: '10px 12px' }}>
            <input autoFocus value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} placeholder="思考を追加..." style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e8eaf0', fontFamily: 'inherit', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => setAdding(false)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}>キャンセル</button>
              <button type="button" onClick={addItem} style={{ flex: 2, padding: '5px 0', borderRadius: 6, background: '#4f46e5', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>追加</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 12, background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={14} /> 思考を追加する
          </button>
        )}
      </div>
    </div>
  )
}

// Step 2: 整理（グループ編集）
function Step2Organized({ groups, onChange }: { groups: OrganizedGroup[]; onChange: (g: OrganizedGroup[]) => void }) {
  const [editGroupIdx, setEditGroupIdx] = useState<number | null>(null)
  const [editGroupLabel, setEditGroupLabel] = useState('')

  function startEditGroup(i: number) { setEditGroupIdx(i); setEditGroupLabel(groups[i].theme) }
  function saveGroupLabel(i: number) {
    if (!editGroupLabel.trim()) { setEditGroupIdx(null); return }
    onChange(groups.map((g, idx) => idx === i ? { ...g, theme: editGroupLabel.trim() } : g))
    setEditGroupIdx(null)
  }
  function deleteFromGroup(gi: number, itemText: string) {
    const updated = groups.map((g, i) => i === gi ? { ...g, items: g.items.filter(x => x !== itemText) } : g)
    onChange(updated.filter(g => g.items.length > 0))
  }

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Step 3 — 整理</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f1f8', margin: '0 0 6px' }}>グループで整理された思考</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.7 }}>グループ名を編集したり、不要な項目を削除できます。</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {groups.map((group, gi) => (
          <div key={gi} style={{ background: '#1e2035', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {editGroupIdx === gi ? (
                <>
                  <input autoFocus value={editGroupLabel} onChange={e => setEditGroupLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveGroupLabel(gi)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, color: '#e8eaf0', fontFamily: 'inherit' }} />
                  <button type="button" onClick={() => saveGroupLabel(gi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4ade80', padding: 2 }}><Check size={14} /></button>
                  <button type="button" onClick={() => setEditGroupIdx(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}><X size={14} /></button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#e8eaf0' }}>{group.theme}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{group.items.length}件</span>
                  <button type="button" onClick={() => startEditGroup(gi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}><Pencil size={13} /></button>
                </>
              )}
            </div>
            <div style={{ padding: '8px 14px 12px' }}>
              {group.items.map((item, ii) => (
                <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: ii < group.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{item}</span>
                  <button type="button" onClick={() => deleteFromGroup(gi, item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.4)', padding: 2, flexShrink: 0 }}><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Step 3: 振り分け（タグ編集）
function Step3Tagged({ items, onChange }: { items: TaggedItem[]; onChange: (items: TaggedItem[]) => void }) {
  function setTag(id: string, tag: ThoughtTag) {
    onChange(items.map(x => x.id === id ? { ...x, tag } : x))
  }
  function setAsTodo(id: string, as_todo: boolean) {
    onChange(items.map(x => x.id === id ? { ...x, as_todo } : x))
  }
  function deleteItem(id: string) { onChange(items.filter(x => x.id !== id)) }

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Step 4 — 振り分け</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f1f8', margin: '0 0 6px' }}>カテゴリで振り分け</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.7 }}>AIが自動で分類しました。タグを変更したり、TODOにするか選べます。</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item => {
          const tagColor = TAG_COLORS[item.tag]
          return (
            <div key={item.id} style={{ background: '#1e2035', border: `1px solid ${tagColor}22`, borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <span style={{ flex: 1, fontSize: 13, color: '#e8eaf0', lineHeight: 1.6 }}>{item.text}</span>
                <button type="button" onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.4)', padding: 2, flexShrink: 0 }}><X size={14} /></button>
              </div>

              {/* タグ選択 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {ALL_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => setTag(item.id, tag)}
                    style={{ padding: '3px 10px', borderRadius: 50, fontSize: 10, fontWeight: 700, border: '1.5px solid', cursor: 'pointer', background: item.tag === tag ? TAG_COLORS[tag] : 'transparent', borderColor: TAG_COLORS[tag], color: item.tag === tag ? '#fff' : TAG_COLORS[tag] }}
                  >{tag}</button>
                ))}
              </div>

              {/* TODO トグル */}
              <button type="button" onClick={() => setAsTodo(item.id, !item.as_todo)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: item.as_todo ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${item.as_todo ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', color: item.as_todo ? '#60a5fa' : 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600 }}
              >
                {item.as_todo ? <CheckSquare size={13} /> : <Square size={13} />}
                TODOに追加する
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Step 4: 詳細振り分け（引き出し割り当て）
function Step4Drawers({ items, onChange }: { items: TaggedItem[]; onChange: (items: TaggedItem[]) => void }) {
  const [drawers, setDrawers] = useState<DrawerItem[]>([])
  useEffect(() => { setDrawers(loadDrawers()) }, [])

  function setDrawer(id: string, drawer_id: string | undefined) {
    onChange(items.map(x => x.id === id ? { ...x, drawer_id } : x))
  }

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Step 5 — 詳細</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f1f8', margin: '0 0 6px' }}>引き出しに振り分け</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.7 }}>各思考をどの引き出しに入れるか選べます。スキップしてもOK。</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item => {
          const tagColor = TAG_COLORS[item.tag]
          const assigned = drawers.find(d => d.id === item.drawer_id)
          return (
            <div key={item.id} style={{ background: '#1e2035', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ padding: '2px 8px', borderRadius: 50, fontSize: 9, fontWeight: 700, background: `${tagColor}22`, color: tagColor }}>{item.tag}</span>
                {item.as_todo && <span style={{ padding: '2px 8px', borderRadius: 50, fontSize: 9, fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>TODO</span>}
              </div>
              <p style={{ fontSize: 13, color: '#e8eaf0', margin: '0 0 10px', lineHeight: 1.6 }}>{item.text}</p>

              {/* 引き出し選択 */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setDrawer(item.id, undefined)}
                  style={{ padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600, border: '1px solid', cursor: 'pointer', background: !item.drawer_id ? 'rgba(255,255,255,0.12)' : 'transparent', borderColor: !item.drawer_id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', color: !item.drawer_id ? '#fff' : 'rgba(255,255,255,0.3)' }}
                >割り当てなし</button>
                {drawers.map(d => (
                  <button key={d.id} type="button" onClick={() => setDrawer(item.id, d.id)}
                    style={{ padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600, border: '1px solid', cursor: 'pointer', background: item.drawer_id === d.id ? `${d.color}22` : 'transparent', borderColor: item.drawer_id === d.id ? d.color : 'rgba(255,255,255,0.1)', color: item.drawer_id === d.id ? d.color : 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <FolderOpen size={11} /> {d.label}
                  </button>
                ))}
              </div>
              {assigned && (
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '6px 0 0' }}>→ 「{assigned.label}」引き出しに保存されます</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── メインコンポーネント ─────────────────────────────────────────────

export default function DetoxPage() {
  const { addSession, addTodo, sessions } = useStore()
  const router = useRouter()

  // タブ（デトックスフロー / 記録 / 分析）
  const [hubTab, setHubTab] = useState<'detox' | 'records' | 'analysis'>('detox')

  // ステッパー状態
  const [step, setStep] = useState(0)
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<BrainAnalysis | null>(null)
  const [isDemoFallback, setIsDemoFallback] = useState(false)
  const [loading, setLoading] = useState(false)

  // 編集可能なコピー
  const [extractedItems, setExtractedItems] = useState<string[]>([])
  const [organizedGroups, setOrganizedGroups] = useState<OrganizedGroup[]>([])
  const [taggedItems, setTaggedItems] = useState<TaggedItem[]>([])

  // 記録・分析用
  const today = new Date().toISOString().split('T')[0]
  const todaySession = sessions.find(s => s.created_at.startsWith(today))
  const streak = useMemo(() => calcStreak(sessions), [sessions])
  const avgScore = sessions.length ? Math.round(sessions.slice(0, 10).reduce((a, s) => a + s.analysis.clarity_score, 0) / Math.min(sessions.length, 10)) : null
  const avgBalance = useMemo(() => {
    if (!sessions.length) return null
    const keys = Object.keys(BALANCE_COLORS) as BalanceKey[]
    return keys.reduce<Record<BalanceKey, number>>((acc, k) => {
      acc[k] = Math.round(sessions.reduce((s, sess) => s + (sess.analysis.balance[k] ?? 0), 0) / sessions.length)
      return acc
    }, {} as Record<BalanceKey, number>)
  }, [sessions])

  function applyAnalysis(a: BrainAnalysis) {
    setAnalysis(a)
    setExtractedItems(a.extracted_items ?? [])
    setOrganizedGroups(a.organized_groups ?? [])
    setTaggedItems(a.tagged_items ?? [])
  }

  async function handleAnalyze() {
    if (!text.trim() || loading) return
    setLoading(true)
    setIsDemoFallback(false)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      applyAnalysis(data.analysis)
      setStep(1)
    } catch {
      applyAnalysis(DEMO_ANALYSIS)
      setIsDemoFallback(true)
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  function handleDemo() {
    applyAnalysis(DEMO_ANALYSIS)
    setIsDemoFallback(true)
    setStep(1)
  }

  function handleSave() {
    if (!analysis) return
    const finalAnalysis: BrainAnalysis = {
      ...analysis,
      extracted_items: extractedItems,
      organized_groups: organizedGroups,
      tagged_items: taggedItems,
    }
    addSession(text, finalAnalysis)
    // タグ付きアイテムのうち as_todo なものをTODOに追加
    taggedItems.filter(x => x.as_todo).forEach(x => {
      addTodo({ text: x.text, tag: x.tag, drawer_id: x.drawer_id, completed: false })
    })
    router.push('/')
  }

  function handleReset() {
    setStep(0)
    setText('')
    setAnalysis(null)
    setExtractedItems([])
    setOrganizedGroups([])
    setTaggedItems([])
    setIsDemoFallback(false)
  }

  const stateColor = NOISE_COLORS[analysis?.noise_state ?? ''] ?? '#6366f1'

  // ─── デトックスタブ ─────────────────────────────────────────────────
  const renderDetoxTab = useCallback(() => (
    <div style={{ minHeight: 'calc(100vh - 48px)', background: '#0d0f1a', display: 'flex', flexDirection: 'column' }}>

      {/* ステップバー（step > 0 のみ表示） */}
      {step > 0 && <StepBar current={step} />}

      {/* ── Step 0: ダンプ入力 ── */}
      {step === 0 && (
        <>
          <div style={{ padding: '36px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Brain Detox</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#f0f1f8', letterSpacing: '-0.5px', marginBottom: 8 }}>脳内デトックス</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.75, margin: 0 }}>
                頭の中にあることを、そのまま書き出してください。判断しなくて大丈夫です。
              </p>
            </div>
          </div>
          <div style={{ padding: '20px 16px 40px', maxWidth: 700, margin: '0 auto', width: '100%' }}>
            <div style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
              <textarea
                placeholder={'今、頭の中にあることを自由に書いてください\n\n例：明日の会議が心配。タスクが溜まっている気がする。あの件どうなったっけ...'}
                value={text}
                onChange={e => setText(e.target.value)}
                style={{ width: '100%', minHeight: 260, fontSize: 15, lineHeight: 1.85, background: 'transparent', border: 'none', outline: 'none', color: '#e8eaf0', fontFamily: 'inherit', resize: 'none', padding: '20px 20px 0', boxSizing: 'border-box' }}
                autoFocus
              />
              <div style={{ padding: '14px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 14 }}>
                <span style={{ fontSize: 12, color: text.length > 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)' }}>
                  {text.length > 0 ? `${text.length} 文字` : '20文字以上で精度が上がります'}
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
                      : <><Sparkles size={14} /> 分析する</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Step 1: 洗い出し ── */}
      {step === 1 && (
        <>
          {isDemoFallback && <div className="sr-demo-banner">AI分析サービスが現在利用できないため、サンプル結果を表示しています</div>}
          <Step1Extracted items={extractedItems} onChange={setExtractedItems} />
        </>
      )}

      {/* ── Step 2: 整理 ── */}
      {step === 2 && <Step2Organized groups={organizedGroups} onChange={setOrganizedGroups} />}

      {/* ── Step 3: 振り分け ── */}
      {step === 3 && <Step3Tagged items={taggedItems} onChange={setTaggedItems} />}

      {/* ── Step 4: 詳細振り分け ── */}
      {step === 4 && <Step4Drawers items={taggedItems} onChange={setTaggedItems} />}

      {/* ── Step 5: 完了 ── */}
      {step === 5 && analysis && (
        <>
          <style>{`
            .sr-hdr{background:#0d0f1a;border-bottom:1px solid rgba(255,255,255,0.06);padding:20px 20px 16px}
            .sr-hdr-in{max-width:1100px;margin:0 auto;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap}
            .sr-section-label{font-size:9px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:2.5px;text-transform:uppercase}
            .sr-state-name{font-size:22px;font-weight:900;letter-spacing:-0.5px}
            .sr-hdr-time{font-size:11px;color:rgba(255,255,255,0.3);font-weight:500}
            .sr-cs-num{font-size:40px;font-weight:900;line-height:1;letter-spacing:-2px}
            .sr-cs-denom{font-size:13px;color:rgba(255,255,255,0.3);font-weight:600}
            .sr-body{max-width:1100px;margin:0 auto;padding:14px 16px 80px;display:flex;flex-direction:column;gap:10px}
            .sr-card{background:#161820;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px}
            .sr-brain-row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}
            .sr-brain-side{flex-shrink:0;display:flex;justify-content:center}
            .sr-stat-side{flex:1;min-width:200px}
            .sr-mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
            .sr-mini-box{background:rgba(255,255,255,0.045);border-radius:9px;padding:9px 11px}
            .sr-mini-key{font-size:8.5px;color:rgba(255,255,255,0.28);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
            .sr-mini-val{font-size:20px;font-weight:800;line-height:1}
            .sr-mini-sub{font-size:10px;margin-top:4px;font-weight:600}
            .sr-dominant{padding:10px 12px;border-radius:9px}
            .sr-dominant-row{display:flex;justify-content:space-between;align-items:center;margin:4px 0}
            .sr-dominant-name{font-size:13px;font-weight:700}
            .sr-dominant-score{font-size:18px;font-weight:800}
            .sr-dominant-desc{font-size:11px;color:rgba(255,255,255,0.42);margin:0;line-height:1.6}
            .ca-grid{display:flex;flex-direction:column;gap:8px}
            .ca-item{padding:10px 12px;border-radius:10px}
            .ca-item-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
            .ca-item-labels{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
            .ca-item-name{font-size:12px}
            .ca-badge-main{font-size:8.5px;font-weight:800;border-radius:5px;padding:2px 6px}
            .ca-badge-level{font-size:8.5px;font-weight:700;border-radius:5px;padding:2px 6px}
            .ca-score{font-size:16px;font-weight:800}
            .ca-bar-track{height:4px;border-radius:3px;margin-bottom:7px}
            .ca-bar-fill{height:100%;border-radius:3px;transition:width 1s ease}
            .ca-desc{font-size:11px;margin:0;line-height:1.65;color:rgba(255,255,255,0.38)}
            .sr-advice-intro{font-size:11px;color:rgba(255,255,255,0.3);margin:3px 0 14px;line-height:1.6}
            .sr-advice-text{font-size:12.5px;color:rgba(255,255,255,0.82);line-height:1.85;margin:0}
            .sr-btn-row{display:flex;gap:10px;padding-top:4px}
            .sr-btn-reset{flex:1;padding:12px 0;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.55);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
            .sr-btn-save{flex:2;padding:12px 0;border-radius:10px;background:#4f46e5;border:none;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:background 0.15s}
            .sr-btn-save:hover{background:#5b52f5}
            .sr-paras p{margin:0 0 1.4em !important;font-size:13px;line-height:1.75;color:rgba(255,255,255,0.7)}
            .sr-paras p:last-child{margin-bottom:0!important}
            .sr-paras-body p{margin:0 0 1.2em !important;font-size:13px;line-height:1.75;color:rgba(255,255,255,0.55)}
            .sr-paras-body p:last-child{margin-bottom:0!important}
            @media(min-width:640px){.sr-hdr{padding:24px 32px 20px}.sr-state-name{font-size:26px}.sr-cs-num{font-size:48px}.sr-body{padding:18px 32px 80px;gap:12px}.sr-card{padding:20px 24px;border-radius:16px}.ca-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sr-advice-text{font-size:13.5px}}
          `}</style>

          {/* 完了ヘッダー */}
          <div className="sr-hdr">
            <div className="sr-hdr-in">
              <div>
                <div className="sr-section-label" style={{ marginBottom: 8 }}>脳内デトックス完了</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className="sr-state-name" style={{ color: stateColor }}>{analysis.noise_state}</span>
                  <span className="sr-hdr-time">{new Date().toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
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

          {isDemoFallback && <div className="sr-demo-banner">AI分析サービスが現在利用できないため、サンプル結果を表示しています</div>}

          <div className="sr-body">
            {/* 振り分けサマリー */}
            {taggedItems.length > 0 && (
              <div className="sr-card">
                <div className="sr-section-label" style={{ marginBottom: 10 }}>振り分けサマリー</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {ALL_TAGS.map(tag => {
                    const count = taggedItems.filter(x => x.tag === tag).length
                    if (!count) return null
                    return <span key={tag} style={{ padding: '3px 10px', borderRadius: 50, fontSize: 10, fontWeight: 700, background: `${TAG_COLORS[tag]}20`, color: TAG_COLORS[tag] }}>{tag} {count}</span>
                  })}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  TODO: {taggedItems.filter(x => x.as_todo).length}件 / 合計: {taggedItems.length}件
                </div>
              </div>
            )}

            {/* 脳ゲージ + 状態 */}
            <div className="sr-card">
              <div className="sr-brain-row">
                <div className="sr-brain-side"><BrainGauge level={analysis.noise_level} state={analysis.noise_state} /></div>
                <div className="sr-stat-side">
                  <div className="sr-section-label" style={{ marginBottom: 10 }}>Status</div>
                  <div className="sr-paras">
                    {STATE_DESCRIPTIONS[analysis.noise_state].split('。').filter(Boolean).map((s, i) => <p key={i} style={{ color: stateColor, opacity: 0.9 }}>{s}。</p>)}
                  </div>
                  <div className="sr-paras-body">
                    {analysis.summary.split('。').filter(Boolean).map((s, i) => <p key={i}>{s}。</p>)}
                  </div>
                  <div className="sr-mini-grid">
                    <div className="sr-mini-box"><div className="sr-mini-key">Noise Level</div><div className="sr-mini-val" style={{ color: stateColor }}>{analysis.noise_level}</div><div className="sr-mini-sub" style={{ color: noiseLevelLabel(analysis.noise_level).color }}>{noiseLevelLabel(analysis.noise_level).label}</div></div>
                    <div className="sr-mini-box"><div className="sr-mini-key">Clarity</div><div className="sr-mini-val" style={{ color: '#4ade80' }}>{analysis.clarity_score}</div><div className="sr-mini-sub" style={{ color: 'rgba(255,255,255,0.38)' }}>{clarityLabel(analysis.clarity_score)}</div></div>
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

            {/* カテゴリ分析 */}
            <div className="sr-card">
              <div className="sr-section-label" style={{ marginBottom: 12 }}>Category Analysis</div>
              <CategoryAnalysis balance={analysis.balance} dominant={analysis.dominant} isDark={true} />
            </div>

            {/* バランスマップ */}
            <div className="sr-card">
              <div className="sr-section-label" style={{ marginBottom: 8 }}>Balance Map</div>
              <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.25)', margin: '3px 0 12px', lineHeight: 1.5 }}>赤い破線より外側が高負荷ゾーンです</p>
              <BalanceMap balance={analysis.balance} dominant={analysis.dominant} isDark={true} fillColor={stateColor} />
            </div>

            {/* AI Advice */}
            <div className="sr-card" style={{ borderLeft: `3px solid ${stateColor}` }}>
              <div className="sr-section-label" style={{ color: stateColor, opacity: 0.85 }}>AI Advice</div>
              <p className="sr-advice-intro">あなたが書いた内容をもとにした、今この瞬間へのアドバイスです</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {analysis.advice.split('。').filter(s => s.trim()).map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, fontSize: 9, fontWeight: 800, background: `${stateColor}18`, border: `1px solid ${stateColor}38`, color: stateColor }}>{i + 1}</div>
                    <p className="sr-advice-text">{s}。</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ボタン */}
            <div className="sr-btn-row">
              <button type="button" onClick={handleReset} className="sr-btn-reset">もう一度書く</button>
              <button type="button" onClick={handleSave} className="sr-btn-save">保存して完了</button>
            </div>
          </div>
        </>
      )}

      {/* ナビゲーションボタン（step 1〜5） */}
      {step > 0 && step < 5 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', background: '#0d0f1a', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, zIndex: 100 }}>
          <button type="button" onClick={() => setStep(s => s - 1)}
            style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <ChevronLeft size={15} /> 戻る
          </button>
          <button type="button" onClick={() => setStep(s => s + 1)}
            style={{ flex: 2, padding: '11px 0', borderRadius: 10, background: '#4f46e5', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            {step === 4 ? '完了へ' : '次へ'} <ChevronRight size={15} />
          </button>
        </div>
      )}

      <style>{`@keyframes dtSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [step, text, loading, extractedItems, organizedGroups, taggedItems, analysis, isDemoFallback, stateColor])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* タブバー */}
      <div className="page-tab-bar">
        <button type="button" className={`page-tab-btn${hubTab === 'detox' ? ' active' : ''}`} onClick={() => setHubTab('detox')}>デトックス</button>
        <button type="button" className={`page-tab-btn${hubTab === 'records' ? ' active' : ''}`} onClick={() => setHubTab('records')}>記録</button>
        <button type="button" className={`page-tab-btn${hubTab === 'analysis' ? ' active' : ''}`} onClick={() => setHubTab('analysis')}>分析</button>
      </div>

      {hubTab === 'detox' && renderDetoxTab()}

      {/* 記録タブ */}
      {hubTab === 'records' && (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 14, lineHeight: 2 }}>
              まだ記録がありません。<br />「デトックス」タブからセッションを始めましょう。
            </div>
          ) : (
            <>
              <div className="card" style={{ padding: '18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>今日のコンディション</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <HubScoreRing score={todaySession?.analysis.clarity_score ?? 0} noSession={!todaySession} />
                  <div style={{ flex: 1 }}>
                    {todaySession ? (
                      <>
                        <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'var(--primary-lt)', color: 'var(--primary)', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{todaySession.analysis.noise_state}</div>
                        <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7, marginBottom: 12 }}>{todaySession.analysis.summary}</p>
                      </>
                    ) : <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.6, marginBottom: 12 }}>今日はまだ未記録です</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg3)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)' }}><Flame size={11} color="var(--primary)" /><span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{streak}日連続</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg3)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)' }}><BarChart2 size={11} color="var(--primary)" /><span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{sessions.length}回</span></div>
                    </div>
                  </div>
                </div>
                {todaySession && <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'var(--primary-lt)', borderLeft: '3px solid var(--primary)', fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7 }}>{todaySession.analysis.advice}</div>}
              </div>

              <div className="card" style={{ padding: '18px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>週間スコア</div>
                <HubWeekBars sessions={sessions} />
              </div>

              <div className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>直近の記録</div>
                  <Link href="/history" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>すべて <ChevronRight size={13} /></Link>
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
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{new Date(s.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* 分析タブ */}
      {hubTab === 'analysis' && (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
          {!avgBalance ? (
            <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 14, lineHeight: 2 }}>記録を積み重ねると分析が表示されます</div>
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
        </div>
      )}
    </div>
  )
}
