'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

const SAVED_CODE_KEY = 'clarity_saved_code'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [saveCode, setSaveCode] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useStore()
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_CODE_KEY)
    if (saved) { setCode(saved); setSaveCode(true) }
  }, [])

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('招待コードを入力してください'); return }
    setLoading(true); setError('')

    try {
      const res = await fetch('/api/auth/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? '招待コードが無効です')
        setLoading(false)
        return
      }

      if (saveCode) localStorage.setItem(SAVED_CODE_KEY, trimmed)
      else localStorage.removeItem(SAVED_CODE_KEY)
      login(`${trimmed.toLowerCase()}@clarity.app`, json.client_name, json.code)
      router.replace('/')
    } catch {
      setError('通信エラーが発生しました。もう一度お試しください。')
      setLoading(false)
    }
  }

  function handleGuestLogin() {
    login('guest@clarity.app', 'ゲスト', '')
    router.replace('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 28px',
    }}>

      {/* Clarity ロゴ */}
      <div style={{ marginBottom: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/clarity-logo.png"
          alt="Clarity inner coach"
          style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: '50%' }}
        />
      </div>

      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 44, fontWeight: 500, letterSpacing: '0.05em' }}>
        インナーコーチングアプリ
      </p>

      {/* 招待コード入力 */}
      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 340 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8, letterSpacing: '0.04em' }}>
          招待コード
        </label>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="例：CLARITY-2024"
          autoComplete="off"
          autoCapitalize="characters"
          style={{
            width: '100%', padding: '14px 16px',
            border: '1.5px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            fontSize: 16, fontFamily: 'inherit', fontWeight: 600,
            color: '#ffffff', background: 'rgba(255,255,255,0.08)',
            outline: 'none', letterSpacing: '0.08em',
            boxSizing: 'border-box',
            marginBottom: 8,
          }}
        />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.6 }}>
          Yukaさんから受け取った招待コードを入力してください。
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={saveCode}
            onChange={e => setSaveCode(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#c9a96e', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>このデバイスにコードを保存する</span>
        </label>

        {error && (
          <div style={{ fontSize: 12, color: '#e11d48', marginBottom: 14, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '15px 0',
            background: loading
              ? '#d4c8bc'
              : 'linear-gradient(135deg, #c9a96e, #b4956c)',
            color: '#ffffff', fontSize: 15, fontWeight: 700,
            border: 'none', borderRadius: 50,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: loading ? 'none' : '0 6px 20px rgba(180,149,108,0.4)',
            letterSpacing: '0.02em',
          }}
        >
          {loading ? '確認中...' : 'はじめる'}
        </button>
      </form>

      {/* ゲストとして使う */}
      <div style={{ marginTop: 24, width: '100%', maxWidth: 340 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>または</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <button
          type="button"
          onClick={handleGuestLogin}
          style={{
            width: '100%', padding: '13px 0',
            background: 'transparent',
            color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600,
            border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 50,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          コードなしで使ってみる
        </button>
      </div>

      <div style={{ marginTop: 40, fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>
        Clarity インナーコーチ
      </div>
    </div>
  )
}
