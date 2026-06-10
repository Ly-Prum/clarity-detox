'use client'
import { useState, useEffect } from 'react'
import { Calculator } from 'lucide-react'

// ── ドーナツグラフ ────────────────────────────────────────────
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, d) => s + Math.max(0, d.value), 0)
  if (total === 0) return null
  const r = 50, cx = 64, cy = 64, sw = 22
  let angle = -90
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 128 128" style={{ width: 120, height: 120, flexShrink: 0 }}>
        {slices.filter(d => d.value > 0).map((d, i) => {
          const pct = d.value / total
          const sweep = pct * 360
          const a1 = (Math.PI / 180) * angle
          angle += sweep
          const a2 = (Math.PI / 180) * angle
          const large = sweep > 180 ? 1 : 0
          const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
          const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
          return <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
            fill="none" stroke={d.color} strokeWidth={sw} strokeLinecap="round" />
        })}
        <text x={cx} y={cy + 5} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: 'var(--text)', fontFamily: 'inherit' }}>
          内訳
        </text>
      </svg>
      <div style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slices.filter(d => d.value > 0).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-faint)', flex: 1 }}>{d.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 定数（2024年度概算） ──────────────────────────────────────
const KENPOU  = 0.0499   // 健康保険 本人負担（東京・協会けんぽ）
const NENKIN  = 0.0915   // 厚生年金 本人負担
const KOYO    = 0.006    // 雇用保険（一般事業）
const KISO_KOJO = 480_000

function fmt(n: number) {
  return Math.abs(n).toLocaleString('ja-JP')
}

// ── 給与計算 ──────────────────────────────────────────────────
function calcSalary(monthly: number) {
  const annual = monthly * 12
  const kenpou = monthly * KENPOU
  const nenkin = monthly * NENKIN
  const koyo   = monthly * KOYO
  const shakai_m = kenpou + nenkin + koyo
  const shakai_y = shakai_m * 12

  // 給与所得控除（年額）
  let kojo: number
  if (annual <= 1_800_000)      kojo = Math.max(550_000, annual * 0.4 - 100_000)
  else if (annual <= 3_600_000) kojo = annual * 0.3 + 80_000
  else if (annual <= 6_600_000) kojo = annual * 0.2 + 440_000
  else if (annual <= 8_500_000) kojo = annual * 0.1 + 1_100_000
  else                          kojo = 1_950_000

  const kazei = Math.max(0, annual - kojo - shakai_y - KISO_KOJO)

  // 所得税（超過累進）× 復興特別所得税
  let szei: number
  if      (kazei <= 1_950_000)  szei = kazei * 0.05
  else if (kazei <= 3_300_000)  szei = kazei * 0.10 - 97_500
  else if (kazei <= 6_950_000)  szei = kazei * 0.20 - 427_500
  else if (kazei <= 9_000_000)  szei = kazei * 0.23 - 636_000
  else if (kazei <= 18_000_000) szei = kazei * 0.33 - 1_536_000
  else if (kazei <= 40_000_000) szei = kazei * 0.40 - 2_796_000
  else                          szei = kazei * 0.45 - 4_796_000
  szei *= 1.021  // 復興特別所得税

  const jzei = kazei * 0.10  // 住民税（翌年）

  const tedate_m = monthly - shakai_m - szei / 12 - jzei / 12
  return {
    kenpou:   Math.round(kenpou),
    nenkin:   Math.round(nenkin),
    koyo:     Math.round(koyo),
    shakai_m: Math.round(shakai_m),
    szei_m:   Math.round(szei / 12),
    jzei_m:   Math.round(jzei / 12),
    tedate_m: Math.round(tedate_m),
    tedate_y: Math.round(tedate_m * 12),
    rate:     Math.round((1 - tedate_m / monthly) * 100),
  }
}

