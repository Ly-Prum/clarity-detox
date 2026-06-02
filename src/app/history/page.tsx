'use client'
import { useState, useMemo } from 'react'
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

type Period = '週' | '月' | '年'
type Tab = 'graph' | 'list'

function buildBars(sessions: DetoxSession[], period: Period) {
  if (period === '週') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().split('T')[0]
      const ds = sessions.filter(s => s.created_at.startsWith(key))
      const score = ds.length ? Math.round(ds.reduce((a, s) => a + s.analysis.clarity_score, 0) / ds.length) : 0
      const labels = ['日', '月', '火', '水', '木', '金', '土']
      return { label: labels[d.getDay()], isLatest: i === 6, score, count: ds.length, state: ds[0]?.analysis.noise_state }
    })
  }
  if (period === '月') {
    return Array.from({ length: 4 }, (_, wi) => {
      const end = new Date(); end.setDate(end.getDate() - wi * 7)
      const start = new Date(end); start.setDate(end.getDate() - 6)
      const ws = sessions.filter(s => {
        const d = s.created_at.split('T')[0]
        return d >= start.toISOString().split('T')[0] && d <= end.toISOString().split('T')[0]
      })
      const score = ws.length ? Math.round(ws.reduce((a, s) => a + s.analysis.clarity_score, 0) / ws.length) : 0
      return { label: `W${4 - wi}`, isLatest: wi === 0, score, count: ws.length, state: undefined }
    }).reverse()
  }
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const ms = sessions.filter(s => {
      const sd = new Date(s.created_at)
      return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth()
    })
    const score = ms.length ? Math.round(ms.reduce((a, s) => a + s.analysis.clarity_score, 0) / ms.length) : 0
    return { label: `${d.getMonth() + 1}月`, isLatest: i === 11, score, count: ms.length, state: undefined }
  })
}

function getDateRange(period: Period) {
  const now = new Date()
  if (period === '週') {
    const start = new Date(); start.setDate(now.getDate() - 6)
    return `${start.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}〜${now.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}`
  }
  if (period === '月') {
    const start = new Date(); start.setDate(now.getDate() - 27)
    return `${start.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}〜${now.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}`
  }
  return `${now.getFullYear()}年`
}

