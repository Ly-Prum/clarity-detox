'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { CheckIn } from '@/lib/types'

const MOODS = [
  { value: 1, emoji: '😔', label: 'しんどい', color: '#e11d48' },
  { value: 2, emoji: '😐', label: 'まあまあ', color: '#f97316' },
  { value: 3, emoji: '🙂', label: 'ふつう',   color: '#eab308' },
  { value: 4, emoji: '😊', label: 'いい感じ', color: '#22c55e' },
  { value: 5, emoji: '🌟', label: '最高',     color: '#3b82f6' },
]

const THEMES = [
  { value: 'work',          label: '仕事',     emoji: '💼' },
  { value: 'relationships', label: '人間関係', emoji: '🤝' },
  { value: 'romance',       label: '恋愛',     emoji: '🌸' },
  { value: 'self',          label: '自分',     emoji: '🌱' },
  { value: 'health',        label: '体・健康', emoji: '💪' },
  { value: 'other',         label: 'その他',   emoji: '✨' },
]

const HIGHLIGHTS: Record<string, string[]> = {
  work: [
    '仕事がうまく進んだ',
    '誰かに感謝できた / された',
    '難しい決断をした',
    '新しいアイデアが浮かんだ',
  ],
  relationships: [
    '誰かと深く話せた',
    '自分の気持ちを伝えられた',
    '関係が少しよくなった',
    'ひとりでいたかった',
  ],
  romance: [
    '相手のことをたくさん考えた',
    '気持ちが少し伝わった',
    '不安や迷いがあった',
    '自分の気持ちが整理できた',
  ],
  self: [
    '自分と向き合えた',
    '新しい気づきがあった',
    '自分を大切にできた',
    '迷いの中に答えが見えた',
  ],
  health: [
    '体を動かせた',
    'よく眠れた',
    '体の変化に気づいた',
    '食事や休息を大切にした',
  ],
  other: [
    'うまくいったことがあった',
    '誰かとのつながりを感じた',
    '何か発見・気づきがあった',
    'ただ今日を過ごした',
  ],
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function moodColor(mood: number) {
  return MOODS.find(m => m.value === mood)?.color ?? '#e5e8f0'
}

export default function CheckInPage() {
  const { currentUser } = useStore()
  const today = new Date().toISOString().split('T')[0]

  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleDeleteToday() {
    if (!todayCheckin || !confirm('今日の記録を削除して入力し直しますか？')) return
    await supabase.from('checkins').delete().eq('id', todayCheckin.id)
    setCheckins(prev => prev.filter(c => c.date !== today))
  }

  const [mood, setMood] = useState<number | null>(null)
  const [theme, setTheme] = useState<string | null>(null)
  const [themeCustom, setThemeCustom] = useState('')
  const [highlight, setHighlight] = useState<string | null>(null)
  const [highlightCustom, setHighlightCustom] = useState('')
  const [memo, setMemo] = useState('')

  const effectiveTheme = theme === 'other' && themeCustom.trim() ? themeCustom.trim() : theme
  const effectiveHighlight = highlight === '__custom__' ? highlightCustom.trim() : highlight

  const todayCheckin = checkins.find(c => c.date === today)

  useEffect(() => {
    if (!currentUser) return
    supabase
      .from('checkins')
      .select('*')
      .eq('user_id', currentUser.email)
      .order('date', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setCheckins(data as CheckIn[])
        setLoading(false)
      })
  }, [currentUser])

  async function handleSave() {
    if (!mood || !effectiveTheme || !effectiveHighlight || !currentUser) return
    setSaving(true)
    const checkin: CheckIn = {
      id: crypto.randomUUID(),
      user_id: currentUser.email,
      date: today,
      mood,
      theme: effectiveTheme,
      highlight: effectiveHighlight,
      memo: memo.trim(),
      created_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('checkins').upsert(checkin)
    setSaving(false)
    if (!error) {
      setCheckins(prev => [checkin, ...prev.filter(c => c.date !== today)])
      setSaved(true)
      setMood(null); setTheme(null); setThemeCustom(''); setHighlight(null); setHighlightCustom(''); setMemo('')
    }
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    return { date: dateStr, checkin: checkins.find(c => c.date === dateStr), label: DAY_LABELS[d.getDay()], isToday: dateStr === today }
  })

  const weekAvgMood = (() => {
    const days = last7.filter(d => d.checkin)
    return days.length ? Math.round(days.reduce((a, d) => a + d.checkin!.mood, 0) / days.length * 10) / 10 : null
  })()

  const themeFreq = THEMES.map(t => ({
    ...t, count: checkins.filter(c => c.theme === t.value).length,
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count)

  const canSave = !!mood && !!effectiveTheme && !!effectiveHighlight

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 80px' }}>

      {/* ヘッダー */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Check-in</div>
        <div style={{ fontSize: 22, fontWeight: 900 }}>今日の気分メモ</div>
        <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 2 }}>今日の気分とテーマを選んで記録する</div>
      </div>

      {/* 今日の記録 */}
      {saved ? (
        <div className="card fade-up" style={{ padding: '24px 20px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{MOODS.find(m => m.value === mood)?.emoji ?? '✓'}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>記録しました！</div>
          <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>明日もまた記録してみてください</div>
        </div>
      ) : todayCheckin ? (
        <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 36 }}>{MOODS.find(m => m.value === todayCheckin.mood)?.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>今日の記録は完了しています ✓</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              {THEMES.find(t => t.value === todayCheckin.theme)?.emoji} {THEMES.find(t => t.value === todayCheckin.theme)?.label}　·　{todayCheckin.highlight}
            </div>
            {todayCheckin.memo && <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 4, fontStyle: 'italic' }}>「{todayCheckin.memo}」</div>}
          </div>
          <button type="button" onClick={handleDeleteToday} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e11d48', opacity: 0.4, fontSize: 18, padding: 4 }} title="削除して入力し直す">×</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
            {new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })} の記録
          </div>

          {/* 気分 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>今日の気分は？</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {MOODS.map(m => (
                <button key={m.value} type="button" onClick={() => setMood(m.value)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  border: `2px solid ${mood === m.value ? m.color : 'var(--border)'}`,
                  background: mood === m.value ? `${m.color}15` : 'var(--bg3)',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 22 }}>{m.emoji}</div>
                  <div style={{ fontSize: 9, color: mood === m.value ? m.color : 'var(--text-faint)', marginTop: 3, fontWeight: mood === m.value ? 700 : 400 }}>{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* テーマ */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>今日のメインテーマ</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {THEMES.map(t => (
                <button key={t.value} type="button" onClick={() => { setTheme(t.value); setHighlight(null); setHighlightCustom('') }} style={{
                  padding: '10px 6px', borderRadius: 10,
                  border: `2px solid ${theme === t.value ? 'var(--primary)' : 'var(--border)'}`,
                  background: theme === t.value ? 'var(--primary-lt)' : 'var(--bg3)',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 18 }}>{t.emoji}</div>
                  <div style={{ fontSize: 11, color: theme === t.value ? 'var(--primary)' : 'var(--text-sub)', fontWeight: theme === t.value ? 700 : 400, marginTop: 3 }}>{t.label}</div>
                </button>
              ))}
            </div>
            {/* 「その他」選択時：テーマを自由入力 */}
            {theme === 'other' && (
              <input
                type="text"
                value={themeCustom}
                onChange={e => setThemeCustom(e.target.value)}
                placeholder="テーマを入力（例：勉強、趣味、お金…）"
                style={{ marginTop: 8, width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid var(--primary)`, fontSize: 13, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
              />
            )}
          </div>

          {/* ハイライト */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {theme ? '今日いちばん近いのは？' : 'テーマを選ぶと選択肢が表示されます'}
            </div>
            {theme && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(HIGHLIGHTS[theme] ?? []).map(h => (
                  <button key={h} type="button" onClick={() => setHighlight(h)} style={{
                    padding: '12px 14px', borderRadius: 10,
                    border: `2px solid ${highlight === h ? 'var(--primary)' : 'var(--border)'}`,
                    background: highlight === h ? 'var(--primary-lt)' : 'var(--bg3)',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    fontSize: 13, color: highlight === h ? 'var(--primary)' : 'var(--text)',
                    fontWeight: highlight === h ? 700 : 400, transition: 'all 0.15s',
                  }}>
                    {highlight === h ? '✓ ' : ''}{h}
                  </button>
                ))}
                {/* その他（自由入力）*/}
                <button type="button" onClick={() => setHighlight('__custom__')} style={{
                  padding: '12px 14px', borderRadius: 10,
                  border: `2px solid ${highlight === '__custom__' ? 'var(--primary)' : 'var(--border)'}`,
                  background: highlight === '__custom__' ? 'var(--primary-lt)' : 'var(--bg3)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  fontSize: 13, color: highlight === '__custom__' ? 'var(--primary)' : 'var(--text-faint)',
                  fontWeight: highlight === '__custom__' ? 700 : 400, transition: 'all 0.15s',
                }}>
                  {highlight === '__custom__' ? '✓ ' : ''}その他（自分で入力）
                </button>
                {highlight === '__custom__' && (
                  <input
                    type="text"
                    value={highlightCustom}
                    onChange={e => setHighlightCustom(e.target.value)}
                    placeholder="今日いちばん近かったことを入力…"
                    autoFocus
                    style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid var(--primary)`, fontSize: 13, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            )}
          </div>

          {/* メモ */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>気づきメモ（任意）</div>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="今日気づいたこと、感じたことを一言..."
              rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button type="button" className="btn-pill" onClick={handleSave} disabled={saving || !canSave} style={{ opacity: !canSave ? 0.4 : 1 }}>
            {saving ? '保存中...' : '記録する'}
          </button>
        </div>
      )}

      {/* 7日間のビジュアル */}
      {!loading && (
        <>
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>過去7日間の気分</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {last7.map(({ date, checkin, label, isToday }) => (
                <div key={date} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: '100%', aspectRatio: '1', borderRadius: '50%',
                    background: checkin ? moodColor(checkin.mood) : 'var(--bg4)',
                    border: `2px solid ${isToday ? 'var(--primary)' : 'transparent'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, margin: '0 auto 6px',
                  }}>
                    {checkin ? MOODS.find(m => m.value === checkin.mood)?.emoji : ''}
                  </div>
                  <div style={{ fontSize: 10, color: isToday ? 'var(--primary)' : 'var(--text-faint)', fontWeight: isToday ? 700 : 400 }}>{label}</div>
                </div>
              ))}
            </div>
            {weekAvgMood && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-faint)', display: 'flex', justifyContent: 'space-between' }}>
                <span>今週の平均気分</span>
                <strong style={{ color: 'var(--primary)' }}>{weekAvgMood} / 5</strong>
              </div>
            )}
          </div>

          {themeFreq.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>よく出るテーマ（30日間）</div>
              {themeFreq.map(t => (
                <div key={t.value} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>{t.emoji} {t.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{t.count}回</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(t.count / checkins.length) * 100}%`, background: 'var(--primary)', borderRadius: 3, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