// ── 個人事業計算 ──────────────────────────────────────────────
function calcFreelance(uriage: number, keihi: number, aoki: boolean) {
  const shotoku = uriage - keihi
  const aoki_kojo = aoki ? 650_000 : 100_000
  const kokuho = Math.min(Math.max(0, shotoku * 0.10), 900_000)
  const nenkin  = 17_510 * 12  // 2025年度国民年金
  const shakai  = kokuho + nenkin
  const kazei   = Math.max(0, shotoku - aoki_kojo - shakai - KISO_KOJO)

  let szei: number
  if      (kazei <= 1_950_000)  szei = kazei * 0.05
  else if (kazei <= 3_300_000)  szei = kazei * 0.10 - 97_500
  else if (kazei <= 6_950_000)  szei = kazei * 0.20 - 427_500
  else if (kazei <= 9_000_000)  szei = kazei * 0.23 - 636_000
  else if (kazei <= 18_000_000) szei = kazei * 0.33 - 1_536_000
  else                          szei = kazei * 0.40 - 2_796_000
  szei *= 1.021

  const jzei = kazei * 0.10
  const net  = shotoku - shakai - szei - jzei
  const shohizei = uriage >= 10_000_000 ? Math.round(uriage * 0.10) : null

  return {
    shotoku:    Math.round(shotoku),
    kokuho:     Math.round(kokuho),
    nenkin,
    shakai:     Math.round(shakai),
    szei:       Math.round(szei),
    jzei:       Math.round(jzei),
    net:        Math.round(net),
    kazei:      Math.round(kazei),
    shohizei,
  }
}

// ── スタイルヘルパー ──────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text-faint)',
  display: 'block', marginBottom: 6,
}
function Row({ label, value, accent, sub }: { label: string; value: string; accent?: boolean; sub?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: sub ? '5px 0' : '8px 0', borderBottom: '1px solid var(--border)', opacity: sub ? 0.75 : 1 }}>
      <span style={{ fontSize: sub ? 12 : 13, color: 'var(--text-faint)' }}>{label}</span>
      <span style={{ fontSize: sub ? 12 : 13, fontWeight: accent ? 800 : 600, color: accent ? 'var(--primary)' : 'var(--text)' }}>{value}</span>
    </div>
  )
}

const STORAGE_KEY = 'clarity-work-calc'

