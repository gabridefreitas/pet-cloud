import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '../hooks/useAuth'
import { ApiError, getAuthToken, setAuthToken, TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT } from '../services/api'
import * as authService from '../services/auth'
import type { TokenResponse, User } from '../types'

/**
 * Holds the logged-in user for the whole app.
 *
 * On startup, a stored token is validated with `GET /auth/me`. Any 401 from
 * the API (expired or revoked token) clears the session via `UNAUTHORIZED_EVENT`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(() => getAuthToken() !== null)

  const [sessionError, setSessionError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!getAuthToken()) return
    const controller = new AbortController()
    authService
      .getCurrentUser(controller.signal)
      .then(setUser)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          setAuthToken(null)
          setUser(null)
        } else {
          setSessionError(error instanceof Error ? error.message : 'Could not restore your session.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setInitializing(false)
      })
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return
      if (event.key !== TOKEN_STORAGE_KEY && event.key !== null) return
      if (event.newValue === getAuthToken()) return
      // Reload from shared storage to discard the old identity, cached data and
      // in-flight work together. This also handles localStorage.clear().
      window.location.reload()
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    /** Stores the token, then loads the user it belongs to. */
    async function startSession(token: TokenResponse): Promise<User> {
      setAuthToken(token.access_token)
      try {
        const current = await authService.getCurrentUser()
        setUser(current)
        return current
      } catch (error) {
        setAuthToken(null)
        throw error
      }
    }

    return {
      user,
      initializing,
      login: async (input) => startSession(await authService.login(input)),
      register: async (input) => startSession(await authService.register(input)),
      logout: () => {
        setAuthToken(null)
        setUser(null)
      },
    }
  }, [user, initializing])

  if (sessionError) {
    return (
      <div role="alert" className="mx-auto max-w-md space-y-4 px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Could not restore your session</h1>
        <p>{sessionError}</p>
        <button type="button" className="rounded border px-4 py-2" onClick={() => {
          setSessionError(null)
          setInitializing(true)
          setAttempt((current) => current + 1)
        }}>
          Try again
        </button>
        <button type="button" className="ml-3 underline" onClick={() => {
          setAuthToken(null)
          setUser(null)
          setSessionError(null)
        }}>
          Continue as a visitor
        </button>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
