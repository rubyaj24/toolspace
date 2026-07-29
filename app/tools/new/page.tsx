import { ToolForm } from '@/components/ToolForm'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewToolPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/tools/new')
  return <main className="shell page"><div className="eyebrow">Share your gear</div><h1>List a tool</h1><p className="muted">Add a power tool and let someone nearby put it to work.</p><ToolForm /></main>
}
