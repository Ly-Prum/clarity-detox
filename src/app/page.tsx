'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, FileText, Settings, Bell, Lightbulb, MessageSquare, CalendarDays, ExternalLink } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { ClarityReport } from '@/lib/types'
import { loadDrawers, drawerBg, DEFAULT_DRAWERS } from '@/lib/drawerConfig'
import type { DrawerItem } from '@/lib/drawerConfig'
import DrawerIcon from '@/components/DrawerIcon'

interface CalEvent {
  id: string; title: string; date: string; time: string; note: string; color: string; url?: string
}
interface NextEvent { event: CalEvent; drawerLabel: string; drawerColor: string; drawerId: string }

const DEFAULT_MESSAGES = [
  'まず「今日やること」を3つだけ決めてみましょう。',
  '頭の中が散らかったら、書き出すだけで整理できます。',
  '小さな気づきを積み重ねることが、大きな変化につながります。',
  '今日の自分を、そのまま受け取ってみてください。',
  '迷っているときほど、立ち止まって深呼吸を。',
]

export default function HomePage() {
  const { currentUser, sessions } = useStore()
  const name = currentUser?.name?.replace('@clarity.app', '') ?? ''

  const [drawers, setDrawers] = useState<DrawerItem[]>(DEFAULT_DRAWERS)
  const [nextEvent, setNextEvent] = useState<NextEvent | null>(null)
  const [notifSeen, setNotifSeen] = useState(false)

  useEffect(() => {
    const loaded = loadDrawers()
    setDrawers(loaded)
    const todayStr = new Date().toISOString().slice(0, 10)
    let found: NextEvent | null = null
    loaded.forEach(drawer => {
      try {
        const evs: CalEvent[] = JSON.parse(localStorage.getItem(`clarity-calendar-events-${drawer.id}`) ?? '[]')
        evs.forEach(ev => {
          if (ev.date >= todayStr) {
            if (!found || (ev.date + ev.time) < (found.event.date + found.event.time)) {
              found = { event: ev, drawerLabel: drawer.label, drawerColor: drawer.color, drawerId: drawer.id }
            }
          }
        })
      } catch {}
    })
    setNextEvent(found)
  }, [])

  const DUMMY_REPORT: ClarityReport = {
    id: 'demo',
    client_code: 'DEMO',
    session_date: '2026-06-01',
    theme: '自分らしいペースで進むために',
    core_theme: '「やらなければ」から「やりたい」へのシフト',
    current_state: '多くのことを抱えながらも、丁寧に向き合おうとするエネルギーを感じます。一方で、自分への期待値が高く、完璧にこなせない自分を責めてしまう傾向も見られます。',
    natural_strengths: ['観察力・洞察力', '共感と傾聴', '誠実さ', '粘り強さ'],
    challenges: ['「べき思考」の手放し', '自分に対する優しさの練習', '小さな成功を認める習慣'],
    overall: 'あなたの中にはすでに必要なものが揃っています。今は、それを信頼して一歩ずつ進む時期です。完璧でなくていい、今日の自分で十分です。',
    thinking_patterns: [],
    word_conversions: [],
    scores: {},
    images: [],
    created_at: '2026-06-01T00:00:00Z',
    is_read: false,
  }

  const [latestReport, setLatestReport] = useState<ClarityReport | null>(DUMMY_REPORT)

  useEffect(() => {
    if (!latestReport) return
    const seenId = localStorage.getItem('clarity-notif-seen')
    if (seenId === latestReport.id) setNotifSeen(true)
  }, [latestReport])

  useEffect(() => {
    if (!currentUser) return
    const code = currentUser.inviteCode || currentUser.name
    if (!code) return
    fetch(`/api/coach-reports?code=${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then((data: ClarityReport[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const report = data[0]
          setLatestReport(report)
          const seenId = localStorage.getItem('clarity-notif-seen')
          if (seenId === report.id) setNotifSeen(true)
        }
      })
      .catch(() => {})
  }, [currentUser])

  const todayMessage = (() => {
    if (latestReport?.overall) {
      const first = latestReport.overall.split(/。|\n/).filter(Boolean)[0]
      if (first) return first + '。'
    }
    if (sessions.length > 0) return sessions[0].analysis.advice
    return DEFAULT_MESSAGES[new Date().getDay() % DEFAULT_MESSAGES.length]
  })()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'おはようございます' : hour < 17 ? 'こんにちは' : 'おつかれさまです'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── ヘッダー ── */}
      <div className="home-header" style={{
        background: 'linear-gradient(160deg, var(--primary-lt) 0%, var(--bg) 70%)',
        padding: '36px 20px 28px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 4, letterSpacing: '0.5px' }}>
                {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2 }}>
                {greeting}{name ? `、${name}さん` : ''}
              </div>
            </div>
            <Link href="/settings" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Settings size={16} color="var(--text-faint)" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 40px', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── コーチからのアラート ── */}
        {latestReport && (
          <Link href="/reports" className="home-section card-lift" style={{ textDecoration: 'none', display: 'block' }}
            onClick={() => { localStorage.setItem('clarity-notif-seen', latestReport.id); setNotifSeen(true) }}>
            <div style={{
              background: '#1d4ed8',
              borderRadius: 16, padding: '14px 16px',
              boxShadow: '0 4px 20px rgba(29,78,216,0.35)',
              display: 'flex', alignItems: 'center', gap: 14,
              animation: notifSeen ? 'none' : 'notif-pulse 1.8s ease-in-out infinite',
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={20} color="#fff" strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginBottom: 3 }}>コーチから新しいレポートが届いています</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latestReport.theme}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{latestReport.session_date}</div>
              </div>
              <ChevronRight size={18} color="rgba(255,255,255,0.8)" style={{ flexShrink: 0 }} />
            </div>
          </Link>
        )}

        {/* ── 次の予定 ── */}
        {nextEvent && (
          <div className="home-section">
            <Link href={`/drawer/${nextEvent.drawerId}?tab=cal`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'var(--card)', borderRadius: 18, border: `1.5px solid ${nextEvent.drawerColor}30`, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: `${nextEvent.drawerColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CalendarDays size={13} color={nextEvent.drawerColor} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: nextEvent.drawerColor }}>次の予定</span>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)', background: `${nextEvent.drawerColor}12`, padding: '2px 8px', borderRadius: 20, fontWeight: 600, marginLeft: 2 }}>{nextEvent.drawerLabel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'center', minWidth: 46, padding: '7px 4px', background: `${nextEvent.drawerColor}12`, borderRadius: 12, flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: nextEvent.drawerColor }}>
                      {new Date(nextEvent.event.date + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: nextEvent.drawerColor, lineHeight: 1.1 }}>
                      {new Date(nextEvent.event.date + 'T00:00:00').getDate()}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: nextEvent.drawerColor }}>
                      {new Date(nextEvent.event.date + 'T00:00:00').toLocaleDateString('ja-JP', { weekday: 'short' })}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{nextEvent.event.title}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                      {nextEvent.event.time && <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{nextEvent.event.time}</span>}
                      {nextEvent.event.note && <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{nextEvent.event.time ? '· ' : ''}{nextEvent.event.note}</span>}
                    </div>
                  </div>
                  {nextEvent.event.url ? (
                    <a href={nextEvent.event.url} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ padding: '10px 16px', borderRadius: 14, background: nextEvent.drawerColor, color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <ExternalLink size={12} /> 予約
                    </a>
                  ) : (
                    <ChevronRight size={16} color={nextEvent.drawerColor} style={{ flexShrink: 0 }} />
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ── 今日のひとこと ── */}
        <div className="home-section">
          <div style={{ background: 'var(--card)', borderRadius: 18, border: '1px solid var(--border)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {latestReport
                  ? <MessageSquare size={14} color="var(--primary)" />
                  : <Lightbulb size={14} color="var(--primary)" />}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                {latestReport ? 'コーチからのメッセージ' : '今日のひとこと'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.85, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayMessage.split('。').filter(s => s.trim()).map((s, i) => (
                  <p key={i} style={{ margin: 0 }}>{s}。</p>
                ))}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bear-mascot.png" alt="" aria-hidden="true" style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }} />
            </div>
          </div>
        </div>

        {/* ── 引き出し ── */}
        <div className="home-section">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.5px', marginBottom: 10 }}>引き出し</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {drawers.map(d => (
              <Link key={d.id} href={`/drawer/${d.id}`} style={{ textDecoration: 'none' }}>
                <div className="drawer-card" style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 8px 10px',
                  background: 'var(--card)', borderRadius: 16,
                  border: `1.5px solid ${d.color}25`,
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: drawerBg(d.color), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DrawerIcon name={d.icon} size={20} color={d.color} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: d.color, whiteSpace: 'nowrap' }}>{d.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>


      </div>
      <style>{`
        @keyframes notif-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 4px 20px rgba(29,78,216,0.35); }
          50% { opacity: 0.6; box-shadow: 0 4px 32px rgba(29,78,216,0.7); }
        }
      `}</style>
    </div>
  )
}
