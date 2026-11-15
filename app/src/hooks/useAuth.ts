import { createContext, useContext } from 'react'
import type { LoginInput, RegisterInput, User } from '../types'

export interface AuthContextValue {
  /** Logged-in user, or null for visitors. */
  user: User | null
  /** True while the stored token is being checked at startup. */
  initializing: boolean
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Current auth state and actions. Must be used inside `<AuthProvider>`. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