export default function WorkCalculator() {
  const [mode, setMode] = useState<'salary' | 'freelance'>('salary')

  // 給与
  const [monthly, setMonthly] = useState('')

  // 個人事業
  const [uriage, setUriage] = useState('')
  const [keihi,  setKeihi]  = useState('')
  const [aoki,   setAoki]   = useState(true)

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      if (s.monthly) setMonthly(s.monthly)
      if (s.uriage)  setUriage(s.uriage)
      if (s.keihi)   setKeihi(s.keihi)
      if (s.aoki !== undefined) setAoki(s.aoki)
    } catch { /* ignore */ }
  }, [])

  function save(updates: object) {
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...updates }))
    } catch { /* ignore */ }
  }

  const salaryResult  = monthly  ? calcSalary(Number(monthly.replace(/,/g, '')))    : null
  const freelanceResult = uriage ? calcFreelance(
    Number(uriage.replace(/,/g, '')),
    Number(keihi.replace(/,/g, '') || '0'),
    aoki
  ) : null

  return (
    <div>
      {/* モード切替 */}
      <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
        {([['salary', '給与計算'], ['freelance', '個人事業']] as const).map(([v, l]) => (
          <button key={v} type="button" onClick={() => setMode(v)}
            style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: mode === v ? 'var(--card)' : 'transparent', color: mode === v ? 'var(--primary)' : 'var(--text-faint)', boxShadow: mode === v ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s' }}>
            {l}
          </button>
        ))}
      </div>

      {mode === 'salary' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>月収（額面）</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg3)', borderRadius: 12, border: '1.5px solid var(--border)' }}>
              <span style={{ padding: '0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-faint)' }}>¥</span>
              <input
                type="number" inputMode="numeric" value={monthly}
                onChange={e => { setMonthly(e.target.value); save({ monthly: e.target.value }) }}
                placeholder="300000"
                style={{ flex: 1, padding: '10px 8px 10px 0', border: 'none', background: 'transparent', fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>東京・協会けんぽ・2025年度概算</div>
          </div>

          {salaryResult && (
            <div style={{ background: 'var(--bg3)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 10, letterSpacing: '0.4px' }}>控除内訳（月額）</div>
              <Row label="健康保険"           value={`-¥${fmt(salaryResult.kenpou)}`}     sub />
              <Row label="厚生年金"           value={`-¥${fmt(salaryResult.nenkin)}`}     sub />
              <Row label="雇用保険"           value={`-¥${fmt(salaryResult.koyo)}`}       sub />
              <Row label="社会保険合計"       value={`-¥${fmt(salaryResult.shakai_m)}`} />
              <Row label="所得税（概算）"     value={`-¥${fmt(salaryResult.szei_m)}`} />
              <Row label="住民税（翌年・概算）" value={`-¥${fmt(salaryResult.jzei_m)}`} />
              <div style={{ marginTop: 12, padding: '12px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>月々の手取り</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>¥{fmt(salaryResult.tedate_m)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>年間手取り</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>¥{fmt(salaryResult.tedate_y)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>控除率</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>約 {salaryResult.rate}%</span>
                </div>
              </div>
              {/* ドーナツグラフ */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 12 }}>月額の内訳グラフ</div>
                <DonutChart slices={[
                  { label: '手取り',   value: salaryResult.tedate_m, color: '#10b981' },
                  { label: '社会保険', value: salaryResult.shakai_m,  color: '#3b82f6' },
                  { label: '所得税',   value: salaryResult.szei_m,    color: '#ef4444' },
                  { label: '住民税',   value: salaryResult.jzei_m,    color: '#f97316' },
                ]} />
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'freelance' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>年間売上</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg3)', borderRadius: 12, border: '1.5px solid var(--border)' }}>
                <span style={{ padding: '0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-faint)' }}>¥</span>
                <input type="number" inputMode="numeric" value={uriage}
                  onChange={e => { setUriage(e.target.value); save({ uriage: e.target.value }) }}
                  placeholder="5000000"
                  style={{ flex: 1, padding: '10px 8px 10px 0', border: 'none', background: 'transparent', fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>年間経費</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg3)', borderRadius: 12, border: '1.5px solid var(--border)' }}>
                <span style={{ padding: '0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-faint)' }}>¥</span>
                <input type="number" inputMode="numeric" value={keihi}
                  onChange={e => { setKeihi(e.target.value); save({ keihi: e.target.value }) }}
                  placeholder="1000000"
                  style={{ flex: 1, padding: '10px 8px 10px 0', border: 'none', background: 'transparent', fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" onClick={() => { setAoki(a => !a); save({ aoki: !aoki }) }}
                style={{ width: 42, height: 24, borderRadius: 12, background: aoki ? 'var(--primary)' : 'var(--bg3)', border: `2px solid ${aoki ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 1, left: aoki ? 18 : 1, width: 18, height: 18, borderRadius: '50%', background: aoki ? '#fff' : 'var(--text-faint)', transition: 'all 0.2s' }} />
              </button>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>青色申告特別控除（65万円）あり</span>
            </div>
          </div>

          {freelanceResult && (
            <div style={{ background: 'var(--bg3)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 10, letterSpacing: '0.4px' }}>概算内訳（年間）</div>
              <Row label="所得（売上 − 経費）" value={`¥${fmt(freelanceResult.shotoku)}`} />
              <Row label="国民健康保険（概算）" value={`-¥${fmt(freelanceResult.kokuho)}`} sub />
              <Row label="国民年金"              value={`-¥${fmt(freelanceResult.nenkin)}`} sub />
              <Row label="所得税（概算）"        value={`-¥${fmt(freelanceResult.szei)}`} />
              <Row label="住民税（概算）"        value={`-¥${fmt(freelanceResult.jzei)}`} />
              {freelanceResult.shohizei !== null && (
                <Row label="消費税（課税事業者）" value={`-¥${fmt(freelanceResult.shohizei)}`} />
              )}
              <div style={{ marginTop: 12, padding: '12px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>年間の手残り（概算）</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: freelanceResult.net >= 0 ? 'var(--primary)' : '#ef4444' }}>
                    ¥{fmt(freelanceResult.net)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>月換算</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>¥{fmt(Math.round(freelanceResult.net / 12))}</span>
                </div>
                {freelanceResult.shohizei === null && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.5 }}>
                    ※ 売上1,000万円以下のため消費税は免税事業者として計算
                  </div>
                )}
              </div>
              {/* ドーナツグラフ */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 12 }}>年間の内訳グラフ</div>
                <DonutChart slices={[
                  { label: '手残り',   value: Math.max(0, freelanceResult.net), color: '#10b981' },
                  { label: '社会保険', value: freelanceResult.shakai,           color: '#3b82f6' },
                  { label: '所得税',   value: freelanceResult.szei,             color: '#ef4444' },
                  { label: '住民税',   value: freelanceResult.jzei,             color: '#f97316' },
                  ...(freelanceResult.shohizei ? [{ label: '消費税', value: freelanceResult.shohizei, color: '#a855f7' }] : []),
                ]} />
              </div>
            </div>
          )}

          {!freelanceResult && (
            <div style={{ padding: '28px 0', textAlign: 'center' }}>
              <Calculator size={36} color="var(--text-faint)" strokeWidth={1.2} style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
              <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>売上を入力すると計算されます</div>
            </div>
          )}

          <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.6 }}>
              ※ 社会保険・税金はあくまで概算です。実際の金額は扶養・各種控除・自治体によって異なります。税理士にご確認ください。
            </div>
          </div>
        </>
      )}
    </div>
  )
}
