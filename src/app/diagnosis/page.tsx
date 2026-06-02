'use client'
import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Sparkles, Check } from 'lucide-react'
import { useStore } from '@/lib/store'
import { CATEGORIES, QUESTIONS } from '@/lib/discoveryData'
import {
  analyzeAnswers,
  CHART_AXIS_LABELS,
  CHART_AXIS_KEYS,
  type DiscoveryAnalysis,
  type ChartScores,
} from '@/lib/discoveryAnalysis'

/* ── types ───────────────────────────────────────────────── */
type Phase = 'intro' | 'category' | 'quiz' | 'analyzing' | 'result'

/* ── colors ──────────────────────────────────────────────── */
const CAT_COLOR = CATEGORIES.reduce<Record<string, string>>((m, c) => { m[c.id] = c.color; return m }, {})

/* ── SVG Radar Chart ─────────────────────────────────────── */
function RadarChart({ scores }: { scores: ChartScores }) {
  const keys = CHART_AXIS_KEYS
  const n = keys.length
  const cx = 130, cy = 124, r = 76

  const pts = keys.map((k, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    const v = (scores[k] ?? 0) / 100
    return { x: cx + v * r * Math.cos(angle), y: cy + v * r * Math.sin(angle) }
  })
  const labelPts = keys.map((_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return { x: cx + (r + 28) * Math.cos(angle), y: cy + (r + 28) * Math.sin(angle) }
  })
  const toPath = (p: { x: number; y: number }[]) =>
    p.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ') + 'Z'

  return (
    <svg viewBox="0 0 260 248" style={{ width: '100%', maxWidth: 280 }}>
      {[0.25, 0.5, 0.75, 1].map(lv => {
        const gp = keys.map((_, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2
          return { x: cx + lv * r * Math.cos(angle), y: cy + lv * r * Math.sin(angle) }
        })
        return (
          <polygon key={lv}
            points={gp.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill={lv < 1 ? 'rgba(180,149,108,0.04)' : 'none'}
            stroke={lv === 1 ? 'rgba(180,149,108,0.25)' : '#ece8e0'}
            strokeWidth={lv === 1 ? 1.5 : 1}
          />
        )
      })}
      {keys.map((_, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={(cx + r * Math.cos(angle)).toFixed(1)}
            y2={(cy + r * Math.sin(angle)).toFixed(1)}
            stroke="#e8e0d4" strokeWidth={1}
          />
        )
      })}
      <path d={toPath(pts)} fill="rgba(180,149,108,0.18)" stroke="#b4956c" strokeWidth={2.5} />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4.5} fill="#b4956c" />
      ))}
      {keys.map((k, i) => (
        <text key={i}
          x={labelPts[i].x.toFixed(1)} y={labelPts[i].y.toFixed(1)}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fontWeight={600} fill="#7a6a58"
        >
          {CHART_AXIS_LABELS[k]}
        </text>
      ))}
    </svg>
  )
}

