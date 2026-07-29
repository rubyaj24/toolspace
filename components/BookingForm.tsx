'use client'

import { FormEvent, useMemo, useState } from 'react'
import { formatInr } from '@/lib/format'
import { CalendarDays, CheckCircle2 } from 'lucide-react'

export function BookingForm({ toolId, price }: { toolId: string; price: number }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const days = useMemo(() => start && end ? Math.max(0, Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000)) : 0, [start, end])

  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage(''); setSuccess(false); setSaving(true)
    const today = new Date().toISOString().slice(0, 10)
    if (start < today) { setMessage('Start date cannot be in the past.'); setSaving(false); return }
    if (end <= start) { setMessage('Return date must be after the start date.'); setSaving(false); return }
    try {
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool_id: toolId, start_date: start, end_date: end }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Booking failed')
      setSuccess(true)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Booking failed') } finally { setSaving(false) }
  }

  return <form className="panel" onSubmit={submit}><div className="step-label">STEP 1 OF 1 · CHOOSE YOUR DATES</div><h3>Request this tool</h3><div className="form-row"><label><span><CalendarDays size={14} /> Start date</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={start} onChange={(e) => setStart(e.target.value)} required /></label><label><span><CalendarDays size={14} /> Return date</span><input type="date" min={start || new Date().toISOString().slice(0, 10)} value={end} onChange={(e) => setEnd(e.target.value)} required /></label></div>{days > 0 && <div className="summary"><span>{days} rental days</span><strong>{formatInr(days * Number(price))} estimated</strong></div>}{success && <div className="success-message"><CheckCircle2 size={19} /><span><strong>Request sent.</strong><br />The owner can now review your booking request.</span></div>}{message && <div className="form-message">{message}</div>}<button className="button" disabled={saving || success}>{saving ? 'Sending…' : success ? 'Request sent' : 'Request booking'}</button></form>
}
