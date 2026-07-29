import type { Metadata } from 'next'
import './globals.css'
import '@fontsource-variable/manrope'
import { createClient } from '@/utils/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'
import { Compass, LayoutDashboard, Plus, Wrench } from 'lucide-react'
import { UserDrawer } from '@/components/UserDrawer'

export const metadata: Metadata = {
  title: 'Toolspace — Rent power tools nearby',
  description: 'Rent power tools from people in your area.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body>
        <header className="nav">
          <div className="shell nav-inner">
            <a className="brand" href="/" aria-label="Toolspace home"><Wrench size={17} strokeWidth={2.5} />Toolspace</a>
            <nav className="nav-links">
              <a href="/"><Compass size={16} /> <span>Browse tools</span></a>
              {user ? <><a href="/dashboard"><LayoutDashboard size={16} /> <span>Dashboard</span></a><LogoutButton /><UserDrawer /></> : <a href="/login">Sign in</a>}
              <a className="button" href="/tools/new"><Plus size={16} /> <span>List a tool</span></a>
            </nav>
          </div>
        </header>
        <main className="site-main">{children}</main>
        <footer><div className="shell">Borrow better. Share locally.</div></footer>
      </body>
    </html>
  )
}
