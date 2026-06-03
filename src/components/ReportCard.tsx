'use client'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { ClarityReport } from '@/lib/types'

export const REPORT_AXES = ['自己理解度', '感情理解度', '課題認識度', '原因理解度', '本音把握度', '方向性明確度', '自己受容度', '行動明確度'] as const

export function ReportRadar({ scores }: { scores: Record<string, number> }) {
  const cx = 90, cy = 90, maxR = 64, labelR = 78
  const n = REPORT_AXES.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) })
  const dataPath = REPORT_AXES.map((k, i) => {
    const p = pt(((scores[k] ?? 1) / 5) * maxR, i)
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ') + 'Z'
  return (
    <svg width={180} height={180} viewBox="0 0 180 180" style={{ overflow: 'visible', display: 'block', flexShrink: 0 }}>
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

export function ReportCard({ report }: { report: ClarityReport }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginBottom: 3 }}>{report.session_date}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>【{report.theme}】</div>
        </div>
        <ChevronRight size={16} color="var(--primary)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ padding: '0 16px 20px', borderTop: '1px solid var(--border)' }}>

          {/* レーダーチャート ＋ バーグラフ */}
          {Object.keys(report.scores).length > 0 && (
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 12, letterSpacing: '0.5px' }}>■ 8軸スコア</div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <ReportRadar scores={report.scores} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  {REPORT_AXES.map(axis => {
                    const score = report.scores[axis] ?? 0
                    return (
                      <div key={axis} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>{axis}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{score} / 5</span>
                        </div>
                        <div style={{ height: 8, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(score / 5) * 100}%`, background: 'var(--primary)', borderRadius: 4, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
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