/* ── Bar Chart ───────────────────────────────────────────── */
function BarChart({ scores }: { scores: ChartScores }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {CHART_AXIS_KEYS.map(k => {
        const val = scores[k] ?? 0
        return (
          <div key={k}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#5a4a3a' }}>{CHART_AXIS_LABELS[k]}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#b4956c' }}>{val}</span>
            </div>
            <div style={{ height: 8, background: '#ece8e0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${val}%`,
                background: val >= 70
                  ? 'linear-gradient(90deg, #b4956c, #c8a87e)'
                  : val >= 40
                    ? 'linear-gradient(90deg, #c9a96e, #d4b88a)'
                    : 'linear-gradient(90deg, #d4b88a, #dcc49a)',
                transition: 'width 0.9s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Tag Chips ───────────────────────────────────────────── */
function TagChips({ tags, color }: { tags: string[]; color: string }) {
  if (!tags.length) return <span style={{ fontSize: 12, color: '#a89a8a' }}>—</span>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {tags.map(t => (
        <span key={t} style={{
          fontSize: 12, fontWeight: 600,
          padding: '4px 12px', borderRadius: 20,
          background: `${color}12`, color,
          border: `1px solid ${color}25`,
        }}>
          {t}
        </span>
      ))}
    </div>
  )
}

/* ── Section Card ────────────────────────────────────────── */
function SectionCard({ emoji, title, color, children }: {
  emoji: string; title: string; color: string; children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#ffffff', borderRadius: 16,
      padding: '18px 18px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{emoji}</span>{title}
      </div>
      {children}
    </div>
  )
}

/* ── Intro Screen ────────────────────────────────────────── */
function IntroScreen({
  onStartAll, onStartCategory,
}: {
  onStartAll: () => void
  onStartCategory: (catId: string) => void
}) {
  return (
    <div style={{ background: '#faf8f5', paddingBottom: 96 }}>

      {/* ヘッダー */}
      <div style={{ padding: '32px 20px 20px', textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: 'linear-gradient(135deg, #c9a96e, #b4956c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', boxShadow: '0 6px 20px rgba(180,149,108,0.3)',
        }}>
          <Sparkles size={22} color="#fff" />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#2d1f0f', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Clarity Discovery
        </h1>
        <p style={{ fontSize: 13, color: '#7a6a58', lineHeight: 1.8 }}>
          カテゴリーを選んで始めましょう。<br />
          どれからでも、何度でも大丈夫です。
        </p>
      </div>

      {/* カテゴリー選択 */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onStartCategory(cat.id)}
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              border: '1.5px solid #ece8e0',
              display: 'flex', alignItems: 'center', gap: 14,
              background: '#fff',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              width: '100%',
              transition: 'border-color 0.15s',
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>{cat.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#2d1f0f', marginBottom: 2 }}>
                {cat.label}
              </div>
              <div style={{ fontSize: 11, color: '#a89a8a' }}>
                {cat.description}・6問
              </div>
            </div>
            <ChevronRight size={16} color={cat.color} style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* すべて診断するボタン */}
      <div style={{ padding: '16px 16px 0' }}>
        <button
          type="button"
          onClick={onStartAll}
          style={{
            width: '100%', padding: '15px',
            borderRadius: 50, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #c9a96e, #b4956c)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            fontFamily: 'inherit',
            boxShadow: '0 6px 20px rgba(180,149,108,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Sparkles size={16} />
          すべて診断する（36問）
        </button>
        <p style={{ fontSize: 11, color: '#a89a8a', textAlign: 'center', marginTop: 10 }}>
          全カテゴリーまとめて診断します
        </p>
      </div>
    </div>
  )
}

/* ── Category Intro Screen ───────────────────────────────── */
function CategoryIntroScreen({
  catIndex, totalCats, onNext,
}: { catIndex: number; totalCats: number; onNext: () => void }) {
  const cat = CATEGORIES[catIndex]
  const qCount = QUESTIONS.filter(q => q.categoryId === cat.id).length
  return (
    <div style={{
      minHeight: '100vh', background: '#faf8f5',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      padding: '48px 28px', textAlign: 'center', gap: 24,
    }}>
      <div style={{ fontSize: 11, color: '#a89a8a', fontWeight: 600, letterSpacing: '0.08em' }}>
        {catIndex + 1} / {totalCats}
      </div>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: `${cat.color}15`,
        border: `2px solid ${cat.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 34,
      }}>
        {cat.emoji}
      </div>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#2d1f0f', marginBottom: 10, letterSpacing: '-0.01em' }}>
          {cat.label}
        </h2>
        <p style={{ fontSize: 14, color: '#7a6a58', lineHeight: 1.85 }}>
          {cat.description}
        </p>
      </div>
      <div style={{
        padding: '10px 20px', borderRadius: 10,
        background: `${cat.color}10`, fontSize: 12, color: cat.color, fontWeight: 600,
      }}>
        {qCount}問
      </div>
      <button
        onClick={onNext}
        style={{
          width: '100%', padding: '15px',
          borderRadius: 50, border: 'none', cursor: 'pointer',
          background: cat.color,
          color: '#fff', fontSize: 15, fontWeight: 700,
          fontFamily: 'inherit',
          boxShadow: `0 6px 20px ${cat.color}40`,
          marginTop: 8,
        }}
      >
        始める
      </button>
    </div>
  )
}

/* ── Quiz Screen ─────────────────────────────────────────── */
function QuizScreen({
  qIndex, questions, answers, freeTexts, onAnswer, onFreeText, onBack, animKey,
}: {
  qIndex: number
  questions: typeof QUESTIONS
  answers: Record<string, number>
  freeTexts: Record<string, string>
  onAnswer: (optionIndex: number) => void
  onFreeText: (text: string) => void
  onBack: () => void
  animKey: number
}) {
  const question = questions[qIndex]
  const catColor = CAT_COLOR[question.categoryId] ?? '#b4956c'
  const cat = CATEGORIES.find(c => c.id === question.categoryId)!
  const selected = answers[question.id]
  const progress = (qIndex + 1) / questions.length

  const catQs = questions.filter(q => q.categoryId === question.categoryId)
  const catQIndex = catQs.findIndex(q => q.id === question.id)

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex', flexDirection: 'column' }}>
      {/* progress bar */}
      <div style={{ height: 3, background: '#ece8e0' }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: catColor, transition: 'width 0.3s ease' }} />
      </div>

      {/* header */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #ece8e0', background: '#fff' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#a89a8a', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 14 }}>{cat.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: catColor }}>{cat.label}</span>
        <span style={{ fontSize: 11, color: '#c4b8a8' }}>· {catQIndex + 1}/{catQs.length}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#a89a8a', fontWeight: 500 }}>
          {qIndex + 1}<span style={{ color: '#d4c8bc' }}>/{QUESTIONS.length}</span>
        </span>
      </div>

      {/* question */}
      <div
        key={animKey}
        style={{
          flex: 1, padding: '36px 24px 20px',
          display: 'flex', alignItems: 'center',
          animation: 'fadeSlide 0.25s ease',
        }}
      >
        <p style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.85, color: '#2d1f0f', letterSpacing: '-0.01em' }}>
          {question.text}
        </p>
      </div>

      {/* options */}
      <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map((opt, idx) => {
          const isSelected = selected === idx
          return (
            <button
              key={idx}
              onClick={() => onAnswer(idx)}
              style={{
                width: '100%', padding: '14px 16px',
                borderRadius: 12, border: isSelected ? `2px solid ${catColor}` : '2px solid #e8e0d4',
                background: isSelected ? `${catColor}0f` : '#ffffff',
                color: '#2d1f0f',
                fontSize: 14, fontWeight: isSelected ? 700 : 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 4px 14px ${catColor}20` : 'none',
              }}
            >
              <span style={{
                minWidth: 28, height: 28, borderRadius: '50%',
                background: isSelected ? catColor : '#f5f0ea',
                color: isSelected ? '#fff' : '#a89a8a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {opt.label}
              </span>
              <span style={{ flex: 1, lineHeight: 1.5 }}>{opt.text}</span>
              {isSelected && <Check size={16} color={catColor} style={{ flexShrink: 0 }} />}
            </button>
          )
        })}
      </div>

      {/* free text */}
      {question.freeTextPrompt && (
        <div style={{ padding: '0 20px 28px' }}>
          <textarea
            placeholder={question.freeTextPrompt}
            value={freeTexts[question.id] ?? ''}
            onChange={e => onFreeText(e.target.value)}
            rows={2}
            style={{
              width: '100%', padding: '12px 14px',
              borderRadius: 10, border: '1.5px solid #e8e0d4',
              background: '#fff', color: '#2d1f0f',
              fontSize: 13, fontFamily: 'inherit',
              resize: 'none', outline: 'none',
              lineHeight: 1.7,
            }}
          />
        </div>
      )}

      {!question.freeTextPrompt && <div style={{ height: 32 }} />}
    </div>
  )
}

/* ── Analyzing Screen ────────────────────────────────────── */
function AnalyzingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#faf8f5',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      gap: 24, padding: '48px 28px', textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'linear-gradient(135deg, #c9a96e, #b4956c)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(180,149,108,0.35)',
        animation: 'breathe 1.8s ease-in-out infinite',
      }}>
        <Sparkles size={32} color="#fff" />
      </div>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#2d1f0f', marginBottom: 10 }}>
          分析しています…
        </h2>
        <p style={{ fontSize: 13, color: '#7a6a58', lineHeight: 1.8 }}>
          あなたの回答から<br />自己理解の地図をつくっています
        </p>
      </div>
    </div>
  )
}

