'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, X, CheckSquare, Square, Trash2, PenLine, FileText, CalendarDays, Calculator } from 'lucide-react'
import { useStore } from '@/lib/store'
import { loadDrawers, drawerBg } from '@/lib/drawerConfig'
import DrawerIcon from '@/components/DrawerIcon'
import WorkCalculator from '@/components/WorkCalculator'
import CalcWidget from '@/components/CalcWidget'
import DrawerCalendar from '@/components/DrawerCalendar'

interface DrawerNote { id: string; content: string; created_at: string; updated_at: string }
interface DrawerTodo { id: string; text: string; done: boolean }

function noteTitle(c: string) { return (c ?? '').split('\n')[0].trim() || '（タイトルなし）' }
function notePreview(c: string) { return (c ?? '').split('\n').filter(l => l.trim()).slice(1, 2).join(' ') || '' }
function noteDate(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return new Date(d).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7) return `${diff}日前`
  return new Date(d).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
}

function todosKey(cat: string) { return `clarity-drawer-todos-${cat}` }
function loadTodos(cat: string): DrawerTodo[] {
  try { return JSON.parse(localStorage.getItem(todosKey(cat)) ?? '[]') } catch { return [] }
}
function saveTodos(cat: string, todos: DrawerTodo[]) {
  localStorage.setItem(todosKey(cat), JSON.stringify(todos))
}

