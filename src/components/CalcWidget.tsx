'use client'
import { useState } from 'react'

export default function CalcWidget() {
  const [display, setDisplay] = useState('0')
  const [prev,    setPrev]    = useState<number | null>(null)
  const [op,      setOp]      = useState<string | null>(null)
  const [fresh,   setFresh]   = useState(false)

  function pushDigit(d: string) {
    if (fresh) { setDisplay(d); setFresh(false); return }
    setDisplay(s => s === '0' ? d : s.length >= 12 ? s : s + d)
  }
  function pushDot() {
    if (fresh) { setDisplay('0.'); setFresh(false); return }
    if (!display.includes('.')) setDisplay(s => s + '.')
  }
  function pushOp(o: string) {
    setPrev(parseFloat(display))
    setOp(o)
    setFresh(true)
  }
  function pushEqual() {
    if (prev === null || op === null) return
    const cur = parseFloat(display)
    let result: number
    switch (op) {
      case '+': result = prev + cur; break
      case '−': result = prev - cur; break
      case '×': result = prev * cur; break
      case '÷': result = cur !== 0 ? prev / cur : 0; break
      default:  result = cur
    }
    const str = String(parseFloat(result.toPrecision(12)))
    setDisplay(str.length > 12 ? result.toExponential(4) : str)
    setPrev(null); setOp(null); setFresh(false)
  }
  function clear() { setDisplay('0'); setPrev(null); setOp(null); setFresh(false) }
  function backspace() {
    setDisplay(s => s.length <= 1 ? '0' : s.slice(0, -1))
  }
  function toggleSign() {
    setDisplay(s => s.startsWith('-') ? s.slice(1) : '-' + s)
  }
  function percent() {
    setDisplay(s => String(parseFloat(s) / 100))
  }

  const fmt = (s: string) => {
    const n = parseFloat(s)
    if (isNaN(n)) return s
    if (s.includes('.') || s.endsWith('.')) return s
    return n.toLocaleString('ja-JP')
  }

  const btnBase: React.CSSProperties = {
    borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 600,
    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: 60, transition: 'opacity 0.1s',
  }

  function Btn({ label, onPress, color, textColor, flex2 }: {
    label: string; onPress: () => void
    color: string; textColor: string; flex2?: boolean
  }) {
    return (
      <button type="button" onClick={onPress}
        style={{ ...btnBase, background: color, color: textColor, gridColumn: flex2 ? 'span 2' : undefined }}>
        {label}
      </button>
    )
  }

  return (
    <div style={{ maxWidth: 320, margin: '0 auto' }}>
      {/* ディスプレイ */}
      <div style={{ background: 'var(--bg3)', borderRadius: 16, padding: '16px 20px 12px', marginBottom: 12, textAlign: 'right' }}>
        {op && (
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 2 }}>
            {prev?.toLocaleString('ja-JP')} {op}
          </div>
        )}
        <div style={{ fontSize: display.length > 9 ? 22 : 32, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px', overflowX: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fmt(display)}
        </div>
      </div>

      {/* ボタングリッド */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <Btn label="AC"  onPress={clear}       color="var(--bg3)" textColor="var(--text-faint)" />
        <Btn label="+/-" onPress={toggleSign}   color="var(--bg3)" textColor="var(--text-faint)" />
        <Btn label="%"   onPress={percent}      color="var(--bg3)" textColor="var(--text-faint)" />
        <Btn label="÷"   onPress={() => pushOp('÷')} color={op === '÷' ? 'var(--text)' : 'var(--primary)'} textColor={op === '÷' ? 'var(--primary)' : '#fff'} />

        <Btn label="7" onPress={() => pushDigit('7')} color="var(--card)" textColor="var(--text)" />
        <Btn label="8" onPress={() => pushDigit('8')} color="var(--card)" textColor="var(--text)" />
        <Btn label="9" onPress={() => pushDigit('9')} color="var(--card)" textColor="var(--text)" />
        <Btn label="×" onPress={() => pushOp('×')} color={op === '×' ? 'var(--text)' : 'var(--primary)'} textColor={op === '×' ? 'var(--primary)' : '#fff'} />

        <Btn label="4" onPress={() => pushDigit('4')} color="var(--card)" textColor="var(--text)" />
        <Btn label="5" onPress={() => pushDigit('5')} color="var(--card)" textColor="var(--text)" />
        <Btn label="6" onPress={() => pushDigit('6')} color="var(--card)" textColor="var(--text)" />
        <Btn label="−" onPress={() => pushOp('−')} color={op === '−' ? 'var(--text)' : 'var(--primary)'} textColor={op === '−' ? 'var(--primary)' : '#fff'} />

        <Btn label="1" onPress={() => pushDigit('1')} color="var(--card)" textColor="var(--text)" />
        <Btn label="2" onPress={() => pushDigit('2')} color="var(--card)" textColor="var(--text)" />
        <Btn label="3" onPress={() => pushDigit('3')} color="var(--card)" textColor="var(--text)" />
        <Btn label="+" onPress={() => pushOp('+')} color={op === '+' ? 'var(--text)' : 'var(--primary)'} textColor={op === '+' ? 'var(--primary)' : '#fff'} />

        <Btn label="0"   onPress={() => pushDigit('0')} color="var(--card)" textColor="var(--text)" flex2 />
        <Btn label="."   onPress={pushDot}              color="var(--card)" textColor="var(--text)" />
        <Btn label="="   onPress={pushEqual}            color="var(--primary)" textColor="#fff" />
      </div>

      <button type="button" onClick={backspace}
        style={{ ...btnBase, width: '100%', marginTop: 8, background: 'var(--bg3)', color: 'var(--text-faint)', fontSize: 14 }}>
        ⌫ 削除
      </button>
    </div>
  )
}
