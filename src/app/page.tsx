'use client'
import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { Brain, ChevronRight, Flame, BarChart2, PenLine } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { DetoxSession, BalanceKey } from '@/lib/types'

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

function ScoreRing({ score, noSession }: { score: number; noSession?: boolean }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setDisplay(score), 150)
    return () => clearTimeout(t)
  }, [score])
  const R = 76
  const CIRC = 2 * Math.PI * R
  const offset = CIRC - (display / 100) * CIRC
  return (
    <div style={{ position: 'relative', width: 192, height: 192 }}>
      <svg width={192} height={192} viewBox="0 0 192 192" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={96} cy={96} r={R} fill="none" stroke="var(--primary-lt)" strokeWidth={12} />
        <circle cx={96} cy={96} r={R} fill="none" stroke="var(--primary)" strokeWidth={12}
          strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Brain size={20} color="var(--primary)" strokeWidth={1.4} style={{ opacity: 0.7 }} />
        {noSession ? (
          <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.6, marginTop: 4 }}>まだ<br />未記録</div>
        ) : (
          <>
            <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-2px' }}>{display}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 400 }}>/100</div>
          </>
        )}
      </div>
    </div>
  )
}

function WeekBars({ sessions }: { sessions: DetoxSession[] }) {
  const today = new Date().toISOString().split('T')[0]
  const bars = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    const s = sessions.find(s => s.created_at.startsWith(key))
    return { label: DAY_LABELS[d.getDay()], isToday: key === today, session: s }
  }), [sessions, today])

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
      {bars.map(({ label, isToday, session }, i) => {
        const score = session?.analysis.clarity_score ?? 0
        const barH = session ? Math.max(8, (score / 100) * 60) : 4
        const color = isToday ? 'var(--primary)' : session ? (NOISE_COLORS[session.analysis.noise_state] ?? 'var(--primary)') : 'var(--bg4)'
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: '100%', height: 60, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%', height: barH,
                borderRadius: '6px 6px 3px 3px',
                background: color,
                opacity: isToday ? 1 : session ? 0.75 : 1,
                transition: 'height 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: isToday ? `0 2px 8px color-mix(in srgb, var(--primary) 40%, transparent)` : 'none',
              }} />
            </div>
            <div style={{ fontSize: 10, color: isToday ? 'var(--primary)' : 'var(--text-faint)', fontWeight: isToday ? 700 : 400 }}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}

function BalanceRadar({ sessions }: { sessions: DetoxSession[] }) {
  const avg = useMemo(() => BALANCE_KEYS.reduce<Record<string, number>>((acc, k) => {
    acc[k] = Math.round(sessions.reduce((s, sess) => s + (sess.analysis.balance[k] ?? 0), 0) / sessions.length)
    return acc
  }, {}), [sessions])
  const size = 180, cx = 90, cy = 90, maxR = 64, labelR = 80
  const n = BALANCE_KEYS.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) })
  const short = (k: string) => k.replace('過多', '').replace('ループ', '').replace('不足', '')
  const dataPoints = BALANCE_KEYS.map((k, i) => { const p = pt((avg[k] / 100) * maxR, i); return `${p.x},${p.y}` }).join(' ')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {[25, 50, 75, 100].map(lv => {
        const pts = BALANCE_KEYS.map((_, i) => { const p = pt((lv / 100) * maxR, i); return `${p.x},${p.y}` }).join(' ')
        return <polygon key={lv} points={pts} fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.8" />
      })}
      {BALANCE_KEYS.map((_, i) => { const p = pt(maxR, i); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth="1" /> })}
      <polygon points={dataPoints} fill="var(--primary)" opacity="0.15" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
      {BALANCE_KEYS.map((k, i) => { const p = pt((avg[k] / 100) * maxR, i); return <circle key={i} cx={p.x} cy={p.y} r={5} fill={BALANCE_COLORS[k]} stroke="#fff" strokeWidth="2" /> })}
      {BALANCE_KEYS.map((k, i) => {
        const p = pt(labelR, i)
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--text-faint)" fontWeight="600">{short(k)}</text>
      })}
    </svg>
  )
}

