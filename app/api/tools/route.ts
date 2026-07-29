import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { toolInputSchema } from '@/lib/validation'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('tools').select('*').eq('status', 'ACTIVE').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Unable to load tools' }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to list a tool' }, { status: 401 })
  let payload: unknown
  try { payload = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }) }
  const parsed = toolInputSchema.safeParse(payload)
  if (!parsed.success) return NextResponse.json({ error: 'Check the listing fields and price' }, { status: 400 })
  const { data, error } = await supabase.from('tools').insert({ ...parsed.data, image_url: parsed.data.image_url || null, owner_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: 'Could not create listing' }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
