import { useState, useEffect } from 'react'
import { useWallet } from './useWallet'
import { formatUnits } from 'viem'
import { useDebounce } from 'use-debounce'

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
] as const

export function useBalance(tokenAddress?: string) {

  const [debouncedAddress] = useDebounce(tokenAddress, 500);
  const [balance, setBalance] = useState<string>('')
  const { publicClient, address } = useWallet()

  useEffect(() => {
    if (!publicClient || !address) {
      setBalance('')
      return
    }

    const fetchBalance = async () => {
      try {
        // Handle native ETH
        if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
          const balance = await publicClient.getBalance({
            address: address as `0x${string}`
          })
          setBalance(formatUnits(balance, 18))
          return
        }

        // Handle ERC20 tokens
        const [balanceResult, decimalsResult] = await Promise.all([
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          }),
          publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }),
        ])

        const formattedBalance = formatUnits(
          balanceResult as bigint,
          decimalsResult as number
        )
        setBalance(formattedBalance)
      } catch (err) {
        console.error('Error fetching balance:', err)
        setBalance('')
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 150000) // Refresh every 15 seconds

    return () => clearInterval(interval)
  }, [publicClient, debouncedAddress, tokenAddress])

  return { balance }
}
