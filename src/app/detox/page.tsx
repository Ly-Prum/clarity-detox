'use client'
import { useState, useEffect, useId } from 'react'
import type { BrainAnalysis, BalanceKey } from '@/lib/types'
import { useStore } from '@/lib/store'

const NOISE_COLORS: Record<string, string> = {
  'クリア':   '#16a34a',
  '安定':     '#0891b2',
  '整理中':   '#6366f1',
  '散乱':     '#d97706',
  '混雑':     '#e11d48',
}

const BALANCE_COLORS: Record<BalanceKey, string> = {
  '感情過多':   '#e11d48',
  'タスク過多': '#6366f1',
  '不安過多':   '#d97706',
  '情報過多':   '#0891b2',
  '思考ループ': '#8b5cf6',
  '行動不足':   '#94a3b8',
}

const DEMO_ANALYSIS: BrainAnalysis = {
  noise_level: 72,
  noise_state: '散乱',
  balance: {
    '感情過多': 65,
    'タスク過多': 80,
    '不安過多': 55,
    '情報過多': 40,
    '思考ループ': 70,
    '行動不足': 30,
  },
  dominant: 'タスク過多',
  summary: '頭の中にタスクと思考ループが混在しており、かなり散乱した状態です。一つひとつ書き出すことで整理できます。',
  advice: 'まず「今日やること」を3つだけ選んでみてください。残りは一旦脇に置きましょう。',
  clarity_score: 28,
}

