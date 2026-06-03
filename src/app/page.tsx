'use client'
import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { Brain, ChevronRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { DetoxSession, BalanceKey, ClarityReport } from '@/lib/types'

const NOISE_COLORS: Record<string, string> = {
  'クリア': '#16a34a', '安定': '#0891b2', '整理中': '#6366f1',
  '散乱': '#d97706', '混雑': '#e11d48',
}
const BALANCE_COLORS: Record<BalanceKey, string> = {
  '感情過多': '#e11d48', 'タスク過多': '#6366f1', '不安過多': '#d97706',
  '情報過多': '#0891b2', '思考ループ': '#8b5cf6', '行動不足': '#94a3b8',
}
const BALANCE_KEYS = Object.keys(BALANCE_COLORS) as BalanceKey[]
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function calcStreak(sessions: DetoxSession[]) {
  if (!sessions.length) return 0
  const dates = new Set(sessions.map(s => s.created_at.split('T')[0]))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 366; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    if (dates.has(d.toISOString().split('T')[0])) streak++
    else if (streak > 0) break
  }
  return streak
}

// ── スコアリング（フィットネスアプリ風） ─────────────────
function ScoreRing({ score, noSession }: { score: number; noSession?: boolean }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setDisplay(score), 120)
    return () => clearTimeout(t)
  }, [score])

  const R = 86
  const CIRC = 2 * Math.PI * R
  const offset = CIRC - (display / 100) * CIRC

  return (
    <div style={{ position: 'relative', width: 214, height: 214 }}>
      <svg width={214} height={214} viewBox="0 0 214 214"
        style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={107} cy={107} r={R} fill="none"
          stroke="rgba(180,149,108,0.18)" strokeWidth={18} />
        <circle cx={107} cy={107} r={R} fill="none"
          stroke="#b4956c" strokeWidth={18}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        <Brain size={26} color="rgba(180,149,108,0.7)" strokeWidth={1.8} />
        {noSession ? (
          <div style={{ fontSize: 13, color: '#8a7060', textAlign: 'center', lineHeight: 1.6, marginTop: 6, padding: '0 16px' }}>
            今日はまだ<br />未記録です
          </div>
        ) : (
          <>
            <div style={{ fontSize: 54, fontWeight: 900, color: '#3d2010', lineHeight: 1, letterSpacing: '-2px' }}>{display}</div>
            <div style={{ fontSize: 15, color: '#8a7060' }}>/100</div>
            <div style={{ fontSize: 12, color: '#a89a8a', marginTop: 2 }}>達成率 {display}%</div>
          </>
        )}
      </div>
    </div>
  )
}

