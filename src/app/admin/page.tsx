import { supabase } from '@/lib/supabase'
import Link from 'next/link'

async function getStats() {
  const [sessions, reports, invites, checkins] = await Promise.all([
    supabase.from('sessions').select('user_id, created_at, analysis').order('created_at', { ascending: false }).limit(200),
    supabase.from('reports').select('id, client_code, session_date, theme').order('created_at', { ascending: false }).limit(5),
    supabase.from('invite_codes').select('id, code, client_name, is_active'),
    supabase.from('checkins').select('user_id, date, mood').order('date', { ascending: false }).limit(100),
  ])
  return {
    sessions: sessions.data ?? [],
    reports:  reports.data  ?? [],
    invites:  invites.data  ?? [],
    checkins: checkins.data ?? [],
  }
}

export default async function DashboardPage() {
  const { sessions, reports, invites, checkins } = await getStats()

  const clientIds     = [...new Set(sessions.map(s => s.user_id))]
  const activeInvites = invites.filter(i => i.is_active).length
  const recentSessions = sessions.slice(0, 5)
  const avgScore = sessions.length
    ? Math.round(sessions.slice(0, 50).reduce((a, s) => a + (s.analysis?.clarity_score ?? 0), 0) / Math.min(sessions.length, 50))
    : 0
  const today = new Date().toISOString().split('T')[0]
  const todayCheckins = checkins.filter(c => c.date === today).length

  const stats = [
    { label: 'クライアント数',       value: clientIds.length,          icon: '👥', color: '#3b82f6' },
    { label: 'レポート総数',          value: reports.length + '件',     icon: '📋', color: '#8b5cf6' },
    { label: '有効招待コード',        value: activeInvites + '件',      icon: '🔑', color: '#f59e0b' },
    { label: '今日のチェックイン',    value: todayCheckins + '件',      icon: '✅', color: '#22c55e' },
    { label: '平均スコア（直近50件）', value: avgScore,                  icon: '📊', color: '#0ea5e9' },
  ]

  return (
    <div>
      <div className="page-title">ダッシュボード</div>
      <div className="page-sub">Clarity コーチ管理画面</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>最新セッション</div>
            <Link href="/admin/clients" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}>すべて見る →</Link>
          </div>
          <table>
            <thead><tr><th>ユーザー</th><th>スコア</th><th>状態</th><th>日時</th></tr></thead>
            <tbody>
              {recentSessions.map(s => (
                <tr key={s.created_at + s.user_id}>
                  <td style={{ fontSize: 11, color: 'var(--text-faint)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.user_id}</td>
                  <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.analysis?.clarity_score ?? '--'}</span></td>
                  <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--primary-lt)', color: 'var(--primary)' }}>{s.analysis?.noise_state ?? '--'}</span></td>
                  <td style={{ fontSize: 11, color: 'var(--text-faint)' }}>{new Date(s.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</td>
                </tr>
              ))}
              {recentSessions.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '24px 0' }}>まだデータがありません</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>最新レポート</div>
            <Link href="/admin/reports/new" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}>＋ 新規作成</Link>
          </div>
          <table>
            <thead><tr><th>クライアント</th><th>テーマ</th><th>日付</th></tr></thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', fontWeight: 700 }}>{r.client_code}</span></td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.theme}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-faint)' }}>{r.session_date}</td>
                </tr>
              ))}
              {reports.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '24px 0' }}>まだレポートがありません</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
