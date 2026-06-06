import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DetoxSession, BrainAnalysis, CognitiveProfile, DiscoverySession } from './types'
import { supabase } from './supabase'

interface CurrentUser {
  email: string
  name: string
  inviteCode: string
}

export interface DiagnosisResult {
  id: string
  date: string
  currentScores: Record<string, number>
  idealScores: Record<string, number>
}

interface AppStore {
  sessions: DetoxSession[]
  profile: CognitiveProfile | null
  colorTheme: string
  isAuthenticated: boolean
  currentUser: CurrentUser | null
  diagnosisResults: DiagnosisResult[]
  discoverySessions: DiscoverySession[]
  setSessions: (sessions: DetoxSession[]) => void
  setDiscoverySessions: (sessions: DiscoverySession[]) => void
  addSession: (input_text: string, analysis: BrainAnalysis) => void
  deleteSession: (id: string) => void
  clearSessions: () => void
  setProfile: (profile: CognitiveProfile) => void
  setColorTheme: (color: string) => void
  applyColorTheme: (color: string) => void
  login: (email: string, name?: string, inviteCode?: string) => void
  logout: () => void
  addDiagnosisResult: (result: DiagnosisResult) => void
  addDiscoverySession: (session: DiscoverySession) => void
  deleteDiscoverySession: (id: string) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      profile: null,
      colorTheme: 'sand',
      isAuthenticated: false,
      currentUser: null,
      diagnosisResults: [],
      discoverySessions: [],
      setSessions: (sessions) => set({ sessions }),
      setDiscoverySessions: (discoverySessions) => set({ discoverySessions }),
      addSession: (input_text, analysis) => {
        const session: DetoxSession = {
          id: crypto.randomUUID(),
          user_id: get().currentUser?.email ?? 'local',
          created_at: new Date().toISOString(),
          input_text,
          analysis,
        }
        set(s => ({ sessions: [session, ...s.sessions] }))
        supabase.from('sessions').upsert(session).then(({ error }) => {
          if (error) console.error('Supabase save error:', error)
        })
      },
      deleteSession: (id) => {
        set(s => ({ sessions: s.sessions.filter(s => s.id !== id) }))
        supabase.from('sessions').delete().eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase delete error:', error)
        })
      },
      clearSessions: () => set({ sessions: [] }),
      setProfile: (profile) => set({ profile }),
      setColorTheme: (colorTheme) => {
        set({ colorTheme })
        const email = get().currentUser?.email
        if (email) {
          supabase.from('user_preferences')
            .upsert({ user_id: email, color_theme: colorTheme, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
            .then(({ error }) => { if (error) console.error('color theme save error:', error) })
        }
      },
      applyColorTheme: (colorTheme) => set({ colorTheme }),
      login: (email, name, inviteCode) => set({
        isAuthenticated: true,
        currentUser: { email, name: name ?? email.split('@')[0], inviteCode: inviteCode ?? '' },
      }),
      logout: () => set({
        isAuthenticated: false,
        currentUser: null,
      }),
      addDiagnosisResult: (result) => set(s => ({
        diagnosisResults: [result, ...s.diagnosisResults],
      })),
      addDiscoverySession: (session) => {
        const userId = get().currentUser?.email ?? 'local'
        const withUser = { ...session, user_id: userId }
        set(s => ({ discoverySessions: [session, ...s.discoverySessions] }))
        supabase.from('discovery_sessions').upsert(withUser).then(({ error }) => {
          if (error) console.error('Supabase discovery save error:', error)
        })
      },
      deleteDiscoverySession: (id) => {
        set(s => ({ discoverySessions: s.discoverySessions.filter(s => s.id !== id) }))
        supabase.from('discovery_sessions').delete().eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase discovery delete error:', error)
        })
      },
    }),
    {
      name: 'mind-detox-v1',
      partialize: (state) => ({
        sessions: state.sessions,
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        diagnosisResults: state.diagnosisResults,
        discoverySessions: state.discoverySessions,
        profile: state.profile,
      }),
    }
  )
)