/* ── Result Screen ───────────────────────────────────────── */
function ResultScreen({
  analysis, onReset, onSave, saved,
}: {
  analysis: DiscoveryAnalysis
  onReset: () => void
  onSave: () => void
  saved: boolean
}) {
  const [tab, setTab] = useState<'summary' | 'detail' | 'graph'>('summary')

  const gold = '#b4956c'
  const goldLight = '#c9a96e'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f2ec', paddingBottom: 100 }}>

      {/* header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #ece8e0' }}>
        <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 19, fontWeight: 800, color: '#2d1f0f', letterSpacing: '-0.02em' }}>
            診断結果
          </h1>
          <button onClick={onReset} style={{
            background: 'none', border: '1px solid #e8e0d4', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            color: '#7a6a58', fontSize: 12, fontFamily: 'inherit',
            padding: '6px 12px', borderRadius: 20,
          }}>
            <RefreshCw size={12} />もう一度
          </button>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', padding: '4px 16px 0' }}>
          {([['summary', 'サマリー'], ['detail', '詳細分析'], ['graph', 'グラフ']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '13px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13,
              fontWeight: tab === t ? 700 : 500,
              color: tab === t ? gold : '#a89a8a',
              borderBottom: `2.5px solid ${tab === t ? gold : 'transparent'}`,
              transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── サマリータブ ── */}
      {tab === 'summary' && (
        <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* hero summary */}
          <div style={{
            background: 'linear-gradient(135deg, #c9a96e, #b4956c)',
            borderRadius: 18, padding: '22px 20px',
            boxShadow: '0 6px 24px rgba(180,149,108,0.3)',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6 }}>
              結果サマリー
            </div>
            <p style={{ fontSize: 14, color: '#fff', lineHeight: 1.9, fontWeight: 500 }}>
              {analysis.summary}
            </p>
          </div>

          {/* 長所 */}
          <SectionCard emoji="✨" title="長所" color={gold}>
            <TagChips tags={analysis.strengths} color={gold} />
          </SectionCard>

          {/* 得意なこと */}
          <SectionCard emoji="💡" title="得意なこと" color="#059669">
            <TagChips tags={analysis.skills} color="#059669" />
            {analysis.skills.length === 0 && (
              <p style={{ fontSize: 12, color: '#a89a8a' }}>回答の傾向から、人に寄り添う力があります。</p>
            )}
          </SectionCard>

          {/* 小さな自分からのメッセージ */}
          <SectionCard emoji="🌸" title="小さな自分からのメッセージ" color="#e11d48">
            <p style={{ fontSize: 13, color: '#3d2010', lineHeight: 1.85 }}>
              {analysis.innerMessage}
            </p>
            {analysis.innerChildNeeds.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <TagChips tags={analysis.innerChildNeeds} color="#e11d48" />
              </div>
            )}
          </SectionCard>

          {/* 今後のテーマ */}
          <SectionCard emoji="🌟" title="今後4年間のテーマ" color="#6366f1">
            <p style={{ fontSize: 14, color: '#2d1f0f', lineHeight: 1.85, fontWeight: 500 }}>
              {analysis.futureTheme}
            </p>
          </SectionCard>

          {/* 今からできること */}
          <SectionCard emoji="🎯" title="今からできること" color="#0891b2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analysis.actionItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    minWidth: 22, height: 22, borderRadius: '50%',
                    background: '#0891b215', color: '#0891b2',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, color: '#3d2010', lineHeight: 1.7 }}>{item}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 方向性 */}
          <SectionCard emoji="🧭" title="向いている生き方" color="#d97706">
            <TagChips tags={analysis.directions} color="#d97706" />
          </SectionCard>

          {/* save button */}
          <button
            onClick={onSave}
            disabled={saved}
            style={{
              width: '100%', padding: '15px',
              borderRadius: 50, border: 'none', cursor: saved ? 'default' : 'pointer',
              background: saved
                ? 'linear-gradient(135deg, #10b981, #34d399)'
                : 'linear-gradient(135deg, #c9a96e, #b4956c)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              fontFamily: 'inherit',
              boxShadow: saved
                ? '0 4px 14px rgba(16,185,129,0.3)'
                : '0 6px 20px rgba(180,149,108,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4,
            }}
          >
            {saved ? <><Check size={16} /> 保存しました</> : '結果を保存する'}
          </button>
        </div>
      )}

      {/* ── 詳細分析タブ ── */}
      {tab === 'detail' && (
        <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          <SectionCard emoji="✨" title="長所" color={gold}>
            <TagChips tags={analysis.strengths} color={gold} />
          </SectionCard>

          <SectionCard emoji="💡" title="得意なこと" color="#059669">
            <TagChips tags={analysis.skills.length ? analysis.skills : ['人に寄り添う力']} color="#059669" />
          </SectionCard>

          <SectionCard emoji="🔄" title="思考の癖" color="#7c3aed">
            {analysis.thinkingPatterns.length > 0 ? (
              <>
                <TagChips tags={analysis.thinkingPatterns} color="#7c3aed" />
                <p style={{ fontSize: 12, color: '#7a6a58', lineHeight: 1.7, marginTop: 10 }}>
                  これらは課題ではなく、あなたの傾向として理解するためのものです。気づくことが第一歩です。
                </p>
              </>
            ) : (
              <p style={{ fontSize: 12, color: '#a89a8a' }}>バランスのとれた思考パターンです。</p>
            )}
          </SectionCard>

          <SectionCard emoji="💧" title="感情の癖" color="#0891b2">
            {analysis.emotionPatterns.length > 0 ? (
              <>
                <TagChips tags={analysis.emotionPatterns} color="#0891b2" />
                <p style={{ fontSize: 12, color: '#7a6a58', lineHeight: 1.7, marginTop: 10 }}>
                  感情と上手に付き合うために、自分のパターンを知っておきましょう。
                </p>
              </>
            ) : (
              <p style={{ fontSize: 12, color: '#a89a8a' }}>感情を素直に表現できる傾向があります。</p>
            )}
          </SectionCard>

          <SectionCard emoji="🌸" title="小さな自分が求めていること" color="#e11d48">
            <p style={{ fontSize: 13, color: '#3d2010', lineHeight: 1.85, marginBottom: 12 }}>
              {analysis.innerMessage}
            </p>
            {analysis.innerChildNeeds.length > 0 && (
              <TagChips tags={analysis.innerChildNeeds} color="#e11d48" />
            )}
          </SectionCard>

          <SectionCard emoji="🌟" title="幸せを感じる条件" color="#d97706">
            <TagChips tags={analysis.directions.slice(0, 3)} color="#d97706" />
          </SectionCard>

          <SectionCard emoji="🧭" title="向いている生き方" color="#6366f1">
            <TagChips tags={analysis.directions} color="#6366f1" />
          </SectionCard>

          <SectionCard emoji="✳️" title="今後のテーマ" color={goldLight}>
            <p style={{ fontSize: 14, color: '#2d1f0f', lineHeight: 1.85, fontWeight: 500 }}>
              {analysis.futureTheme}
            </p>
          </SectionCard>

          <SectionCard emoji="🎯" title="今からできること" color="#059669">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analysis.actionItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    minWidth: 22, height: 22, borderRadius: '50%',
                    background: '#05996915', color: '#059669',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, color: '#3d2010', lineHeight: 1.7 }}>{item}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── グラフタブ ── */}
      {tab === 'graph' && (
        <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div style={{ background: '#fff', borderRadius: 18, padding: '20px 16px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7a6a58', marginBottom: 4 }}>現在地レーダーチャート</div>
            <div style={{ fontSize: 11, color: '#a89a8a', marginBottom: 16, lineHeight: 1.5 }}>
              これは能力評価ではなく、自己理解の進捗を可視化したものです。
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <RadarChart scores={analysis.chartScores} />
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 18, padding: '20px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7a6a58', marginBottom: 16 }}>現在地バーグラフ</div>
            <BarChart scores={analysis.chartScores} />
          </div>

          <div style={{ background: '#fff', borderRadius: 18, padding: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7a6a58', marginBottom: 14 }}>軸の意味</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CHART_AXIS_KEYS.map(k => (
                <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 8, height: 8, borderRadius: '50%', background: gold, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#5a4a3a' }}>{CHART_AXIS_LABELS[k]}</span>
                    <span style={{ fontSize: 12, color: '#a89a8a', marginLeft: 8 }}>
                      {(analysis.chartScores[k] ?? 0)}点
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────── */
export default function DiagnosisPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [catIndex, setCatIndex] = useState(0)
  const [qIndex, setQIndex] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [freeTexts, setFreeTexts] = useState<Record<string, string>>({})
  const [analysis, setAnalysis] = useState<DiscoveryAnalysis | null>(null)
  const [saved, setSaved] = useState(false)
  const [activeCatId, setActiveCatId] = useState<string | null>(null)

  const { addDiscoverySession } = useStore()

  // 現在アクティブな問題リスト
  const activeQuestions = activeCatId
    ? QUESTIONS.filter(q => q.categoryId === activeCatId)
    : QUESTIONS

  const reset = useCallback(() => {
    setPhase('intro')
    setCatIndex(0)
    setQIndex(0)
    setAnimKey(0)
    setAnswers({})
    setFreeTexts({})
    setAnalysis(null)
    setSaved(false)
    setActiveCatId(null)
  }, [])

  function startAll() {
    setActiveCatId(null)
    setCatIndex(0)
    setQIndex(0)
    setPhase('category')
  }

  function startCategory(catId: string) {
    setActiveCatId(catId)
    const idx = CATEGORIES.findIndex(c => c.id === catId)
    setCatIndex(idx)
    setQIndex(0)
    setPhase('category')
  }

  function handleAnswer(optionIndex: number) {
    const question = activeQuestions[qIndex]
    const nextAnswers = { ...answers, [question.id]: optionIndex }
    setAnswers(nextAnswers)

    setTimeout(() => {
      setAnimKey(k => k + 1)
      const nextIndex = qIndex + 1

      if (nextIndex >= activeQuestions.length) {
        setPhase('analyzing')
        setTimeout(() => {
          const result = analyzeAnswers(nextAnswers)
          setAnalysis(result)
          setPhase('result')
        }, 2000)
        return
      }

      // 全カテゴリーモードのみカテゴリー間トランジションを表示
      if (!activeCatId) {
        const currentCat = activeQuestions[qIndex].categoryId
        const nextCat = activeQuestions[nextIndex].categoryId
        if (nextCat !== currentCat) {
          const newCatIndex = CATEGORIES.findIndex(c => c.id === nextCat)
          setCatIndex(newCatIndex)
          setQIndex(nextIndex)
          setPhase('category')
          return
        }
      }
      setQIndex(nextIndex)
    }, 160)
  }

  function handleBack() {
    if (phase === 'category') {
      if (qIndex === 0) {
        setPhase('intro')
      } else {
        setAnimKey(k => k + 1)
        setQIndex(qIndex - 1)
        setPhase('quiz')
      }
      return
    }
    if (phase === 'quiz') {
      if (qIndex === 0) {
        setPhase('category')
        return
      }
      setAnimKey(k => k + 1)
      const prevIndex = qIndex - 1
      setQIndex(prevIndex)

      if (!activeCatId) {
        const prevCat = activeQuestions[prevIndex].categoryId
        const curCat = activeQuestions[qIndex].categoryId
        if (prevCat !== curCat) {
          const prevCatIndex = CATEGORIES.findIndex(c => c.id === prevCat)
          setCatIndex(prevCatIndex)
          setPhase('category')
        }
      }
    }
  }

  function handleSave() {
    if (!analysis) return
    addDiscoverySession({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      answers,
      freeTexts,
      analysis,
    })
    setSaved(true)
  }

  if (phase === 'intro') return (
    <IntroScreen onStartAll={startAll} onStartCategory={startCategory} />
  )
  if (phase === 'analyzing') return <AnalyzingScreen />
  if (phase === 'result' && analysis) return (
    <ResultScreen analysis={analysis} onReset={reset} onSave={handleSave} saved={saved} />
  )
  if (phase === 'category') return (
    <CategoryIntroScreen
      catIndex={catIndex}
      totalCats={activeCatId ? 1 : CATEGORIES.length}
      onNext={() => setPhase('quiz')}
    />
  )
  if (phase === 'quiz') return (
    <QuizScreen
      qIndex={qIndex}
      questions={activeQuestions}
      answers={answers}
      freeTexts={freeTexts}
      onAnswer={handleAnswer}
      onFreeText={text => setFreeTexts(prev => ({ ...prev, [activeQuestions[qIndex].id]: text }))}
      onBack={handleBack}
      animKey={animKey}
    />
  )

  return null
}
