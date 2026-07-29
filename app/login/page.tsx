'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState('')
  async function signIn() {
    setError('')
    const supabase = createClient()
    const next = new URLSearchParams(window.location.search).get('next') || '/'
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } })
    if (authError) setError('Google sign-in is not configured yet.')
  }
  return <main className="shell page"><div className="form-card auth-card"><div className="auth-mark"><LogIn size={24} /></div><div className="eyebrow">Welcome back</div><h2>Sign in to Toolspace</h2><p className="muted">Sign in to request rentals or publish your own tools.</p>{error && <div className="form-message">{error}</div>}<button className="button full-button" onClick={signIn}><LogIn size={18} /> Continue with Google</button></div></main>
}
