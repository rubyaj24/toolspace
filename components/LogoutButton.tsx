'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()
  async function logout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }
  return <button className="link-button" onClick={logout} title="Sign out"><LogOut size={16} /> <span>Sign out</span></button>
}
