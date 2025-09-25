/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_AUTH0_DOMAIN: string
  readonly VITE_APP_AUTH0_CLIENT_ID: string
  readonly VITE_APP_AUTH0_REDIRECT_URI: string
  readonly VITE_APP_AUTH0_AUDIENCE: string
  readonly VITE_APP_AUTH0_ORGANIZATION: string
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
