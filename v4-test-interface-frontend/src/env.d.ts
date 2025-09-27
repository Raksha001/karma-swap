/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INFURA_KEY: string
  readonly VITE_MAINNET_RPC_URL: string
  readonly VITE_GOERLI_RPC_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