export default function HomePage() {
  const { sessions, currentUser } = useStore()
  const [tab, setTab] = useState<'dashboard' | 'balance'>('dashboard')
  const streak = useMemo(() => calcStreak(sessions), [sessions])
  const avgScore = sessions.length
    ? Math.round(sessions.slice(0, 10).reduce((a, s) => a + s.analysis.clarity_score, 0) / Math.min(sessions.length, 10))
    : null
  const today = new Date().toISOString().split('T')[0]
  const todaySession = sessions.find(s => s.created_at.startsWith(today))
  const name = currentUser?.name?.replace('@clarity.app', '') ?? ''

  /* ── オンボーディング ── */
  if (!sessions.length) {
    return (
      <div style={{ minHeight: '100vh' }}>
        {/* ヒーロー */}
        <div style={{ background: 'var(--primary)', padding: '52px 24px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 20%, rgba(255,255,255,0.18) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div className="breathing-orb" style={{ width: 80, height: 80, margin: '0 auto 24px', boxShadow: '0 0 40px rgba(255,255,255,0.3)' }} />
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 10, letterSpacing: '-0.5px' }}>脳内デトックス</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>頭の中を整理して、<br />前に進める状態をつくる。</p>
        </div>
        <div style={{ padding: '24px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/detox" className="btn-pill" style={{ textDecoration: 'none' }}>
            <Brain size={18} /> 最初のデトックスを始める
          </Link>
          {[
            { icon: <PenLine size={22} color="var(--primary)" />, title: '今日の記録（1分）', desc: '気分と今日の気づきをひとこと記録する' },
            { icon: <Brain size={22} color="var(--primary)" />, title: '頭の整理（デトックス）', desc: 'AIが思考をスキャンしてスッキリさせる' },
            { icon: <BarChart2 size={22} color="var(--primary)" />, title: 'コンディションの確認', desc: '毎日のスコアと変化をグラフで振り返る' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3, color: 'var(--text)' }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── メインダッシュボード ── */
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── ガラスヘッダー ── */}
      <div style={{
        background: 'rgba(255,255,255,0.72)',
        WebkitBackdropFilter: 'blur(24px)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        padding: '20px 20px 24px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* 上部ヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingLeft: 46 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 2, fontWeight: 400 }}>
                {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
              </div>
              {name && <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>こんにちは、{name}さん</div>}
            </div>
            <Link href="/settings" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/clarity-logo.png" alt="設定" style={{ width: 40, height: 40, objectFit: 'contain' }} />
              </div>
            </Link>
          </div>

          {/* スコアリング + 情報 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ScoreRing score={todaySession?.analysis.clarity_score ?? 0} noSession={!todaySession} />
            <div style={{ flex: 1 }}>
              {todaySession ? (
                <>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.5px' }}>今日のコンディション</div>
                  <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'var(--primary-lt)', color: 'var(--primary)', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                    {todaySession.analysis.noise_state}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7, fontWeight: 400 }}>{todaySession.analysis.summary}</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>今日はまだ未記録です</div>
                  <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.6, fontWeight: 400 }}>デトックスで今日の状態を確認しましょう</p>
                </>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg3)', padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)' }}>
                  <Flame size={12} color="var(--primary)" />
                  <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 500 }}>{streak}日連続</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg3)', padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)' }}>
                  <BarChart2 size={12} color="var(--primary)" />
                  <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 500 }}>{sessions.length}回</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── 今日できること（常時表示ガイド） ── */}
      <div style={{ padding: '14px 16px 4px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
          今日できること
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Link href="/checkin" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--card)', borderRadius: 14, border: '1.5px solid var(--border)', padding: '14px', display: 'flex', flexDirection: 'column', gap: 6, transition: 'box-shadow 0.15s' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PenLine size={16} color="var(--primary)" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>今日の記録</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.5 }}>1分。気分と今日の気づきをメモ</div>
              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>始める →</div>
            </div>
          </Link>
          <Link href="/detox" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--card)', borderRadius: 14, border: '1.5px solid var(--border)', padding: '14px', display: 'flex', flexDirection: 'column', gap: 6, transition: 'box-shadow 0.15s' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={16} color="var(--primary)" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>頭の整理</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.5 }}>AIが思考をスッキリさせてくれる</div>
              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>始める →</div>
            </div>
          </Link>
        </div>
      </div>

      {/* タブ */}
      <div className="page-tab-bar">
        <button className={`page-tab-btn${tab === 'dashboard' ? ' active' : ''}`} onClick={() => setTab('dashboard')}>記録</button>
        <button className={`page-tab-btn${tab === 'balance' ? ' active' : ''}`} onClick={() => setTab('balance')}>分析</button>
      </div>

      {/* ── ダッシュボードタブ ── */}
      {tab === 'dashboard' && (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>

          {/* 今日のアドバイス */}
          {todaySession && (
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>今日のアドバイス</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                <span style={{ padding: '4px 12px', borderRadius: 20, background: `${NOISE_COLORS[todaySession.analysis.noise_state] ?? '#6366f1'}15`, color: NOISE_COLORS[todaySession.analysis.noise_state] ?? '#6366f1', fontSize: 12, fontWeight: 700 }}>
                  {todaySession.analysis.noise_state}
                </span>
                {todaySession.analysis.dominant && (
                  <span style={{ padding: '4px 12px', borderRadius: 20, background: `${BALANCE_COLORS[todaySession.analysis.dominant]}12`, color: BALANCE_COLORS[todaySession.analysis.dominant], fontSize: 12, fontWeight: 600 }}>
                    {todaySession.analysis.dominant}
                  </span>
                )}
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--primary-lt)', borderLeft: '3px solid var(--primary)', fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7 }}>
                {todaySession.analysis.advice}
              </div>
            </div>
          )}

          {/* 週間スコア */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>週間スコア</div>
              <Link href="/history" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                全記録 <ChevronRight size={13} />
              </Link>
            </div>
            <WeekBars sessions={sessions} />
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
              const c = NOISE_COLORS[s.analysis.noise_state] ?? '#6366f1'
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${c}15`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: c, lineHeight: 1 }}>{s.analysis.clarity_score}</div>
                    <div style={{ fontSize: 8, color: c, opacity: 0.8, fontWeight: 600 }}>pt</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                      <span style={{ padding: '2px 10px', borderRadius: 20, background: `${c}15`, color: c, fontSize: 11, fontWeight: 700 }}>{s.analysis.noise_state}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                      {new Date(s.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>ノイズ {s.analysis.noise_level}</div>
                </div>
              )
            })}
          </div>
          <div style={{ height: 8 }} />
        </div>
      )}

      {/* ── バランスタブ ── */}
      {tab === 'balance' && (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
          <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, alignSelf: 'flex-start', marginBottom: 20, color: 'var(--text)' }}>バランスマップ（平均）</div>
            <BalanceRadar sessions={sessions} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 20 }}>
              {BALANCE_KEYS.map(k => {
                const avg = Math.round(sessions.reduce((s, sess) => s + (sess.analysis.balance[k] ?? 0), 0) / sessions.length)
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: BALANCE_COLORS[k], flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--text-sub)', fontWeight: 500 }}>{k}</div>
                    <div style={{ width: 80, height: 6, borderRadius: 4, background: 'var(--bg4)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${avg}%`, background: BALANCE_COLORS[k], borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: BALANCE_COLORS[k], minWidth: 28, textAlign: 'right' }}>{avg}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>過去10回の平均スコア</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: 'var(--primary)', lineHeight: 1, letterSpacing: '-2px' }}>{avgScore ?? '--'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 6 }}>/100</div>
          </div>
          <div style={{ height: 8 }} />
        </div>
      )}
    </div>
  )
}
