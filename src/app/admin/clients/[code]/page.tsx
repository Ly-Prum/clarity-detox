import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const MOOD_EMOJI  = ['', '😔', '😐', '🙂', '😊', '🌟']
const MOOD_COLOR  = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
const NOISE_COLOR: Record<string, string> = {
  'クリア': '#16a34a', '安定': '#0891b2', '整理中': '#6366f1', '散乱': '#d97706', '混雑': '#e11d48',
}

function ScoreLine({ sessions }: { sessions: { analysis: { clarity_score: number }; created_at: string }[] }) {
  if (sessions.length < 2) return null
  const data = sessions.slice(0, 20).reverse()
  const max = 100, w = 400, h = 80
  const xs = data.map((_, i) => (i / (data.length - 1)) * w)
  const ys = data.map(s => h - (s.analysis.clarity_score / max) * h)
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 400, height: 80 }}>
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={3.5} fill="#3b82f6" />)}
    </svg>
  )
}

export default async function ClientDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const userId = decodeURIComponent(code)

  const [sessions, checkins, notes, reports] = await Promise.all([
    supabase.from('sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
    supabase.from('checkins').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(14),
    supabase.from('coaching_notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('reports').select('*').eq('client_code', userId).order('session_date', { ascending: false }),
  ])

  const s = sessions.data ?? []
  const c = checkins.data ?? []
  const n = notes.data ?? []
  const r = reports.data ?? []
  const avgScore = s.length ? Math.round(s.reduce((a, x) => a + (x.analysis?.clarity_score ?? 0), 0) / s.length) : 0

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/clients" style={{ fontSize: 12, color: 'var(--text-faint)', textDecoration: 'none' }}>← クライアント一覧</Link>
        <div className="page-title" style={{ marginTop: 8 }}>{userId}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'セッション数', value: s.length + '回' },
          { label: '平均スコア',   value: avgScore + '/100' },
          { label: 'チェックイン', value: c.length + '回' },
          { label: 'レポート',     value: r.length + '件' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📊 スコア推移（直近20回）</div>
          <ScoreLine sessions={s} />
          <div style={{ marginTop: 12 }}>
            {s.slice(0, 5).map(sess => (
              <div key={sess.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)', minWidth: 36 }}>{sess.analysis?.clarity_score}</span>
                <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 8, background: `${NOISE_COLOR[sess.analysis?.noise_state] ?? '#6366f1'}15`, color: NOISE_COLOR[sess.analysis?.noise_state] ?? '#6366f1' }}>
                  {sess.analysis?.noise_state}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 'auto' }}>
                  {new Date(sess.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>✅ チェックイン（直近14日）</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {c.slice(0, 14).map(ck => (
              <div key={ck.date} title={ck.date} style={{ textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: MOOD_COLOR[ck.mood], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {MOOD_EMOJI[ck.mood]}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>
                  {new Date(ck.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                </div>
              </div>
            ))}
            {c.length === 0 && <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>記録なし</div>}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📓 コーチングノート（直近）</div>
          {n.length === 0 && <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>記録なし</div>}
          {n.slice(0, 3).map(note => {
            const content = note.content as Record<string, string | string[]>
            const isSelf = note.type === 'self_acceptance'
            return (
              <div key={note.id} style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                  {isSelf ? '🌱 自己受容' : '✨ 許可'} · {new Date(note.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.6 }}>
                  {isSelf
                    ? (content.message as string || content.state as string || '')
                    : ((content.permissions as string[])?.slice(0, 2).map(p => `私は、${p}`).join(' / ') ?? '')}
                </div>
              </div>
            )
          })}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>📋 レポート</div>
            <Link href={`/admin/reports/new?client=${encodeURIComponent(userId)}`} style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>＋ 新規作成</Link>
          </div>
          {r.length === 0 && <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>レポートなし</div>}
          {r.map(rep => (
            <div key={rep.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{rep.theme}</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{rep.session_date}</div>
              </div>
              <Link href={`/admin/reports/${rep.id}`} style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}>詳細</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
