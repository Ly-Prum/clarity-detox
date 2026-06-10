'use client'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Clock, ExternalLink } from 'lucide-react'

interface CalEvent {
  id: string
  title: string
  date: string
  time: string
  note: string
  color: string
  url?: string
}

const EVENT_COLORS = [
  '#3b82f6', '#10b981', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#64748b',
]
const WEEKS = ['日', '月', '火', '水', '木', '金', '土']

function storageKey(category: string) { return `clarity-calendar-events-${category}` }
function loadEvents(category: string): CalEvent[] {
  try { return JSON.parse(localStorage.getItem(storageKey(category)) ?? '[]') } catch { return [] }
}
function saveEvents(category: string, evs: CalEvent[]) {
  localStorage.setItem(storageKey(category), JSON.stringify(evs))
}
function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function DrawerCalendar({ category, accentColor }: { category: string; accentColor: string }) {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [events, setEvents] = useState<CalEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [showForm,   setShowForm]   = useState(false)
  const [editTarget, setEditTarget] = useState<CalEvent | null>(null)
  const [fTitle, setFTitle] = useState('')
  const [fDate,  setFDate]  = useState('')
  const [fTime,  setFTime]  = useState('')
  const [fNote,  setFNote]  = useState('')
  const [fUrl,   setFUrl]   = useState('')
  const [fColor, setFColor] = useState(accentColor)

  useEffect(() => { setEvents(loadEvents(category)) }, [category])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }

  const firstDay    = new Date(year, month - 1, 1).getDay()
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
    setFTitle(''); setFNote(''); setFTime(''); setFUrl('')
    setFColor(accentColor)
    setFDate(date ?? selectedDate ?? toKey(year, month, 1))
    setShowForm(true)
  }
  function openEdit(e: CalEvent) {
    setEditTarget(e)
    setFTitle(e.title); setFDate(e.date); setFTime(e.time)
    setFNote(e.note); setFUrl(e.url ?? ''); setFColor(e.color)
    setShowForm(true)
  }
  function closeForm() { setShowForm(false); setEditTarget(null) }

  function submit() {
    if (!fTitle.trim()) return
    if (editTarget) {
      const updated = events.map(e => e.id === editTarget.id
        ? { ...e, title: fTitle.trim(), date: fDate, time: fTime, note: fNote, url: fUrl.trim(), color: fColor }
        : e)
      setEvents(updated); saveEvents(category, updated)
    } else {
      const ev: CalEvent = { id: `${Date.now()}`, title: fTitle.trim(), date: fDate, time: fTime, note: fNote, url: fUrl.trim(), color: fColor }
      const next = [...events, ev].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      setEvents(next); saveEvents(category, next)
    }
    if (!selectedDate) setSelectedDate(fDate)
    closeForm()
  }

  function deleteEvent(id: string) {
    const next = events.filter(e => e.id !== id)
    setEvents(next); saveEvents(category, next)
    closeForm()
  }

  const selectedEvents = selectedDate
    ? (eventMap[selectedDate] ?? []).sort((a, b) => a.time.localeCompare(b.time))
    : []

  return (
    <div>
      {/* 月ナビ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', padding: 4 }}><ChevronLeft size={18} /></button>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', minWidth: 100, textAlign: 'center' }}>{year}年{month}月</span>
          <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', padding: 4 }}><ChevronRight size={18} /></button>
        </div>
        <button type="button" onClick={() => openNew(selectedDate ?? undefined)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 16, background: accentColor, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={13} /> 追加
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
          {WEEKS.map((w, i) => (
            <div key={w} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : 'var(--text-faint)' }}>{w}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, idx) => {
            if (day === null) return (
              <div key={`e-${idx}`} style={{ height: 58, borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none', borderBottom: idx < cells.length - 7 ? '1px solid var(--border)' : 'none' }} />
            )
            const key = toKey(year, month, day)
            const dayEvs = eventMap[key] ?? []
            const isToday    = key === todayKey
            const isSelected = key === selectedDate
            const dow = idx % 7
            return (
              <button key={key} type="button" onClick={() => setSelectedDate(isSelected ? null : key)}
                style={{ height: 58, padding: '5px 2px 3px', border: 'none', background: isSelected ? `${accentColor}18` : 'transparent', cursor: 'pointer', borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none', borderBottom: idx < cells.length - 7 ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontFamily: 'inherit', transition: 'background 0.12s' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: isToday ? accentColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: isToday ? 800 : 400, color: isToday ? '#fff' : dow === 0 ? '#ef4444' : dow === 6 ? '#3b82f6' : 'var(--text)' }}>
                  {day}
                </span>
                {dayEvs.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    {dayEvs.slice(0, 3).map((e, i) => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: e.color }} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 選択日のイベント */}
      {selectedDate && (
        <div style={{ background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '10px 14px', borderBottom: selectedEvents.length > 0 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
            <button type="button" onClick={() => openNew(selectedDate)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, background: accentColor, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={11} /> 追加
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>予定はありません</div>
          ) : (
            selectedEvents.map((e, i) => (
              <div key={e.id}
                style={{ padding: '10px 14px', borderBottom: i < selectedEvents.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div onClick={() => openEdit(e)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <div style={{ width: 3, height: 32, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                    {(e.time || e.note) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        {e.time && <><Clock size={9} color="var(--text-faint)" /><span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{e.time}</span></>}
                        {e.note && <span style={{ fontSize: 11, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.time ? ' · ' : ''}{e.note}</span>}
                      </div>
                    )}
                  </div>
                </div>
                {e.url && (
                  <a href={e.url} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '6px 12px', borderRadius: 10, background: e.color, color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <ExternalLink size={11} /> 予約
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 今月の予定一覧（日付未選択時） */}
      {!selectedDate && (() => {
        const mk = `${year}-${String(month).padStart(2, '0')}`
        const monthEvs = events.filter(e => e.date.startsWith(mk)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        if (monthEvs.length === 0) return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>この月の予定はありません</div>
          </div>
        )
        return (
          <div style={{ background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {monthEvs.map((e, i) => {
              const d = new Date(e.date + 'T00:00:00')
              return (
                <div key={e.id}
                  style={{ padding: '10px 14px', borderBottom: i < monthEvs.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div onClick={() => { setSelectedDate(e.date); openEdit(e) }} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                    <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 700 }}>{d.toLocaleDateString('ja-JP', { weekday: 'short' })}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{d.getDate()}</div>
                    </div>
                    <div style={{ width: 3, height: 32, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                      {e.time && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>{e.time}</div>}
                    </div>
                  </div>
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '6px 12px', borderRadius: 10, background: e.color, color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <ExternalLink size={11} /> 予約
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* フォーム */}
      {showForm && (
        <>
          <div onClick={closeForm} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--card)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', zIndex: 101, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{editTarget ? '予定を編集' : '予定を追加'}</div>
              <button type="button" onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>タイトル</label>
              <input type="text" value={fTitle} onChange={e => setFTitle(e.target.value)}
                placeholder="予定のタイトル" autoFocus
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            </div>

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

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>メモ（任意）</label>
              <input type="text" value={fNote} onChange={e => setFNote(e.target.value)}
                placeholder="場所・詳細など"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>予約URL（任意）</label>
              <input type="url" value={fUrl} onChange={e => setFUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 8 }}>カラー</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {EVENT_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setFColor(c)}
                    style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: fColor === c ? '3px solid var(--text)' : '3px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
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
                style={{ flex: 1, padding: '13px', borderRadius: 14, border: 'none', background: !fTitle.trim() ? 'var(--bg3)' : accentColor, fontSize: 14, fontWeight: 800, color: !fTitle.trim() ? 'var(--text-faint)' : '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                {editTarget ? '更新する' : '保存する'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
