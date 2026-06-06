export const AXES = [
  '自己理解度', '感情理解度', '課題認識度', '原因理解度',
  '本音把握度', '方向性明確度', '自己受容度', '行動明確度',
] as const

// 各軸に固有の色
const AXIS_COLORS = [
  '#3b82f6', // 自己理解度  blue
  '#8b5cf6', // 感情理解度  purple
  '#ec4899', // 課題認識度  pink
  '#f97316', // 原因理解度  orange
  '#14b8a6', // 本音把握度  teal
  '#6366f1', // 方向性明確度 indigo
  '#22c55e', // 自己受容度  green
  '#f59e0b', // 行動明確度  amber
]

export function ReportRadarChart({ scores, size = 220 }: { scores: Record<string, number>; size?: number }) {
  const cx = size / 2, cy = size / 2
  const maxR = size * 0.32
  const labelR = size * 0.43
  const n = AXES.length
  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  })

  const dataPath = AXES.map((k, i) => {
    const p = pt(((scores[k] ?? 1) / 5) * maxR, i)
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ') + 'Z'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible', display: 'block' }}>
      {/* グリッド */}
      {[1, 2, 3, 4, 5].map(lv => {
        const pts = AXES.map((_, i) => {
          const p = pt((lv / 5) * maxR, i)
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
        }).join(' ')
        return (
          <polygon key={lv} points={pts} fill={lv % 2 === 0 ? 'rgba(241,245,249,0.8)' : 'none'}
            stroke={lv === 5 ? '#cbd5e1' : '#e2e8f0'} strokeWidth={lv === 5 ? 1.5 : 0.8} />
        )
      })}

      {/* 軸線 */}
      {AXES.map((_, i) => {
        const p = pt(maxR, i)
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#e2e8f0" strokeWidth={1} />
      })}

      {/* データ塗り */}
      <path d={dataPath} fill="rgba(99,102,241,0.12)" stroke="none" />

      {/* データ輪郭 */}
      <path d={dataPath} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" strokeDasharray="0" opacity={0.5} />

      {/* 各軸のドット（固有色） */}
      {AXES.map((k, i) => {
        const score = scores[k] ?? 1
        const p = pt((score / 5) * maxR, i)
        return (
          <circle key={i} cx={p.x} cy={p.y} r={5}
            fill={AXIS_COLORS[i]} stroke="#fff" strokeWidth={2} />
        )
      })}

      {/* スコア値 */}
      {AXES.map((k, i) => {
        const score = scores[k] ?? 1
        const dist = ((score / 5) * maxR) + 16
        const p = pt(dist, i)
        return (
          <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={10} fill={AXIS_COLORS[i]} fontWeight={700}>
            {score}
          </text>
        )
      })}

      {/* ラベル */}
      {AXES.map((k, i) => {
        const p = pt(labelR, i)
        const short = k.replace('度', '')
        return (
          <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={size > 180 ? 10 : 8} fill="#64748b" fontWeight={500}>
            {short}
          </text>
        )
      })}
    </svg>
  )
}

// バーグラフ付きの凡例（詳細ページ用）
export function RadarLegend({ scores }: { scores: Record<string, number> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {AXES.map((axis, i) => {
        const score = scores[axis] ?? 0
        return (
          <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: AXIS_COLORS[i], flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#475569', flex: 1 }}>{axis}</span>
            <div style={{ width: 80, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(score / 5) * 100}%`, background: AXIS_COLORS[i], borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: AXIS_COLORS[i], width: 18, textAlign: 'right' }}>{score}</span>
          </div>
        )
      })}
    </div>
  )
}
