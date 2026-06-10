import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { IntegratedAnalysisContent } from '@/lib/types'

const client = new Anthropic()

const SYSTEM_PROMPT = `あなたはインナーコーチングと深層心理の専門家AIです。
ユーザーが積み上げてきたデータを通して、その人の「内側にある本当の声」を読み解いてください。

表面的な言葉の分析ではなく、繰り返し現れるテーマ、避けている感情、隠れた強み、
無意識に作っている制限を丁寧に読み取ってください。

必ず以下の形式のJSONのみを返してください（説明文・コードブロック不要）:
{
  "core_pattern": "核となる無意識パターン（2〜3文。「〜という信念が、〜という行動を生み出している」という形で具体的に。データの言葉を引用して）",
  "insight": "統合的な気づき（3〜4文。複数のデータをつなげて初めて見えてくる本質。「〜の記録と〜の記録に共通して〜が現れています」という形で根拠を示す）",
  "self_acceptance_message": "あなたへのメッセージ（4〜5文。「あなた」への語りかけ。評価せず今の状態をそのまま受け取る言葉。具体的なデータの内容に触れながら）",
  "permission": "あなたへの許可（「〜していいよ」形式で3〜4個、改行で区切る。データから読み取った、その人が一番「許せていないこと」に応える）",
  "next_step": "次のステップ（2〜3文。今のパターンを崩す小さな実験。「〜の代わりに、今日だけ〜してみる」という具体性）",
  "affirmation": "アファーメーション（「私は〜」形式で2〜3文。その人固有の強みと課題に応じた、声に出せる言葉）"
}

分析を深めるための視点:
- データに出てきた具体的な言葉・感情・状況を必ず参照する
- 「なぜそのパターンが生まれたか」まで踏み込む
- 批判・評価・アドバイスではなく「鏡に映す」視点で
- その人だけに当てはまる言葉を選ぶ（汎用的・抽象的な言葉は避ける）
- 強みと脆さは同じコインの表裏として捉える
- 繰り返し出てくるキーワードや感情に特に注目する`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { detoxSessions, selfAcceptanceNotes, permissionNotes, discoveryAnalysis } = body

    const parts: string[] = []

    if (detoxSessions?.length) {
      parts.push(`## 脳内デトックスセッション（直近${detoxSessions.length}件）\n${
        detoxSessions.map((s: { analysis: { noise_state: string; clarity_score: number; dominant: string | null; summary: string }; input_text: string }, i: number) =>
          `### セッション${i + 1}\n【書き出した内容】\n${s.input_text}\n【状態】${s.analysis.noise_state}（クリアスコア: ${s.analysis.clarity_score}）${s.analysis.dominant ? `　主な傾向: ${s.analysis.dominant}` : ''}\n【AIの分析】${s.analysis.summary}`
        ).join('\n\n')
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
      max_tokens: 2000,
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
