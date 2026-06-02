/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NASA_FIRMS_MAP_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
