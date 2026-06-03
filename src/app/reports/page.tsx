'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { ReportCard } from '@/components/ReportCard'
import type { ClarityReport } from '@/lib/types'

export default function ReportsPage() {
  const { currentUser } = useStore()
  const [reports, setReports] = useState<ClarityReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    supabase
      .from('reports')
      .select('*')
      .eq('client_code', currentUser.name)
      .order('session_date', { ascending: false })
      .then(({ data }) => {
        if (data) setReports(data as ClarityReport[])
        setLoading(false)
      })
  }, [currentUser])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Clarity</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>分析レポート</div>
        <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>コーチからのセッション分析レポート</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)', fontSize: 13 }}>読み込み中...</div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>まだレポートがありません</div>
          <div style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.7 }}>
            セッション後にコーチからレポートが届くと<br />ここに表示されます
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>{reports.length}件のレポート</div>
          {reports.map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  )
}
