/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CARTO_BASEMAP_KEY?: string;
  readonly VITE_PILOT_SIGNUP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
