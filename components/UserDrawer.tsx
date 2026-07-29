'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Compass, LayoutDashboard, ListPlus, LogOut, Menu, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function UserDrawer() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function signOut() {
    await createClient().auth.signOut()
    setOpen(false)
    router.push('/login')
    router.refresh()
  }

  return <>
    <button className="drawer-trigger" onClick={() => setOpen(true)} aria-label="Open user menu" aria-expanded={open} title="Open user menu"><Menu size={20} /></button>
    {open && <div className="drawer-backdrop" role="presentation" onClick={() => setOpen(false)}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="User menu" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head"><strong>Toolspace</strong><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close user menu"><X size={18} /></button></div>
        <p className="drawer-caption">Your workspace</p>
        <nav className="drawer-nav">
          <a href="/" onClick={() => setOpen(false)}><Compass size={18} /> Browse tools</a>
          <a href="/dashboard" onClick={() => setOpen(false)}><LayoutDashboard size={18} /> Dashboard</a>
          <a href="/tools/new" onClick={() => setOpen(false)}><ListPlus size={18} /> List a tool</a>
        </nav>
        <button className="drawer-signout" onClick={signOut}><LogOut size={18} /> Sign out</button>
      </aside>
    </div>}
  </>
}