export default function DrawerPage() {
  const { category } = useParams<{ category: string }>()
  const searchParams = useSearchParams()
  const { currentUser } = useStore()
  const meta = loadDrawers().find(d => d.id === category) ?? null

  const isWork = category === 'work'
  const initialTab = (searchParams.get('tab') as 'notes' | 'todos' | 'cal' | 'calc') ?? 'notes'
  const [tab, setTab] = useState<'notes' | 'todos' | 'cal' | 'calc'>(initialTab)

  // ── Notes ──
  const [notes, setNotes]       = useState<DrawerNote[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [newNoteOpen, setNewNoteOpen] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const newRef  = useRef<HTMLTextAreaElement>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)

  // ── Todos ──
  const [todos, setTodos]     = useState<DrawerTodo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [addingTodo, setAddingTodo] = useState(false)

  useEffect(() => {
    if (!currentUser?.email || !category) return
    fetch(`/api/drawer-notes?user_id=${encodeURIComponent(currentUser.email)}&category=${category}`)
      .then(r => r.json())
      .then((d: DrawerNote[]) => { if (Array.isArray(d)) setNotes(d) })
      .catch(() => {})
    setTodos(loadTodos(category))
  }, [currentUser?.email, category])

  useEffect(() => { if (newNoteOpen) setTimeout(() => newRef.current?.focus(), 50) }, [newNoteOpen])

  async function createNote() {
    if (!newNoteText.trim() || !currentUser?.email) return
    setSaving(true)
    try {
      const res = await fetch('/api/drawer-notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.email, category, content: newNoteText.trim() }),
      })
      if (!res.ok) { setSaving(false); return }
      const note: DrawerNote = await res.json()
      setNotes(prev => [note, ...prev]); setNewNoteText(''); setNewNoteOpen(false)
    } finally { setSaving(false) }
  }

  function startEdit(note: DrawerNote) {
    setEditingId(note.id); setEditContent(note.content)
    setTimeout(() => editRef.current?.focus(), 50)
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/drawer-notes/${editingId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })
      const updated: DrawerNote = await res.json()
      setNotes(prev => prev.map(n => n.id === editingId ? updated : n)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))
      setEditingId(null)
    } finally { setSaving(false) }
  }

  async function deleteNote(id: string) {
    await fetch(`/api/drawer-notes/${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function addTodo() {
    if (!newTodo.trim()) return
    const t: DrawerTodo = { id: `${Date.now()}`, text: newTodo.trim(), done: false }
    const next = [t, ...todos]; setTodos(next); saveTodos(category, next)
    setNewTodo(''); setAddingTodo(false)
  }
  function toggleTodo(id: string) {
    const next = todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTodos(next); saveTodos(category, next)
  }
  function removeTodo(id: string) {
    const next = todos.filter(t => t.id !== id); setTodos(next); saveTodos(category, next)
  }

  if (!meta) return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-faint)' }}>引き出しが見つかりません</div>
  )

  const pendingCount = todos.filter(t => !t.done).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ヘッダー */}
      <div style={{
        background: `linear-gradient(160deg, ${drawerBg(meta.color)} 0%, var(--bg) 65%)`,
        padding: '20px 20px 0', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-faint)', fontSize: 13, textDecoration: 'none', marginBottom: 16 }}>
            <ChevronLeft size={15} /> ホーム
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: drawerBg(meta.color), border: `2px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DrawerIcon name={meta.icon} size={24} color={meta.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{meta.label}</div>
            </div>
          </div>

          {/* タブバー */}
          <div style={{ display: 'flex', gap: 0 }}>
            {([
              ['notes', 'メモ',       FileText,     notes.length > 0 ? notes.length : null],
              ['todos', 'TODO',       CheckSquare,  pendingCount > 0 ? pendingCount : null],
              ['cal',   'カレンダー', CalendarDays, null],
              ...(isWork ? [['calc', '計算', Calculator, null]] : []),
            ] as [string, string, React.ElementType, number | null][]).map(([t, label, Icon, count]) => (
              <button key={t} type="button" onClick={() => setTab(t as typeof tab)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: tab === t ? 700 : 500,
                color: tab === t ? meta.color : 'var(--text-faint)',
                borderBottom: `2.5px solid ${tab === t ? meta.color : 'transparent'}`,
                transition: 'all 0.18s', whiteSpace: 'nowrap',
              }}>
                <Icon size={13} />
                {label}
                {count !== null && <span style={{ fontSize: 10, background: meta.color, color: '#fff', borderRadius: 8, padding: '0 5px', lineHeight: '16px' }}>{count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 80px' }}>

        {/* ── メモタブ ── */}
        {tab === 'notes' && (
          <div className="fade-up">
            {/* 新規作成ボタン */}
            {!newNoteOpen && (
              <button type="button" onClick={() => setNewNoteOpen(true)} style={{
                width: '100%', padding: '12px', borderRadius: 14, border: `1.5px dashed ${meta.color}55`,
                background: drawerBg(meta.color), cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 13, color: meta.color, fontWeight: 600, marginBottom: 12,
                transition: 'opacity 0.15s',
              }}>
                <Plus size={15} /> 新しいメモを追加
              </button>
            )}

            {/* 新規入力フォーム */}
            {newNoteOpen && (
              <div style={{ background: 'var(--card)', borderRadius: 16, border: `1.5px solid ${meta.color}40`, padding: '14px', marginBottom: 12, boxShadow: `0 4px 20px ${meta.color}15` }}>
                <textarea ref={newRef} value={newNoteText} onChange={e => setNewNoteText(e.target.value)}
                  placeholder={'1行目がタイトルになります\n自由に書いてください...'}
                  rows={5} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 10, border: `1px solid ${meta.color}30`, fontSize: 14, color: 'var(--text)', lineHeight: 1.8, fontFamily: 'inherit', background: drawerBg(meta.color), outline: 'none', resize: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                  <button type="button" onClick={() => { setNewNoteOpen(false); setNewNoteText('') }} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${meta.color}30`, background: 'transparent', fontSize: 12, color: meta.color, cursor: 'pointer', fontFamily: 'inherit' }}>キャンセル</button>
                  <button type="button" onClick={createNote} disabled={!newNoteText.trim() || saving} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: meta.color, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', opacity: !newNoteText.trim() ? 0.4 : 1 }}>
                    {saving ? '保存中…' : '保存'}
                  </button>
                </div>
              </div>
            )}

            {/* メモリスト */}
            {notes.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: 'var(--text-faint)' }}>まだメモがありません</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notes.map(note => (
                  <div key={note.id} className="card-lift" style={{ background: 'var(--card)', borderRadius: 14, border: `1px solid ${meta.color}18`, overflow: 'hidden' }}>
                    {editingId === note.id ? (
                      <div style={{ padding: '14px' }}>
                        <textarea ref={editRef} value={editContent} onChange={e => setEditContent(e.target.value)} rows={6}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 10, border: `1px solid ${meta.color}40`, fontSize: 14, color: 'var(--text)', lineHeight: 1.8, fontFamily: 'inherit', background: drawerBg(meta.color), outline: 'none', resize: 'none' }} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button type="button" onClick={() => deleteNote(note.id)} style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: 'rgba(220,50,50,0.1)', fontSize: 12, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Trash2 size={12} /> 削除
                          </button>
                          <div style={{ flex: 1 }} />
                          <button type="button" onClick={() => setEditingId(null)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${meta.color}30`, background: 'transparent', fontSize: 12, color: meta.color, cursor: 'pointer', fontFamily: 'inherit' }}>キャンセル</button>
                          <button type="button" onClick={saveEdit} disabled={saving} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: meta.color, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                            {saving ? '保存中…' : '保存'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => startEdit(note)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <PenLine size={12} color={meta.color} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{noteTitle(note.content)}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-faint)', flexShrink: 0 }}>{noteDate(note.updated_at)}</span>
                        </div>
                        {notePreview(note.content) && (
                          <div style={{ fontSize: 12, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 20 }}>{notePreview(note.content)}</div>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TODOタブ ── */}
        {tab === 'todos' && (
          <div className="fade-up">
            {/* 追加フォーム */}
            {!addingTodo ? (
              <button type="button" onClick={() => setAddingTodo(true)} style={{
                width: '100%', padding: '12px', borderRadius: 14, border: `1.5px dashed ${meta.color}55`,
                background: drawerBg(meta.color), cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 13, color: meta.color, fontWeight: 600, marginBottom: 12,
              }}>
                <Plus size={15} /> TODO を追加
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input type="text" value={newTodo} onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTodo(); if (e.key === 'Escape') setAddingTodo(false) }}
                  placeholder="TODOを入力..."
                  autoFocus
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${meta.color}`, fontSize: 14, fontFamily: 'inherit', background: drawerBg(meta.color), color: 'var(--text)', outline: 'none' }} />
                <button type="button" onClick={addTodo} style={{ padding: '10px 18px', borderRadius: 12, background: meta.color, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>追加</button>
                <button type="button" onClick={() => setAddingTodo(false)} style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <X size={14} color="var(--text-faint)" />
                </button>
              </div>
            )}

            {todos.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: 'var(--text-faint)' }}>まだTODOがありません</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* 未完了 */}
                {todos.filter(t => !t.done).map(todo => (
                  <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--card)', border: `1px solid ${meta.color}20` }}>
                    <button type="button" onClick={() => toggleTodo(todo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1 }}>
                      <Square size={18} color={meta.color} />
                    </button>
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{todo.text}</span>
                    <button type="button" onClick={() => removeTodo(todo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, opacity: 0.3 }}>
                      <X size={14} color="var(--text-faint)" />
                    </button>
                  </div>
                ))}
                {/* 完了済み */}
                {todos.filter(t => t.done).length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 700, padding: '8px 4px 4px', letterSpacing: '0.5px' }}>完了済み</div>
                    {todos.filter(t => t.done).map(todo => (
                      <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--bg3)', border: '1px solid transparent', opacity: 0.55 }}>
                        <button type="button" onClick={() => toggleTodo(todo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1 }}>
                          <CheckSquare size={18} color={meta.color} />
                        </button>
                        <span style={{ flex: 1, fontSize: 14, color: 'var(--text-faint)', lineHeight: 1.6, textDecoration: 'line-through' }}>{todo.text}</span>
                        <button type="button" onClick={() => removeTodo(todo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, opacity: 0.4 }}>
                          <X size={14} color="var(--text-faint)" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── カレンダータブ ── */}
        {tab === 'cal' && (
          <div className="fade-up">
            <DrawerCalendar category={category} accentColor={meta.color} />
          </div>
        )}

        {/* ── 計算タブ（仕事のみ） ── */}
        {tab === 'calc' && isWork && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <WorkCalculator />
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 14 }}>電卓</div>
              <CalcWidget />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
