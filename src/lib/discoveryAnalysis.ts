import { QUESTIONS, type CategoryId } from './discoveryData'

export interface TagAggregation {
  [tag: string]: number
}

export interface ChartScores {
  selfAwareness: number
  emotionalAwareness: number
  challengeAwareness: number
  causeAwareness: number
  authenticVoice: number
  directionClarity: number
  selfAcceptance: number
  actionClarity: number
}

export interface DiscoveryAnalysis {
  tagScores: TagAggregation
  strengths: string[]
  skills: string[]
  thinkingPatterns: string[]
  emotionPatterns: string[]
  innerChildNeeds: string[]
  directions: string[]
  chartScores: ChartScores
  summary: string
  innerMessage: string
  futureTheme: string
  actionItems: string[]
}

const STRENGTH_TAGS = ['自己受容', '自己信頼', '観察力', '行動力', '成長意欲', '共感力', '思いやり', '継続力', '責任感', '真面目', '感情表現力', '自律性', '内省力']
const SKILL_TAGS    = ['聞く力', '寄り添う力', '整理する力', '人を支える力']
const THINKING_TAGS = ['自己否定', '自己表現苦手', '完璧主義', '我慢癖', '相手優先', '自分を後回し', '考えすぎ', '情報過多']
const EMOTION_TAGS  = ['感情後回し', '不安を隠す', '明るく振る舞う', '落ち込みやすい']
const INNER_TAGS    = ['認めてほしい', '甘えたい', '安心したい', '分かってほしい', '可愛いと言われたい', '大切にされたい', '自由にしたい']
const DIRECTION_TAGS = ['穏やかに過ごしたい', '家族を大切にしたい', '人の役に立ちたい', '自分の時間を持ちたい', '好きなことを見つけたい', '意味のある日々']

export function aggregateTags(answers: Record<string, number>): TagAggregation {
  const scores: TagAggregation = {}
  QUESTIONS.forEach(q => {
    const optionIndex = answers[q.id]
    if (optionIndex === undefined) return
    const option = q.options[optionIndex]
    if (!option) return
    option.tags.forEach(({ tag, score }) => {
      scores[tag] = (scores[tag] ?? 0) + score
    })
  })
  return scores
}

function topTags(tags: TagAggregation, candidates: string[], n: number): string[] {
  return candidates
    .filter(t => (tags[t] ?? 0) > 0)
    .sort((a, b) => (tags[b] ?? 0) - (tags[a] ?? 0))
    .slice(0, n)
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(val)))
}

function pct(raw: number, divisor: number): number {
  return clamp((raw / divisor) * 100)
}

function computeChartScores(tags: TagAggregation): ChartScores {
  const g = (t: string) => tags[t] ?? 0

  const selfAwareness = pct(
    g('自己受容') + g('自己信頼') + g('観察力') + g('内省力'),
    18
  )
  const emotionalAwareness = pct(
    g('感情表現力') * 1.5 + g('共感力') + g('内省力') * 0.5,
    14
  )
  const challengeAwareness = pct(
    THINKING_TAGS.concat(EMOTION_TAGS).reduce((s, t) => s + g(t), 0),
    22
  )
  const causeAwareness = pct(
    g('内省力') * 2 + g('観察力') * 1.5 + g('成長意欲'),
    14
  )
  const authenticVoice = pct(
    INNER_TAGS.reduce((s, t) => s + g(t), 0),
    18
  )
  const directionClarity = pct(
    DIRECTION_TAGS.reduce((s, t) => s + g(t), 0),
    20
  )
  const selfAcceptance = clamp(
    Math.round(((g('自己受容') * 3 - g('自己否定') + 14) / 28) * 100)
  )
  const actionClarity = pct(
    g('行動力') * 2 + g('成長意欲') * 1.5,
    14
  )

  return {
    selfAwareness,
    emotionalAwareness,
    challengeAwareness,
    causeAwareness,
    authenticVoice,
    directionClarity,
    selfAcceptance,
    actionClarity,
  }
}

