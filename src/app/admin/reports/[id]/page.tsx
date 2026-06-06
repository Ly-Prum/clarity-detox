import { supabase } from '@/lib/supabase'
import { ReportRadarChart, AXES } from '@/components/ReportRadarChart'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: report } = await supabase.from('reports').select('*').eq('id', id).maybeSingle()
  if (!report) notFound()

  const scores   = (report.scores ?? {}) as Record<string, number>
  const patterns = (report.thinking_patterns ?? []) as { title: string; description: string }[]
  const strengths = (report.natural_strengths ?? []) as string[]
  const wordConv = (report.word_conversions ?? []) as { before: string; after: string }[]
  const challenges = (report.challenges ?? []) as string[]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/reports" style={{ fontSize: 12, color: 'var(--text-faint)', textDecoration: 'none' }}>← レポート一覧</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
          <div>
            <div className="page-title">{report.theme}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{report.client_code} · {report.session_date}</div>
          </div>
          <Link href={`/admin/reports/new?client=${encodeURIComponent(report.client_code)}`} className="btn btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>
            ＋ 新規作成
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {(report.current_state || report.core_theme) && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.5px', marginBottom: 10, textTransform: 'uppercase' }}>現在の状態</div>
              {report.current_state && <p style={{ fontSize: 13, lineHeight: 1.85, marginBottom: report.core_theme ? 12 : 0 }}>{report.current_state}</p>}
              {report.core_theme && (
                <div style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--primary-lt)', borderLeft: '3px solid var(--primary)', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                  ◆ {report.core_theme}
                </div>
              )}
            </div>
          )}

          {patterns.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.5px', marginBottom: 12, textTransform: 'uppercase' }}>思考パターン</div>
              {patterns.map((p, i) => (
                <div key={i} style={{ marginBottom: i < patterns.length - 1 ? 14 : 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>◆ {p.title}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7 }}>{p.description}</p>
                </div>
              ))}
            </div>
          )}

          {strengths.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.5px', marginBottom: 12, textTransform: 'uppercase' }}>本来の魅力</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {strengths.map((s, i) => (
                  <span key={i} style={{ padding: '5px 14px', borderRadius: 20, background: 'var(--primary-lt)', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>✓ {s}</span>
                ))}
              </div>
            </div>
          )}

          {wordConv.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.5px', marginBottom: 12, textTransform: 'uppercase' }}>言葉の変換</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {wordConv.map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ padding: '4px 12px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-sub)' }}>{w.before}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 16 }}>→</span>
                    <span style={{ padding: '4px 12px', borderRadius: 6, background: 'var(--primary-lt)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{w.after}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {challenges.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.5px', marginBottom: 12, textTransform: 'uppercase' }}>今後の課題</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {challenges.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-faint)', flexShrink: 0 }}>□</span>{c}
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.overall && (
            <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--primary)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: 10, textTransform: 'uppercase' }}>総評</div>
              <p style={{ fontSize: 13, lineHeight: 1.85 }}>{report.overall}</p>
            </div>
          )}
        </div>

        <div style={{ position: 'sticky', top: 24 }}>
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 14, letterSpacing: '0.5px', textTransform: 'uppercase' }}>8軸スコア</div>
            <ReportRadarChart scores={scores} size={240} />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {AXES.map(axis => {
                const score = scores[axis] ?? 0
                return (
                  <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-sub)', flex: 1, textAlign: 'left' }}>{axis}</span>
                    <div style={{ width: 80, height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(score / 5) * 100}%`, background: 'var(--primary)', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', width: 20, textAlign: 'right' }}>{score}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
