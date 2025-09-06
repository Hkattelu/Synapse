/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FEATURE_ADVANCED_UI?: string;
  readonly VITE_SHOW_FPS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
