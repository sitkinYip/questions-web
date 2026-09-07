/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PUBLIC_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_BUILD__: import("../scripts/build-info").BuildInfo;
