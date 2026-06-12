'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { loadDrawers, saveDrawers, DRAWER_COLORS, DRAWER_ICONS, drawerBg } from '@/lib/drawerConfig'
import type { DrawerItem } from '@/lib/drawerConfig'
import DrawerIcon from '@/components/DrawerIcon'

export default function DrawersPage() {
  const [drawers, setDrawers] = useState<DrawerItem[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const [form, setForm] = useState({ label: '', icon: 'Folder', color: DRAWER_COLORS[0] })

  useEffect(() => {
    setDrawers(loadDrawers())
  }, [])

  function save(updated: DrawerItem[]) {
    setDrawers(updated)
    saveDrawers(updated)
  }

  function startAdd() {
    setForm({ label: '', icon: 'Folder', color: DRAWER_COLORS[0] })
    setAdding(true)
    setEditing(null)
  }

  function startEdit(d: DrawerItem) {
    setForm({ label: d.label, icon: d.icon, color: d.color })
    setEditing(d.id)
    setAdding(false)
  }

  function confirmAdd() {
    if (!form.label.trim()) return
    const newItem: DrawerItem = {
      id: form.label.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      label: form.label.trim(),
      icon: form.icon,
      color: form.color,
    }
    save([...drawers, newItem])
    setAdding(false)
  }

  function confirmEdit() {
    if (!form.label.trim() || !editing) return
    save(drawers.map(d => d.id === editing ? { ...d, ...form, label: form.label.trim() } : d))
    setEditing(null)
  }

  function deleteDrawer(id: string) {
    save(drawers.filter(d => d.id !== id))
  }

  const isActive = (id: string) => editing === id

  return (
    <div className="page-content" style={{ paddingBottom: 32 }}>

      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>引き出し</h1>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '3px 0 0' }}>
            思考を分類して保存する場所です
          </p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 50, background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={15} /> 追加
        </button>
      </div>

      {/* 追加フォーム */}
      {adding && (
        <DrawerForm
          form={form}
          onChange={setForm}
          onConfirm={confirmAdd}
          onCancel={() => setAdding(false)}
          title="新しい引き出し"
        />
      )}

      {/* 引き出しグリッド */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {drawers.map(d => (
          <div key={d.id}>
            {isActive(d.id) ? (
              <DrawerForm
                form={form}
                onChange={setForm}
                onConfirm={confirmEdit}
                onCancel={() => setEditing(null)}
                title="編集"
              />
            ) : (
              <div style={{ position: 'relative' }}>
                <Link
                  href={`/drawer/${d.id}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    padding: '20px 12px 16px',
                    background: drawerBg(d.color),
                    border: `1.5px solid ${d.color}33`,
                    borderRadius: 16,
                    textDecoration: 'none',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${d.color}22` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${d.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DrawerIcon name={d.icon} size={26} color={d.color} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textAlign: 'center' }}>{d.label}</span>
                </Link>
                {/* 編集・削除ボタン */}
                <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                  <button type="button" onClick={() => startEdit(d)}
                    style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                  ><Pencil size={12} /></button>
                  <button type="button" onClick={() => deleteDrawer(d.id)}
                    style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                  ><Trash2 size={12} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DrawerForm({
  form, onChange, onConfirm, onCancel, title,
}: {
  form: { label: string; icon: string; color: string }
  onChange: (f: { label: string; icon: string; color: string }) => void
  onConfirm: () => void
  onCancel: () => void
  title: string
}) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</p>
      <input
        autoFocus
        type="text"
        placeholder="引き出しの名前"
        value={form.label}
        onChange={e => onChange({ ...form, label: e.target.value })}
        onKeyDown={e => e.key === 'Enter' && onConfirm()}
        style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 14, color: 'var(--text)', outline: 'none', fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box' }}
      />

      {/* アイコン選択 */}
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', margin: '0 0 6px' }}>アイコン</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {DRAWER_ICONS.map(ic => (
          <button key={ic.id} type="button"
            onClick={() => onChange({ ...form, icon: ic.id })}
            title={ic.label}
            style={{ width: 32, height: 32, borderRadius: 8, border: form.icon === ic.id ? `2px solid ${form.color}` : '1.5px solid var(--border)', background: form.icon === ic.id ? `${form.color}18` : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: form.icon === ic.id ? form.color : 'var(--text-faint)' }}
          >
            <DrawerIcon name={ic.id} size={16} color={form.icon === ic.id ? form.color : undefined} />
          </button>
        ))}
      </div>

      {/* カラー選択 */}
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', margin: '0 0 6px' }}>カラー</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {DRAWER_COLORS.map(c => (
          <button key={c} type="button"
            onClick={() => onChange({ ...form, color: c })}
            style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--text)' : '2px solid transparent', cursor: 'pointer', padding: 0 }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-sub)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
        ><X size={14} /> キャンセル</button>
        <button type="button" onClick={onConfirm}
          style={{ flex: 2, padding: '8px 0', borderRadius: 8, background: 'var(--primary)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
        ><Check size={14} /> 保存</button>
      </div>
    </div>
  )
}
