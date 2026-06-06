import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

const SYSTEM = `ユーザーが貼り付けたコーチングセッション分析テキストを読み取り、以下のJSON形式で構造化してください。
テキストの内容から最大限の情報を抽出してください。

必ずこのJSON形式のみを返してください（説明文不要）:
{
  "theme": "セッションのテーマ",
  "session_date": "YYYY-MM-DD形式（記載がなければ今日の日付）",
  "current_state": "現在の状態の説明文",
  "core_theme": "核となるテーマ（一文）",
  "thinking_patterns": [
    {"title": "パターン名", "description": "説明"}
  ],
  "natural_strengths": ["強み1", "強み2"],
  "word_conversions": [
    {"before": "変換前の言葉", "after": "変換後の言葉"}
  ],
  "challenges": ["課題1", "課題2"],
  "overall": "総評の文章",
  "scores": {
    "自己理解度": 3,
    "感情理解度": 3,
    "課題認識度": 3,
    "原因理解度": 3,
    "本音把握度": 3,
    "方向性明確度": 3,
    "自己受容度": 3,
    "行動明確度": 3
  }
}

スコアが記載されていない項目はテキストの内容から推測して1〜5で採点してください。`

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: 'テキストが空です' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: 'user', content: `以下のセッション分析テキストを構造化してください。\n\n${text.trim()}` }],
    })

    const raw = (message.content[0] as { text: string }).text.trim()
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'テキストから情報を取得できませんでした' }, { status: 422 })

    return NextResponse.json({ ok: true, data: JSON.parse(match[0]) })
  } catch (err) {
    console.error('analyze-text error:', err)
    return NextResponse.json({ error: '解析中にエラーが発生しました' }, { status: 500 })
  }
}
