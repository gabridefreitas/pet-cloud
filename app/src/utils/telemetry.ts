/** Optional browser telemetry. Disabled/incomplete configuration never loads the AWS SDK. */
import type { AwsRum } from 'aws-rum-web'

type RumClient = Pick<AwsRum, 'recordError' | 'recordEvent' | 'disable'>
type PendingEvent = { error: Error } | { http: object }

let client: RumClient | null = null
let initialization: Promise<void> | null = null
let acceptingEvents = false
const pending: PendingEvent[] = []
const reportedErrors = new WeakSet<object>()
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'

function safeUrl(value: string): string {
  try {
    const url = new URL(value, window.location.origin)
    // Query strings/fragments can contain search text, credentials or signed URLs.
    return `${url.origin}${url.pathname.replace(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi, ':id')}`
  } catch {
    return '[unavailable]'
  }
}

function send(event: PendingEvent): void {
  if (!client) {
    // Bound the startup queue; telemetry never delays React rendering.
    if (acceptingEvents && pending.length < 20) pending.push(event)
    return
  }
  try {
    if ('error' in event) client.recordError(event.error)
    else client.recordEvent('com.amazon.rum.http_event', event.http)
  } catch {
    try { client.disable() } catch { /* Monitoring must never break the app. */ }
    client = null
    acceptingEvents = false
    pending.length = 0
    console.warn('Browser telemetry unavailable; local logging remains active.')
  }
}

export function initializeTelemetry(): Promise<void> {
  if (initialization) return initialization
  if (import.meta.env.VITE_RUM_ENABLED !== 'true') return Promise.resolve()

  const monitorId = import.meta.env.VITE_RUM_APP_MONITOR_ID?.trim() ?? ''
  const region = import.meta.env.VITE_RUM_REGION?.trim() ?? ''
  const poolId = import.meta.env.VITE_RUM_IDENTITY_POOL_ID?.trim() ?? ''
  const poolUuid = poolId.slice(region.length + 1)
  if (!UUID_PATTERN.test(monitorId) || monitorId === EMPTY_UUID ||
      !/^[a-z]{2}(?:-[a-z]+)+-\d+$/.test(region) ||
      !poolId.startsWith(`${region}:`) || !UUID_PATTERN.test(poolUuid) || poolUuid === EMPTY_UUID) {
    console.warn('RUM is enabled but its monitor/region/identity configuration is incomplete or invalid; telemetry stays off.')
    return Promise.resolve()
  }

  acceptingEvents = true
  initialization = import('aws-rum-web').then(({ AwsRum }) => {
    client = new AwsRum(monitorId, import.meta.env.VITE_RUM_APP_VERSION?.trim() || '0.1.0', region, {
      identityPoolId: poolId,
      endpoint: `https://dataplane.rum.${region}.${region.startsWith('cn-') ? 'amazonaws.com.cn' : 'amazonaws.com'}`,
      allowCookies: false,
      disableAutoPageView: true,
      recordResourceUrl: false,
      enableXRay: false,
      // Our logger handles global/React errors and the API client handles HTTP
      // failures. Disable automatic capture to avoid duplicates and raw URLs.
      telemetries: [['errors', { ignore: () => true }]],
    })
    for (const event of pending.splice(0)) send(event)
  }).catch(() => {
    client = null
    acceptingEvents = false
    pending.length = 0
    console.warn('Browser telemetry could not start; local logging remains active.')
  })
  return initialization
}

/** Forward a handled/global error once, without sending arbitrary messages or context. */
export function reportBrowserError(label: string, error: unknown): void {
  if (error instanceof Object) {
    if (reportedErrors.has(error)) return
    reportedErrors.add(error)
  }
  const safe = new Error(label)
  if (error instanceof Error) {
    safe.name = /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(error.name) ? error.name : 'Error'
    const frames = error.stack?.split('\n').slice(1, 21).join('\n') ?? ''
    safe.stack = `${safe.name}: ${label}\n${frames.replace(/https?:\/\/[^\s)]+/g, safeUrl)}`
  }
  send({ error: safe })
}

/** Record API failures without request bodies, headers, query values or response details. */
export function reportHttpFailure(error: Error, method: string, url: string, status: number): void {
  if (reportedErrors.has(error)) return
  reportedErrors.add(error)
  send({ http: {
    version: '1.0.0',
    request: { method, url: safeUrl(url) },
    ...(status > 0 ? { response: { status } } : {
      error: { version: '1.0.0', type: 'NetworkError', message: 'API connection failed or timed out.' },
    }),
  } })
}
