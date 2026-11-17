import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { inputClass, labelClass, primaryButtonClass } from '../../components/ui/styles'
import { useAuth } from '../../hooks/useAuth'
import { MOCK_DEMO_ACCOUNTS, MOCK_PASSWORD } from '../../mocks/users'
import { USE_MOCKS } from '../../services/api'
import { postLoginPath } from '../../utils/auth'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const user = await login({ email, password })
      navigate(postLoginPath(redirect, user), { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not log in. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to request adoptions or manage your organization.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className={labelClass}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div>
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        New to PetCloud?{' '}
        <Link
          to={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'}
          className="font-medium text-brand-600 hover:underline"
        >
          Create an account
        </Link>
      </p>

      {USE_MOCKS && (
        <div className="mt-6 rounded-lg bg-brand-50 p-4 text-xs text-brand-900">
          <p className="font-semibold">Demo accounts (mock mode)</p>
          <ul className="mt-2 space-y-1.5">
            {MOCK_DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  className="text-left hover:underline"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(MOCK_PASSWORD)
                  }}
                >
                  {account.label}: {account.email}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Password: <code>{MOCK_PASSWORD}</code>. Click an account to fill the form.
          </p>
        </div>
      )}
    </AuthLayout>
  )
}
