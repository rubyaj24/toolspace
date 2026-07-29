import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const updateToolSchema = z.object({ status: z.enum(['ACTIVE', 'PAUSED', 'DAMAGED', 'REMOVED']) })

export async function GET(_request: Request, context: RouteContext<'/api/tools/[toolId]'>) {
  const { toolId } = await context.params
  const supabase = await createClient()
  const { data, error } = await supabase.from('tools').select('*').eq('id', toolId).maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to load tool' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
  const { data: owner } = await supabase.from('profile_summaries').select('id, name').eq('id', data.owner_id).maybeSingle()
  return NextResponse.json({ data: { ...data, owner } })
}

export async function PATCH(request: Request, context: RouteContext<'/api/tools/[toolId]'>) {
  const { toolId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to update a tool' }, { status: 401 })
  let payload: unknown
  try { payload = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }) }
  const parsed = updateToolSchema.safeParse(payload)
  if (!parsed.success) return NextResponse.json({ error: 'Choose a valid tool status' }, { status: 400 })
  const { data: tool } = await supabase.from('tools').select('owner_id').eq('id', toolId).maybeSingle()
  if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
  if (tool.owner_id !== user.id) return NextResponse.json({ error: 'Only the owner can change availability' }, { status: 403 })
  const { data, error } = await supabase.from('tools').update({ status: parsed.data.status }).eq('id', toolId).select().single()
  if (error) return NextResponse.json({ error: 'Could not update availability' }, { status: 500 })
  return NextResponse.json({ data })
}
