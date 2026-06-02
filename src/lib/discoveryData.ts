export type CategoryId = 'self' | 'emotion' | 'relationships' | 'values' | 'innerChild' | 'future'

export type TagGroup = 'strength' | 'skill' | 'thinking' | 'emotionHabit' | 'innerChild' | 'direction'

export interface TagScore {
  tag: string
  score: number
  group: TagGroup
}

export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
  tags: TagScore[]
}

export interface Question {
  id: string
  categoryId: CategoryId
  text: string
  options: [QuestionOption, QuestionOption, QuestionOption, QuestionOption]
  freeTextPrompt?: string
}

export interface Category {
  id: CategoryId
  label: string
  emoji: string
  description: string
  color: string
}

export const CATEGORIES: Category[] = [
  { id: 'self',          label: '自分',     emoji: '🌱', color: '#7c3aed', description: '自分自身をどう見ているか、どう感じているか' },
  { id: 'emotion',       label: '感情',     emoji: '💧', color: '#0891b2', description: '感情とどう向き合っているか' },
  { id: 'relationships', label: '人間関係', emoji: '🤝', color: '#059669', description: '人とどう関わっているか' },
  { id: 'values',        label: '価値観',   emoji: '✨', color: '#d97706', description: '何を大切にして生きているか' },
  { id: 'innerChild',    label: '小さな自分', emoji: '🌸', color: '#e11d48', description: '本音で求めていること、心の奥の声' },
  { id: 'future',        label: '未来',     emoji: '🌟', color: '#6366f1', description: 'これからどう生きていきたいか' },
]

