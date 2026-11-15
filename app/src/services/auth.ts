/**
 * Authentication endpoints. The API issues a JWT on login/register; the client
 * stores it via `setAuthToken` and sends it as `Authorization: Bearer <token>`.
 */
import { mockGetCurrentUser, mockLogin, mockRegister } from '../mocks/users'
import type { LoginInput, RegisterInput, TokenResponse, User } from '../types'
import { api, USE_MOCKS } from './api'

/** `POST /auth/login` — exchanges email and password for an access token. */
export function login(input: LoginInput, signal?: AbortSignal): Promise<TokenResponse> {
  if (USE_MOCKS) return mockLogin(input, signal)
  return api.post<TokenResponse>('/auth/login', input, { signal })
}

/** `POST /auth/register` — creates an adopter account and returns an access token. */
export function register(input: RegisterInput, signal?: AbortSignal): Promise<TokenResponse> {
  if (USE_MOCKS) return mockRegister(input, signal)
  return api.post<TokenResponse>('/auth/register', input, { signal })
}

/** `GET /auth/me` — the user that owns the current token. */
export function getCurrentUser(signal?: AbortSignal): Promise<User> {
  if (USE_MOCKS) return mockGetCurrentUser(signal)
  return api.get<User>('/auth/me', { signal })
}