const INNER_MESSAGES: Record<string, string> = {
  '認めてほしい': 'あなたは、もっと自分の頑張りや存在を認めてもらいたいと感じているかもしれません。それは弱さではなく、誰もが持つ大切な気持ちです。',
  '甘えたい': '本当は、誰かにそっと頼ってみたいのかもしれません。甘えることは、心を安心させる大切な力です。',
  '安心したい': 'ただ安心できる場所が欲しいのかもしれません。その感覚を大切にすることが、自分を守ることにつながります。',
  '分かってほしい': 'ありのままの自分を、誰かにわかってほしいと思っているのかもしれません。その気持ちを持ち続けてください。',
  '可愛いと言われたい': '自分の柔らかい部分を、もっと受け入れてもらいたいのかもしれません。あなたの素直さはとても素敵です。',
  '大切にされたい': 'もっと大切にされてもいいと、どこかで感じているのかもしれません。その感覚は正しいものです。',
  '自由にしたい': '自分のペースで、もう少し自由に生きてみたいのかもしれません。その感覚を手放さないでください。',
}

const DIRECTION_THEMES: Partial<Record<string, string>> = {
  '人の役に立ちたい': '人のためだけでなく、自分の心が喜ぶ時間も同じくらい大切にすること。',
  '穏やかに過ごしたい': '頑張りすぎずに、今日一日をていねいに過ごすこと。',
  '好きなことを見つけたい': '好奇心の矢印を、自分自身にも向けてみること。',
  '自分の時間を持ちたい': '自分を後回しにせず、小さな喜びを毎日ひとつ確保すること。',
  '家族を大切にしたい': '大切な人との何気ない時間を、意識的に守ること。',
  '意味のある日々': '毎日に小さな「意味」を見つけ、それを積み重ねていくこと。',
}

const ACTION_MAP: Record<string, string[]> = {
  '我慢癖': ['嫌だったことを、誰かに一言だけ話してみる', '「我慢せず伝えてもいい」と、毎朝自分に言い聞かせる'],
  '自己否定': ['毎日1つ、自分の「よかった点」を書き留める', '自分を責める言葉を、「次はこうしよう」に置き換えてみる'],
  '感情後回し': ['1日の終わりに「今日一番感じた感情」を一言メモする'],
  '完璧主義': ['80点でOKと決めて動いてみる日をつくる'],
  '自分を後回し': ['週に1回、自分のためだけの時間を30分つくる'],
  '考えすぎ': ['考えを紙に書き出して、頭の外に出す習慣をつける'],
  '不安を隠す': ['信頼できる人に、小さな不安を一つだけ打ち明けてみる'],
  '相手優先': ['「自分はどうしたいか」を、決める前に必ず一度考える'],
}

const DEFAULT_ACTIONS = [
  '毎日1つ、嬉しかったことを書き留める',
  '週に1回、自分のためだけの時間をつくる',
  '感じたことを、そのまま誰かに話してみる',
]

function generateSummary(tags: TagAggregation): string {
  const topStrength = topTags(tags, STRENGTH_TAGS, 1)[0]
  const topDirection = topTags(tags, DIRECTION_TAGS, 1)[0]
  const topThinking = topTags(tags, THINKING_TAGS.concat(EMOTION_TAGS), 1)[0]

  const strengthPhrases: Partial<Record<string, string>> = {
    '共感力': '人の気持ちに深く寄り添える共感力',
    '思いやり': '相手を思いやる温かさ',
    '自己受容': '自分をありのままに受け入れる力',
    '行動力': '考えるより先に動ける行動力',
    '成長意欲': '常に成長しようとする前向きさ',
    '観察力': '細かいことに気づける観察力',
    '内省力': '自分を深く見つめる内省力',
    '自律性': '一人でも力強く進める自立心',
    '感情表現力': '感情を言葉にできる豊かさ',
    '自己信頼': '自分の判断を信じる芯の強さ',
  }
  const directionPhrases: Partial<Record<string, string>> = {
    '人の役に立ちたい': '誰かの力になりたいという強い思い',
    '穏やかに過ごしたい': '心穏やかな日々を大切にする感覚',
    '好きなことを見つけたい': '自分の好きを探していく姿勢',
    '自分の時間を持ちたい': '自分を大切にしたいという意志',
    '家族を大切にしたい': '大切な人との絆を守る温かさ',
    '意味のある日々': '意味を持って生きようとする誠実さ',
  }
  const thinkingPhrases: Partial<Record<string, string>> = {
    '自己否定': '自分を責めやすい面',
    '我慢癖': '気持ちを抑えやすい面',
    '完璧主義': '高い基準を持つ面',
    '自分を後回し': '自分より人を優先しやすい面',
    '考えすぎ': '深く考えすぎてしまう面',
    '感情後回し': '感情を後回しにしやすい面',
    '不安を隠す': '不安を外に出しにくい面',
  }

  const sp = topStrength ? (strengthPhrases[topStrength] ?? topStrength) : '多くの力'
  const dp = topDirection ? (directionPhrases[topDirection] ?? topDirection) : '自分らしい生き方'
  const tp = topThinking ? (thinkingPhrases[topThinking] ?? topThinking) : null

  if (tp) {
    return `${sp}があり、${dp}への意識が高い傾向があります。一方で${tp}があり、それが自分の可能性を狭めていることがあります。`
  }
  return `${sp}があり、${dp}への意識が高い傾向があります。`
}

