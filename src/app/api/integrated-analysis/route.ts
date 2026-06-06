import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { IntegratedAnalysisContent } from '@/lib/types'

const client = new Anthropic()

const SYSTEM_PROMPT = `あなたは深く共感的なインナーコーチングAIです。
ユーザーが提供した複数のデータ（脳内デトックスセッション・自己受容ノート・許可ノート・Discovery分析）を統合し、その人の深層パターンと次のステップを分析してください。

必ずこの形式のみを返してください（説明文不要）:
{
  "core_pattern": "核となるパターン（1〜2文。例：自分の感情を後回しにしながら頑張る癖がある）",
  "insight": "統合的な気づき（2〜3文。データ全体から見えてくる本質的な洞察）",
  "self_acceptance_message": "自己受容のメッセージ（3〜4文。'あなた'への優しい語りかけ。評価せず、ただ受け取る）",
  "permission": "あなたへの許可（「〜していいよ」形式で2〜3個。改行で区切る）",
  "next_step": "次のステップ（1〜2文。具体的で小さく、今すぐできること）",
  "affirmation": "アファーメーション（「私は〜」形式で1〜2文）"
}

分析の視点:
- 繰り返し現れるパターン・テーマに注目する
- 強みと課題を両方見る
- 批判せず、あるがままを受け入れる視点で
- 小さくても前進できる言葉を選ぶ`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { detoxSessions, selfAcceptanceNotes, permissionNotes, discoveryAnalysis } = body

    const parts: string[] = []

    if (detoxSessions?.length) {
      parts.push(`## 脳内デトックスセッション（直近${detoxSessions.length}件）\n${
        detoxSessions.map((s: { analysis: { noise_state: string; clarity_score: number; dominant: string | null; summary: string }; input_text: string }) =>
          `- 状態: ${s.analysis.noise_state}、スコア: ${s.analysis.clarity_score}、${s.analysis.dominant ? `主な傾向: ${s.analysis.dominant}、` : ''}一言: ${s.analysis.summary}`
        ).join('\n')
      }`)
    }

    if (selfAcceptanceNotes?.length) {
      parts.push(`## 自己受容ノート（直近${selfAcceptanceNotes.length}件）\n${
        selfAcceptanceNotes.map((n: { content: { state?: string; blame?: string; message?: string } }) => {
          const c = n.content
          return [
            c.state   ? `今の状態: ${c.state}` : '',
            c.blame   ? `責めてしまったこと: ${c.blame}` : '',
            c.message ? `自分への言葉: ${c.message}` : '',
          ].filter(Boolean).join('\n')
        }).join('\n---\n')
      }`)
    }

    if (permissionNotes?.length) {
      const allPerms = permissionNotes.flatMap((n: { content: { permissions: string[] } }) => n.content.permissions ?? [])
      if (allPerms.length) {
        parts.push(`## 許可ノート（自分に与えた許可）\n${allPerms.map((p: string) => `私は、${p}`).join('\n')}`)
      }
    }

    if (discoveryAnalysis) {
      const d = discoveryAnalysis
      parts.push(`## Discovery分析\n強み: ${d.strengths?.join('、') ?? 'なし'}\n思考パターン: ${d.thinkingPatterns?.join('、') ?? 'なし'}\n内なるニーズ: ${d.innerChildNeeds?.join('、') ?? 'なし'}\n方向性: ${d.directions?.join('、') ?? 'なし'}`)
    }

    if (!parts.length) {
      return NextResponse.json({ error: 'データが不足しています' }, { status: 400 })
    }

    const userContent = `以下のデータを統合して分析してください。\n\n${parts.join('\n\n')}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid JSON response')

    const content: IntegratedAnalysisContent = JSON.parse(jsonMatch[0])
    return NextResponse.json({ content })
  } catch (err) {
    console.error('Integrated analysis error:', err)
    return NextResponse.json({ error: '分析中にエラーが発生しました' }, { status: 500 })
  }
}
