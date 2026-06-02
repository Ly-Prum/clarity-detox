import type { DiscoveryAnalysis } from './discoveryAnalysis'

export interface DiscoverySession {
  id: string
  date: string
  answers: Record<string, number>
  freeTexts: Record<string, string>
  analysis: DiscoveryAnalysis
}

export type NoiseState = '混雑' | '散乱' | '整理中' | '安定' | 'クリア'

export type BalanceKey =
  | '感情過多' | 'タスク過多' | '不安過多'
  | '情報過多' | '思考ループ' | '行動不足'

export interface BrainAnalysis {
  noise_level: number       // 0-100 (100 = most noisy)
  noise_state: NoiseState
  balance: Record<BalanceKey, number>  // 0-100 each
  dominant: BalanceKey | null
  summary: string           // 1-2 sentence description
  advice: string            // gentle one-line suggestion
  clarity_score: number     // 0-100 (100 = fully clear)
}

export interface DetoxSession {
  id: string
  user_id: string
  input_text: string
  analysis: BrainAnalysis
  created_at: string
}

export interface CognitiveProfile {
  thinkingStyle: '論理型' | '感情型'
  actionStyle: '計画型' | '直感型'
  processingStyle: '内省型' | '外向型'
  completedAt: string
}
