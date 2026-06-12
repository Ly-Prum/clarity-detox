'use client'
import { useState } from 'react'
import { CheckSquare, Square, Trash2, Plus } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { ThoughtTag } from '@/lib/types'

const TAG_COLORS: Record<ThoughtTag, string> = {
  'タスク':   '#3b82f6',
  '感情':     '#ec4899',
  '不安':     '#f59e0b',
  '人間関係': '#8b5cf6',
  'アイデア': '#10b981',
  'その他':   '#64748b',
}

const ALL_TAGS: ThoughtTag[] = ['タスク', '感情', '不安', '人間関係', 'アイデア', 'その他']

export default function TodoPage() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useStore()
  const [filter, setFilter] = useState<ThoughtTag | 'all'>('all')
  const [showDone, setShowDone] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [newTag, setNewTag] = useState<ThoughtTag>('タスク')

  const filtered = todos.filter(t => {
    if (!showDone && t.completed) return false
    if (filter !== 'all' && t.tag !== filter) return false
    return true
  })

  const pending = todos.filter(t => !t.completed).length

  function handleAdd() {
    if (!newText.trim()) return
    addTodo({ text: newText.trim(), tag: newTag, completed: false })
    setNewText('')
    setAdding(false)
  }

  return (
    <div className="page-content" style={{ paddingBottom: 32 }}>

      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>TODO</h1>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '3px 0 0' }}>
            {pending > 0 ? `${pending}件 未完了` : 'すべて完了しています'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 50, background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={15} /> 追加
        </button>
      </div>

      {/* タグフィルター */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setFilter('all')}
          style={{ padding: '4px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600, border: '1.5px solid', cursor: 'pointer',
            background: filter === 'all' ? 'var(--primary)' : 'transparent',
            borderColor: filter === 'all' ? 'var(--primary)' : 'var(--border)',
            color: filter === 'all' ? '#fff' : 'var(--text-sub)',
          }}
        >すべて</button>
        {ALL_TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => setFilter(tag)}
            style={{ padding: '4px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600, border: '1.5px solid', cursor: 'pointer',
              background: filter === tag ? TAG_COLORS[tag] : 'transparent',
              borderColor: TAG_COLORS[tag],
              color: filter === tag ? '#fff' : TAG_COLORS[tag],
            }}
          >{tag}</button>
        ))}
      </div>

      {/* 追加フォーム */}
      {adding && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
          <input
            autoFocus
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="タスクを入力..."
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text)', fontFamily: 'inherit', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {ALL_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setNewTag(tag)}
                style={{ padding: '3px 10px', borderRadius: 50, fontSize: 10, fontWeight: 700, border: '1.5px solid', cursor: 'pointer',
                  background: newTag === tag ? TAG_COLORS[tag] : 'transparent',
                  borderColor: TAG_COLORS[tag],
                  color: newTag === tag ? '#fff' : TAG_COLORS[tag],
                }}
              >{tag}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setAdding(false)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-sub)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >キャンセル</button>
            <button type="button" onClick={handleAdd}
              style={{ flex: 2, padding: '8px 0', borderRadius: 8, background: 'var(--primary)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >追加する</button>
          </div>
        </div>
      )}

      {/* TODO リスト */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
            {filter === 'all' ? 'タスクがありません' : `「${filter}」のタスクがありません`}
          </div>
        ) : filtered.map(todo => (
          <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
            <button type="button" onClick={() => toggleTodo(todo.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: todo.completed ? 'var(--primary)' : 'var(--text-faint)', flexShrink: 0, marginTop: 1 }}
            >
              {todo.completed ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, color: todo.completed ? 'var(--text-faint)' : 'var(--text)', margin: 0, lineHeight: 1.5, textDecoration: todo.completed ? 'line-through' : 'none' }}>
                {todo.text}
              </p>
              <span style={{ display: 'inline-block', marginTop: 5, padding: '2px 8px', borderRadius: 50, fontSize: 10, fontWeight: 700, background: `${TAG_COLORS[todo.tag as ThoughtTag]}18`, color: TAG_COLORS[todo.tag as ThoughtTag] }}>
                {todo.tag}
              </span>
            </div>
            <button type="button" onClick={() => deleteTodo(todo.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-faint)', flexShrink: 0 }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* 完了済みトグル */}
      {todos.some(t => t.completed) && (
        <button
          type="button"
          onClick={() => setShowDone(p => !p)}
          style={{ marginTop: 16, width: '100%', padding: '10px 0', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-faint)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          {showDone ? '完了済みを隠す' : `完了済みを表示（${todos.filter(t => t.completed).length}件）`}
        </button>
      )}
    </div>
  )
}
