import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  const year   = req.nextUrl.searchParams.get('year')
  const month  = req.nextUrl.searchParams.get('month')
  if (!userId || !year || !month) return NextResponse.json([])
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to   = `${year}-${String(month).padStart(2, '0')}-31`
  const { data, error } = await supabase
    .from('kakeibo_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('entry_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id, amount, type, category, note, entry_date } = body
  if (!user_id || !amount || !type || !category || !entry_date)
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const { data, error } = await supabase
    .from('kakeibo_entries')
    .insert({ user_id, amount, type, category, note: note ?? '', entry_date })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