export const QUESTIONS: Question[] = [
  // ──────────────────────────────────────────
  // CATEGORY 1: 自分
  // ──────────────────────────────────────────
  {
    id: 'self_1',
    categoryId: 'self',
    text: '褒められた時、あなたは？',
    options: [
      { label: 'A', text: '素直に嬉しい', tags: [{ tag: '自己受容', score: 2, group: 'strength' }] },
      { label: 'B', text: '本当にそうかな、と疑う', tags: [{ tag: '自己否定', score: 2, group: 'thinking' }] },
      { label: 'C', text: '恥ずかしくなる', tags: [{ tag: '自己表現苦手', score: 2, group: 'thinking' }] },
      { label: 'D', text: 'もっと頑張らなきゃと思う', tags: [{ tag: '完璧主義', score: 2, group: 'thinking' }, { tag: '成長意欲', score: 1, group: 'strength' }] },
    ],
  },
  {
    id: 'self_2',
    categoryId: 'self',
    text: '自分の長所を聞かれると？',
    options: [
      { label: 'A', text: 'すぐに思い浮かぶ', tags: [{ tag: '自己受容', score: 2, group: 'strength' }, { tag: '自己信頼', score: 2, group: 'strength' }] },
      { label: 'B', text: '少し考えれば出てくる', tags: [{ tag: '観察力', score: 1, group: 'strength' }] },
      { label: 'C', text: 'あまり思い浮かばない', tags: [{ tag: '自己否定', score: 2, group: 'thinking' }] },
      { label: 'D', text: '長所より短所の方が先に出てくる', tags: [{ tag: '自己否定', score: 2, group: 'thinking' }, { tag: '完璧主義', score: 1, group: 'thinking' }] },
    ],
  },
  {
    id: 'self_3',
    categoryId: 'self',
    text: '失敗したとき、最初に思うことは？',
    freeTextPrompt: '一言あれば',
    options: [
      { label: 'A', text: '次どうするかを考える', tags: [{ tag: '行動力', score: 2, group: 'strength' }, { tag: '成長意欲', score: 2, group: 'strength' }] },
      { label: 'B', text: 'なぜ失敗したかを分析する', tags: [{ tag: '観察力', score: 2, group: 'strength' }, { tag: '内省力', score: 2, group: 'strength' }] },
      { label: 'C', text: '自分がダメだったと責める', tags: [{ tag: '自己否定', score: 3, group: 'thinking' }] },
      { label: 'D', text: '恥ずかしくて早く忘れたい', tags: [{ tag: '自己表現苦手', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'self_4',
    categoryId: 'self',
    text: '一人の時間は？',
    options: [
      { label: 'A', text: '好きで充電できる', tags: [{ tag: '自律性', score: 2, group: 'strength' }, { tag: '自己信頼', score: 1, group: 'strength' }] },
      { label: 'B', text: '少し寂しいが必要だと思う', tags: [{ tag: '安心したい', score: 1, group: 'innerChild' }] },
      { label: 'C', text: 'できれば誰かといたい', tags: [{ tag: '甘えたい', score: 1, group: 'innerChild' }, { tag: '安心したい', score: 2, group: 'innerChild' }] },
      { label: 'D', text: '何をしていいかわからなくなる', tags: [{ tag: '自己否定', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'self_5',
    categoryId: 'self',
    text: '自分の気持ちに気づくのは？',
    options: [
      { label: 'A', text: 'その場ですぐに気づける', tags: [{ tag: '感情表現力', score: 2, group: 'strength' }, { tag: '内省力', score: 1, group: 'strength' }] },
      { label: 'B', text: '少し経ってから気づく', tags: [{ tag: '感情後回し', score: 2, group: 'emotionHabit' }] },
      { label: 'C', text: '誰かに言われて気づくことが多い', tags: [{ tag: '感情後回し', score: 2, group: 'emotionHabit' }] },
      { label: 'D', text: 'なかなか気づけない', tags: [{ tag: '感情後回し', score: 3, group: 'emotionHabit' }, { tag: '我慢癖', score: 1, group: 'thinking' }] },
    ],
  },
  {
    id: 'self_6',
    categoryId: 'self',
    text: '自分のことを「好き」と思える？',
    options: [
      { label: 'A', text: '概ね好き', tags: [{ tag: '自己受容', score: 3, group: 'strength' }] },
      { label: 'B', text: '好きな部分もある', tags: [{ tag: '自己受容', score: 1, group: 'strength' }] },
      { label: 'C', text: 'あまり好きではない', tags: [{ tag: '自己否定', score: 3, group: 'thinking' }] },
      { label: 'D', text: '考えたことがない', tags: [{ tag: '感情後回し', score: 1, group: 'emotionHabit' }] },
    ],
  },

  // ──────────────────────────────────────────
  // CATEGORY 2: 感情
  // ──────────────────────────────────────────
  {
    id: 'emotion_1',
    categoryId: 'emotion',
    text: '悲しいとき、どうする？',
    options: [
      { label: 'A', text: '泣く・感情を出す', tags: [{ tag: '感情表現力', score: 2, group: 'strength' }, { tag: '自己受容', score: 1, group: 'strength' }] },
      { label: 'B', text: '一人で静かに過ごす', tags: [{ tag: '自律性', score: 1, group: 'strength' }] },
      { label: 'C', text: '明るく振る舞う', tags: [{ tag: '明るく振る舞う', score: 3, group: 'emotionHabit' }] },
      { label: 'D', text: '気づかないふりをする', tags: [{ tag: '感情後回し', score: 3, group: 'emotionHabit' }, { tag: '不安を隠す', score: 2, group: 'emotionHabit' }] },
    ],
  },
  {
    id: 'emotion_2',
    categoryId: 'emotion',
    text: '怒りを感じたとき？',
    options: [
      { label: 'A', text: '正直に伝える', tags: [{ tag: '感情表現力', score: 2, group: 'strength' }, { tag: '行動力', score: 1, group: 'strength' }] },
      { label: 'B', text: '自分の中で消化する', tags: [{ tag: '我慢癖', score: 2, group: 'thinking' }] },
      { label: 'C', text: '後でじわじわ出てくる', tags: [{ tag: '我慢癖', score: 2, group: 'thinking' }, { tag: '感情後回し', score: 2, group: 'emotionHabit' }] },
      { label: 'D', text: '怒るのはよくないと思って抑える', tags: [{ tag: '自己否定', score: 1, group: 'thinking' }, { tag: '我慢癖', score: 3, group: 'thinking' }] },
    ],
  },
  {
    id: 'emotion_3',
    categoryId: 'emotion',
    text: '誰かに甘えるとき？',
    options: [
      { label: 'A', text: '素直に甘えられる', tags: [{ tag: '自己受容', score: 2, group: 'strength' }] },
      { label: 'B', text: '遠慮してしまう', tags: [{ tag: '我慢癖', score: 2, group: 'thinking' }, { tag: '甘えたい', score: 2, group: 'innerChild' }] },
      { label: 'C', text: '相手の反応が気になって言えない', tags: [{ tag: '認めてほしい', score: 2, group: 'innerChild' }, { tag: '不安を隠す', score: 2, group: 'emotionHabit' }] },
      { label: 'D', text: '甘えることがほとんどない', tags: [{ tag: '我慢癖', score: 3, group: 'thinking' }, { tag: '甘えたい', score: 3, group: 'innerChild' }] },
    ],
  },
  {
    id: 'emotion_4',
    categoryId: 'emotion',
    text: '安心する瞬間は？（最も近いもの）',
    options: [
      { label: 'A', text: '一人でいるとき', tags: [{ tag: '自律性', score: 2, group: 'strength' }] },
      { label: 'B', text: '大切な人といるとき', tags: [{ tag: '安心したい', score: 2, group: 'innerChild' }] },
      { label: 'C', text: '何もしなくていいとき', tags: [{ tag: '穏やかに過ごしたい', score: 2, group: 'direction' }] },
      { label: 'D', text: '自分が役に立てているとき', tags: [{ tag: '人の役に立ちたい', score: 2, group: 'direction' }] },
    ],
  },
  {
    id: 'emotion_5',
    categoryId: 'emotion',
    text: '不安になったとき？',
    options: [
      { label: 'A', text: '情報を集めて解決しようとする', tags: [{ tag: '情報過多', score: 2, group: 'thinking' }, { tag: '完璧主義', score: 1, group: 'thinking' }] },
      { label: 'B', text: '誰かに話す', tags: [{ tag: '共感力', score: 1, group: 'strength' }, { tag: '分かってほしい', score: 1, group: 'innerChild' }] },
      { label: 'C', text: '一人で抱え込む', tags: [{ tag: '不安を隠す', score: 3, group: 'emotionHabit' }, { tag: '我慢癖', score: 2, group: 'thinking' }] },
      { label: 'D', text: '何もできなくなる', tags: [{ tag: '落ち込みやすい', score: 3, group: 'emotionHabit' }] },
    ],
  },
  {
    id: 'emotion_6',
    categoryId: 'emotion',
    text: '感情を言葉にするのは？',
    options: [
      { label: 'A', text: '自然にできる', tags: [{ tag: '感情表現力', score: 2, group: 'strength' }, { tag: '共感力', score: 1, group: 'strength' }] },
      { label: 'B', text: '少し難しいが大切にしたい', tags: [{ tag: '成長意欲', score: 1, group: 'strength' }, { tag: '内省力', score: 1, group: 'strength' }] },
      { label: 'C', text: '難しいので避けてしまう', tags: [{ tag: '感情後回し', score: 2, group: 'emotionHabit' }] },
      { label: 'D', text: 'あまり必要性を感じない', tags: [{ tag: '感情後回し', score: 2, group: 'emotionHabit' }] },
    ],
  },

  // ──────────────────────────────────────────
  // CATEGORY 3: 人間関係
  // ──────────────────────────────────────────
  {
    id: 'rel_1',
    categoryId: 'relationships',
    text: '友達から相談されたとき？',
    options: [
      { label: 'A', text: '全力で話を聞く', tags: [{ tag: '聞く力', score: 3, group: 'skill' }, { tag: '思いやり', score: 2, group: 'strength' }] },
      { label: 'B', text: '一緒に解決策を考える', tags: [{ tag: '整理する力', score: 2, group: 'skill' }, { tag: '観察力', score: 1, group: 'strength' }] },
      { label: 'C', text: '共感して寄り添う', tags: [{ tag: '共感力', score: 3, group: 'strength' }, { tag: '寄り添う力', score: 2, group: 'skill' }] },
      { label: 'D', text: '自分のことより相談を優先してしまう', tags: [{ tag: '自分を後回し', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'rel_2',
    categoryId: 'relationships',
    text: '断れないことはある？',
    options: [
      { label: 'A', text: '必要なら断れる', tags: [{ tag: '自己信頼', score: 2, group: 'strength' }, { tag: '自律性', score: 1, group: 'strength' }] },
      { label: 'B', text: '相手の顔を見て決める', tags: [{ tag: '相手優先', score: 2, group: 'thinking' }] },
      { label: 'C', text: 'ほとんど断れない', tags: [{ tag: '相手優先', score: 3, group: 'thinking' }, { tag: '自分を後回し', score: 3, group: 'thinking' }] },
      { label: 'D', text: '断ると罪悪感がある', tags: [{ tag: '自己否定', score: 1, group: 'thinking' }, { tag: '我慢癖', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'rel_3',
    categoryId: 'relationships',
    text: '自分の意見を言うとき？',
    options: [
      { label: 'A', text: '自然に言える', tags: [{ tag: '行動力', score: 1, group: 'strength' }, { tag: '感情表現力', score: 1, group: 'strength' }] },
      { label: 'B', text: '考えてからなら言える', tags: [{ tag: '観察力', score: 1, group: 'strength' }, { tag: '内省力', score: 1, group: 'strength' }] },
      { label: 'C', text: '空気を読んで合わせてしまう', tags: [{ tag: '相手優先', score: 2, group: 'thinking' }, { tag: '考えすぎ', score: 2, group: 'thinking' }] },
      { label: 'D', text: '意見を言うのが怖い', tags: [{ tag: '不安を隠す', score: 2, group: 'emotionHabit' }, { tag: '自己否定', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'rel_4',
    categoryId: 'relationships',
    text: '「大切にされた」と感じる瞬間は？',
    options: [
      { label: 'A', text: 'ありがとうと言われるとき', tags: [{ tag: '認めてほしい', score: 2, group: 'innerChild' }] },
      { label: 'B', text: '話を聞いてもらえるとき', tags: [{ tag: '分かってほしい', score: 3, group: 'innerChild' }] },
      { label: 'C', text: '存在を気にかけてもらえるとき', tags: [{ tag: '大切にされたい', score: 3, group: 'innerChild' }] },
      { label: 'D', text: '一緒にいてくれるとき', tags: [{ tag: '安心したい', score: 2, group: 'innerChild' }] },
    ],
  },
  {
    id: 'rel_5',
    categoryId: 'relationships',
    text: '人と深く関わることは？',
    options: [
      { label: 'A', text: '得意で大好き', tags: [{ tag: '共感力', score: 2, group: 'strength' }, { tag: '寄り添う力', score: 2, group: 'skill' }] },
      { label: 'B', text: '少し疲れるが大切', tags: [{ tag: '継続力', score: 1, group: 'strength' }, { tag: '責任感', score: 1, group: 'strength' }] },
      { label: 'C', text: '深い関係は少し怖い', tags: [{ tag: '不安を隠す', score: 2, group: 'emotionHabit' }] },
      { label: 'D', text: '広く浅くの方が楽', tags: [{ tag: '自律性', score: 1, group: 'strength' }] },
    ],
  },
  {
    id: 'rel_6',
    categoryId: 'relationships',
    text: '誰かの役に立てたとき？',
    options: [
      { label: 'A', text: 'とても嬉しい・やりがいを感じる', tags: [{ tag: '人を支える力', score: 2, group: 'skill' }, { tag: '思いやり', score: 2, group: 'strength' }] },
      { label: 'B', text: '当然のことだと思う', tags: [{ tag: '責任感', score: 1, group: 'strength' }] },
      { label: 'C', text: 'もっと役立てたかったと思う', tags: [{ tag: '完璧主義', score: 2, group: 'thinking' }] },
      { label: 'D', text: '自分が報われた気がする', tags: [{ tag: '認めてほしい', score: 2, group: 'innerChild' }] },
    ],
  },

  // ──────────────────────────────────────────
  // CATEGORY 4: 価値観
  // ──────────────────────────────────────────
  {
    id: 'val_1',
    categoryId: 'values',
    text: '何かを選ぶとき？',
    options: [
      { label: 'A', text: '直感で決める', tags: [{ tag: '行動力', score: 2, group: 'strength' }] },
      { label: 'B', text: 'じっくり情報を集めてから', tags: [{ tag: '情報過多', score: 2, group: 'thinking' }, { tag: '完璧主義', score: 1, group: 'thinking' }] },
      { label: 'C', text: '誰かに相談してから', tags: [{ tag: '相手優先', score: 1, group: 'thinking' }] },
      { label: 'D', text: '後悔しないか確認しながら', tags: [{ tag: '考えすぎ', score: 3, group: 'thinking' }] },
    ],
  },
  {
    id: 'val_2',
    categoryId: 'values',
    text: '「幸せだな」と感じる瞬間は？',
    options: [
      { label: 'A', text: '美味しいものや好きなことをしているとき', tags: [{ tag: '好きなことを見つけたい', score: 2, group: 'direction' }] },
      { label: 'B', text: '誰かの役に立てたとき', tags: [{ tag: '人の役に立ちたい', score: 3, group: 'direction' }] },
      { label: 'C', text: '自分の時間が持てたとき', tags: [{ tag: '自分の時間を持ちたい', score: 3, group: 'direction' }] },
      { label: 'D', text: '誰かと笑えたとき', tags: [{ tag: '家族を大切にしたい', score: 2, group: 'direction' }] },
    ],
  },
  {
    id: 'val_3',
    categoryId: 'values',
    text: '自分にとっての「豊かさ」は？',
    options: [
      { label: 'A', text: '好きなことができること', tags: [{ tag: '好きなことを見つけたい', score: 3, group: 'direction' }] },
      { label: 'B', text: '安心して毎日を過ごせること', tags: [{ tag: '穏やかに過ごしたい', score: 3, group: 'direction' }] },
      { label: 'C', text: '誰かに認められること', tags: [{ tag: '認めてほしい', score: 3, group: 'innerChild' }] },
      { label: 'D', text: '自分が成長できること', tags: [{ tag: '成長意欲', score: 3, group: 'strength' }] },
    ],
  },
  {
    id: 'val_4',
    categoryId: 'values',
    text: '大切にしている価値観は？（最も近いもの）',
    options: [
      { label: 'A', text: '自由', tags: [{ tag: '自由にしたい', score: 2, group: 'innerChild' }, { tag: '意味のある日々', score: 1, group: 'direction' }] },
      { label: 'B', text: '誠実さ・真剣さ', tags: [{ tag: '責任感', score: 2, group: 'strength' }, { tag: '真面目', score: 2, group: 'strength' }] },
      { label: 'C', text: '調和・平和', tags: [{ tag: '穏やかに過ごしたい', score: 2, group: 'direction' }, { tag: '家族を大切にしたい', score: 1, group: 'direction' }] },
      { label: 'D', text: '成長・挑戦', tags: [{ tag: '成長意欲', score: 2, group: 'strength' }, { tag: '行動力', score: 1, group: 'strength' }] },
    ],
  },
  {
    id: 'val_5',
    categoryId: 'values',
    text: '将来について考えるとき？',
    options: [
      { label: 'A', text: 'ワクワクする', tags: [{ tag: '成長意欲', score: 2, group: 'strength' }, { tag: '行動力', score: 1, group: 'strength' }] },
      { label: 'B', text: '不安になる', tags: [{ tag: '不安を隠す', score: 2, group: 'emotionHabit' }, { tag: '落ち込みやすい', score: 1, group: 'emotionHabit' }] },
      { label: 'C', text: '考えすぎてしまう', tags: [{ tag: '考えすぎ', score: 3, group: 'thinking' }] },
      { label: 'D', text: 'あまり考えたくない', tags: [{ tag: '感情後回し', score: 2, group: 'emotionHabit' }] },
    ],
  },
  {
    id: 'val_6',
    categoryId: 'values',
    text: '「意味のある日々」をどう定義する？',
    options: [
      { label: 'A', text: '目標に向かって進む日々', tags: [{ tag: '行動力', score: 1, group: 'strength' }, { tag: '成長意欲', score: 2, group: 'strength' }, { tag: '意味のある日々', score: 1, group: 'direction' }] },
      { label: 'B', text: '大切な人との時間がある日々', tags: [{ tag: '家族を大切にしたい', score: 2, group: 'direction' }, { tag: '意味のある日々', score: 1, group: 'direction' }] },
      { label: 'C', text: '心が穏やかでいられる日々', tags: [{ tag: '穏やかに過ごしたい', score: 2, group: 'direction' }, { tag: '意味のある日々', score: 1, group: 'direction' }] },
      { label: 'D', text: '誰かに必要とされている日々', tags: [{ tag: '人の役に立ちたい', score: 2, group: 'direction' }, { tag: '認めてほしい', score: 1, group: 'innerChild' }] },
    ],
  },

  // ──────────────────────────────────────────
  // CATEGORY 5: 小さな自分
  // ──────────────────────────────────────────
  {
    id: 'inner_1',
    categoryId: 'innerChild',
    text: '心のどこかで求めていることは？',
    freeTextPrompt: '一言あれば',
    options: [
      { label: 'A', text: 'もっと認めてほしい', tags: [{ tag: '認めてほしい', score: 3, group: 'innerChild' }] },
      { label: 'B', text: '誰かに甘えたい', tags: [{ tag: '甘えたい', score: 3, group: 'innerChild' }] },
      { label: 'C', text: 'もっと自由にしたい', tags: [{ tag: '自由にしたい', score: 3, group: 'innerChild' }] },
      { label: 'D', text: 'ただ安心していたい', tags: [{ tag: '安心したい', score: 3, group: 'innerChild' }] },
    ],
  },
  {
    id: 'inner_2',
    categoryId: 'innerChild',
    text: '傷ついたとき、心の奥では？',
    options: [
      { label: 'A', text: 'ただ話を聞いてほしい', tags: [{ tag: '分かってほしい', score: 3, group: 'innerChild' }] },
      { label: 'B', text: 'そっとしておいてほしい', tags: [{ tag: '自由にしたい', score: 2, group: 'innerChild' }] },
      { label: 'C', text: '「大丈夫だよ」と言ってほしい', tags: [{ tag: '安心したい', score: 3, group: 'innerChild' }] },
      { label: 'D', text: '自分が間違っていたのかと思う', tags: [{ tag: '自己否定', score: 3, group: 'thinking' }] },
    ],
  },
  {
    id: 'inner_3',
    categoryId: 'innerChild',
    text: '疲れているとき、本当は？',
    options: [
      { label: 'A', text: '誰かに気づいてほしい', tags: [{ tag: '大切にされたい', score: 3, group: 'innerChild' }] },
      { label: 'B', text: '「頑張ってるね」と言ってほしい', tags: [{ tag: '認めてほしい', score: 3, group: 'innerChild' }] },
      { label: 'C', text: '甘えさせてほしい', tags: [{ tag: '甘えたい', score: 3, group: 'innerChild' }] },
      { label: 'D', text: 'ひとりにしてほしい', tags: [{ tag: '自由にしたい', score: 2, group: 'innerChild' }] },
    ],
  },
  {
    id: 'inner_4',
    categoryId: 'innerChild',
    text: '好きな人に「可愛い」と言われたら？',
    options: [
      { label: 'A', text: '素直に嬉しい', tags: [{ tag: '自己受容', score: 2, group: 'strength' }, { tag: '可愛いと言われたい', score: 1, group: 'innerChild' }] },
      { label: 'B', text: '恥ずかしい・信じられない', tags: [{ tag: '自己否定', score: 2, group: 'thinking' }] },
      { label: 'C', text: 'もっと言ってほしいと思う', tags: [{ tag: '可愛いと言われたい', score: 3, group: 'innerChild' }, { tag: '認めてほしい', score: 1, group: 'innerChild' }] },
      { label: 'D', text: '特に何も感じない', tags: [{ tag: '感情後回し', score: 2, group: 'emotionHabit' }] },
    ],
  },
  {
    id: 'inner_5',
    categoryId: 'innerChild',
    text: '子供の頃の自分に近いのは？',
    options: [
      { label: 'A', text: '甘えん坊', tags: [{ tag: '甘えたい', score: 2, group: 'innerChild' }, { tag: '安心したい', score: 1, group: 'innerChild' }] },
      { label: 'B', text: 'しっかりした子', tags: [{ tag: '我慢癖', score: 2, group: 'thinking' }, { tag: '自分を後回し', score: 1, group: 'thinking' }] },
      { label: 'C', text: '自由気まま', tags: [{ tag: '自由にしたい', score: 2, group: 'innerChild' }] },
      { label: 'D', text: '引っ込み思案', tags: [{ tag: '自己表現苦手', score: 2, group: 'thinking' }, { tag: '不安を隠す', score: 1, group: 'emotionHabit' }] },
    ],
  },
  {
    id: 'inner_6',
    categoryId: 'innerChild',
    text: '「もし誰も見ていなかったら」したいことは？',
    options: [
      { label: 'A', text: '大声で泣く', tags: [{ tag: '我慢癖', score: 3, group: 'thinking' }, { tag: '感情後回し', score: 1, group: 'emotionHabit' }] },
      { label: 'B', text: '誰かに甘える', tags: [{ tag: '甘えたい', score: 3, group: 'innerChild' }] },
      { label: 'C', text: '好き勝手に自由に過ごす', tags: [{ tag: '自由にしたい', score: 3, group: 'innerChild' }] },
      { label: 'D', text: '何もしないでぼーっとする', tags: [{ tag: '穏やかに過ごしたい', score: 2, group: 'direction' }] },
    ],
  },

  // ──────────────────────────────────────────
  // CATEGORY 6: 未来
  // ──────────────────────────────────────────
  {
    id: 'future_1',
    categoryId: 'future',
    text: '5年後の自分に期待することは？',
    freeTextPrompt: '一言あれば',
    options: [
      { label: 'A', text: '今より成長していること', tags: [{ tag: '成長意欲', score: 3, group: 'strength' }] },
      { label: 'B', text: '穏やかに暮らしていること', tags: [{ tag: '穏やかに過ごしたい', score: 3, group: 'direction' }] },
      { label: 'C', text: '好きなことをしていること', tags: [{ tag: '好きなことを見つけたい', score: 3, group: 'direction' }] },
      { label: 'D', text: '誰かの役に立っていること', tags: [{ tag: '人の役に立ちたい', score: 3, group: 'direction' }] },
    ],
  },
  {
    id: 'future_2',
    categoryId: 'future',
    text: '自分が変えたいと思うことは？',
    options: [
      { label: 'A', text: '自分をもっと信じたい', tags: [{ tag: '自己信頼', score: 2, group: 'strength' }] },
      { label: 'B', text: '人に頼れるようになりたい', tags: [{ tag: '甘えたい', score: 2, group: 'innerChild' }] },
      { label: 'C', text: '自分の時間を増やしたい', tags: [{ tag: '自分の時間を持ちたい', score: 3, group: 'direction' }] },
      { label: 'D', text: 'もっと人の役に立てるようになりたい', tags: [{ tag: '人の役に立ちたい', score: 2, group: 'direction' }] },
    ],
  },
  {
    id: 'future_3',
    categoryId: 'future',
    text: '理想の生き方に近いのは？',
    options: [
      { label: 'A', text: '自分らしく自由に', tags: [{ tag: '自由にしたい', score: 2, group: 'innerChild' }, { tag: '意味のある日々', score: 1, group: 'direction' }] },
      { label: 'B', text: '誰かの支えになる', tags: [{ tag: '人の役に立ちたい', score: 3, group: 'direction' }] },
      { label: 'C', text: '穏やかで安心できる日常', tags: [{ tag: '穏やかに過ごしたい', score: 3, group: 'direction' }] },
      { label: 'D', text: '大切な人と深く関わる', tags: [{ tag: '家族を大切にしたい', score: 3, group: 'direction' }] },
    ],
  },
  {
    id: 'future_4',
    categoryId: 'future',
    text: '今の自分に一番足りないと感じることは？',
    options: [
      { label: 'A', text: '自信', tags: [{ tag: '自己信頼', score: 2, group: 'strength' }] },
      { label: 'B', text: '自分の時間', tags: [{ tag: '自分の時間を持ちたい', score: 2, group: 'direction' }] },
      { label: 'C', text: '休息と安らぎ', tags: [{ tag: '穏やかに過ごしたい', score: 2, group: 'direction' }] },
      { label: 'D', text: '意味のある繋がり', tags: [{ tag: '意味のある日々', score: 2, group: 'direction' }, { tag: '家族を大切にしたい', score: 1, group: 'direction' }] },
    ],
  },
  {
    id: 'future_5',
    categoryId: 'future',
    text: '今すぐ始めたいことに近いのは？',
    options: [
      { label: 'A', text: '自分のことをもっと知ること', tags: [{ tag: '自己受容', score: 2, group: 'strength' }, { tag: '内省力', score: 1, group: 'strength' }] },
      { label: 'B', text: '誰かと深く話すこと', tags: [{ tag: '分かってほしい', score: 1, group: 'innerChild' }, { tag: '共感力', score: 2, group: 'strength' }] },
      { label: 'C', text: '好きなことを探すこと', tags: [{ tag: '好きなことを見つけたい', score: 3, group: 'direction' }] },
      { label: 'D', text: 'ゆっくり休むこと', tags: [{ tag: '穏やかに過ごしたい', score: 2, group: 'direction' }] },
    ],
  },
  {
    id: 'future_6',
    categoryId: 'future',
    text: '「いい人生だったな」と感じるためには？',
    options: [
      { label: 'A', text: '自分を大切にしながら生きられたこと', tags: [{ tag: '自己受容', score: 2, group: 'strength' }, { tag: '意味のある日々', score: 1, group: 'direction' }] },
      { label: 'B', text: '誰かの人生に影響を与えられたこと', tags: [{ tag: '人の役に立ちたい', score: 2, group: 'direction' }, { tag: '意味のある日々', score: 1, group: 'direction' }] },
      { label: 'C', text: '好きなことに向き合えたこと', tags: [{ tag: '好きなことを見つけたい', score: 2, group: 'direction' }, { tag: '意味のある日々', score: 1, group: 'direction' }] },
      { label: 'D', text: '心穏やかに日々を重ねられたこと', tags: [{ tag: '穏やかに過ごしたい', score: 2, group: 'direction' }, { tag: '意味のある日々', score: 1, group: 'direction' }] },
    ],
  },
]

export const QUESTIONS_BY_CATEGORY = CATEGORIES.map(cat => ({
  category: cat,
  questions: QUESTIONS.filter(q => q.categoryId === cat.id),
}))
