'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { ClarityReport } from '@/lib/types'

export default function ReportsPage() {
  const [reports, setReports] = useState<Pick<ClarityReport, 'id' | 'client_code' | 'session_date' | 'theme'>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('reports')
      .select('id, client_code, session_date, theme')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setReports(data)
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>レポート</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>作成済みの分析レポート一覧</div>
        </div>
        <Link href="/admin" style={{ padding: '9px 18px', borderRadius: 20, background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
          ＋ 新規作成
        </Link>
      </div>

      {loading && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>読み込み中...</div>}

      {!loading && reports.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          レポートがまだありません
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {reports.map(r => (
          <div key={r.id} style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{r.client_code}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{r.theme}</div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{r.session_date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
