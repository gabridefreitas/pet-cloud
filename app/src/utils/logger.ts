/** Local structured logging with optional, fail-safe CloudWatch RUM reporting. */
import { reportBrowserError } from './telemetry'

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
  /** HTTP failures have their own sanitized RUM event; keep their console log local. */
  reportToRum?: boolean
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

/** Random per-tab ID used to group entries from the same visit. */
const sessionId = crypto.randomUUID()

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  try {
    return { name: 'NonError', message: typeof error === 'string' ? error : JSON.stringify(error) ?? String(error) }
  } catch {
    return { name: 'NonError', message: '[Unserializable error]' }
  }
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
  if (level === 'error' && context.reportToRum !== false) reportBrowserError(message, context.error)
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
