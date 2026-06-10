import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const id   = req.nextUrl.searchParams.get('id')

  // Single report by ID (verify ownership via client_code)
  if (id && code) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .eq('client_code', code)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? null)
  }

  // List reports for a client
  if (!code) return NextResponse.json([])
  const { data, error } = await supabase
    .from('reports')
    .select('id, theme, session_date, created_at, overall, scores, images, core_theme, challenges')
    .eq('client_code', code)
    .order('session_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
