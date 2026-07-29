import { notFound } from 'next/navigation'
import { BookingForm } from '@/components/BookingForm'
import { createClient } from '@/utils/supabase/server'
import { formatInr } from '@/lib/format'

export default async function ToolDetails({ params }: PageProps<'/tools/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tool } = await supabase.from('tools').select('*').eq('id', id).maybeSingle()
  if (!tool) notFound()
  const { data: owner } = await supabase.from('profile_summaries').select('id, name').eq('id', tool.owner_id).maybeSingle()
  const isOwner = user?.id === tool.owner_id
  return <main className="shell page"><a className="muted" href="/">← Back to marketplace</a><div className="detail"><div className="detail-image">{tool.image_url ? <img src={tool.image_url} alt={tool.name} /> : <span className="tool-placeholder">🛠️</span>}</div><div className="detail-copy"><div className="eyebrow">{tool.category} · {tool.location}</div><h1>{tool.name}</h1><p className="muted">{tool.description || 'A reliable tool ready for its next project.'}</p><p><strong>{formatInr(tool.price_per_day)} / day</strong></p><p className="muted">Listed by {owner?.name ?? 'a local owner'}</p>{isOwner ? <div className="panel"><strong>This is your listing.</strong><p className="muted">You cannot book your own tool.</p><a className="button secondary" href="/dashboard">Open owner dashboard</a></div> : <BookingForm toolId={tool.id} price={tool.price_per_day} />}</div></div></main>
}