function generateInnerMessage(tags: TagAggregation): string {
  const top = topTags(tags, INNER_TAGS, 1)[0]
  return top ? (INNER_MESSAGES[top] ?? INNER_MESSAGES['安心したい']) : INNER_MESSAGES['安心したい']
}

function generateFutureTheme(tags: TagAggregation): string {
  const top = topTags(tags, DIRECTION_TAGS, 1)[0]
  return top ? (DIRECTION_THEMES[top] ?? DIRECTION_THEMES['意味のある日々']!) : DIRECTION_THEMES['意味のある日々']!
}

function generateActionItems(tags: TagAggregation): string[] {
  const actions: string[] = []
  const topPatterns = topTags(tags, THINKING_TAGS.concat(EMOTION_TAGS), 3)

  for (const pattern of topPatterns) {
    const mapped = ACTION_MAP[pattern]
    if (mapped) {
      for (const a of mapped) {
        if (!actions.includes(a) && actions.length < 3) actions.push(a)
      }
    }
    if (actions.length >= 3) break
  }

  while (actions.length < 3) {
    const def = DEFAULT_ACTIONS[actions.length]
    if (def && !actions.includes(def)) actions.push(def)
    else break
  }
  return actions.slice(0, 3)
}

export function analyzeAnswers(answers: Record<string, number>): DiscoveryAnalysis {
  const tags = aggregateTags(answers)

  return {
    tagScores: tags,
    strengths: topTags(tags, STRENGTH_TAGS, 5),
    skills: topTags(tags, SKILL_TAGS, 4),
    thinkingPatterns: topTags(tags, THINKING_TAGS, 5),
    emotionPatterns: topTags(tags, EMOTION_TAGS, 4),
    innerChildNeeds: topTags(tags, INNER_TAGS, 3),
    directions: topTags(tags, DIRECTION_TAGS, 4),
    chartScores: computeChartScores(tags),
    summary: generateSummary(tags),
    innerMessage: generateInnerMessage(tags),
    futureTheme: generateFutureTheme(tags),
    actionItems: generateActionItems(tags),
  }
}

export const CHART_AXIS_LABELS: Record<keyof ChartScores, string> = {
  selfAwareness: '自己理解度',
  emotionalAwareness: '感情理解度',
  challengeAwareness: '課題認識度',
  causeAwareness: '原因理解度',
  authenticVoice: '本音把握度',
  directionClarity: '方向性明確度',
  selfAcceptance: '自己受容度',
  actionClarity: '行動明確度',
}

export const CHART_AXIS_KEYS = Object.keys(CHART_AXIS_LABELS) as (keyof ChartScores)[]

export const DIRECTION_LABEL_MAP: Record<string, string> = {
  '穏やかに過ごしたい': '穏やかな日々',
  '家族を大切にしたい': '家族・絆',
  '人の役に立ちたい': '誰かの力に',
  '自分の時間を持ちたい': '自分時間',
  '好きなことを見つけたい': '好きを探す',
  '意味のある日々': '意味ある日々',
}

export const CATEGORY_ANSWERCOUNT: Record<CategoryId, number> = {
  self: 6, emotion: 6, relationships: 6, values: 6, innerChild: 6, future: 6,
}
