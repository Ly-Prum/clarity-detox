import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { BrainAnalysis } from '@/lib/types'

const client = new Anthropic()

const SYSTEM_PROMPT = `あなたは脳内状態を優しく分析するアシスタントです。
ユーザーが書いた「頭の中にあること」のテキストを分析し、以下のJSON形式で返してください。

必ずこの形式のみを返してください（説明文不要）:
{
  "noise_level": 0-100の数値（100が最も混雑）,
  "noise_state": "混雑" | "散乱" | "整理中" | "安定" | "クリア" のいずれか,
  "balance": {
    "感情過多": 0-100,
    "タスク過多": 0-100,
    "不安過多": 0-100,
    "情報過多": 0-100,
    "思考ループ": 0-100,
    "行動不足": 0-100
  },
  "dominant": 最も高い項目の名前（全て低い場合はnull）,
  "summary": "脳内状態を1〜2文で優しく説明",
  "advice": "整理を助ける一言アドバイス（評価せず、優しく）",
  "clarity_score": 0-100（100が完全にクリア）
}

判断基準:
- noise_level: テキストの量・複雑さ・感情的負荷で判断
- balance: 各カテゴリの割合（感情的な言葉 → 感情過多、ToDoや義務 → タスク過多、心配・「〜したら」→ 不安過多、情報羅列 → 情報過多、同じことの繰り返し → 思考ループ、何もできていない感 → 行動不足）
- clarity_score: noise_levelの逆（整理されているほど高い）
- テキストが短い・少ない場合は、noise_levelを低め・clarity_scoreを高めに設定`

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { error: 'テキストが短すぎます' },
        { status: 400 }
      )
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text.trim() }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid JSON response')

    const analysis: BrainAnalysis = JSON.parse(jsonMatch[0])
    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('Analysis error:', err)
    return NextResponse.json({ error: '分析中にエラーが発生しました' }, { status: 500 })
  }
}
