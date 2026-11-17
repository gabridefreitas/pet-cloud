import { LoaderCircle, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types'

interface RequireAuthProps {
  /** When set, only users with this role can see the page. */
  role?: UserRole
  children: ReactNode
}

/**
 * Route guard for authenticated pages. Visitors are sent to the login page
 * with a `redirect` back to where they were. This is only a UX guard: the API
 * must still authorize every request.
 */
export function RequireAuth({ role, children }: RequireAuthProps) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="grid place-items-center py-24" role="status">
        <LoaderCircle className="size-8 animate-spin text-brand-500" aria-hidden />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  if (role && user.role !== role) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <ShieldAlert className="size-10 text-brand-400" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold text-brand-900">This area is not available for your account</h1>
        <p className="mt-2 text-sm text-gray-600">
          {role === 'organization_member'
            ? 'Only members of a shelter or NGO can access the organization portal.'
            : 'This page is only available to adopters.'}
        </p>
        <Link to="/adopt" className="mt-6 text-sm font-medium text-brand-600 hover:underline">
          Back to the pets
        </Link>
      </div>
    )
  }

  return children
}
