/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for REST and WebSocket calls, e.g. http://localhost:3005 or https://example.kz/api */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
