import type { User } from '../types'

/**
 * Where to go after logging in: the `redirect` query param when it is a safe
 * in-app path, otherwise the user's home area.
 */
export function postLoginPath(redirect: string | null, user: User): string {
  // Only accept relative in-app paths, never "//other-site.com" (open redirect).
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) return redirect
  return user.role === 'organization_member' ? '/organization' : '/adopt'
}
