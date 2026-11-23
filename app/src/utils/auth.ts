import type { User } from '../types'

/**
 * Organization members always go to their dashboard. Adopters can return to
 * a safe in-app redirect, otherwise they go to the catalog.
 */
export function postLoginPath(redirect: string | null, user: User): string {
  if (user.role === 'organization_member') return '/organization'

  // Only accept relative in-app paths, never "//other-site.com" (open redirect).
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) return redirect
  return '/adopt'
}
