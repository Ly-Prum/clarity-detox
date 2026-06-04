import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// service_role key で invite_codes テーブルにアクセス（サーバーサイドのみ）
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code?.trim()) {
    return NextResponse.json({ error: '招待コードを入力してください' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('invite_codes')
    .select('code, client_name, is_active')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: '招待コードが見つかりません' }, { status: 404 })
  }
  if (!data.is_active) {
    return NextResponse.json({ error: 'この招待コードは無効です' }, { status: 403 })
  }

  return NextResponse.json({ ok: true, client_name: data.client_name, code: data.code })
}
