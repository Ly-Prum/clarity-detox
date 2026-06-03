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
      background: '#c9a87e',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 8,
      opacity: phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.5s ease' : 'none',
    }}>
      {/* Clarity ロゴ（ベージュ背景版） */}
      <div style={{
        opacity: phase === 'in' ? 0 : 1,
        transform: phase === 'in' ? 'scale(0.85)' : 'scale(1)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/clarity-logo-beige.png"
          alt="Clarity"
          style={{ width: 220, height: 220, objectFit: 'contain' }}
        />
      </div>

      {/* ローディングドット */}
      <div style={{
        display: 'flex', gap: 6, marginTop: 8,
        opacity: phase === 'hold' ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'rgba(60,45,30,0.4)',
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
