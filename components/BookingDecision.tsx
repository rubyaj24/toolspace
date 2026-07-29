'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

export function BookingDecision({ bookingId }: { bookingId: string }) {
  const [status, setStatus] = useState('PENDING')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function decide(nextStatus: 'APPROVED' | 'REJECTED') {
    setSaving(true); setError('')
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Could not update request')
      setStatus(body.data.status)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update request') } finally { setSaving(false) }
  }

  if (status !== 'PENDING') return <span className={`status status-${status.toLowerCase()}`}>{status}</span>
  return <div className="decision-actions">{error && <small className="inline-error">{error}</small>}<button className="small-button approve" onClick={() => decide('APPROVED')} disabled={saving} title="Approve booking"><Check size={14} /> Approve</button><button className="small-button reject" onClick={() => decide('REJECTED')} disabled={saving} title="Reject booking"><X size={14} /> Reject</button></div>
}
