/**
 * Mock users and auth endpoints. Accounts are inspired by the project
 * storyboard: Marina (adopter) and Carlos (NGO member).
 *
 * Mock tokens have the form `mock-token:<user id>`; they are not JWTs and only
 * work while `VITE_USE_MOCKS` is enabled.
 */
import { ApiError, getAuthToken } from '../services/api'
import type { LoginInput, RegisterInput, TokenResponse, User, UserRole } from '../types'
import { mockDelay, nowIso } from './delay'

const SEED_DATE = '2026-10-01T12:00:00Z'

/** Password shared by all demo accounts. */
export const MOCK_PASSWORD = 'petcloud123'

export const mockUsers: User[] = [
  {
    id: 'user-marina',
    email: 'marina@petcloud.example',
    full_name: 'Marina Souza',
    phone: '+1 (555) 201-3344',
    role: 'adopter',
    organization_id: null,
    city: 'Los Angeles',
    state: 'California',
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: 'user-jordan',
    email: 'jordan@petcloud.example',
    full_name: 'Jordan Lee',
    phone: null,
    role: 'adopter',
    organization_id: null,
    city: 'Phoenix',
    state: 'Arizona',
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: 'user-carlos',
    email: 'carlos@happypaws.example',
    full_name: 'Carlos Mendes',
    phone: '+1 (555) 123-4567',
    role: 'organization_member',
    organization_id: 'org-happy-paws',
    city: 'Anytown',
    state: 'California',
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
]

/** Demo accounts listed on the login page while mocks are enabled. */
export const MOCK_DEMO_ACCOUNTS = [
  { label: 'Adopter (Marina)', email: 'marina@petcloud.example' },
  { label: 'Organization (Carlos, Happy Paws)', email: 'carlos@happypaws.example' },
]

const TOKEN_PREFIX = 'mock-token:'

function tokenFor(user: User): TokenResponse {
  return { access_token: `${TOKEN_PREFIX}${user.id}`, token_type: 'bearer' }
}

/**
 * Resolves the logged-in user from the stored token, like the API's auth
 * dependency. Throws 401 when missing and 403 when the role does not match.
 */
export function requireMockUser(role?: UserRole): User {
  const token = getAuthToken()
  const user = token?.startsWith(TOKEN_PREFIX)
    ? mockUsers.find((candidate) => candidate.id === token.slice(TOKEN_PREFIX.length))
    : undefined
  if (!user) throw new ApiError('Please log in to continue.', 401, '/auth/me')
  if (role && user.role !== role) throw new ApiError('You do not have access to this action.', 403, '/auth/me')
  return user
}

/** Mock of `POST /auth/login`. */
export async function mockLogin(input: LoginInput, signal?: AbortSignal): Promise<TokenResponse> {
  await mockDelay(signal)
  const user = mockUsers.find((candidate) => candidate.email === input.email.trim().toLowerCase())
  if (!user || input.password !== MOCK_PASSWORD) {
    throw new ApiError('Invalid email or password.', 401, '/auth/login')
  }
  return tokenFor(user)
}

/** Mock of `POST /auth/register`. New accounts are always adopters. */
export async function mockRegister(input: RegisterInput, signal?: AbortSignal): Promise<TokenResponse> {
  await mockDelay(signal)
  const email = input.email.trim().toLowerCase()
  if (mockUsers.some((user) => user.email === email)) {
    throw new ApiError('An account with this email already exists.', 409, '/auth/register')
  }
  const timestamp = nowIso()
  const user: User = {
    id: `user-${crypto.randomUUID()}`,
    email,
    full_name: input.full_name.trim(),
    phone: null,
    role: 'adopter',
    organization_id: null,
    city: null,
    state: null,
    created_at: timestamp,
    updated_at: timestamp,
  }
  mockUsers.push(user)
  return tokenFor(user)
}

/** Mock of `GET /auth/me`. */
export async function mockGetCurrentUser(signal?: AbortSignal): Promise<User> {
  await mockDelay(signal, 150)
  return structuredClone(requireMockUser())
}
