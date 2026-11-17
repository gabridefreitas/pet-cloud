import { useEffect, useRef, useState } from 'react'

interface AsyncResult<T> {
  /** The request this result answers, used to tell whether it is current. */
  key: string
  attempt: number
  data: T | null
  error: string | null
}

/**
 * Runs `load` whenever `key` changes and exposes loading/error/data states.
 *
 * - `key` identifies the request (e.g. a serialized filter object or an ID);
 *   `load` always uses the latest closure, so it does not need to be memoized.
 * - The previous request is aborted when the key changes or on unmount.
 * - While a new request runs, the previous `data` is kept to avoid flashing.
 * - `reload()` repeats the request, e.g. after a mutation or an error.
 */
export function useAsyncData<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const loadRef = useRef(load)
  const [result, setResult] = useState<AsyncResult<T> | null>(null)
  const [attempt, setAttempt] = useState(0)

  // Keep the latest `load` without re-running the request on every render.
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    const controller = new AbortController()

    loadRef.current(controller.signal)
      .then((data) => setResult({ key, attempt, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Something went wrong.'
        setResult({ key, attempt, data: null, error: message })
      })

    return () => controller.abort()
  }, [key, attempt])

  const loading = result?.key !== key || result.attempt !== attempt

  return {
    data: result?.data ?? null,
    loading,
    error: loading ? null : (result?.error ?? null),
    reload: () => setAttempt((value) => value + 1),
  }
}
