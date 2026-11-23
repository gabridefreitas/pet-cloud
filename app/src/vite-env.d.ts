/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the PetCloud API, e.g. http://localhost:8000 or the HTTPS EC2 URL. */
  readonly VITE_API_URL?: string
  /** Only the literal "true" enables RUM, and only with complete valid configuration. */
  readonly VITE_RUM_ENABLED?: string
  readonly VITE_RUM_APP_MONITOR_ID?: string
  readonly VITE_RUM_REGION?: string
  readonly VITE_RUM_IDENTITY_POOL_ID?: string
  readonly VITE_RUM_APP_VERSION?: string
  /** "true" enables local mocks; otherwise services call the real API. */
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
