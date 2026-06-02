'use client'
import { useState, useEffect } from 'react'
import SplashScreen from './SplashScreen'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    const shown = sessionStorage.getItem('splashShown')
    if (!shown) setShowSplash(true)
  }, [])

  function handleComplete() {
    sessionStorage.setItem('splashShown', '1')
    setShowSplash(false)
  }

  return (
    <>
      {children}
      {showSplash && <SplashScreen onComplete={handleComplete} />}
    </>
  )
}
