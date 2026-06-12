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

export type ThoughtTag = 'タスク' | '感情' | '不安' | '人間関係' | 'アイデア' | 'その他'

export interface TaggedItem {
  id: string
  text: string
  tag: ThoughtTag
  drawer_id?: string
  as_todo: boolean
}

export interface OrganizedGroup {
  theme: string
  items: string[]
}

export interface BrainAnalysis {
  noise_level: number
  noise_state: NoiseState
  balance: Record<BalanceKey, number>
  dominant: BalanceKey | null
  summary: string
  advice: string
  clarity_score: number
  extracted_items: string[]
  organized_groups: OrganizedGroup[]
  tagged_items: TaggedItem[]
}

export interface Todo {
  id: string
  user_id: string
  text: string
  tag: ThoughtTag
  drawer_id?: string
  session_id?: string
  completed: boolean
  created_at: string
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

export interface ThinkingPattern {
  title: string
  description: string
}

export interface WordConversion {
  before: string
  after: string
}

export interface CheckIn {
  id: string
  user_id: string
  date: string
  mood: number
  theme: string
  highlight: string
  memo: string
  created_at: string
}

export interface SelfAcceptanceContent {
  state: string
  blame: string
  message: string
}

export interface PermissionContent {
  permissions: string[]
}

export interface CoachingNote {
  id: string
  user_id: string
  type: 'self_acceptance' | 'permission'
  content: SelfAcceptanceContent | PermissionContent
  created_at: string
}

export interface IntegratedAnalysisContent {
  core_pattern: string
  insight: string
  self_acceptance_message: string
  permission: string
  next_step: string
  affirmation: string
}

export interface IntegratedAnalysis {
  id: string
  user_id: string
  content: IntegratedAnalysisContent
  created_at: string
}

export interface ClarityReport {
  id: string
  client_code: string
  session_date: string
  theme: string
  current_state: string
  core_theme: string
  thinking_patterns: ThinkingPattern[]
  natural_strengths: string[]
  word_conversions: WordConversion[]
  challenges: string[]
  overall: string
  scores: Record<string, number>
  images: string[]
  created_at: string
  is_read: boolean
}