// ── グラフ（フィットネスアプリ風） ────────────────────────
function BarChart({ sessions, period }: { sessions: DetoxSession[]; period: Period }) {
  const bars = useMemo(() => buildBars(sessions, period), [sessions, period])
  const active = bars.filter(b => b.count > 0)
  const avgScore  = active.length ? Math.round(active.reduce((a, b) => a + b.score, 0) / active.length) : null
  const bestScore = active.length ? Math.max(...active.map(b => b.score)) : null
  const totalSessions = active.reduce((a, b) => a + b.count, 0)
  const achieveDays = active.filter(b => b.score >= 60).length
  const GOAL = 60
  const maxH = 160

  return (
    <div>
      {/* 大きな平均スコア表示 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 4 }}>平均スコア</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 44, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{avgScore ?? '--'}</span>
          <span style={{ fontSize: 14, color: 'var(--text-faint)' }}>点</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 3 }}>{getDateRange(period)}</div>
      </div>

      {/* チャート本体（Y軸 + バー） */}
      <div style={{ display: 'flex', gap: 4 }}>
        {/* Y軸 */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 20, width: 26, flexShrink: 0, height: maxH + 20 }}>
          {[100, 75, 50, 25, 0].map(v => (
            <div key={v} style={{ fontSize: 9, color: '#bbb', textAlign: 'right', lineHeight: 1 }}>{v}</div>
          ))}
        </div>

        {/* バーエリア */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* 目標ライン */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: `${((100 - GOAL) / 100) * maxH}px`, zIndex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ flex: 1, borderTop: `1px dashed var(--primary)`, opacity: 0.5 }} />
          </div>
          {/* バー群 */}
          <div style={{ display: 'flex', gap: bars.length > 8 ? 3 : 6, alignItems: 'flex-end', height: maxH + 20, paddingBottom: 20, position: 'relative', zIndex: 2 }}>
            {bars.map((bar, i) => {
              const barH = bar.count > 0 ? Math.max(4, (bar.score / 100) * maxH) : 2
              const color = bar.count > 0 ? (bar.state ? (NOISE_COLORS[bar.state] ?? 'var(--primary)') : 'var(--primary)') : '#e8ecf5'
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  {bar.count > 0 && <div style={{ fontSize: 8, color: bar.isLatest ? 'var(--primary)' : '#bbb', fontWeight: 700 }}>{bar.score}</div>}
                  <div style={{ width: '100%', height: maxH, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', height: barH, borderRadius: '4px 4px 0 0', background: color, opacity: bar.isLatest ? 1 : bar.count > 0 ? 0.6 : 1 }} />
                  </div>
                  <div style={{ fontSize: bars.length > 9 ? 8 : 10, color: bar.isLatest ? 'var(--primary)' : '#bbb', fontWeight: bar.isLatest ? 700 : 400 }}>
                    {bar.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 目標ライン凡例 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: 'var(--text-faint)' }}>
        <div style={{ width: 20, borderTop: '1px dashed var(--primary)', opacity: 0.6 }} />
        <span>整理目標 {GOAL}点</span>
      </div>

      {/* 統計4ボックス（フィットネスアプリ右画面スタイル） */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 16, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { label: '平均スコア',   value: avgScore ?? '--',        unit: '点' },
          { label: '最高スコア',   value: bestScore ?? '--',       unit: '点' },
          { label: '総セッション', value: `${totalSessions}`,      unit: '回' },
          { label: '目標達成',     value: `${achieveDays}`,        unit: '日' },
        ].map(({ label, value, unit }, i) => (
          <div key={label} style={{
            padding: '12px 14px',
            borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
            borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 3 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{value}</span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── セッションカード ──────────────────────────────────────
function SessionCard({ session, last }: { session: DetoxSession; last: boolean }) {
  const [open, setOpen] = useState(false)
  const c = NOISE_COLORS[session.analysis.noise_state] ?? '#6366f1'
  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ minWidth: 46, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{session.analysis.clarity_score}</div>
          <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>スコア</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 2 }}>
            {new Date(session.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ padding: '2px 8px', borderRadius: 8, background: `${c}15`, color: c, fontSize: 11, fontWeight: 700 }}>{session.analysis.noise_state}</span>
            <span style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: '20px' }}>ノイズ {session.analysis.noise_level}</span>
          </div>
        </div>
        <div style={{ color: '#ccc', fontSize: 14, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</div>
      </div>
      {open && (
        <div style={{ padding: '0 16px 14px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.7, marginBottom: 10 }}>{session.analysis.summary}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(Object.entries(session.analysis.balance) as [BalanceKey, number][]).map(([k, v]) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 26px', gap: '0 8px', alignItems: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{k}</div>
                <div style={{ height: 5, borderRadius: 3, background: '#e8ecf5', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${v}%`, borderRadius: 3, background: BALANCE_COLORS[k] }} />
                </div>
                <div style={{ fontSize: 10, color: BALANCE_COLORS[k], fontWeight: 700, textAlign: 'right' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 記録ページ ────────────────────────────────────────────
export default function HistoryPage() {
  const { sessions } = useStore()
  const [tab, setTab]     = useState<Tab>('graph')
  const [period, setPeriod] = useState<Period>('週')
  const [filter, setFilter] = useState('全て')

  const filtered = useMemo(() =>
    filter === '全て' ? sessions : sessions.filter(s => s.analysis.noise_state === filter),
    [sessions, filter]
  )
  const grouped = useMemo(() => {
    const acc: Record<string, DetoxSession[]> = {}
    filtered.forEach(s => {
      const date = s.created_at.split('T')[0]
      if (!acc[date]) acc[date] = []
      acc[date].push(s)
    })
    return Object.entries(acc).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  if (!sessions.length) {
    return (
      <div style={{ padding: '60px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>まだ記録がありません</div>
        <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>デトックスを行うとここに記録されます</div>
      </div>
    )
  }

  return (
    <div>
      {/* タイトル */}
      <div style={{ background: '#fff', padding: '16px 16px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>記録</div>

        {/* グラフ / リスト タブ */}
        <div style={{ display: 'flex' }}>
          {([['graph', '📊 グラフ'], ['list', '≡ リスト']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '11px 0', border: 'none', background: 'transparent',
              color: tab === t ? 'var(--primary)' : 'var(--text-faint)',
              fontSize: 13, fontWeight: tab === t ? 700 : 500,
              borderBottom: `2.5px solid ${tab === t ? 'var(--primary)' : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── グラフタブ ── */}
      {tab === 'graph' && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 期間セレクター */}
          <div className="period-selector">
            {(['週', '月', '年'] as Period[]).map(p => (
              <button key={p} className={`period-btn${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
          <div className="card" style={{ padding: '18px 14px' }}>
            <BarChart sessions={sessions} period={period} />
          </div>
          <div style={{ height: 4 }} />
        </div>
      )}

      {/* ── リストタブ ── */}
      {tab === 'list' && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* フィルター */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {(['全て', ...Object.keys(NOISE_COLORS)]).map(state => {
              const color = state === '全て' ? 'var(--primary)' : (NOISE_COLORS[state] ?? 'var(--primary)')
              const active = filter === state
              return (
                <button key={state} onClick={() => setFilter(state)} style={{
                  padding: '5px 14px', borderRadius: 20,
                  border: `1.5px solid ${active ? color : 'var(--border)'}`,
                  background: active ? `${color}12` : '#fff',
                  color: active ? color : 'var(--text-faint)',
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                }}>
                  {state}{state !== '全て' && <span style={{ marginLeft: 4, fontSize: 10 }}>{sessions.filter(s => s.analysis.noise_state === state).length}</span>}
                </button>
              )
            })}
          </div>

          {grouped.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)', fontSize: 13 }}>該当する記録がありません</div>
          ) : grouped.map(([date, daySessions]) => (
            <div key={date} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-faint)' }}>
                {new Date(date + 'T12:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
              </div>
              {daySessions.map((s, i) => (
                <SessionCard key={s.id} session={s} last={i === daySessions.length - 1} />
              ))}
            </div>
          ))}
          <div style={{ height: 4 }} />
        </div>
      )}
    </div>
  )
}
