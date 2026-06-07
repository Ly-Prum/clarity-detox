'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckSquare, Square } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ReportRadar, REPORT_AXES } from '@/components/ReportCard'
import type { ClarityReport } from '@/lib/types'

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport] = useState<ClarityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  useEffect(() => {
    supabase.from('reports').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => { if (data) setReport(data as ClarityReport); setLoading(false) })
  }, [id])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)' }}>読み込み中...</div>
  if (!report) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)' }}>レポートが見つかりません</div>

  const SectionTitle = ({ children }: { children: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, background: 'var(--primary)', borderRadius: 2 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.5px' }}>{children}</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 80px' }}>

      {/* ヘッダー */}
      <div style={{ background: 'var(--primary)', padding: '20px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 55%)', pointerEvents: 'none' }} />
        <button type="button" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '6px 14px', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
          <ArrowLeft size={14} /> 戻る
        </button>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontWeight: 500 }}>Clarity 自己分析レポート</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.4 }}>テーマ【{report.theme}】</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>作成日：{report.session_date}</div>
        {report.core_theme && (
          <div style={{ marginTop: 16, padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', display: 'inline-block' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>核となるテーマ</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>◆ {report.core_theme}</div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* 現在の状態 */}
        {report.current_state && (
          <div style={{ marginTop: 20, padding: '20px', background: 'var(--card)', borderRadius: 'var(--r)', border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <SectionTitle>現在の状態</SectionTitle>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.9, fontWeight: 400 }}>{report.current_state}</p>
          </div>
        )}

        {/* レーダーチャート */}
        {Object.keys(report.scores ?? {}).length > 0 && (
          <div style={{ marginTop: 16, padding: '20px', background: 'var(--card)', borderRadius: 'var(--r)', border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <SectionTitle>8軸スコア分析</SectionTitle>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
              <ReportRadar scores={report.scores} />
              <div style={{ flex: 1, minWidth: 200 }}>
                {REPORT_AXES.map(axis => {
                  const score = report.scores[axis] ?? 0
                  const pct = (score / 5) * 100
                  return (
                    <div key={axis} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 500 }}>{axis}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--primary)' : 'var(--rose)' }}>{score}<span style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 400 }}>/5</span></span>
                      </div>
                      <div style={{ height: 7, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--primary)' : 'var(--rose)', borderRadius: 4, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 思考パターン */}
        {(report.thinking_patterns ?? []).filter(p => p.title).length > 0 && (
          <div style={{ marginTop: 16, padding: '20px', background: 'var(--card)', borderRadius: 'var(--r)', border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <SectionTitle>思考パターン分析</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {report.thinking_patterns.filter(p => p.title).map((p, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg3)', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>◆ {p.title}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.8, fontWeight: 400 }}>{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 本来の魅力 */}
        {(report.natural_strengths ?? []).filter(Boolean).length > 0 && (
          <div style={{ marginTop: 16, padding: '20px', background: 'var(--card)', borderRadius: 'var(--r)', border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <SectionTitle>本来の魅力・強み</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {report.natural_strengths.filter(Boolean).map((s, i) => (
                <div key={i} style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--primary-lt)', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>✓</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{s}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 言葉の変換 */}
        {(report.word_conversions ?? []).filter(w => w.before).length > 0 && (
          <div style={{ marginTop: 16, padding: '20px', background: 'var(--card)', borderRadius: 'var(--r)', border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <SectionTitle>言葉の変換 — 思考を書き換える</SectionTitle>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14, fontWeight: 400 }}>これらの言葉を意識して使ってみましょう</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg4)', padding: '10px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)' }}>今の言葉</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>新しい言葉</div>
              </div>
              {report.word_conversions.filter(w => w.before).map((w, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.055)', background: i % 2 === 0 ? '#fff' : 'var(--bg3)' }}>
                  <div style={{ fontSize: 14, color: 'var(--text-sub)', fontWeight: 400 }}>{w.before}</div>
                  <div style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600 }}>{w.after}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 今後の課題 */}
        {(report.challenges ?? []).filter(Boolean).length > 0 && (
          <div style={{ marginTop: 16, padding: '20px', background: 'var(--card)', borderRadius: 'var(--r)', border: '1px solid rgba(0,0,0,0.055)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <SectionTitle>今後の課題</SectionTitle>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14, fontWeight: 400 }}>できたものにチェックを入れてみましょう</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {report.challenges.filter(Boolean).map((c, i) => (
                <button key={i} type="button" onClick={() => setChecked(prev => ({ ...prev, [i]: !prev[i] }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${checked[i] ? 'var(--primary)' : 'rgba(0,0,0,0.08)'}`, background: checked[i] ? 'var(--primary-lt)' : 'var(--bg3)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.2s' }}>
                  {checked[i]
                    ? <CheckSquare size={18} color="var(--primary)" strokeWidth={2} />
                    : <Square size={18} color="var(--text-faint)" strokeWidth={1.5} />}
                  <span style={{ fontSize: 14, color: checked[i] ? 'var(--primary)' : 'var(--text)', fontWeight: checked[i] ? 600 : 400, textDecoration: checked[i] ? 'line-through' : 'none', opacity: checked[i] ? 0.7 : 1 }}>{c}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 総評・メッセージ */}
        {report.overall && (
          <div style={{ marginTop: 16, padding: '24px 20px', borderRadius: 'var(--r)', background: 'var(--primary)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 50%)', pointerEvents: 'none' }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>総評・メッセージ</div>
            <p style={{ fontSize: 14, color: '#fff', lineHeight: 2, fontWeight: 400 }}>{report.overall}</p>
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  )
}
