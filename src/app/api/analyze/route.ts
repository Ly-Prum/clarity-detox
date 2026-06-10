import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { BrainAnalysis } from '@/lib/types'

const client = new Anthropic()

const SYSTEM_PROMPT = `あなたはインナーコーチングの専門家AIです。
ユーザーが書き出した「頭の中にあること」を深く読み取り、その人固有の状態を分析してください。

必ずこの形式のみを返してください（説明文・コードブロック不要）:
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
  "summary": "脳内状態を2〜3文で説明。書かれた内容の具体的なキーワードや感情に触れながら、その人の今の状態を鏡のように映す。評価しない。",
  "advice": "その人の書いた内容に直接応えるアドバイスを2〜3文。「〜という気持ちがあるなら、今日だけ〜してみては」という具体的な提案。汎用的な言葉は避ける。",
  "clarity_score": 0-100（100が完全にクリア）
}

分析の視点:
- 書かれた内容の具体的な言葉・感情・状況を必ず参照する
- noise_level: 語数・感情的負荷・複雑さで判断（長文で感情的＝高め）
- balance: 感情的な言葉→感情過多、ToDoや「しなければ」→タスク過多、心配・「もし〜なら」→不安過多、情報の羅列→情報過多、同じことの繰り返し→思考ループ、停滞感・無力感→行動不足
- clarity_score: noise_levelの逆（整理されているほど高い）
- テキストが短い場合はnoise_level低め・clarity_score高めに設定
- summaryとadviceは必ずその人固有の内容に触れた言葉にする`

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
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
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
