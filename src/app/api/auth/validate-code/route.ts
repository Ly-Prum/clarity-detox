import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code?.trim()) {
    return NextResponse.json({ error: '招待コードを入力してください' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('invite_codes')
    .select('code, client_name, is_active')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()

  if (error) {
    console.error('validate-code error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: '招待コードが見つかりません' }, { status: 404 })
  }
  if (!data.is_active) {
    return NextResponse.json({ error: 'この招待コードは無効です' }, { status: 403 })
  }

  return NextResponse.json({ ok: true, client_name: data.client_name, code: data.code })
}