// ── 週間棒グラフ ──────────────────────────────────────────
function WeekBars({ sessions }: { sessions: DetoxSession[] }) {
  const today = new Date().toISOString().split('T')[0]
  const bars = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    const s = sessions.find(s => s.created_at.startsWith(key))
    return { label: DAY_LABELS[d.getDay()], isToday: key === today, session: s }
  }), [sessions, today])

  const prevWeekScore = useMemo(() => {
    const scores = bars.filter(b => !b.isToday && b.session).map(b => b.session!.analysis.clarity_score)
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  }, [bars])

  const todayScore = bars.find(b => b.isToday)?.session?.analysis.clarity_score ?? null
  const diff = todayScore !== null && prevWeekScore !== null ? todayScore - prevWeekScore : null

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12, color: 'var(--text-faint)' }}>
        <span>先週比: <strong style={{ color: diff !== null ? (diff >= 0 ? 'var(--green)' : 'var(--rose)') : 'var(--text-faint)' }}>
          {diff !== null ? (diff >= 0 ? `+${diff}` : diff) : '--'}
        </strong></span>
        <span>昨日比: <strong style={{ color: 'var(--text-faint)' }}>--</strong></span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 72 }}>
        {bars.map(({ label, isToday, session }, i) => {
          const score = session?.analysis.clarity_score ?? 0
          const barH = session ? Math.max(5, (score / 100) * 54) : 2
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: '100%', height: 54, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{
                  width: '100%', height: barH, borderRadius: '4px 4px 0 0',
                  background: isToday ? 'var(--primary)' : session ? (NOISE_COLORS[session.analysis.noise_state] ?? 'var(--primary)') : '#e8ecf5',
                  opacity: isToday ? 1 : session ? 0.7 : 1,
                }} />
              </div>
              <div style={{ fontSize: 10, color: isToday ? 'var(--primary)' : '#bbb', fontWeight: isToday ? 700 : 400 }}>
                {label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── バランスレーダー ──────────────────────────────────────
function BalanceRadar({ sessions }: { sessions: DetoxSession[] }) {
  const avg = useMemo(() => BALANCE_KEYS.reduce<Record<string, number>>((acc, k) => {
    acc[k] = Math.round(sessions.reduce((s, sess) => s + (sess.analysis.balance[k] ?? 0), 0) / sessions.length)
    return acc
  }, {}), [sessions])

  const size = 180, cx = 90, cy = 90, maxR = 64, labelR = 78
  const n = BALANCE_KEYS.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) })
  const short = (k: string) => k.replace('過多', '').replace('ループ', '').replace('不足', '')
  const dataPoints = BALANCE_KEYS.map((k, i) => { const p = pt((avg[k] / 100) * maxR, i); return `${p.x},${p.y}` }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {[25, 50, 75, 100].map(lv => {
        const pts = BALANCE_KEYS.map((_, i) => { const p = pt((lv / 100) * maxR, i); return `${p.x},${p.y}` }).join(' ')
        return <polygon key={lv} points={pts} fill="none" stroke="#e5e8f0" strokeWidth="1" />
      })}
      {BALANCE_KEYS.map((_, i) => { const p = pt(maxR, i); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e5e8f0" strokeWidth="1" /> })}
      <polygon points={dataPoints} fill="var(--primary)" opacity="0.15" stroke="var(--primary)" strokeWidth="2" />
      {BALANCE_KEYS.map((k, i) => { const p = pt((avg[k] / 100) * maxR, i); return <circle key={i} cx={p.x} cy={p.y} r={4} fill={BALANCE_COLORS[k]} stroke="#fff" strokeWidth="1.5" /> })}
      {BALANCE_KEYS.map((k, i) => {
        const p = pt(labelR, i)
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#9ca3af">{short(k)}</text>
      })}
    </svg>
  )
}

// ── ホームページ ──────────────────────────────────────────
const REPORT_AXES = ['自己理解度', '感情理解度', '課題認識度', '原因理解度', '本音把握度', '方向性明確度', '自己受容度', '行動明確度'] as const

function ReportRadar({ scores }: { scores: Record<string, number> }) {
  const cx = 90, cy = 90, maxR = 64, labelR = 78
  const n = REPORT_AXES.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) })
  const dataPath = REPORT_AXES.map((k, i) => {
    const p = pt(((scores[k] ?? 1) / 5) * maxR, i)
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ') + 'Z'
  return (
    <svg width={180} height={180} viewBox="0 0 180 180" style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}>
      {[1,2,3,4,5].map(lv => {
        const pts = REPORT_AXES.map((_, i) => { const p = pt((lv/5)*maxR, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
        return <polygon key={lv} points={pts} fill="none" stroke={lv===5?'#e0d8ce':'#ece8e0'} strokeWidth={lv===5?1.5:0.8} />
      })}
      {REPORT_AXES.map((_, i) => { const p = pt(maxR, i); return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#ece8e0" strokeWidth="1" /> })}
      <path d={dataPath} fill="var(--primary)" fillOpacity="0.2" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
      {REPORT_AXES.map((k, i) => { const r = ((scores[k]??1)/5)*maxR; const p = pt(r, i); return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--primary)" stroke="#fff" strokeWidth="1.5" /> })}
      {REPORT_AXES.map((k, i) => {
        const p = pt(labelR, i)
        return <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill="#8a7060">{k.replace('度','')}</text>
      })}
    </svg>
  )
}

function ReportCard({ report }: { report: ClarityReport }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginBottom: 3 }}>{report.session_date}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>【{report.theme}】</div>
        </div>
        <ChevronRight size={16} color="var(--primary)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ padding: '0 16px 20px', borderTop: '1px solid var(--border)' }}>
          {/* レーダーチャート */}
          {Object.keys(report.scores).length > 0 && (
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 12, letterSpacing: '0.5px' }}>8軸スコア</div>
              <ReportRadar scores={report.scores} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12 }}>
                {REPORT_AXES.map(axis => (
                  <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, fontSize: 11, color: 'var(--text-sub)' }}>{axis}</div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(n => <div key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: n <= (report.scores[axis]??0) ? 'var(--primary)' : 'var(--border)' }} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.current_state && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 6, letterSpacing: '0.5px' }}>■ 現在の状態</div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.8 }}>{report.current_state}</p>
              {report.core_theme && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--primary-lt)', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>◆ {report.core_theme}</div>}
            </div>
          )}

          {report.thinking_patterns.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 8, letterSpacing: '0.5px' }}>■ 思考パターン</div>
              {report.thinking_patterns.map((p, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>◆ {p.title}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7 }}>{p.description}</p>
                </div>
              ))}
            </div>
          )}

          {report.natural_strengths.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 8, letterSpacing: '0.5px' }}>■ 本来の魅力</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {report.natural_strengths.map((s, i) => <span key={i} style={{ padding: '4px 12px', borderRadius: 20, background: 'var(--primary-lt)', color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>✓ {s}</span>)}
              </div>
            </div>
          )}

          {report.word_conversions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 8, letterSpacing: '0.5px' }}>■ 言葉の変換</div>
              {report.word_conversions.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--bg3)', fontSize: 12, color: 'var(--text-sub)' }}>{w.before}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>→</span>
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--primary-lt)', fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{w.after}</span>
                </div>
              ))}
            </div>
          )}

          {report.challenges.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 8, letterSpacing: '0.5px' }}>■ 今後の課題</div>
              {report.challenges.map((c, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text)', marginBottom: 5 }}>□ {c}</div>)}
            </div>
          )}

          {report.overall && (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg3)', borderLeft: '3px solid var(--primary)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 6, letterSpacing: '0.5px' }}>■ 総評</div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.8 }}>{report.overall}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const { sessions, currentUser } = useStore()
  const [tab, setTab] = useState<'dashboard' | 'balance' | 'reports'>('dashboard')
  const [reports, setReports] = useState<ClarityReport[]>([])
  const [reportsLoaded, setReportsLoaded] = useState(false)
  const streak = useMemo(() => calcStreak(sessions), [sessions])

  useEffect(() => {
    if (tab !== 'reports' || reportsLoaded || !currentUser) return
    supabase.from('reports').select('*').eq('client_code', currentUser.name).order('session_date', { ascending: false })
      .then(({ data }) => { if (data) setReports(data as ClarityReport[]); setReportsLoaded(true) })
  }, [tab, reportsLoaded, currentUser])
  const avgScore = sessions.length
    ? Math.round(sessions.slice(0, 10).reduce((a, s) => a + s.analysis.clarity_score, 0) / Math.min(sessions.length, 10))
    : null
  const today = new Date().toISOString().split('T')[0]
  const todaySession = sessions.find(s => s.created_at.startsWith(today))

  /* ── オンボーディング ── */
  if (!sessions.length) {
    return (
      <div>
        <div style={{ background: 'var(--primary)', padding: '32px 20px 36px', borderRadius: '0 0 32px 32px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 75% 20%, rgba(255,255,255,0.15) 0%, transparent 55%)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 20 }}>
            {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
          <div className="breathing-orb" style={{ width: 72, height: 72, margin: '0 auto 20px' }} />
          <div style={{
            display: 'inline-block',
            padding: '14px 28px', borderRadius: 20, marginBottom: 8,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>脳内デトックス</div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }}>
            頭の中を整理して、前に進める状態をつくる。
          </p>
        </div>

        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/detox" className="btn-pill" style={{ textDecoration: 'none' }}>
            <Brain size={18} /> 最初のデトックスを始める
          </Link>
          {[
            { emoji: '🧠', title: '脳内ノイズ分析', desc: 'AIが頭の混雑度を0–100でスキャン' },
            { emoji: '🎯', title: 'バランスマップ', desc: '6軸レーダーで思考の偏りを確認' },
            { emoji: '📈', title: 'スコア記録', desc: '毎日のスコアをグラフで振り返る' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>{emoji}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── ダッシュボード ── */
  return (
    <div style={{ background: 'var(--bg)' }}>

      {/* ─── ヒーロー（薄いベージュ） ─── */}
      <div style={{ background: 'linear-gradient(160deg, #fdf8f2 0%, #f2e6d8 100%)', padding: '18px 20px 24px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid #ece0d0' }}>

        {/* ヘッダー行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(180,149,108,0.15)', fontSize: 12, color: '#b4956c', fontWeight: 700 }}>
            🔥 {streak}日連続
          </div>
          <div style={{ fontSize: 12, color: '#8a7060', fontWeight: 500 }}>
            {new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })}
          </div>
          {/* 設定へのリンク */}
          <Link href="/settings" style={{ textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', background: '#fff', border: '1.5px solid rgba(180,149,108,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/clarity-logo.png" alt="設定" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            </div>
          </Link>
        </div>

        {/* リング */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <ScoreRing score={todaySession?.analysis.clarity_score ?? 0} noSession={!todaySession} />
        </div>

        {/* 統計バー */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: '連続記録', value: `${streak}日`, icon: '🔥' },
            { label: '総セッション', value: `${sessions.length}回`, icon: '📊' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: 'rgba(180,149,108,0.12)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#3d2010', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: '#8a7060', marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CTAボタン ─── */}
      <div style={{ padding: '14px 16px', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <Link href="/detox" className="btn-pill" style={{ textDecoration: 'none' }}>
          <Brain size={18} />
          {todaySession ? 'もう一度デトックスする' : '脳内デトックスを始める'}
        </Link>
      </div>

      {/* ─── タブナビ ─── */}
      <div className="page-tab-bar">
        <button className={`page-tab-btn${tab === 'dashboard' ? ' active' : ''}`} onClick={() => setTab('dashboard')}>
          ダッシュボード
        </button>
        <button className={`page-tab-btn${tab === 'balance' ? ' active' : ''}`} onClick={() => setTab('balance')}>
          バランス
        </button>
        <button className={`page-tab-btn${tab === 'reports' ? ' active' : ''}`} onClick={() => setTab('reports')}>
          レポート
        </button>
      </div>

      {/* ─── ダッシュボードタブ ─── */}
      {tab === 'dashboard' && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* 今日のコンディション */}
          {todaySession && (
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>今日のコンディション</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: 20, background: `${NOISE_COLORS[todaySession.analysis.noise_state] ?? '#6366f1'}15`, color: NOISE_COLORS[todaySession.analysis.noise_state] ?? '#6366f1', fontSize: 13, fontWeight: 700, border: `1px solid ${NOISE_COLORS[todaySession.analysis.noise_state] ?? '#6366f1'}30` }}>
                  {todaySession.analysis.noise_state}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>ノイズ <strong>{todaySession.analysis.noise_level}</strong></span>
                {todaySession.analysis.dominant && (
                  <span style={{ padding: '3px 10px', borderRadius: 10, background: `${BALANCE_COLORS[todaySession.analysis.dominant]}15`, color: BALANCE_COLORS[todaySession.analysis.dominant], fontSize: 11, fontWeight: 600 }}>
                    {todaySession.analysis.dominant}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7, marginBottom: 10 }}>{todaySession.analysis.summary}</p>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--primary-lt)', borderLeft: '3px solid var(--primary)', fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                💡 {todaySession.analysis.advice}
              </div>
            </div>
          )}

          {/* 今週の整理スコア */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>📊 整理スコア</div>
              <Link href="/history" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                全記録 <ChevronRight size={13} />
              </Link>
            </div>
            <WeekBars sessions={sessions} />
          </div>

          {/* 直近セッション */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>直近の記録</div>
              <Link href="/history" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                すべて見る <ChevronRight size={13} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sessions.slice(0, 3).map((s, i) => {
                const c = NOISE_COLORS[s.analysis.noise_state] ?? '#6366f1'
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ minWidth: 44, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{s.analysis.clarity_score}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>スコア</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ padding: '2px 8px', borderRadius: 8, background: `${c}15`, color: c, fontSize: 11, fontWeight: 700 }}>{s.analysis.noise_state}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                        {new Date(s.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>ノイズ {s.analysis.noise_level}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ height: 4 }} />
        </div>
      )}

      {/* ─── バランスタブ ─── */}
      {tab === 'balance' && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, alignSelf: 'flex-start', marginBottom: 16 }}>バランスマップ（平均）</div>
            <BalanceRadar sessions={sessions} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', marginTop: 16 }}>
              {BALANCE_KEYS.map(k => {
                const avg = Math.round(sessions.reduce((s, sess) => s + (sess.analysis.balance[k] ?? 0), 0) / sessions.length)
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: BALANCE_COLORS[k], flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 11, color: 'var(--text-sub)' }}>{k}</div>
                    <div style={{ width: 60, height: 5, borderRadius: 3, background: '#e8ecf5', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${avg}%`, background: BALANCE_COLORS[k] }} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: BALANCE_COLORS[k], minWidth: 24, textAlign: 'right' }}>{avg}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 平均スコア */}
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 6 }}>過去10回の平均整理スコア</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{avgScore ?? '--'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>/100</div>
          </div>

          <div style={{ height: 4 }} />
        </div>
      )}

      {/* ─── レポートタブ ─── */}
      {tab === 'reports' && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!reportsLoaded ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontSize: 13 }}>読み込み中...</div>
          ) : reports.length === 0 ? (
            <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>まだレポートがありません</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>コーチからのレポートが届くとここに表示されます</div>
            </div>
          ) : (
            reports.map(r => <ReportCard key={r.id} report={r} />)
          )}
          <div style={{ height: 4 }} />
        </div>
      )}
    </div>
  )
}
