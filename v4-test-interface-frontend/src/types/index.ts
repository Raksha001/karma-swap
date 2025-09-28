export interface Token {
  address: string
  symbol: string
  decimals: number
  name: string
  logoURI?: string
  chainId?: number
  balance?: bigint
}
