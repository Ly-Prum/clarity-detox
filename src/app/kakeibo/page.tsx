'use client'
import { useState, useEffect } from 'react'
import { Plus, X, Trash2, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Wallet, Calculator, List, BarChart2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import CalcWidget from '@/components/CalcWidget'

interface Entry {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  note: string
  entry_date: string
}

const EXPENSE_PRESET = ['食費', '外食', '交通費', '光熱費', '通信費', '日用品', '衣服・美容', '医療', '教育', '娯楽']
const INCOME_PRESET  = ['給与', '副業', 'ボーナス']

const CAT_COLORS: Record<string, string> = {
  '食費': '#f97316', '外食': '#fb923c', '交通費': '#3b82f6', '光熱費': '#f59e0b',
  '通信費': '#6366f1', '日用品': '#22c55e', '衣服・美容': '#ec4899', '医療': '#ef4444',
  '教育': '#8b5cf6', '娯楽': '#a855f7',
  '給与': '#10b981', '副業': '#14b8a6', 'ボーナス': '#84cc16',
}
function catColor(cat: string) { return CAT_COLORS[cat] ?? '#94a3b8' }

function fmt(n: number) { return Math.abs(n).toLocaleString('ja-JP') }
function fmtDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}

// ── ドーナツグラフ ────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null
  const r = 54, cx = 64, cy = 64, stroke = 20
  let angle = -90

  return (
    <svg viewBox="0 0 128 128" style={{ width: 128, height: 128 }}>
      {data.map((d, i) => {
        const pct = d.value / total
        const sweep = pct * 360
        const start = angle
        angle += sweep
        const r1 = (Math.PI / 180) * start
        const r2 = (Math.PI / 180) * (start + sweep)
        const large = sweep > 180 ? 1 : 0
        const x1 = cx + r * Math.cos(r1), y1 = cy + r * Math.sin(r1)
        const x2 = cx + r * Math.cos(r2), y2 = cy + r * Math.sin(r2)
        const d_attr = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
        return <path key={i} d={d_attr} fill="none" stroke={d.color} strokeWidth={stroke} strokeLinecap="round" />
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--text-faint)', fontFamily: 'inherit' }}>支出</text>
      <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: 'var(--text)', fontFamily: 'inherit' }}>¥{fmt(total)}</text>
    </svg>
  )
}

