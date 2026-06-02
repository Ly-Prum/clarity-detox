import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DetoxSession, BrainAnalysis, CognitiveProfile, DiscoverySession } from './types'

interface CurrentUser {
  email: string
  name: string
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
  addSession: (input_text: string, analysis: BrainAnalysis) => void
  clearSessions: () => void
  setProfile: (profile: CognitiveProfile) => void
  setColorTheme: (color: string) => void
  login: (email: string, name?: string) => void
  logout: () => void
  addDiagnosisResult: (result: DiagnosisResult) => void
  addDiscoverySession: (session: DiscoverySession) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      sessions: [],
      profile: null,
      colorTheme: 'blue',
      isAuthenticated: false,
      currentUser: null,
      diagnosisResults: [],
      discoverySessions: [],
      addSession: (input_text, analysis) => set(s => ({
        sessions: [{
          id: crypto.randomUUID(),
          user_id: s.currentUser?.email ?? 'local',
          created_at: new Date().toISOString(),
          input_text,
          analysis,
        }, ...s.sessions],
      })),
      clearSessions: () => set({ sessions: [] }),
      setProfile: (profile) => set({ profile }),
      setColorTheme: (colorTheme) => set({ colorTheme }),
      login: (email, name) => set({
        isAuthenticated: true,
        currentUser: { email, name: name ?? email.split('@')[0] },
      }),
      logout: () => set({
        isAuthenticated: false,
        currentUser: null,
      }),
      addDiagnosisResult: (result) => set(s => ({
        diagnosisResults: [result, ...s.diagnosisResults],
      })),
      addDiscoverySession: (session) => set(s => ({
        discoverySessions: [session, ...s.discoverySessions],
      })),
    }),
    { name: 'mind-detox-v1' }
  )
)
