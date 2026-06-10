'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckSquare, Square, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { REPORT_AXES } from '@/components/ReportCard'
import type { ClarityReport } from '@/lib/types'

// 8軸それぞれの色
const AXIS_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#14b8a6','#f97316']

const SECTION_STYLES = {
  state:      { accent: '#6366f1', light: '#eef2ff', border: '#c7d2fe', label: '現在の状態',   icon: '🔍' },
  patterns:   { accent: '#d97706', light: '#fffbeb', border: '#fde68a', label: '思考パターン', icon: '🔄' },
  strengths:  { accent: '#059669', light: '#ecfdf5', border: '#a7f3d0', label: '本来の魅力',   icon: '✨' },
  wordconv:   { accent: '#0284c7', light: '#f0f9ff', border: '#bae6fd', label: '言葉の変換',   icon: '💬' },
  challenges: { accent: '#e11d48', light: '#fff1f2', border: '#fecdd3', label: '今後の課題',   icon: '🎯' },
  overall:    { accent: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe', label: '総評',         icon: '📝' },
} as const

function paras(text: string): string[] {
  const byLine = text.split(/\n+/).filter(s => s.trim())
  if (byLine.length > 1) return byLine
  return text.split('。').filter(s => s.trim()).map(s => s + '。')
}

function SectionHeader({ s }: { s: typeof SECTION_STYLES[keyof typeof SECTION_STYLES] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 16 }}>{s.icon}</span>
      <span style={{
        fontSize: 12, fontWeight: 800, letterSpacing: '0.04em',
        color: s.accent, background: s.light, border: `1px solid ${s.border}`,
        padding: '4px 12px', borderRadius: 20,
      }}>{s.label}</span>
    </div>
  )
}

