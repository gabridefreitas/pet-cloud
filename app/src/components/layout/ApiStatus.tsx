import { useEffect, useState } from 'react'
import { api } from '../../services/api'

type Status = 'checking' | 'online' | 'offline'

const LABELS: Record<Status, string> = {
  checking: 'Checking API…',
  online: 'API online',
  offline: 'API offline',
}

const DOT_COLORS: Record<Status, string> = {
  checking: 'bg-gray-300',
  online: 'bg-emerald-400',
  offline: 'bg-red-400',
}

/** Small indicator that the backend (EC2) answers its `/health` endpoint. */
export function ApiStatus() {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    const controller = new AbortController()
    api
      .get<{ status: string }>('/health', { signal: controller.signal, timeoutMs: 5000 })
      .then((data) => setStatus(data.status === 'ok' ? 'online' : 'offline'))
      .catch(() => {
        if (!controller.signal.aborted) setStatus('offline')
      })
    return () => controller.abort()
  }, [])

  return (
    <span role="status" className="flex items-center gap-2 text-xs text-brand-100">
      <span className={`size-2 rounded-full ${DOT_COLORS[status]}`} aria-hidden />
      {LABELS[status]}
    </span>
  )
}
