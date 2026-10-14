import { useState } from 'react'
import './App.css'

const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

function App() {
  const [status, setStatus] = useState('Not checked')
  const [checking, setChecking] = useState(false)

  async function checkApi() {
    setChecking(true)
    setStatus('Checking…')
    try {
      const response = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5000) })
      if (!response.ok) throw new Error('API request failed')
      const data: unknown = await response.json()
      if (typeof data !== 'object' || data === null || !('status' in data) || data.status !== 'ok') {
        throw new Error('Unexpected API response')
      }
      setStatus('API is online')
    } catch {
      setStatus('Could not reach the API. Check that the backend is running.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <main>
      <h1>PetCloud</h1>
      <p>Connecting pets with their future families.</p>
      <section aria-labelledby="connection-heading">
        <h2 id="connection-heading">Development starter</h2>
        <button type="button" disabled={checking} onClick={checkApi}>
          {checking ? 'Checking…' : 'Check API connection'}
        </button>
        <p role="status">{status}</p>
      </section>
    </main>
  )
}

export default App
