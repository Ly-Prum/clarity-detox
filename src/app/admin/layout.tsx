'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import CoachSidebar from '@/components/CoachSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return (
    <div className="coach-layout">
      <CoachSidebar />
      <main className="coach-main">{children}</main>
    </div>
  )
}
