import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const userId   = req.nextUrl.searchParams.get('user_id')
  const category = req.nextUrl.searchParams.get('category')
  if (!userId || !category) return NextResponse.json([])
  const { data, error } = await supabase
    .from('drawer_notes')
    .select('id, content, category, created_at, updated_at')
    .eq('user_id', userId)
    .eq('category', category)
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { user_id, category, content } = await req.json()
  if (!user_id || !category || content === undefined)
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const { data, error } = await supabase
    .from('drawer_notes')
    .insert({ user_id, category, content })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
