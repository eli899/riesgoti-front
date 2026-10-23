/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  /** Solo desarrollo: contraseña de los usuarios semilla para el selector de perfiles del login. */
  readonly VITE_DEMO_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
