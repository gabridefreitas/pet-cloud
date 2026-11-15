/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the PetCloud API, e.g. http://localhost:8000 or the HTTPS EC2 URL. */
  readonly VITE_API_URL?: string
  /** Optional endpoint that receives browser error logs as JSON. Empty disables it. */
  readonly VITE_LOG_ENDPOINT?: string
  /** "false" loads pets from the API; any other value uses local mock data. */
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