export default function KakeiboPage() {
  const { currentUser } = useStore()

  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [tab,   setTab]   = useState<'list' | 'graph' | 'calc'>('list')

  const [entries,  setEntries]  = useState<Entry[]>([])
  const [loading,  setLoading]  = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Entry | null>(null)

  // フォームstate
  const [fType,      setFType]      = useState<'income' | 'expense'>('expense')
  const [fAmount,    setFAmount]    = useState('')
  const [fCat,       setFCat]       = useState(EXPENSE_PRESET[0])
  const [fCustomCat, setFCustomCat] = useState('')
  const [fNote,      setFNote]      = useState('')
  const [fDate,      setFDate]      = useState(now.toISOString().slice(0, 10))
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    if (!currentUser?.email) return
    setLoading(true)
    fetch(`/api/kakeibo?user_id=${encodeURIComponent(currentUser.email)}&year=${year}&month=${month}`)
      .then(r => r.json())
      .then((d: Entry[]) => { if (Array.isArray(d)) setEntries(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentUser?.email, year, month])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }

  const effectiveCat = fCat === 'custom' ? fCustomCat.trim() : fCat

  function openNew() {
    setEditTarget(null)
    setFType('expense'); setFAmount(''); setFCat(EXPENSE_PRESET[0])
    setFCustomCat(''); setFNote('')
    setFDate(new Date().toISOString().slice(0, 10))
    setShowForm(true)
  }
  function openEdit(e: Entry) {
    setEditTarget(e)
    setFType(e.type)
    const preset = (e.type === 'expense' ? EXPENSE_PRESET : INCOME_PRESET).includes(e.category)
    setFCat(preset ? e.category : 'custom')
    setFCustomCat(preset ? '' : e.category)
    setFAmount(String(e.amount)); setFNote(e.note); setFDate(e.entry_date)
    setShowForm(true)
  }
  function closeForm() { setShowForm(false); setEditTarget(null) }

  async function submit() {
    const amt = parseInt(fAmount.replace(/,/g, ''), 10)
    const cat = effectiveCat
    if (!amt || !cat || !currentUser?.email) return
    setSaving(true)
    try {
      if (editTarget) {
        const res = await fetch(`/api/kakeibo/${editTarget.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amt, type: fType, category: cat, note: fNote, entry_date: fDate }),
        })
        const updated: Entry = await res.json()
        setEntries(prev => prev.map(e => e.id === editTarget.id ? updated : e)
          .sort((a, b) => b.entry_date.localeCompare(a.entry_date)))
      } else {
        const res = await fetch('/api/kakeibo', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.email, amount: amt, type: fType, category: cat, note: fNote, entry_date: fDate }),
        })
        const created: Entry = await res.json()
        setEntries(prev => [created, ...prev].sort((a, b) => b.entry_date.localeCompare(a.entry_date)))
      }
      closeForm()
    } finally { setSaving(false) }
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/kakeibo/${id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
    closeForm()
  }

  const totalIncome  = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const balance      = totalIncome - totalExpense

  // カテゴリ別集計（支出）
  const catMap: Record<string, number> = {}
  entries.filter(e => e.type === 'expense').forEach(e => {
    catMap[e.category] = (catMap[e.category] ?? 0) + e.amount
  })
  const catList = Object.entries(catMap).sort((a, b) => b[1] - a[1])
  const donutData = catList.map(([label, value]) => ({ label, value, color: catColor(label) }))

  const cats = fType === 'expense' ? EXPENSE_PRESET : INCOME_PRESET

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ヘッダー */}
      <div style={{ background: 'linear-gradient(160deg, var(--primary-lt) 0%, var(--bg) 65%)', padding: '24px 20px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>家計簿</div>
            </div>
            <button type="button" onClick={openNew}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: 'var(--primary)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={14} /> 記録
            </button>
          </div>

          {/* 月ナビ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 14 }}>
            <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}><ChevronLeft size={20} /></button>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', minWidth: 110, textAlign: 'center' }}>{year}年{month}月</span>
            <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}><ChevronRight size={20} /></button>
          </div>

          {/* タブ */}
          <div style={{ display: 'flex' }}>
            {([
              ['list',  '明細',   List] ,
              ['graph', 'グラフ', BarChart2],
              ['calc',  '電卓',   Calculator],
            ] as [typeof tab, string, React.ElementType][]).map(([t, l, Icon]) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--primary)' : 'var(--text-faint)', borderBottom: `2.5px solid ${tab === t ? 'var(--primary)' : 'transparent'}`, transition: 'all 0.18s' }}>
                <Icon size={13} />{l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 80px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* サマリー（全タブ共通） */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '12px', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 4 }}>
              <TrendingUp size={12} color="#10b981" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>収入</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#10b981' }}>¥{fmt(totalIncome)}</div>
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '12px', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 4 }}>
              <TrendingDown size={12} color="#ef4444" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>支出</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#ef4444' }}>¥{fmt(totalExpense)}</div>
          </div>
          <div style={{ background: balance >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 16, padding: '12px', border: `1px solid ${balance >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 4 }}>残高</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: balance >= 0 ? '#10b981' : '#ef4444' }}>
              {balance >= 0 ? '+' : '−'}¥{fmt(balance)}
            </div>
          </div>
        </div>

        {/* ── 明細タブ ── */}
        {tab === 'list' && (
          <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: entries.length > 0 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)' }}>
                明細 {entries.length > 0 ? `（${entries.length}件）` : ''}
              </span>
            </div>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>読み込み中...</div>
            ) : entries.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📒</div>
                <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>まだ記録がありません</div>
              </div>
            ) : (
              <div>
                {entries.map((e, i) => {
                  const color = catColor(e.category)
                  return (
                    <button key={e.id} type="button" onClick={() => openEdit(e)}
                      style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color, textAlign: 'center', lineHeight: 1.2 }}>{e.category.slice(0, 3)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.note || e.category}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{fmtDate(e.entry_date)} · {e.category}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: e.type === 'income' ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                        {e.type === 'income' ? '+' : '−'}¥{fmt(e.amount)}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── グラフタブ ── */}
        {tab === 'graph' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {catList.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>支出の記録がありません</div>
            ) : (
              <>
                {/* ドーナツ＋凡例 */}
                <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 16 }}>支出の内訳</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <DonutChart data={donutData} />
                    <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {catList.map(([cat, amt]) => {
                        const pct = Math.round((amt / totalExpense) * 100)
                        const color = catColor(cat)
                        return (
                          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{cat}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 横棒グラフ */}
                <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: '16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 12 }}>カテゴリ別金額</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {catList.map(([cat, amt]) => {
                      const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0
                      const color = catColor(cat)
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{cat}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>¥{fmt(amt)}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--bg3)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 電卓タブ ── */}
        {tab === 'calc' && (
          <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 16px' }}>
            <CalcWidget />
          </div>
        )}

      </div>

      {/* 入力フォーム */}
      {showForm && (
        <>
          <div onClick={closeForm} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--card)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', zIndex: 101, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{editTarget ? '記録を編集' : '収支を記録'}</div>
              <button type="button" onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)' }}><X size={20} /></button>
            </div>

            {/* 収入/支出 */}
            <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 12, padding: 4, marginBottom: 16 }}>
              {(['expense', 'income'] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => { setFType(t); setFCat(t === 'expense' ? EXPENSE_PRESET[0] : INCOME_PRESET[0]); setFCustomCat('') }}
                  style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: fType === t ? (t === 'expense' ? '#ef4444' : '#10b981') : 'transparent', color: fType === t ? '#fff' : 'var(--text-faint)', transition: 'all 0.15s' }}>
                  {t === 'expense' ? '支出' : '収入'}
                </button>
              ))}
            </div>

            {/* 金額 */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>金額</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg3)', borderRadius: 12, border: '1.5px solid var(--border)' }}>
                <span style={{ padding: '0 12px', fontSize: 16, fontWeight: 700, color: 'var(--text-faint)' }}>¥</span>
                <input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)}
                  placeholder="0" inputMode="numeric"
                  style={{ flex: 1, padding: '12px 8px 12px 0', border: 'none', background: 'transparent', fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            </div>

            {/* カテゴリ（プリセット＋カスタム） */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 8 }}>カテゴリ</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {cats.map(cat => (
                  <button key={cat} type="button" onClick={() => { setFCat(cat); setFCustomCat('') }}
                    style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${fCat === cat ? catColor(cat) : 'var(--border)'}`, background: fCat === cat ? `${catColor(cat)}18` : 'transparent', fontSize: 12, fontWeight: fCat === cat ? 700 : 500, color: fCat === cat ? catColor(cat) : 'var(--text-faint)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}>
                    {cat}
                  </button>
                ))}
                <button type="button" onClick={() => setFCat('custom')}
                  style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${fCat === 'custom' ? 'var(--primary)' : 'var(--border)'}`, background: fCat === 'custom' ? 'var(--primary-lt)' : 'transparent', fontSize: 12, fontWeight: fCat === 'custom' ? 700 : 500, color: fCat === 'custom' ? 'var(--primary)' : 'var(--text-faint)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ＋ 自由入力
                </button>
              </div>
              {fCat === 'custom' && (
                <input type="text" value={fCustomCat} onChange={e => setFCustomCat(e.target.value)}
                  placeholder="カテゴリ名を入力"
                  autoFocus
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 14px', borderRadius: 12, border: '1.5px solid var(--primary)', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
              )}
            </div>

            {/* メモ */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>メモ（任意）</label>
              <input type="text" value={fNote} onChange={e => setFNote(e.target.value)}
                placeholder="例：スーパーで食材購入"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            </div>

            {/* 日付 */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', display: 'block', marginBottom: 6 }}>日付</label>
              <input type="date" value={fDate} onChange={e => setFDate(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {editTarget && (
                <button type="button" onClick={() => deleteEntry(editTarget.id)}
                  style={{ padding: '13px 18px', borderRadius: 14, border: 'none', background: 'rgba(239,68,68,0.1)', fontSize: 13, color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trash2 size={14} /> 削除
                </button>
              )}
              <button type="button" onClick={submit} disabled={!fAmount || (fCat === 'custom' && !fCustomCat.trim()) || saving}
                style={{ flex: 1, padding: '13px', borderRadius: 14, border: 'none', background: (!fAmount || (fCat === 'custom' && !fCustomCat.trim())) ? 'var(--bg3)' : fType === 'expense' ? '#ef4444' : '#10b981', fontSize: 14, fontWeight: 800, color: (!fAmount || (fCat === 'custom' && !fCustomCat.trim())) ? 'var(--text-faint)' : '#fff', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                {saving ? '保存中…' : editTarget ? '更新する' : '保存する'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
