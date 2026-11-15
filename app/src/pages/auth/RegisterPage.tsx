import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { inputClass, labelClass, primaryButtonClass } from '../../components/ui/styles'
import { useAuth } from '../../hooks/useAuth'
import { postLoginPath } from '../../utils/auth'
import { AuthLayout } from './AuthLayout'

const MIN_PASSWORD_LENGTH = 8

/** Sign-up for adopters. Organization accounts are created by the PetCloud team. */
export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`The password must have at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const user = await register({ full_name: fullName, email, password })
      navigate(postLoginPath(redirect, user), { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the account. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Sign up to send adoption requests and follow their progress.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="register-name" className={labelClass}>
            Full name
          </label>
          <input
            id="register-name"
            autoComplete="name"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div>
          <label htmlFor="register-email" className={labelClass}>
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>
        <div>
          <label htmlFor="register-password" className={labelClass}>
            Password
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${inputClass} mt-1.5`}
            aria-describedby="register-password-hint"
          />
          <p id="register-password-hint" className="mt-1 text-xs text-gray-500">
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}
          className="font-medium text-brand-600 hover:underline"
        >
          Log in
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-gray-500">
        Shelter or NGO? Contact the PetCloud team to get an organization account.
      </p>
    </AuthLayout>
  )
}
