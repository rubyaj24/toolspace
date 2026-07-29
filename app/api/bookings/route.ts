import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { bookingInputSchema } from '@/lib/validation'
import { rentalDays, validateBookingRules } from '@/lib/booking'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to request a booking' }, { status: 401 })
  let payload: unknown
  try { payload = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }) }
  const parsed = bookingInputSchema.safeParse(payload)
  if (!parsed.success) return NextResponse.json({ error: 'Enter valid booking dates and a tool ID' }, { status: 400 })
  const { tool_id, start_date, end_date } = parsed.data
  const { data: tool } = await supabase.from('tools').select('owner_id, price_per_day, status').eq('id', tool_id).maybeSingle()
  if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
  const ruleError = validateBookingRules({ renterId: user.id, ownerId: tool.owner_id, toolStatus: tool.status, startDate: start_date, endDate: end_date })
  if (ruleError) return NextResponse.json({ error: ruleError }, { status: 400 })
  const { data: conflict } = await supabase.from('bookings').select('id').eq('tool_id', tool_id).in('status', ['PENDING', 'APPROVED']).lt('start_date', end_date).gt('end_date', start_date).limit(1)
  if (conflict?.length) return NextResponse.json({ error: 'Those dates are already booked' }, { status: 409 })
  const days = rentalDays(start_date, end_date)
  const { data, error } = await supabase.from('bookings').insert({ tool_id, renter_id: user.id, start_date, end_date, price_per_day_at_booking: tool.price_per_day, total_price: days * Number(tool.price_per_day), status: 'PENDING' }).select().single()
  if (error) return NextResponse.json({ error: 'Could not create booking' }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
