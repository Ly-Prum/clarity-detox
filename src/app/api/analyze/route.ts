import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { BrainAnalysis } from '@/lib/types'

const client = new Anthropic()

const SYSTEM_PROMPT = `あなたは頭の中の整理を助けるAIです。
ユーザーが書き出した内容を読み取り、以下の形式のJSONのみを返してください（説明文・コードブロック不要）。

{
  "noise_level": 0-100の数値（100が最も混雑）,
  "noise_state": "混雑" | "散乱" | "整理中" | "安定" | "クリア",
  "balance": {
    "感情過多": 0-100,
    "タスク過多": 0-100,
    "不安過多": 0-100,
    "情報過多": 0-100,
    "思考ループ": 0-100,
    "行動不足": 0-100
  },
  "dominant": 最も高い項目名またはnull,
  "summary": "書かれた内容を鏡のように映す2文。評価せず、その人の状態をそのまま言葉にする。",
  "advice": "気持ちに寄り添うひとこと。「もしよければ〜」という柔らかい言い方。命令形は使わない。",
  "clarity_score": 0-100（100が完全クリア）,
  "extracted_items": [
    "書かれた内容から抽出した個別の思考・悩み・タスク・感情を1つずつ短い文で。重複なし。"
  ],
  "organized_groups": [
    {
      "theme": "グループのテーマ名（短く）",
      "items": ["このグループに属するextracted_itemsの文をそのまま"]
    }
  ],
  "tagged_items": [
    {
      "id": "t1",
      "text": "extracted_itemsの文をそのまま",
      "tag": "タスク" | "感情" | "不安" | "人間関係" | "アイデア" | "その他",
      "as_todo": タスクなら true、それ以外は false
    }
  ]
}

ルール:
- extracted_itemsは書かれた内容を忠実に分解する（5〜15個程度）
- organized_groupsはextracted_itemsを意味でグループ化（2〜5グループ）
- tagged_itemsはextracted_itemsのすべてをtagで分類（順番・文はそのまま）
- idはt1,t2,t3...と連番
- as_todoは「〜する」「〜しなければ」など行動が必要なものをtrue`

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || text.trim().length < 5) {
      return NextResponse.json({ error: 'テキストが短すぎます' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text.trim() }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid JSON response')

    const analysis: BrainAnalysis = JSON.parse(jsonMatch[0])

    if (!analysis.extracted_items) analysis.extracted_items = []
    if (!analysis.organized_groups) analysis.organized_groups = []
    if (!analysis.tagged_items) analysis.tagged_items = []

    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('Analysis error:', err)
    const msg = err instanceof Error ? err.message : '不明なエラー'
    const isAuthError = msg.includes('apiKey') || msg.includes('authentication') || msg.includes('401')
    return NextResponse.json(
      { error: isAuthError ? 'APIキーが設定されていません' : '分析中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
