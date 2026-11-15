/**
 * Structured browser logger.
 *
 * Every entry is a flat JSON object (timestamp, level, route, action, error)
 * ready for CloudWatch Logs. Entries are always written to the console; when
 * `VITE_LOG_ENDPOINT` is set, `error` entries are also POSTed there (for
 * example, an API route that forwards them to CloudWatch). CloudWatch RUM can
 * be added later without changing call sites.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface SerializedError {
  name: string
  message: string
  stack?: string
}

export interface LogContext {
  /** What the user or app was doing, e.g. "GET /pets" or "submit adoption request". */
  action?: string
  error?: unknown
  /** Extra non-sensitive details. Never include tokens, passwords, or personal data. */
  data?: Record<string, unknown>
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  app: 'petcloud-web'
  environment: string
  session_id: string
  route: string
  user_agent: string
  action?: string
  error?: SerializedError
  data?: Record<string, unknown>
}

const LOG_ENDPOINT = import.meta.env.VITE_LOG_ENDPOINT?.trim() ?? ''
const SHIPPED_LEVELS: ReadonlySet<LogLevel> = new Set(['error'])

/** Random per-tab ID used to group entries from the same visit. */
const sessionId = crypto.randomUUID()

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  return { name: 'NonError', message: typeof error === 'string' ? error : JSON.stringify(error) }
}

function ship(entry: LogEntry): void {
  if (!LOG_ENDPOINT || !SHIPPED_LEVELS.has(entry.level)) return
  // Plain fetch (not the API client) so a failing log call can never recurse.
  // `keepalive` lets the request finish even if the page is closing.
  fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
    keepalive: true,
  }).catch(() => {
    // Logging must never break the app.
  })
}

function log(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    app: 'petcloud-web',
    environment: import.meta.env.MODE,
    session_id: sessionId,
    route: window.location.pathname,
    user_agent: navigator.userAgent,
    ...(context.action && { action: context.action }),
    ...(context.error !== undefined && { error: serializeError(context.error) }),
    ...(context.data && { data: context.data }),
  }

  if (level === 'error' || level === 'warn' || import.meta.env.DEV) {
    console[level](`[${level}] ${message}`, entry)
  }
  ship(entry)
  return entry
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
}

let globalHandlersInstalled = false

/** Captures uncaught errors and unhandled promise rejections. Call once at startup. */
export function installGlobalErrorHandlers(): void {
  if (globalHandlersInstalled) return
  globalHandlersInstalled = true

  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', { action: 'window.error', error: event.error ?? event.message })
  })
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      action: 'window.unhandledrejection',
      error: event.reason,
    })
  })
}
