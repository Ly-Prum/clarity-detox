import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function ReportsPage() {
  const { data: reports } = await supabase
    .from('reports').select('*').order('created_at', { ascending: false })
  const all = reports ?? []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="page-title">レポート管理</div>
          <div className="page-sub">{all.length}件のレポート</div>
        </div>
        <Link href="/admin/reports/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          ＋ 新規作成
        </Link>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>クライアント</th><th>テーマ</th><th>セッション日</th><th>作成日</th><th></th></tr>
          </thead>
          <tbody>
            {all.map(r => (
              <tr key={r.id}>
                <td><span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--primary-lt)', color: 'var(--primary)', fontWeight: 700 }}>{r.client_code}</span></td>
                <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{r.theme}</td>
                <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{r.session_date}</td>
                <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{new Date(r.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</td>
                <td>
                  <Link href={`/admin/reports/${r.id}`} style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>詳細</Link>
                </td>
              </tr>
            ))}
            {all.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '48px 0' }}>まだレポートがありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
