/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_USER?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}