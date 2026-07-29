import { redirect } from 'next/navigation'
import { CalendarDays, MapPin, PackageOpen } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { formatInr } from '@/lib/format'
import { ToolStatusControl } from '@/components/ToolStatusControl'
import { BookingDecision } from '@/components/BookingDecision'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  const { data: tools } = await supabase.from('tools').select('id, name, category, location, price_per_day, status').eq('owner_id', user.id).order('created_at', { ascending: false })
  const toolIds = tools?.map((tool) => tool.id) ?? []
  const { data: requests } = toolIds.length ? await supabase.from('bookings').select('id, tool_id, start_date, end_date, total_price, status, renter_id').in('tool_id', toolIds).order('created_at', { ascending: false }) : { data: [] }
  const { data: myBookings } = await supabase.from('bookings').select('id, tool_id, start_date, end_date, total_price, status, tool:tools(name, location)').eq('renter_id', user.id).order('created_at', { ascending: false })

  return <main className="shell page"><div className="eyebrow">Your Toolspace</div><div className="dashboard-heading"><div><h1>Dashboard</h1><p className="muted">Manage your listings and track your rental activity.</p></div><a className="button" href="/tools/new"><PackageOpen size={17} /> List another tool</a></div><section className="dashboard-section"><div className="section-head"><h2>My listings</h2><span className="muted">{tools?.length ?? 0} tools</span></div>{tools?.length ? <div className="dashboard-grid">{tools.map((tool) => <div className="dashboard-card" key={tool.id}><a href={`/tools/${tool.id}`}><div><h3>{tool.name}</h3><p className="muted"><MapPin size={14} /> {tool.location} · {tool.category}</p></div><strong>{formatInr(tool.price_per_day)} / day</strong></a><ToolStatusControl toolId={tool.id} initialStatus={tool.status} /></div>)}</div> : <div className="empty">You have not listed any tools yet. <a href="/tools/new">Create your first listing.</a></div>}</section><section className="dashboard-section"><div className="section-head"><h2>Requests for my tools</h2><span className="muted">{requests?.length ?? 0} requests</span></div>{requests?.length ? <div className="request-list">{requests.map((request) => <div className="request-row" key={request.id}><div><strong>{tools?.find((tool) => tool.id === request.tool_id)?.name ?? 'Your tool'}</strong><p className="muted"><CalendarDays size={14} /> {request.start_date} → {request.end_date}</p></div><div className="request-right"><strong>{formatInr(request.total_price)}</strong><BookingDecision bookingId={request.id} /></div></div>)}</div> : <div className="empty">New booking requests for your tools will appear here.</div>}</section><section className="dashboard-section"><div className="section-head"><h2>My bookings</h2><span className="muted">{myBookings?.length ?? 0} bookings</span></div>{myBookings?.length ? <div className="request-list">{myBookings.map((booking) => <div className="request-row" key={booking.id}><div><strong>{booking.tool?.[0]?.name ?? 'Tool'}</strong><p className="muted"><CalendarDays size={14} /> {booking.start_date} → {booking.end_date} · {booking.tool?.[0]?.location ?? 'Local pickup'}</p></div><div className="request-right"><span className={`status status-${booking.status.toLowerCase()}`}>{booking.status}</span><strong>{formatInr(booking.total_price)}</strong></div></div>)}</div> : <div className="empty">Tools you request will appear here. <a href="/">Browse the marketplace.</a></div>}</section></main>
}