function BrainGauge({ level, state }: { level: number; state: string }) {
  const uid = useId()
  const clipId = `bc${uid.replace(/[^a-zA-Z0-9]/g, '')}`
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDisplay(level), 60)
    return () => clearTimeout(t)
  }, [level])

  const color = NOISE_COLORS[state] ?? '#6366f1'
  const brainTop = 18
  const brainBottom = 142
  const fillY = brainBottom - (display / 100) * (brainBottom - brainTop)

  const outerPath = [
    'M 80,18',
    'C 68,15 52,18 40,30',
    'C 26,36 16,52 15,70',
    'C 12,86 18,102 30,114',
    'C 42,126 58,134 72,136',
    'C 76,140 78,142 80,142',
    'C 82,142 84,140 88,136',
    'C 102,134 118,126 130,114',
    'C 142,102 148,86 145,70',
    'C 144,52 134,36 120,30',
    'C 108,18 92,15 80,18 Z',
  ].join(' ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 240, height: 240 }}>
        <svg width={240} height={240} viewBox="0 0 160 160">
          <defs>
            <clipPath id={clipId}>
              <path d={outerPath} />
            </clipPath>
          </defs>
          <path d={outerPath} fill={`${color}15`} />
          <g clipPath={`url(#${clipId})`}>
            <rect x={0} y={0} width={160} height={160}
              fill={color} opacity={0.72}
              style={{ transform: `translateY(${fillY}px)`, transition: 'transform 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
          </g>
          <path d={outerPath} fill="none" stroke={`${color}60`} strokeWidth="2" />
          <path d="M 80,20 C 77,55 77,105 80,138" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
          <path d="M 36,55 C 44,51 54,56 52,67" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 20,84 C 30,80 40,85 38,96" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 38,110 C 46,106 56,111 54,120" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 124,55 C 116,51 106,56 108,67" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 140,84 C 130,80 120,85 122,96" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 122,110 C 114,106 104,111 106,120" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 46, fontWeight: 800, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.4)', lineHeight: 1 }}>{level}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.3)', marginTop: 4 }}>ノイズ量</div>
        </div>
      </div>
      <div style={{ padding: '7px 24px', borderRadius: 24, background: `${color}18`, color, fontSize: 16, fontWeight: 700, border: `1px solid ${color}44`, letterSpacing: '0.5px' }}>
        {state}
      </div>
    </div>
  )
}

function RadarChart({ balance, dominant }: { balance: Record<BalanceKey, number>; dominant: BalanceKey | null }) {
  const keys = Object.keys(balance) as BalanceKey[]
  const size = 240
  const cx = size / 2
  const cy = size / 2
  const maxR = 80
  const labelR = 100
  const n = keys.length

  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2
  const pt = (r: number, i: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  })

  const gridLevels = [25, 50, 75, 100]
  const shortLabel = (k: BalanceKey) => k.replace('過多', '').replace('ループ', '').replace('不足', '')

  const dataPoints = keys.map((k, i) => {
    const r = (balance[k] / 100) * maxR
    const p = pt(r, i)
    return `${p.x},${p.y}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {gridLevels.map(level => {
        const pts = keys.map((_, i) => { const p = pt((level / 100) * maxR, i); return `${p.x},${p.y}` }).join(' ')
        return <polygon key={level} points={pts} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      })}
      {keys.map((_, i) => {
        const p = pt(maxR, i)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      })}
      <polygon points={dataPoints} fill="rgba(99,102,241,0.12)" stroke="#6366f1" strokeWidth="2" />
      {keys.map((k, i) => {
        const r = (balance[k] / 100) * maxR
        const p = pt(r, i)
        const color = BALANCE_COLORS[k]
        return <circle key={i} cx={p.x} cy={p.y} r={5} fill={color} stroke="#fff" strokeWidth="1.5" />
      })}
      {keys.map((k, i) => {
        const p = pt(labelR, i)
        const isMain = k === dominant
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize={isMain ? 14 : 13} fontWeight={isMain ? 700 : 400}
            fill={isMain ? BALANCE_COLORS[k] : '#6b7280'}
          >
            {shortLabel(k)}
          </text>
        )
      })}
    </svg>
  )
}

export default function DetoxPage() {
  const { addSession } = useStore()
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<BrainAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const charCount = text.length

  function handleDemo() {
    setAnalysis(DEMO_ANALYSIS)
    setError('')
  }

  function handleSave() {
    if (!analysis) return
    addSession(text, analysis)
    handleReset()
  }

  async function handleAnalyze() {
    if (!text.trim() || loading) return
    setLoading(true)
    setError('')
    setAnalysis(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysis(data.analysis)
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setText('')
    setAnalysis(null)
    setError('')
  }

  if (analysis) {
    return (
      <div className="page-wrap detox-wrap" style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>

        {/* 結果ヘッダー */}
        <div className="card fade-up" style={{ padding: '20px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>脳内スキャン結果</div>
            <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 2, letterSpacing: '1px', textTransform: 'uppercase' }}>整理スコア</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 54, fontWeight: 900, background: 'var(--grad-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                {analysis.clarity_score}
              </span>
              <span style={{ fontSize: 18, color: 'var(--text-sub)', fontWeight: 600 }}>/100</span>
            </div>
          </div>
        </div>

        {/* メイン: 脳ゲージ + カテゴリ */}
        <div className="card fade-up-2" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0 }}>
              <BrainGauge level={analysis.noise_level} state={analysis.noise_state} />
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 14, letterSpacing: '1px', textTransform: 'uppercase' }}>
                脳内カテゴリ分析
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {(Object.entries(analysis.balance) as [BalanceKey, number][]).map(([key, val]) => {
                  const color = BALANCE_COLORS[key]
                  const isMain = key === analysis.dominant
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: isMain ? `${color}12` : 'var(--bg3)', border: `1px solid ${isMain ? color + '40' : 'transparent'}` }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: isMain ? color : `${color}20`, border: `2px solid ${isMain ? color : color + '44'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: isMain ? '#fff' : color, flexShrink: 0 }}>
                        {val}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: isMain ? 700 : 500, color: isMain ? 'var(--text)' : 'var(--text-sub)' }}>{key}</div>
                        {isMain && <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 2 }}>▶ 主要因</div>}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg3)', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 6, letterSpacing: '0.5px' }}>今の脳内状態</div>
                <p style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.8 }}>{analysis.summary}</p>
              </div>
            </div>
          </div>
        </div>

        {/* バランスマップ + アドバイス */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div className="card fade-up-3" style={{ padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>バランスマップ</div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <RadarChart balance={analysis.balance} dominant={analysis.dominant} />
            </div>
          </div>

          <div className="card fade-up-4" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 16, letterSpacing: '1px', textTransform: 'uppercase' }}>AIアドバイス</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>💡</div>
              <p style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.9 }}>{analysis.advice}</p>
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-faint)', textAlign: 'center' }}>
              次回のセッションで変化を確認しましょう
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={handleReset}>もう一度書く</button>
          <button className="btn-primary" onClick={handleSave}>完了・保存</button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* 中央：タイトル */}
      <div style={{ textAlign: 'center', padding: '32px 0 28px' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 6 }}>
          脳内デトックス
        </div>
        <p style={{ color: 'var(--text-sub)', fontSize: 13 }}>
          今頭の中にあることを、そのまま書き出してください。判断しなくて大丈夫です。
        </p>
      </div>

      <div className="fade-up">
        <div className="card" style={{ padding: 28 }}>
          <textarea
            className="input"
            placeholder="今、頭の中にあることを自由に書いてください&#10;&#10;例：明日の会議が心配。タスクが溜まっている気がする。あの件どうなったっけ..."
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ minHeight: 240, fontSize: 16, lineHeight: 1.8, fontWeight: 300 }}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 14, color: 'var(--text-faint)' }}>
              {charCount > 0 ? `${charCount}文字` : '20文字以上書くと精度が上がります'}
            </span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn-ghost" onClick={handleDemo} style={{ fontSize: 14 }}>デモを見る</button>
              <button
                className="btn-grad"
                onClick={handleAnalyze}
                disabled={loading || text.trim().length < 5}
                style={{ opacity: text.trim().length < 5 ? 0.5 : 1 }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    分析中...
                  </span>
                ) : '✦ 脳内を分析する'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '12px 18px', borderRadius: 'var(--r-sm)', background: 'rgba(225,29,72,0.08)', color: 'var(--rose)', fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
