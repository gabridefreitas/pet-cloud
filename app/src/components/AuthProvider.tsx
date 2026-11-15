import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '../hooks/useAuth'
import { getAuthToken, setAuthToken, UNAUTHORIZED_EVENT } from '../services/api'
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

  useEffect(() => {
    if (!getAuthToken()) return
    const controller = new AbortController()
    authService
      .getCurrentUser(controller.signal)
      .then(setUser)
      .catch(() => {
        // Invalid or expired token: continue as a visitor.
        if (!controller.signal.aborted) setAuthToken(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setInitializing(false)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
