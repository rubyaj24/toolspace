import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'

const statusSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']) })

export async function PATCH(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to update this booking' }, { status: 401 })

  let payload: unknown
  try { payload = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }) }
  const parsed = statusSchema.safeParse(payload)
  if (!parsed.success) return NextResponse.json({ error: 'Choose APPROVED, REJECTED, or CANCELLED' }, { status: 400 })

  const { data: booking } = await supabase.from('bookings').select('id, tool_id, renter_id, start_date, end_date, status').eq('id', bookingId).maybeSingle()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  const { data: tool } = await supabase.from('tools').select('owner_id').eq('id', booking.tool_id).maybeSingle()
  const isOwner = tool?.owner_id === user.id
  const isRenter = booking.renter_id === user.id

  if (parsed.data.status === 'CANCELLED') {
    if (!isRenter) return NextResponse.json({ error: 'Only the renter can cancel this booking' }, { status: 403 })
  } else {
    if (!isOwner) return NextResponse.json({ error: 'Only the tool owner can decide this request' }, { status: 403 })
    if (booking.status !== 'PENDING') return NextResponse.json({ error: 'Only pending requests can be approved or rejected' }, { status: 400 })
    if (parsed.data.status === 'APPROVED') {
      const { data: conflict } = await supabase.from('bookings').select('id').eq('tool_id', booking.tool_id).in('status', ['PENDING', 'APPROVED']).neq('id', booking.id).lt('start_date', booking.end_date).gt('end_date', booking.start_date).limit(1)
      if (conflict?.length) return NextResponse.json({ error: 'Another pending or approved request overlaps these dates' }, { status: 409 })
    }
  }

  const { data, error } = await supabase.from('bookings').update({ status: parsed.data.status }).eq('id', booking.id).select().single()
  if (error) return NextResponse.json({ error: 'Could not update booking status' }, { status: 500 })
  return NextResponse.json({ data })
}
