import { ToolCard } from '@/components/ToolCard'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tools, error } = await supabase.from('tools').select('*').eq('status', 'ACTIVE').order('created_at', { ascending: false })

  return (
    <main>
      <div className="shell hero">
        <div>
          <div className="eyebrow">The neighborhood tool library</div>
          <h1>Get the right tool for the job.</h1>
          <p>Rent quality power tools from people nearby. List the tools sitting in your garage and help someone finish their next project.</p>
          <a className="button" href="#tools">Explore available tools</a>
        </div>
        <div className="hero-card"><span className="eyebrow">Share more. Buy less.</span><strong>Tools that work as hard as you do.</strong></div>
      </div>
      <section id="tools" className="shell section">
        <div className="section-head"><div><div className="eyebrow">Available now</div><h2>Find a tool</h2></div><span className="muted">{tools?.length ?? 0} listings</span></div>
        {error ? <div className="empty">Connect your Supabase schema to load listings.</div> : tools?.length ? <div className="grid">{tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</div> : <div className="empty">No tools are listed yet. Be the first to <a href="/tools/new">list one</a>.</div>}
      </section>
    </main>
  )
}
