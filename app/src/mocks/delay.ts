/** Simulated network latency so loading states are visible while using mocks. */
const MOCK_DELAY_MS = 400

/** Waits like a network call would; rejects if the caller aborts. */
export function mockDelay(signal?: AbortSignal, ms = MOCK_DELAY_MS): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })
}

/** Current time as an ISO string, used for created/updated timestamps. */
export function nowIso(): string {
  return new Date().toISOString()
}
