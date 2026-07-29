'use client'

import { useState } from 'react'
import { Check, Pause, Play } from 'lucide-react'

export function ToolStatusControl({ toolId, initialStatus }: { toolId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function updateStatus(nextStatus: 'ACTIVE' | 'PAUSED') {
    setSaving(true); setError('')
    try {
      const response = await fetch(`/api/tools/${toolId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Could not update availability')
      setStatus(body.data.status)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update availability') } finally { setSaving(false) }
  }

  return <div className="status-control"><span className={`status status-${status.toLowerCase()}`}>{status}</span>{status === 'ACTIVE' ? <button className="icon-button" title="Pause listing" aria-label="Pause listing" onClick={() => updateStatus('PAUSED')} disabled={saving}><Pause size={15} /></button> : <button className="icon-button" title="Make listing active" aria-label="Make listing active" onClick={() => updateStatus('ACTIVE')} disabled={saving}><Play size={15} /></button>}{status !== initialStatus && <span title="Saved"><Check size={15} className="saved-icon" aria-label="Saved" /></span>}{error && <small className="inline-error">{error}</small>}</div>
}
