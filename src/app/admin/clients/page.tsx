import { supabase } from '@/lib/supabase'
import Link from 'next/link'

async function getClients() {
  const [sessions, checkins] = await Promise.all([
    supabase.from('sessions').select('user_id, created_at, analysis').order('created_at', { ascending: false }),
    supabase.from('checkins').select('user_id, date, mood').order('date', { ascending: false }),
  ])
  return { sessions: sessions.data ?? [], checkins: checkins.data ?? [] }
}

export default async function ClientsPage() {
  const { sessions, checkins } = await getClients()

  const clientMap = new Map<string, { userId: string; lastSession: string; sessionCount: number; avgScore: number; lastMood: number | null }>()

  for (const s of sessions) {
    if (!clientMap.has(s.user_id)) {
      clientMap.set(s.user_id, { userId: s.user_id, lastSession: s.created_at, sessionCount: 0, avgScore: 0, lastMood: null })
    }
    const c = clientMap.get(s.user_id)!
    c.sessionCount++
    c.avgScore += s.analysis?.clarity_score ?? 0
  }
  for (const [uid, c] of clientMap) {
    if (c.sessionCount > 0) c.avgScore = Math.round(c.avgScore / c.sessionCount)
    const ck = checkins.find(ch => ch.user_id === uid)
    if (ck) c.lastMood = ck.mood
  }

  const clients = [...clientMap.values()].sort((a, b) => new Date(b.lastSession).getTime() - new Date(a.lastSession).getTime())
  const MOOD_EMOJI = ['', '😔', '😐', '🙂', '😊', '🌟']

  return (
    <div>
      <div className="page-title">クライアント一覧</div>
      <div className="page-sub">{clients.length}名のクライアント</div>

      <div className="card">
        <table>
          <thead>
            <tr><th>ユーザー</th><th>セッション数</th><th>平均スコア</th><th>最終気分</th><th>最終記録</th><th></th></tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.userId}>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.userId}</div>
                </td>
                <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.sessionCount}</span>回</td>
                <td>
                  <span style={{ fontWeight: 700, color: c.avgScore >= 70 ? 'var(--green)' : c.avgScore >= 40 ? 'var(--amber)' : 'var(--rose)' }}>{c.avgScore}</span>
                  <span style={{ color: 'var(--text-faint)' }}>/100</span>
                </td>
                <td style={{ fontSize: 18 }}>{c.lastMood ? MOOD_EMOJI[c.lastMood] : '--'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{new Date(c.lastSession).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</td>
                <td>
                  <Link href={`/admin/clients/${encodeURIComponent(c.userId)}`} style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>詳細 →</Link>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '48px 0' }}>まだデータがありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
