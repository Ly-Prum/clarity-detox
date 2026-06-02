'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useStore()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('メールアドレスとパスワードを入力してください')
      return
    }
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 700))
    login(email.trim())
    router.replace('/')
  }

  function handleTestLogin() {
    login('test@example.com', 'テストユーザー')
    router.replace('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f4f6fb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>

      {/* App Icon */}
      <div style={{
        width: 88, height: 88, borderRadius: 24,
        background: 'linear-gradient(145deg, #0ea5e9, #6055d8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
        boxShadow: '0 8px 32px rgba(14,165,233,0.28)',
      }}>
        <svg width={48} height={48} viewBox="0 0 160 160" fill="none">
          <path d="M80,18 C68,15 52,18 40,30 C26,36 16,52 15,70 C12,86 18,102 30,114 C42,126 58,134 72,136 C76,140 78,142 80,142 C82,142 84,140 88,136 C102,134 118,126 130,114 C142,102 148,86 145,70 C144,52 134,36 120,30 C108,18 92,15 80,18 Z"
            fill="white" opacity="0.95" />
          <path d="M80,20 C77,55 77,105 80,138" stroke="rgba(14,165,233,0.5)" strokeWidth="3" fill="none" />
        </svg>
      </div>

      <div style={{ fontSize: 26, fontWeight: 900, color: '#1a1d2e', marginBottom: 4, letterSpacing: '-0.5px' }}>
        Mind Detox
      </div>
      <div style={{ fontSize: 13, color: '#9aa0be', marginBottom: 40, fontWeight: 500 }}>
        脳内整理 × Clarityセッション管理
      </div>

      {/* Login form */}
      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{
            fontSize: 12, fontWeight: 600, color: '#5a6080',
            display: 'block', marginBottom: 6,
          }}>
            メールアドレス
          </label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            style={{
              background: '#ffffff',
              border: '1.5px solid #e4e8f2',
              color: '#1a1d2e',
              fontSize: 15,
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{
            fontSize: 12, fontWeight: 600, color: '#5a6080',
            display: 'block', marginBottom: 6,
          }}>
            パスワード
          </label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{
              background: '#ffffff',
              border: '1.5px solid #e4e8f2',
              color: '#1a1d2e',
              fontSize: 15,
            }}
          />
        </div>

        {error && (
          <div style={{
            fontSize: 12, color: '#e11d85',
            marginBottom: 16, textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '14px 0',
            background: loading ? '#93c5fd' : 'linear-gradient(135deg, #0ea5e9, #6055d8)',
            color: '#ffffff', fontSize: 15, fontWeight: 700,
            border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.3px',
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      <div style={{ marginTop: 16, width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#e4e8f2' }} />
          <span style={{ fontSize: 11, color: '#c0c6d8', whiteSpace: 'nowrap' }}>または</span>
          <div style={{ flex: 1, height: 1, background: '#e4e8f2' }} />
        </div>
        <button
          type="button"
          onClick={handleTestLogin}
          style={{
            width: '100%', padding: '13px 0',
            background: 'transparent',
            color: '#5a6080', fontSize: 14, fontWeight: 600,
            border: '1.5px solid #e4e8f2', borderRadius: 12,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          🧪 テストログイン
        </button>
      </div>

      <div style={{ marginTop: 32, fontSize: 11, color: '#c0c6d8' }}>
        Powered by Clarity
      </div>
    </div>
  )
}
