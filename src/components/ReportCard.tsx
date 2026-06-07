'use client'
import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'
import type { ClarityReport } from '@/lib/types'

export const REPORT_AXES = ['自己理解度', '感情理解度', '課題認識度', '原因理解度', '本音把握度', '方向性明確度', '自己受容度', '行動明確度'] as const

export function ReportRadar({ scores }: { scores: Record<string, number> }) {
  const cx = 100, cy = 100, maxR = 72, labelR = 86
  const n = REPORT_AXES.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) })
  const dataPath = REPORT_AXES.map((k, i) => {
    const p = pt(((scores[k] ?? 1) / 5) * maxR, i)
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ') + 'Z'
  return (
    <svg width={200} height={200} viewBox="0 0 200 200" style={{ overflow: 'visible', display: 'block' }}>
      {[1,2,3,4,5].map(lv => {
        const pts = REPORT_AXES.map((_, i) => { const p = pt((lv/5)*maxR, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
        return <polygon key={lv} points={pts} fill="none" stroke={lv===5?'rgba(0,0,0,0.12)':'rgba(0,0,0,0.06)'} strokeWidth={lv===5?1.5:0.8} />
      })}
      {REPORT_AXES.map((_, i) => { const p = pt(maxR, i); return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="rgba(0,0,0,0.07)" strokeWidth="1" /> })}
      <path d={dataPath} fill="var(--primary)" fillOpacity="0.18" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
      {REPORT_AXES.map((k, i) => { const r = ((scores[k]??1)/5)*maxR; const p = pt(r, i); return <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--primary)" stroke="#fff" strokeWidth="2" /> })}
      {REPORT_AXES.map((k, i) => {
        const p = pt(labelR, i)
        return <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--text-faint)" fontWeight="500">{k.replace('度','')}</text>
      })}
    </svg>
  )
}

export function ReportCard({ report }: { report: ClarityReport }) {
  const hasScores = Object.keys(report.scores ?? {}).length > 0
  const avgScore = hasScores
    ? Math.round(REPORT_AXES.reduce((s, k) => s + (report.scores[k] ?? 0), 0) / REPORT_AXES.length * 10) / 10
    : null

  return (
    <Link href={`/reports/${report.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, transition: 'box-shadow 0.2s' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={22} color="var(--primary)" strokeWidth={1.6} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>{report.session_date}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>【{report.theme}】</div>
          {report.core_theme && <div style={{ fontSize: 12, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>◆ {report.core_theme}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {avgScore !== null && (
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{avgScore}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-faint)' }}>/5</span></div>
          )}
          <ChevronRight size={16} color="var(--text-faint)" />
        </div>
      </div>
    </Link>
  )
}
