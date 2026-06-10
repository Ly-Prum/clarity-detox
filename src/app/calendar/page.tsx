'use client'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Clock } from 'lucide-react'

interface CalEvent {
  id: string
  title: string
  date: string       // YYYY-MM-DD
  time: string       // HH:MM or ''
  note: string
  color: string
}

const EVENT_COLORS = [
  { value: '#3b82f6', label: '青' },
  { value: '#10b981', label: '緑' },
  { value: '#f97316', label: '橙' },
  { value: '#ef4444', label: '赤' },
  { value: '#a855f7', label: '紫' },
  { value: '#ec4899', label: 'ピンク' },
  { value: '#64748b', label: 'グレー' },
]

const STORAGE_KEY = 'clarity-calendar-events'
const WEEKS = ['日', '月', '火', '水', '木', '金', '土']

function loadEvents(): CalEvent[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function saveEvents(evs: CalEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(evs))
}
function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function fmtTime(t: string) { return t || '' }

export default function CalendarPage() {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [events, setEvents] = useState<CalEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // フォーム
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<CalEvent | null>(null)
  const [fTitle, setFTitle] = useState('')
  const [fDate,  setFDate]  = useState('')
  const [fTime,  setFTime]  = useState('')
  const [fNote,  setFNote]  = useState('')
  const [fColor, setFColor] = useState(EVENT_COLORS[0].value)

  useEffect(() => { setEvents(loadEvents()) }, [])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }
  function goToday() {
    const t = new Date()
    setYear(t.getFullYear()); setMonth(t.getMonth() + 1)
    setSelectedDate(toKey(t.getFullYear(), t.getMonth() + 1, t.getDate()))
  }

  // カレンダーグリッド構築
  const firstDay = new Date(year, month - 1, 1).getDay()   // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const eventMap: Record<string, CalEvent[]> = {}
  events.forEach(e => { (eventMap[e.date] ??= []).push(e) })

  const todayKey = toKey(now.getFullYear(), now.getMonth() + 1, now.getDate())

  function openNew(date?: string) {
    setEditTarget(null)
    setFTitle(''); setFNote(''); setFTime('')
    setFColor(EVENT_COLORS[0].value)
    setFDate(date ?? selectedDate ?? toKey(year, month, 1))
    setShowForm(true)
  }
  function openEdit(e: CalEvent) {
    setEditTarget(e)
    setFTitle(e.title); setFDate(e.date); setFTime(e.time)
    setFNote(e.note); setFColor(e.color)
    setShowForm(true)
  }
  function closeForm() { setShowForm(false); setEditTarget(null) }

  function submit() {
    if (!fTitle.trim()) return
    if (editTarget) {
      const updated = events.map(e => e.id === editTarget.id
        ? { ...e, title: fTitle.trim(), date: fDate, time: fTime, note: fNote, color: fColor }
        : e)
      setEvents(updated); saveEvents(updated)
    } else {
      const ev: CalEvent = { id: `${Date.now()}`, title: fTitle.trim(), date: fDate, time: fTime, note: fNote, color: fColor }
      const next = [...events, ev].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      setEvents(next); saveEvents(next)
    }
    if (!selectedDate) setSelectedDate(fDate)
    closeForm()
  }

  function deleteEvent(id: string) {
    const next = events.filter(e => e.id !== id)
    setEvents(next); saveEvents(next)
    closeForm()
  }

  const selectedEvents = selectedDate ? (eventMap[selectedDate] ?? []).sort((a, b) => a.time.localeCompare(b.time)) : []

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ヘッダー */}
      <div style={{ background: 'linear-gradient(160deg, var(--primary-lt) 0%, var(--bg) 65%)', padding: '24px 20px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>カレンダー</div>
            <button type="button" onClick={goToday}
              style={{ padding: '6px 14px', borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', cursor: 'pointer', fontFamily: 'inherit' }}>
              今日
            </button>
            <button type="button" onClick={() => openNew()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: 'var(--primary)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={14} /> 追加
            </button>
          </div>

          {/* 月ナビ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 16 }}>
            <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}><ChevronLeft size={20} /></button>
            <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--text)', minWidth: 120, textAlign: 'center' }}>{year}年{month}月</span>
            <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 12px 80px' }}>

        {/* カレンダーグリッド */}
        <div style={{ background: 'var(--card)', borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
          {/* 曜日ヘッダー */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {WEEKS.map((w, i) => (
              <div key={w} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : 'var(--text-faint)' }}>{w}</div>
            ))}
          </div>

          {/* 日付セル */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} style={{ height: 68, borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none', borderBottom: idx < cells.length - 7 ? '1px solid var(--border)' : 'none' }} />
              const key = toKey(year, month, day)
              const dayEvs = eventMap[key] ?? []
              const isToday = key === todayKey
              const isSelected = key === selectedDate
              const dow = (idx) % 7  // 日曜=0
              return (
                <button key={key} type="button" onClick={() => setSelectedDate(isSelected ? null : key)}
                  style={{ height: 68, padding: '6px 4px 4px', border: 'none', background: isSelected ? 'var(--primary-lt)' : 'transparent', cursor: 'pointer', borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none', borderBottom: idx < cells.length - 7 ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontFamily: 'inherit', position: 'relative', transition: 'background 0.12s' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: isToday ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: isToday ? 800 : 400, color: isToday ? '#fff' : dow === 0 ? '#ef4444' : dow === 6 ? '#3b82f6' : 'var(--text)' }}>
                    {day}
                  </span>
                  {/* イベントドット（最大3個） */}
                  {dayEvs.length > 0 && (
                    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 44 }}>
                      {dayEvs.slice(0, 3).map((e, i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                      ))}
                      {dayEvs.length > 3 && <span style={{ fontSize: 8, color: 'var(--text-faint)', lineHeight: '6px' }}>+{dayEvs.length - 3}</span>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 選択日のイベント一覧 */}
        {selectedDate && (
          <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: selectedEvents.length > 0 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
              </span>
              <button type="button" onClick={() => openNew(selectedDate)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 14, background: 'var(--primary)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={12} /> 追加
              </button>
            </div>
            {selectedEvents.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>予定はありません</div>
            ) : (
              <div>
                {selectedEvents.map((e, i) => (
                  <button key={e.id} type="button" onClick={() => openEdit(e)}
                    style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderBottom: i < selectedEvents.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    <div style={{ width: 4, height: 36, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                      {e.time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          <Clock size={10} color="var(--text-faint)" />
                          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtTime(e.time)}</span>
                        </div>
                      )}
                      {e.note && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.note}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 今月の予定一覧（日付未選択時） */}
        {!selectedDate && (() => {
          const monthKey = `${year}-${String(month).padStart(2, '0')}`
          const monthEvs = events.filter(e => e.date.startsWith(monthKey)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
          if (monthEvs.length === 0) return (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>この月の予定はありません</div>
            </div>
          )
          return (
            <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)' }}>今月の予定（{monthEvs.length}件）</span>
              </div>
              {monthEvs.map((e, i) => {
                const d = new Date(e.date + 'T00:00:00')
                return (
                  <button key={e.id} type="button" onClick={() => { setSelectedDate(e.date); openEdit(e) }}
                    style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', borderBottom: i < monthEvs.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 700 }}>{d.toLocaleDateString('ja-JP', { weekday: 'short' })}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{d.getDate()}</div>
                    </div>
                    <div style={{ width: 4, height: 34, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                      {e.time && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>{e.time}</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* 入力フォーム（ボトムシート） */}
      {showForm && (
        <>
          <div onClick={closeForm} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--card)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', zIndex: 101, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{editTarget ? '予定を編集' : '予定を追加'}</div>
              <button type="button" onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)' }}><X size={20} /></button>
            </div>

            {/* タイトル */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>タイトル</label>
              <input type="text" value={fTitle} onChange={e => setFTitle(e.target.value)}
                placeholder="予定のタイトル" autoFocus
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            </div>

            {/* 日付・時刻 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>日付</label>
                <input type="date" value={fDate} onChange={e => setFDate(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>時刻（任意）</label>
                <input type="time" value={fTime} onChange={e => setFTime(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
              </div>
            </div>

            {/* メモ */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>メモ（任意）</label>
              <input type="text" value={fNote} onChange={e => setFNote(e.target.value)}
                placeholder="場所・詳細など"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            </div>

            {/* カラー */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 8 }}>カラー</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {EVENT_COLORS.map(c => (
                  <button key={c.value} type="button" onClick={() => setFColor(c.value)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c.value, border: fColor === c.value ? `3px solid var(--text)` : '3px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {editTarget && (
                <button type="button" onClick={() => deleteEvent(editTarget.id)}
                  style={{ padding: '13px 16px', borderRadius: 14, border: 'none', background: 'rgba(239,68,68,0.1)', fontSize: 13, color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trash2 size={14} /> 削除
                </button>
              )}
              <button type="button" onClick={submit} disabled={!fTitle.trim()}
                style={{ flex: 1, padding: '13px', borderRadius: 14, border: 'none', background: !fTitle.trim() ? 'var(--bg3)' : 'var(--primary)', fontSize: 14, fontWeight: 800, color: !fTitle.trim() ? 'var(--text-faint)' : '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                {editTarget ? '更新する' : '保存する'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
