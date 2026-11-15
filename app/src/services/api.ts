/**
 * HTTP client for the PetCloud API (FastAPI on EC2).
 *
 * A thin `fetch` wrapper, so no extra dependency is needed:
 * - base URL from `VITE_API_URL` (localhost in development, HTTPS EC2 URL in AWS)
 * - injects the JWT as `Authorization: Bearer <token>`
 * - sends JSON bodies, or `FormData` as multipart/form-data
 * - turns network failures, timeouts, and non-2xx responses into `ApiError`
 * - logs server and network failures through the CloudWatch-ready logger
 */
import type { ApiErrorBody } from '../types'
import { logger } from '../utils/logger'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

const DEFAULT_TIMEOUT_MS = 10_000
const TOKEN_STORAGE_KEY = 'petcloud.access_token'

/** Dispatched on `window` when the API answers 401, so the UI can redirect to login. */
export const UNAUTHORIZED_EVENT = 'petcloud:unauthorized'

export class ApiError extends Error {
  /** HTTP status code, or 0 for network failures and timeouts. */
  readonly status: number
  readonly path: string
  readonly detail: ApiErrorBody['detail'] | null

  constructor(message: string, status: number, path: string, detail: ApiErrorBody['detail'] | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.path = path
    this.detail = detail
  }
}

// ---------------------------------------------------------------------------
// Auth token
// ---------------------------------------------------------------------------

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

let authToken = readStoredToken()

export function getAuthToken(): string | null {
  return authToken
}

export function setAuthToken(token: string | null): void {
  authToken = token
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // Storage can be unavailable (private mode); the in-memory token still works.
  }
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

type QueryValue = string | number | boolean | null | undefined | readonly (string | number | boolean)[]
export type QueryParams = Record<string, QueryValue>

export interface RequestOptions {
  query?: QueryParams
  /** Plain objects are sent as JSON; `FormData` is sent as multipart/form-data. */
  body?: unknown
  /** Lets callers cancel the request, e.g. when a component unmounts. */
  signal?: AbortSignal
  timeoutMs?: number
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, String(item)))
    else url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'detail' in value
}

function errorMessage(detail: ApiErrorBody['detail'] | null, status: number): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) return detail[0].msg
  return `Request failed with status ${status}`
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options
  const action = `${method} ${path}`

  const headers = new Headers({ Accept: 'application/json' })
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`)

  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    // The browser sets the multipart Content-Type with its boundary.
    payload = body
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    payload = JSON.stringify(body)
  }

  const signals = [AbortSignal.timeout(timeoutMs)]
  if (signal) signals.push(signal)

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: payload,
      signal: AbortSignal.any(signals),
    })
  } catch (error) {
    // Cancelled by the caller: not a failure worth reporting.
    if (signal?.aborted) throw error
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
    const apiError = new ApiError(
      timedOut ? 'The server took too long to respond.' : 'Could not reach the server. Check your connection.',
      0,
      path,
    )
    logger.error('API request failed', { action, error })
    throw apiError
  }

  if (!response.ok) {
    const errorBody = await readJson(response)
    const detail = isApiErrorBody(errorBody) ? errorBody.detail : null
    const apiError = new ApiError(errorMessage(detail, response.status), response.status, path, detail)

    if (response.status === 401) {
      setAuthToken(null)
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    if (response.status >= 500) {
      logger.error('API server error', { action, error: apiError, data: { status: response.status } })
    } else {
      logger.warn('API request rejected', { action, data: { status: response.status } })
    }
    throw apiError
  }

  if (response.status === 204) return undefined as T
  // Response shapes are trusted to match the API's Pydantic models.
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T = void>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
}

// ---------------------------------------------------------------------------
// S3 uploads
// ---------------------------------------------------------------------------

/**
 * Uploads a file straight to S3 using a presigned PUT URL issued by the API.
 * The API token is deliberately not sent: S3 authorizes via the URL signature.
 * The Content-Type must match the one used when the URL was signed.
 */
export async function uploadToPresignedUrl(uploadUrl: string, file: File, signal?: AbortSignal): Promise<void> {
  let response: Response
  try {
    response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    logger.error('Photo upload failed', { action: 'PUT presigned S3 URL', error })
    throw new ApiError('Could not upload the photo. Check your connection.', 0, 's3')
  }
  if (!response.ok) {
    logger.error('Photo upload rejected', { action: 'PUT presigned S3 URL', data: { status: response.status } })
    throw new ApiError('The photo upload was rejected. Please try again.', response.status, 's3')
  }
}
