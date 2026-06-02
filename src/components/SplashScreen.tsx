'use client'
import { useEffect, useState } from 'react'

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600)
    const t2 = setTimeout(() => setPhase('out'), 2000)
    const t3 = setTimeout(onComplete, 2600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#ffffff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 20,
      opacity: phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.5s ease' : 'none',
    }}>
      {/* App Icon */}
      <div style={{
        width: 96, height: 96, borderRadius: 26,
        background: 'linear-gradient(145deg, #0ea5e9, #6055d8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 40px rgba(14,165,233,0.35)',
        opacity: phase === 'in' ? 0 : 1,
        transform: phase === 'in' ? 'scale(0.75)' : 'scale(1)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <svg width={52} height={52} viewBox="0 0 160 160" fill="none">
          <path d="M80,18 C68,15 52,18 40,30 C26,36 16,52 15,70 C12,86 18,102 30,114 C42,126 58,134 72,136 C76,140 78,142 80,142 C82,142 84,140 88,136 C102,134 118,126 130,114 C142,102 148,86 145,70 C144,52 134,36 120,30 C108,18 92,15 80,18 Z"
            fill="white" opacity="0.95" />
          <path d="M80,20 C77,55 77,105 80,138" stroke="rgba(14,165,233,0.6)" strokeWidth="3" fill="none" />
        </svg>
      </div>

      {/* App name */}
      <div style={{
        textAlign: 'center',
        opacity: phase === 'in' ? 0 : 1,
        transform: phase === 'in' ? 'translateY(12px)' : 'translateY(0)',
        transition: 'opacity 0.5s 0.15s ease, transform 0.5s 0.15s ease',
      }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#1a1d2e', letterSpacing: '-0.5px', marginBottom: 4 }}>
          Mind Detox
        </div>
        <div style={{ fontSize: 13, color: '#9aa0be', fontWeight: 500 }}>by Clarity</div>
      </div>

      {/* Loading dots */}
      <div style={{
        display: 'flex', gap: 6, marginTop: 8,
        opacity: phase === 'hold' ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#0ea5e9',
            animation: `dot 1s ${i * 0.15}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
