import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function buildEmail(clientName: string, code: string) {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans JP',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#c9a96e,#b4956c);padding:36px 32px;text-align:center;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Inner Coaching</div>
      <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Clarity</div>
    </div>
    <div style="padding:36px 32px;">
      <p style="font-size:15px;color:#3d2010;margin:0 0 24px;line-height:1.7;">${clientName} さん、<br>Clarityへようこそ。<br>あなた専用の招待コードをお送りします。</p>
      <div style="background:#faf6f0;border:2px dashed #c9a96e;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
        <div style="font-size:11px;font-weight:700;color:#b4956c;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">あなたの招待コード</div>
        <div style="font-size:30px;font-weight:900;color:#3d2010;letter-spacing:0.15em;font-family:monospace;">${code}</div>
      </div>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="https://clarity-detox.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#c9a96e,#b4956c);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;">Clarityを開く</a>
      </div>
      <div style="font-size:11px;color:#a89a8a;text-align:center;line-height:1.7;">ログイン画面で上記の招待コードを入力してください。</div>
    </div>
    <div style="background:#faf6f0;padding:20px 32px;text-align:center;border-top:1px solid #ece8e0;">
      <div style="font-size:11px;color:#c4b8a8;">Clarity インナーコーチング</div>
    </div>
  </div>
</body>
</html>`
}

export async function GET() {
  const { data } = await supabase.from('invite_codes').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { code, client_name, email } = body

  const { error } = await supabase.from('invite_codes').insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (email?.trim() && resend != null) {
    const { error: mailError } = await resend.emails.send({
      from: 'Clarity <onboarding@resend.dev>',
      to: email.trim(),
      subject: '【Clarity】招待コードのご案内',
      html: buildEmail(client_name, code),
    })
    if (mailError) console.error('Mail send error:', mailError)
  }

  return NextResponse.json({ ok: true })
}
