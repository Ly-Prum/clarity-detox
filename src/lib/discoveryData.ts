export type CategoryId = 'identity' | 'mindset' | 'relationships' | 'career' | 'romance' | 'values'

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
  { id: 'identity',      label: '自分を知る',       emoji: '🌱', color: '#7c3aed', description: '自分軸で生きているか、本当の自分と向き合う' },
  { id: 'mindset',       label: '思考と感情',        emoji: '💧', color: '#0891b2', description: '思考の癖・感情とどう向き合っているか' },
  { id: 'relationships', label: '人とのつながり',    emoji: '🤝', color: '#059669', description: '人間関係のパターン・コミュニケーションスタイル' },
  { id: 'career',        label: '仕事・強み',        emoji: '💼', color: '#d97706', description: '仕事スタイル・得意なこと・キャリアへの向き合い方' },
  { id: 'romance',       label: '恋愛・親密さ',      emoji: '🌸', color: '#e11d48', description: '愛着スタイル・親密な関係での自分' },
  { id: 'values',        label: '価値観・ありたい姿', emoji: '🌟', color: '#6366f1', description: '何を大切にして生きているか・これからの方向性' },
]

export const QUESTIONS: Question[] = [
  // ──────────────────────────────────────────
  // CATEGORY 1: 自分を知る（自分軸 vs 他者軸）
  // ──────────────────────────────────────────
  {
    id: 'identity_1',
    categoryId: 'identity',
    text: '何かを決めるとき、一番影響するのは？',
    options: [
      { label: 'A', text: '自分の気持ちや直感', tags: [{ tag: '自分軸', score: 3, group: 'strength' }, { tag: '自己信頼', score: 2, group: 'strength' }] },
      { label: 'B', text: '周りの意見や期待', tags: [{ tag: '他者軸', score: 3, group: 'thinking' }, { tag: '相手優先', score: 2, group: 'thinking' }] },
      { label: 'C', text: 'メリット・デメリットの分析', tags: [{ tag: '論理思考', score: 2, group: 'strength' }, { tag: '慎重さ', score: 1, group: 'strength' }] },
      { label: 'D', text: 'なんとなく流れに任せる', tags: [{ tag: '自己決定苦手', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'identity_2',
    categoryId: 'identity',
    text: '自分の意見と周りが違うとき？',
    options: [
      { label: 'A', text: '自分の意見をきちんと伝える', tags: [{ tag: '自分軸', score: 3, group: 'strength' }, { tag: '感情表現力', score: 2, group: 'strength' }] },
      { label: 'B', text: '状況を見ながら伝えるタイミングを探る', tags: [{ tag: '観察力', score: 2, group: 'strength' }, { tag: '慎重さ', score: 1, group: 'strength' }] },
      { label: 'C', text: '内心は違っても合わせてしまう', tags: [{ tag: '他者軸', score: 3, group: 'thinking' }, { tag: '我慢癖', score: 2, group: 'thinking' }] },
      { label: 'D', text: 'どちらが正しいか悩み続ける', tags: [{ tag: '考えすぎ', score: 3, group: 'thinking' }] },
    ],
  },
  {
    id: 'identity_3',
    categoryId: 'identity',
    text: '褒められたとき、最初に思うことは？',
    options: [
      { label: 'A', text: '素直に嬉しい', tags: [{ tag: '自己受容', score: 3, group: 'strength' }] },
      { label: 'B', text: '本当にそうかな、と疑う', tags: [{ tag: '自己否定', score: 2, group: 'thinking' }] },
      { label: 'C', text: '恥ずかしくて否定したくなる', tags: [{ tag: '自己表現苦手', score: 2, group: 'thinking' }] },
      { label: 'D', text: 'もっと頑張らなきゃと思う', tags: [{ tag: '完璧主義', score: 2, group: 'thinking' }, { tag: '成長意欲', score: 1, group: 'strength' }] },
    ],
  },
  {
    id: 'identity_4',
    categoryId: 'identity',
    text: '「本当の自分」を人に見せることは？',
    options: [
      { label: 'A', text: '自然にできる', tags: [{ tag: '自分軸', score: 2, group: 'strength' }, { tag: '自己受容', score: 2, group: 'strength' }] },
      { label: 'B', text: '信頼できる人にだけできる', tags: [{ tag: '慎重さ', score: 1, group: 'strength' }] },
      { label: 'C', text: '少し怖い・ためらいがある', tags: [{ tag: '不安を隠す', score: 2, group: 'emotionHabit' }] },
      { label: 'D', text: 'ほとんど見せられない', tags: [{ tag: '自己表現苦手', score: 3, group: 'thinking' }, { tag: '不安を隠す', score: 2, group: 'emotionHabit' }] },
    ],
  },
  {
    id: 'identity_5',
    categoryId: 'identity',
    text: '自分の長所を聞かれると？',
    options: [
      { label: 'A', text: 'すぐに思い浮かぶ', tags: [{ tag: '自己信頼', score: 3, group: 'strength' }, { tag: '自己受容', score: 2, group: 'strength' }] },
      { label: 'B', text: '少し考えれば出てくる', tags: [{ tag: '内省力', score: 1, group: 'strength' }] },
      { label: 'C', text: 'あまり思い浮かばない', tags: [{ tag: '自己否定', score: 2, group: 'thinking' }] },
      { label: 'D', text: '短所の方が先に出てくる', tags: [{ tag: '自己否定', score: 3, group: 'thinking' }, { tag: '完璧主義', score: 1, group: 'thinking' }] },
    ],
  },
  {
    id: 'identity_6',
    categoryId: 'identity',
    freeTextPrompt: '一言あれば',
    text: '自分のことを「好き」と思える？',
    options: [
      { label: 'A', text: '概ね好き', tags: [{ tag: '自己受容', score: 3, group: 'strength' }] },
      { label: 'B', text: '好きな部分もある', tags: [{ tag: '自己受容', score: 1, group: 'strength' }] },
      { label: 'C', text: 'あまり好きではない', tags: [{ tag: '自己否定', score: 3, group: 'thinking' }] },
      { label: 'D', text: 'あまり考えたことがない', tags: [{ tag: '感情後回し', score: 2, group: 'emotionHabit' }] },
    ],
  },

  // ──────────────────────────────────────────
  // CATEGORY 2: 思考と感情
  // ──────────────────────────────────────────
  {
    id: 'mindset_1',
    categoryId: 'mindset',
    text: '失敗したとき、最初に思うことは？',
    freeTextPrompt: '一言あれば',
    options: [
      { label: 'A', text: '次どうするかを考える', tags: [{ tag: '行動力', score: 2, group: 'strength' }, { tag: '成長意欲', score: 2, group: 'strength' }] },
      { label: 'B', text: 'なぜ失敗したかを分析する', tags: [{ tag: '観察力', score: 2, group: 'strength' }, { tag: '内省力', score: 2, group: 'strength' }] },
      { label: 'C', text: '自分がダメだったと責める', tags: [{ tag: '自己否定', score: 3, group: 'thinking' }] },
      { label: 'D', text: '恥ずかしくて早く忘れたい', tags: [{ tag: '自己否定', score: 2, group: 'thinking' }, { tag: '感情後回し', score: 2, group: 'emotionHabit' }] },
    ],
  },
  {
    id: 'mindset_2',
    categoryId: 'mindset',
    text: '不安になったとき？',
    options: [
      { label: 'A', text: '情報を集めて対処しようとする', tags: [{ tag: '論理思考', score: 2, group: 'strength' }, { tag: '情報過多', score: 1, group: 'thinking' }] },
      { label: 'B', text: '誰かに話して楽になる', tags: [{ tag: '感情表現力', score: 2, group: 'strength' }] },
      { label: 'C', text: '一人で抱え込む', tags: [{ tag: '不安を隠す', score: 3, group: 'emotionHabit' }, { tag: '我慢癖', score: 2, group: 'thinking' }] },
      { label: 'D', text: '何もできなくなる', tags: [{ tag: '落ち込みやすい', score: 3, group: 'emotionHabit' }] },
    ],
  },
  {
    id: 'mindset_3',
    categoryId: 'mindset',
    text: '人の評価・視線は気になる？',
    options: [
      { label: 'A', text: 'あまり気にしない', tags: [{ tag: '自分軸', score: 2, group: 'strength' }] },
      { label: 'B', text: '少し気になるが引きずらない', tags: [{ tag: '慎重さ', score: 1, group: 'strength' }] },
      { label: 'C', text: 'かなり気になる', tags: [{ tag: '他者軸', score: 2, group: 'thinking' }, { tag: '考えすぎ', score: 2, group: 'thinking' }] },
      { label: 'D', text: '常に意識してしまう', tags: [{ tag: '他者軸', score: 3, group: 'thinking' }, { tag: '認めてほしい', score: 2, group: 'innerChild' }] },
    ],
  },
  {
    id: 'mindset_4',
    categoryId: 'mindset',
    text: '悩みや感情を言葉にするのは？',
    options: [
      { label: 'A', text: '自然にできる', tags: [{ tag: '感情表現力', score: 3, group: 'strength' }] },
      { label: 'B', text: '時間をかければできる', tags: [{ tag: '内省力', score: 2, group: 'strength' }] },
      { label: 'C', text: '難しくて避けてしまう', tags: [{ tag: '感情後回し', score: 2, group: 'emotionHabit' }] },
      { label: 'D', text: '言葉が見つからず詰まる', tags: [{ tag: '感情後回し', score: 3, group: 'emotionHabit' }, { tag: '自己表現苦手', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'mindset_5',
    categoryId: 'mindset',
    text: '「あの時こうすれば良かった」と思うことは？',
    options: [
      { label: 'A', text: 'あまりない、前を向く方だ', tags: [{ tag: '行動力', score: 2, group: 'strength' }, { tag: '自己受容', score: 1, group: 'strength' }] },
      { label: 'B', text: '時々あるが引きずらない', tags: [{ tag: '内省力', score: 1, group: 'strength' }] },
      { label: 'C', text: 'よくあって気になる', tags: [{ tag: '考えすぎ', score: 2, group: 'thinking' }] },
      { label: 'D', text: 'ずっと頭から離れない', tags: [{ tag: '考えすぎ', score: 3, group: 'thinking' }, { tag: '自己否定', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'mindset_6',
    categoryId: 'mindset',
    text: '自分を追い込む傾向は？',
    options: [
      { label: 'A', text: 'ほとんどない', tags: [{ tag: '自己受容', score: 2, group: 'strength' }] },
      { label: 'B', text: '大切な場面だけ頑張りすぎる', tags: [{ tag: '責任感', score: 2, group: 'strength' }] },
      { label: 'C', text: '完璧にやろうとしすぎる', tags: [{ tag: '完璧主義', score: 3, group: 'thinking' }] },
      { label: 'D', text: 'いつも自分に厳しい', tags: [{ tag: '完璧主義', score: 2, group: 'thinking' }, { tag: '自己否定', score: 2, group: 'thinking' }] },
    ],
  },

  // ──────────────────────────────────────────
  // CATEGORY 3: 人とのつながり
  // ──────────────────────────────────────────
  {
    id: 'rel_1',
    categoryId: 'relationships',
    text: '誰かと意見が対立したとき？',
    options: [
      { label: 'A', text: '正直に自分の意見を伝える', tags: [{ tag: '感情表現力', score: 2, group: 'strength' }, { tag: '自分軸', score: 2, group: 'strength' }] },
      { label: 'B', text: '相手を立てながら伝えるようにする', tags: [{ tag: '共感力', score: 2, group: 'strength' }, { tag: '観察力', score: 1, group: 'strength' }] },
      { label: 'C', text: '自分が折れることが多い', tags: [{ tag: '他者軸', score: 3, group: 'thinking' }, { tag: '我慢癖', score: 2, group: 'thinking' }] },
      { label: 'D', text: 'その場を避けてしまう', tags: [{ tag: '不安を隠す', score: 2, group: 'emotionHabit' }, { tag: '自己表現苦手', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'rel_2',
    categoryId: 'relationships',
    text: '「No」と断ることは？',
    options: [
      { label: 'A', text: '必要なら自然にできる', tags: [{ tag: '自分軸', score: 3, group: 'strength' }, { tag: '自己信頼', score: 2, group: 'strength' }] },
      { label: 'B', text: '理由があれば言える', tags: [{ tag: '慎重さ', score: 1, group: 'strength' }] },
      { label: 'C', text: 'かなり難しい', tags: [{ tag: '他者軸', score: 2, group: 'thinking' }, { tag: '我慢癖', score: 2, group: 'thinking' }] },
      { label: 'D', text: 'ほぼ断れない・断ると罪悪感がある', tags: [{ tag: '他者軸', score: 3, group: 'thinking' }, { tag: '自分を後回し', score: 3, group: 'thinking' }] },
    ],
  },
  {
    id: 'rel_3',
    categoryId: 'relationships',
    text: '人間関係で疲れるのはどんな時？',
    options: [
      { label: 'A', text: '気を遣いすぎるとき', tags: [{ tag: '他者軸', score: 2, group: 'thinking' }, { tag: '自分を後回し', score: 2, group: 'thinking' }] },
      { label: 'B', text: '本音を言えないとき', tags: [{ tag: '我慢癖', score: 2, group: 'thinking' }, { tag: '自己表現苦手', score: 2, group: 'thinking' }] },
      { label: 'C', text: '相手の感情に引っ張られるとき', tags: [{ tag: '共感力', score: 2, group: 'strength' }, { tag: '境界線が薄い', score: 2, group: 'thinking' }] },
      { label: 'D', text: '自分の話を聞いてもらえないとき', tags: [{ tag: '分かってほしい', score: 3, group: 'innerChild' }] },
    ],
  },
  {
    id: 'rel_4',
    categoryId: 'relationships',
    text: '友達や同僚から相談されたとき？',
    options: [
      { label: 'A', text: '全力で話を聞く', tags: [{ tag: '聞く力', score: 3, group: 'skill' }, { tag: '思いやり', score: 2, group: 'strength' }] },
      { label: 'B', text: '一緒に解決策を考える', tags: [{ tag: '論理思考', score: 2, group: 'strength' }, { tag: '整理する力', score: 2, group: 'skill' }] },
      { label: 'C', text: '共感して寄り添う', tags: [{ tag: '共感力', score: 3, group: 'strength' }] },
      { label: 'D', text: '自分のことより相談を優先してしまう', tags: [{ tag: '自分を後回し', score: 2, group: 'thinking' }, { tag: '他者軸', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'rel_5',
    categoryId: 'relationships',
    text: '自分のことを人に話すのは？',
    options: [
      { label: 'A', text: '得意で積極的に話す', tags: [{ tag: '感情表現力', score: 2, group: 'strength' }, { tag: '自己開示力', score: 3, group: 'strength' }] },
      { label: 'B', text: '聞かれれば話せる', tags: [{ tag: '慎重さ', score: 1, group: 'strength' }] },
      { label: 'C', text: '信頼できる人にしか話せない', tags: [{ tag: '自己開示苦手', score: 1, group: 'thinking' }] },
      { label: 'D', text: 'あまり話せない・話したくない', tags: [{ tag: '自己表現苦手', score: 2, group: 'thinking' }, { tag: '自己開示苦手', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'rel_6',
    categoryId: 'relationships',
    text: '人間関係で大切にしていることは？',
    options: [
      { label: 'A', text: 'お互いの本音を話せること', tags: [{ tag: '誠実さ', score: 2, group: 'strength' }, { tag: '感情表現力', score: 1, group: 'strength' }] },
      { label: 'B', text: '安心できる空気感', tags: [{ tag: '安心したい', score: 2, group: 'innerChild' }] },
      { label: 'C', text: '適度な距離感', tags: [{ tag: '自律性', score: 2, group: 'strength' }] },
      { label: 'D', text: '互いに高め合えること', tags: [{ tag: '成長意欲', score: 2, group: 'strength' }] },
    ],
  },

  // ──────────────────────────────────────────
  // CATEGORY 4: 仕事・強み
  // ──────────────────────────────────────────
  {
    id: 'career_1',
    categoryId: 'career',
    text: '仕事や活動で最も活きる場面は？',
    options: [
      { label: 'A', text: 'アイデアを出す・新しいことを考える', tags: [{ tag: 'アイデア力', score: 3, group: 'skill' }, { tag: '創造性', score: 2, group: 'strength' }] },
      { label: 'B', text: '人をサポート・まとめる', tags: [{ tag: '人を支える力', score: 3, group: 'skill' }, { tag: '共感力', score: 2, group: 'strength' }] },
      { label: 'C', text: 'コツコツ丁寧に仕上げる', tags: [{ tag: '継続力', score: 3, group: 'strength' }, { tag: '責任感', score: 2, group: 'strength' }] },
      { label: 'D', text: '新しいことへ挑戦・リード', tags: [{ tag: '行動力', score: 3, group: 'strength' }, { tag: 'チャレンジ精神', score: 2, group: 'strength' }] },
    ],
  },
  {
    id: 'career_2',
    categoryId: 'career',
    text: '仕事でストレスを感じやすいのは？',
    options: [
      { label: 'A', text: 'やることが多すぎるとき', tags: [{ tag: 'キャパオーバー傾向', score: 2, group: 'thinking' }] },
      { label: 'B', text: '人間関係の摩擦があるとき', tags: [{ tag: '他者軸', score: 1, group: 'thinking' }, { tag: '環境に敏感', score: 2, group: 'emotionHabit' }] },
      { label: 'C', text: '評価されない・認められないとき', tags: [{ tag: '認めてほしい', score: 3, group: 'innerChild' }] },
      { label: 'D', text: '意味を感じられないとき', tags: [{ tag: '意味のある日々', score: 2, group: 'direction' }] },
    ],
  },
  {
    id: 'career_3',
    categoryId: 'career',
    text: '自分の得意なことは？（最も近いもの）',
    options: [
      { label: 'A', text: '人の話を聞く・共感する', tags: [{ tag: '聞く力', score: 3, group: 'skill' }, { tag: '共感力', score: 2, group: 'strength' }] },
      { label: 'B', text: '物事を整理・分析する', tags: [{ tag: '論理思考', score: 3, group: 'strength' }, { tag: '整理する力', score: 2, group: 'skill' }] },
      { label: 'C', text: 'アイデアを出す・表現する', tags: [{ tag: 'アイデア力', score: 3, group: 'skill' }, { tag: '創造性', score: 2, group: 'strength' }] },
      { label: 'D', text: '黙々と丁寧にやり遂げる', tags: [{ tag: '継続力', score: 3, group: 'strength' }, { tag: '責任感', score: 2, group: 'strength' }] },
    ],
  },
  {
    id: 'career_4',
    categoryId: 'career',
    text: 'キャリアや目標について、今の状態は？',
    freeTextPrompt: '一言あれば',
    options: [
      { label: 'A', text: '明確なビジョンがある', tags: [{ tag: '方向性明確', score: 3, group: 'direction' }, { tag: '行動力', score: 1, group: 'strength' }] },
      { label: 'B', text: 'なんとなく方向性はある', tags: [{ tag: '方向性明確', score: 1, group: 'direction' }] },
      { label: 'C', text: 'やりたいことを探している', tags: [{ tag: '好きなことを見つけたい', score: 2, group: 'direction' }] },
      { label: 'D', text: 'あまり考えてこなかった', tags: [{ tag: '感情後回し', score: 1, group: 'emotionHabit' }] },
    ],
  },
  {
    id: 'career_5',
    categoryId: 'career',
    text: '頑張りすぎてしまうのはどんな時？',
    options: [
      { label: 'A', text: '好きなこと・得意なことをするとき', tags: [{ tag: '没頭力', score: 2, group: 'strength' }] },
      { label: 'B', text: '責任感から引き受けてしまうとき', tags: [{ tag: '責任感', score: 2, group: 'strength' }, { tag: '我慢癖', score: 1, group: 'thinking' }] },
      { label: 'C', text: '評価されたい・認められたいとき', tags: [{ tag: '認めてほしい', score: 2, group: 'innerChild' }] },
      { label: 'D', text: '断れなくて引き受けすぎるとき', tags: [{ tag: '他者軸', score: 2, group: 'thinking' }, { tag: '自分を後回し', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'career_6',
    categoryId: 'career',
    text: '今の自分のキャリアに必要なのは？',
    options: [
      { label: 'A', text: 'もっと自信を持つこと', tags: [{ tag: '自己信頼', score: 2, group: 'strength' }] },
      { label: 'B', text: '行動に移す力', tags: [{ tag: '行動力', score: 2, group: 'strength' }] },
      { label: 'C', text: '継続する・やり遂げる力', tags: [{ tag: '継続力', score: 2, group: 'strength' }] },
      { label: 'D', text: 'やりたいことを見つけること', tags: [{ tag: '好きなことを見つけたい', score: 3, group: 'direction' }] },
    ],
  },

  // ──────────────────────────────────────────
  // CATEGORY 5: 恋愛・親密さ
  // ──────────────────────────────────────────
  {
    id: 'romance_1',
    categoryId: 'romance',
    text: '好きな人ができたとき？',
    options: [
      { label: 'A', text: '素直に気持ちを伝えられる', tags: [{ tag: '自己開示力', score: 3, group: 'strength' }, { tag: '自分軸', score: 2, group: 'strength' }] },
      { label: 'B', text: 'タイミングを見計らって行動する', tags: [{ tag: '慎重さ', score: 2, group: 'strength' }, { tag: '観察力', score: 1, group: 'strength' }] },
      { label: 'C', text: 'なかなか自分から動けない', tags: [{ tag: '不安を隠す', score: 2, group: 'emotionHabit' }] },
      { label: 'D', text: '相手の気持ちが気になって動けない', tags: [{ tag: '考えすぎ', score: 2, group: 'thinking' }, { tag: '他者軸', score: 2, group: 'thinking' }] },
    ],
  },
  {
    id: 'romance_2',
    categoryId: 'romance',
    text: '親密な関係で怖いと感じることは？',
    options: [
      { label: 'A', text: '嫌われること', tags: [{ tag: '認めてほしい', score: 2, group: 'innerChild' }, { tag: '他者軸', score: 2, group: 'thinking' }] },
      { label: 'B', text: '傷つくこと', tags: [{ tag: '安心したい', score: 2, group: 'innerChild' }] },
      { label: 'C', text: '本音を見せること', tags: [{ tag: '自己表現苦手', score: 2, group: 'thinking' }, { tag: '不安を隠す', score: 2, group: 'emotionHabit' }] },
      { label: 'D', text: '依存してしまうこと', tags: [{ tag: '自律性', score: 2, group: 'strength' }] },
    ],
  },
  {
    id: 'romance_3',
    categoryId: 'romance',
    text: '誰かに甘えたり頼ったりするとき？',
    options: [
      { label: 'A', text: '素直にできる', tags: [{ tag: '自己受容', score: 2, group: 'strength' }, { tag: '自己開示力', score: 1, group: 'strength' }] },
      { label: 'B', text: '遠慮してしまう', tags: [{ tag: '我慢癖', score: 2, group: 'thinking' }] },
      { label: 'C', text: '相手の反応が気になって言えない', tags: [{ tag: '他者軸', score: 2, group: 'thinking' }, { tag: '不安を隠す', score: 2, group: 'emotionHabit' }] },
      { label: 'D', text: 'ほとんど頼らない・頼れない', tags: [{ tag: '我慢癖', score: 3, group: 'thinking' }, { tag: '甘えたい', score: 3, group: 'innerChild' }] },
    ],
  },
  {
    id: 'romance_4',
    categoryId: 'romance',
    text: '関係性で大切にしたいのは？',
    options: [
      { label: 'A', text: '一緒にいて安心できること', tags: [{ tag: '安心したい', score: 2, group: 'innerChild' }] },
      { label: 'B', text: '本音で話し合えること', tags: [{ tag: '誠実さ', score: 2, group: 'strength' }, { tag: '感情表現力', score: 1, group: 'strength' }] },
      { label: 'C', text: 'お互いを高め合えること', tags: [{ tag: '成長意欲', score: 2, group: 'strength' }] },
      { label: 'D', text: '適度な自由と距離感があること', tags: [{ tag: '自律性', score: 2, group: 'strength' }] },
    ],
  },
  {
    id: 'romance_5',
    categoryId: 'romance',
    text: '「大切にされている」と感じる瞬間は？',
    options: [
      { label: 'A', text: '話を丁寧に聞いてもらえるとき', tags: [{ tag: '分かってほしい', score: 3, group: 'innerChild' }] },
      { label: 'B', text: '存在を気にかけてもらえるとき', tags: [{ tag: '大切にされたい', score: 3, group: 'innerChild' }] },
      { label: 'C', text: '言葉や行動で示してもらえるとき', tags: [{ tag: '認めてほしい', score: 2, group: 'innerChild' }] },
      { label: 'D', text: 'そばにいてくれるとき', tags: [{ tag: '安心したい', score: 2, group: 'innerChild' }] },
    ],
  },
  {
    id: 'romance_6',
    categoryId: 'romance',
    text: '恋愛や人間関係で繰り返しやすいパターンは？',
    freeTextPrompt: '一言あれば',
    options: [
      { label: 'A', text: '自分より相手を優先しすぎる', tags: [{ tag: '他者軸', score: 3, group: 'thinking' }, { tag: '自分を後回し', score: 2, group: 'thinking' }] },
      { label: 'B', text: '本音を言えないまま我慢する', tags: [{ tag: '我慢癖', score: 3, group: 'thinking' }] },
      { label: 'C', text: '距離が縮まると不安になる', tags: [{ tag: '不安を隠す', score: 2, group: 'emotionHabit' }] },
      { label: 'D', text: '特に気になるパターンはない', tags: [{ tag: '自己受容', score: 1, group: 'strength' }] },
    ],
  },

  // ──────────────────────────────────────────
  // CATEGORY 6: 価値観・ありたい姿
  // ──────────────────────────────────────────
  {
    id: 'values_1',
    categoryId: 'values',
    text: '「幸せだな」と感じる瞬間は？',
    options: [
      { label: 'A', text: '好きなことに没頭しているとき', tags: [{ tag: '好きなことを見つけたい', score: 3, group: 'direction' }] },
      { label: 'B', text: '誰かの役に立てたとき', tags: [{ tag: '人の役に立ちたい', score: 3, group: 'direction' }] },
      { label: 'C', text: '自分の時間がしっかり持てたとき', tags: [{ tag: '自分の時間を持ちたい', score: 3, group: 'direction' }] },
      { label: 'D', text: '大切な人と笑えたとき', tags: [{ tag: 'つながりを大切にしたい', score: 3, group: 'direction' }] },
    ],
  },
  {
    id: 'values_2',
    categoryId: 'values',
    text: '大切にしている価値観は？',
    options: [
      { label: 'A', text: '自由・自分らしさ', tags: [{ tag: '自分軸', score: 2, group: 'strength' }, { tag: '自由にしたい', score: 2, group: 'innerChild' }] },
      { label: 'B', text: '成長・チャレンジ', tags: [{ tag: '成長意欲', score: 3, group: 'strength' }] },
      { label: 'C', text: '調和・つながり', tags: [{ tag: 'つながりを大切にしたい', score: 2, group: 'direction' }] },
      { label: 'D', text: '安心・安定', tags: [{ tag: '穏やかに過ごしたい', score: 2, group: 'direction' }] },
    ],
  },
  {
    id: 'values_3',
    categoryId: 'values',
    text: '5年後の自分に期待することは？',
    freeTextPrompt: '一言あれば',
    options: [
      { label: 'A', text: '自分らしく生きていること', tags: [{ tag: '自分軸', score: 2, group: 'strength' }, { tag: '意味のある日々', score: 1, group: 'direction' }] },
      { label: 'B', text: '今より成長していること', tags: [{ tag: '成長意欲', score: 3, group: 'strength' }] },
      { label: 'C', text: '好きなことをしていること', tags: [{ tag: '好きなことを見つけたい', score: 3, group: 'direction' }] },
      { label: 'D', text: '穏やかに暮らしていること', tags: [{ tag: '穏やかに過ごしたい', score: 3, group: 'direction' }] },
    ],
  },
  {
    id: 'values_4',
    categoryId: 'values',
    text: '今の自分に一番足りないと感じることは？',
    options: [
      { label: 'A', text: '自分への自信', tags: [{ tag: '自己信頼', score: 2, group: 'strength' }] },
      { label: 'B', text: '自分だけの時間', tags: [{ tag: '自分の時間を持ちたい', score: 2, group: 'direction' }] },
      { label: 'C', text: '心の余裕・休息', tags: [{ tag: '穏やかに過ごしたい', score: 2, group: 'direction' }] },
      { label: 'D', text: '意味のある目標・方向性', tags: [{ tag: '意味のある日々', score: 2, group: 'direction' }] },
    ],
  },
  {
    id: 'values_5',
    categoryId: 'values',
    text: '自分が変えたいと思うことは？',
    options: [
      { label: 'A', text: 'もっと自分を信じたい', tags: [{ tag: '自己信頼', score: 2, group: 'strength' }] },
      { label: 'B', text: '人にもっと頼れるようになりたい', tags: [{ tag: '甘えたい', score: 2, group: 'innerChild' }] },
      { label: 'C', text: '自分の気持ちを素直に伝えたい', tags: [{ tag: '感情表現力', score: 2, group: 'strength' }] },
      { label: 'D', text: 'もっと行動できるようになりたい', tags: [{ tag: '行動力', score: 2, group: 'strength' }] },
    ],
  },
  {
    id: 'values_6',
    categoryId: 'values',
    text: '「いい人生だったな」と感じるためには？',
    options: [
      { label: 'A', text: '自分に正直に生きられたこと', tags: [{ tag: '自分軸', score: 2, group: 'strength' }, { tag: '意味のある日々', score: 1, group: 'direction' }] },
      { label: 'B', text: '誰かの人生に影響を与えられたこと', tags: [{ tag: '人の役に立ちたい', score: 2, group: 'direction' }] },
      { label: 'C', text: 'やりたいことに向き合えたこと', tags: [{ tag: '好きなことを見つけたい', score: 2, group: 'direction' }] },
      { label: 'D', text: '心穏やかに日々を積み重ねられたこと', tags: [{ tag: '穏やかに過ごしたい', score: 2, group: 'direction' }] },
    ],
  },
]

export const QUESTIONS_BY_CATEGORY = CATEGORIES.map(cat => ({
  category: cat,
  questions: QUESTIONS.filter(q => q.categoryId === cat.id),
}))
