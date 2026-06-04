'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useStore()
  const router = useRouter()

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('招待コードを入力してください'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/auth/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: trimmed }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) { setError(json.error ?? '招待コードが無効です'); return }

    // 招待コードに紐づく名前・コードでログイン
    login(`${trimmed.toLowerCase()}@clarity.app`, json.client_name, json.code)
    router.replace('/')
  }

  function handleGuestLogin() {
    login('guest@clarity.app', 'ゲスト', '')
    router.replace('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
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
          style={{ width: 160, height: 160, objectFit: 'contain' }}
        />
      </div>

      <p style={{ fontSize: 13, color: '#a89a8a', marginBottom: 44, fontWeight: 500, letterSpacing: '0.05em' }}>
        インナーコーチングアプリ
      </p>

      {/* 招待コード入力 */}
      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 340 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#5a4a3a', display: 'block', marginBottom: 8, letterSpacing: '0.04em' }}>
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
            border: '1.5px solid #e8e0d4',
            borderRadius: 12,
            fontSize: 16, fontFamily: 'inherit', fontWeight: 600,
            color: '#2d1f0f', background: '#faf8f5',
            outline: 'none', letterSpacing: '0.08em',
            boxSizing: 'border-box',
            marginBottom: 8,
          }}
        />
        <p style={{ fontSize: 11, color: '#a89a8a', marginBottom: 20, lineHeight: 1.6 }}>
          Yukaさんから受け取った招待コードを入力してください。
        </p>

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
          <div style={{ flex: 1, height: 1, background: '#ece8e0' }} />
          <span style={{ fontSize: 11, color: '#c4b8a8', whiteSpace: 'nowrap' }}>または</span>
          <div style={{ flex: 1, height: 1, background: '#ece8e0' }} />
        </div>
        <button
          type="button"
          onClick={handleGuestLogin}
          style={{
            width: '100%', padding: '13px 0',
            background: 'transparent',
            color: '#a89a8a', fontSize: 13, fontWeight: 600,
            border: '1.5px solid #ece8e0', borderRadius: 50,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          コードなしで使ってみる
        </button>
      </div>

      <div style={{ marginTop: 40, fontSize: 11, color: '#d4c8bc', letterSpacing: '0.04em' }}>
        Clarity インナーコーチ
      </div>
    </div>
  )
}
