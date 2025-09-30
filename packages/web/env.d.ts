/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_APP_API_AUTH: string
  readonly VITE_APP_API_BASE: string
  readonly VITE_APP_QUESTION_POLLING_INTERVAL_MS: string
  readonly VITE_APP_QUESTION_MAX_POLLING_INTERVAL: string

  // Cyoda Client Configuration
  readonly VITE_APP_CYODA_CLIENT_HOST: string
  readonly VITE_APP_CYODA_CLIENT_ENV_PREFIX: string

  // Auth0 Configuration
  readonly VITE_APP_AUTH0_DOMAIN: string
  readonly VITE_APP_AUTH0_CLIENT_ID: string
  readonly VITE_APP_AUTH0_REDIRECT_URI: string
  readonly VITE_APP_AUTH0_AUDIENCE: string
  readonly VITE_APP_AUTH0_ORGANIZATION: string

  // Electron flag
  readonly VITE_IS_ELECTRON: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