// 大きくカラフルなレーダーチャート
function ColorRadar({ scores }: { scores: Record<string, number> }) {
  const SIZE = 340, cx = 170, cy = 170, maxR = 118, labelR = 145
  const n = REPORT_AXES.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) })

  const gridLevels = [1, 2, 3, 4, 5]
  const dataPath = REPORT_AXES.map((k, i) => {
    const p = pt(((scores[k] ?? 1) / 5) * maxR, i)
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ') + 'Z'

  return (
    <svg width="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible', display: 'block', maxWidth: 340, margin: '0 auto' }}>
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.12" />
        </radialGradient>
      </defs>

      {/* グリッドの多角形 */}
      {gridLevels.map(lv => {
        const pts = REPORT_AXES.map((_, i) => { const p = pt((lv/5)*maxR, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
        const isMax = lv === 5
        return (
          <polygon key={lv} points={pts}
            fill={lv === 5 ? 'rgba(99,102,241,0.03)' : 'none'}
            stroke={isMax ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.12)'}
            strokeWidth={isMax ? 1.5 : 0.8}
          />
        )
      })}

      {/* 軸ライン（各軸カラー） */}
      {REPORT_AXES.map((_, i) => {
        const p = pt(maxR, i)
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke={AXIS_COLORS[i]} strokeWidth="1.2" strokeOpacity="0.3" />
      })}

      {/* スコアレベルの数字（1〜5）を最外グリッドの右軸に */}
      {gridLevels.map(lv => {
        const p = pt((lv/5)*maxR, 0)
        return (
          <text key={lv} x={(p.x + 8).toFixed(1)} y={p.y.toFixed(1)}
            fontSize="8" fill="rgba(99,102,241,0.5)" fontWeight="600" dominantBaseline="middle">
            {lv}
          </text>
        )
      })}

      {/* データ塗りつぶし */}
      <path d={dataPath} fill="url(#radarFill)" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" />

      {/* データポイント（各軸カラー） */}
      {REPORT_AXES.map((k, i) => {
        const score = scores[k] ?? 1
        const r = (score / 5) * maxR
        const p = pt(r, i)
        const color = AXIS_COLORS[i]
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={13} fill={color} fillOpacity="0.15" />
            <circle cx={p.x} cy={p.y} r={8} fill={color} stroke="#fff" strokeWidth="2" />
            <text x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fill="#fff" fontWeight="800">{score}</text>
          </g>
        )
      })}

      {/* 軸ラベル（各軸カラー） */}
      {REPORT_AXES.map((k, i) => {
        const p = pt(labelR, i)
        const angle_deg = (i * 360 / n) - 90
        const isLeft = Math.cos((angle_deg * Math.PI) / 180) < -0.1
        const anchor = isLeft ? 'end' : Math.abs(Math.cos((angle_deg * Math.PI) / 180)) < 0.1 ? 'middle' : 'start'
        const shortLabel = k.replace('度', '')
        const color = AXIS_COLORS[i]
        return (
          <g key={i}>
            <text x={p.x.toFixed(1)} y={(p.y - 5).toFixed(1)}
              textAnchor={anchor} dominantBaseline="auto"
              fontSize="10" fill={color} fontWeight="700">{shortLabel}</text>
            <text x={p.x.toFixed(1)} y={(p.y + 7).toFixed(1)}
              textAnchor={anchor} dominantBaseline="auto"
              fontSize="8.5" fill={color} fontWeight="500" opacity="0.75">度</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { currentUser } = useStore()
  const [report, setReport] = useState<ClarityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (!currentUser) return
    const code = currentUser.inviteCode || currentUser.name
    fetch(`/api/coach-reports?id=${encodeURIComponent(id)}&code=${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then(data => { if (data && data.id) setReport(data as ClarityReport) })
      .finally(() => setLoading(false))
  }, [id, currentUser])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)' }}>読み込み中...</div>
  if (!report) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)' }}>レポートが見つかりません</div>

  const PATTERN_COLORS = ['#d97706','#ea580c','#dc2626','#7c3aed','#0284c7','#059669']

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 80px' }}>

      {/* ── ヘッダー ── */}
      <div style={{ background: 'var(--primary)', padding: '20px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        {/* 薄めに見せる白オーバーレイ */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.18)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <button type="button" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '6px 14px', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
          <ArrowLeft size={14} /> 戻る
        </button>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.5px' }}>Clarity 自己分析レポート</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6, lineHeight: 1.4 }}>【{report.theme}】</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>作成日：{report.session_date}</div>
        {report.core_theme && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', display: 'inline-block', maxWidth: '100%' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 4, letterSpacing: '0.5px' }}>核となるテーマ</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>◆ {report.core_theme}</div>
          </div>
        )}
      </div>

      {/* ライトボックス */}
      {lightbox !== null && (report.images?.length ?? 0) > 0 && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <button type="button" title="閉じる" onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} color="#fff" />
          </button>
          {lightbox > 0 && (
            <button type="button" title="前" onClick={e => { e.stopPropagation(); setLightbox(l => l! - 1) }} style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={22} color="#fff" />
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={report.images![lightbox]} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
          {lightbox < (report.images?.length ?? 0) - 1 && (
            <button type="button" title="次" onClick={e => { e.stopPropagation(); setLightbox(l => l! + 1) }} style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={22} color="#fff" />
            </button>
          )}
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {lightbox + 1} / {report.images!.length}
          </div>
        </div>
      )}

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14 }}>

        {/* ── 画像ギャラリー ── */}
        {(report.images ?? []).length > 0 && (
          <div style={{ padding: '18px', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.5px', marginBottom: 12, textTransform: 'uppercase' }}>分析資料・画像</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {report.images!.map((url, i) => (
                <button key={i} type="button" onClick={() => setLightbox(i)} style={{ border: 'none', padding: 0, cursor: 'zoom-in', borderRadius: 12, overflow: 'hidden', background: 'none', aspectRatio: '3/4', display: 'block', width: '100%' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`画像${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }}
                    onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 8軸スコア分析（大きなレーダーチャート） ── */}
        {Object.keys(report.scores ?? {}).length > 0 && (
          <div style={{ padding: '20px 16px', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>8軸スコア分析</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 20 }}>各軸 5点満点での評価</div>

            <ColorRadar scores={report.scores} />

            {/* 軸別スコアバー */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
              {REPORT_AXES.map((axis, i) => {
                const score = report.scores[axis] ?? 0
                const pct = (score / 5) * 100
                const color = AXIS_COLORS[i]
                return (
                  <div key={axis}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-sub)', fontWeight: 500 }}>{axis}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color }}>{score}<span style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 400 }}>/5</span></span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.8s ease', boxShadow: `0 0 6px ${color}60` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 現在の状態 ── */}
        {report.current_state && (() => {
          const s = SECTION_STYLES.state
          return (
            <div style={{ padding: '18px', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', borderLeft: `4px solid ${s.accent}` }}>
              <SectionHeader s={s} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {paras(report.current_state).map((p, i) => (
                  <p key={i} style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.9, margin: 0 }}>{p}</p>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── 思考パターン ── */}
        {(report.thinking_patterns ?? []).filter(p => p.title).length > 0 && (() => {
          const s = SECTION_STYLES.patterns
          return (
            <div style={{ padding: '18px', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', borderLeft: `4px solid ${s.accent}` }}>
              <SectionHeader s={s} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {report.thinking_patterns.filter(p => p.title).map((p, i) => {
                  const c = PATTERN_COLORS[i % PATTERN_COLORS.length]
                  return (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg3)', borderLeft: `3px solid ${c}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: c, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{p.title}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 30 }}>
                        {paras(p.description).map((line, j) => (
                          <p key={j} style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.85, margin: 0 }}>{line}</p>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── 本来の魅力 ── */}
        {(report.natural_strengths ?? []).filter(Boolean).length > 0 && (() => {
          const s = SECTION_STYLES.strengths
          return (
            <div style={{ padding: '18px', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', borderLeft: `4px solid ${s.accent}` }}>
              <SectionHeader s={s} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {report.natural_strengths.filter(Boolean).map((str, i) => (
                  <span key={i} style={{
                    padding: '8px 16px', borderRadius: 20,
                    background: s.light, border: `1.5px solid ${s.border}`,
                    color: s.accent, fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span>✓</span>{str}
                  </span>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── 言葉の変換 ── */}
        {(report.word_conversions ?? []).filter(w => w.before).length > 0 && (() => {
          const s = SECTION_STYLES.wordconv
          return (
            <div style={{ padding: '18px', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', borderLeft: `4px solid ${s.accent}` }}>
              <SectionHeader s={s} />
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14 }}>これらの言葉を意識して使ってみましょう</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.word_conversions.filter(w => w.before).map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ padding: '7px 14px', borderRadius: 10, background: '#fff1f2', border: '1.5px solid #fecdd3', fontSize: 13, color: '#be123c', fontWeight: 600, flexShrink: 0 }}>{w.before}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: s.accent, flexShrink: 0 }}>→</span>
                    <span style={{ padding: '7px 14px', borderRadius: 10, background: s.light, border: `1.5px solid ${s.border}`, fontSize: 13, color: s.accent, fontWeight: 700, flexShrink: 0 }}>{w.after}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── 今後の課題（チェックできる） ── */}
        {(report.challenges ?? []).filter(Boolean).length > 0 && (() => {
          const s = SECTION_STYLES.challenges
          return (
            <div style={{ padding: '18px', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', borderLeft: `4px solid ${s.accent}` }}>
              <SectionHeader s={s} />
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14 }}>できたものにチェックしてみましょう</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.challenges.filter(Boolean).map((c, i) => (
                  <button key={i} type="button"
                    onClick={() => setChecked(prev => ({ ...prev, [i]: !prev[i] }))}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${checked[i] ? s.accent : 'rgba(0,0,0,0.08)'}`, background: checked[i] ? s.light : 'var(--bg3)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.2s' }}>
                    {checked[i]
                      ? <CheckSquare size={18} color={s.accent} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                      : <Square size={18} color="var(--text-faint)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />}
                    <span style={{ fontSize: 14, color: checked[i] ? s.accent : 'var(--text)', fontWeight: checked[i] ? 600 : 400, textDecoration: checked[i] ? 'line-through' : 'none', opacity: checked[i] ? 0.75 : 1, lineHeight: 1.6 }}>{c}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── 総評・メッセージ ── */}
        {report.overall && (() => {
          const s = SECTION_STYLES.overall
          return (
            <div style={{ padding: '20px', borderRadius: 16, background: 'var(--primary)', position: 'relative', overflow: 'hidden' }}>
              {/* 薄めオーバーレイ */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 50%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.95)', background: 'rgba(255,255,255,0.22)', padding: '4px 12px', borderRadius: 20 }}>{s.label}</span>
              </div>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paras(report.overall).map((p, i) => (
                  <p key={i} style={{ fontSize: 14, color: '#fff', lineHeight: 2, margin: 0, opacity: 0.9 }}>{p}</p>
                ))}
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
