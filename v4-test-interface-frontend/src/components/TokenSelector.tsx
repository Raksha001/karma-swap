import { Token } from '../types'
import { TextField, Box } from '@mui/material'
import { isAddress } from 'viem'
import { ChangeEvent } from 'react'

interface TokenSelectorProps {
  value?: Token
  onChange: (token: Token) => void
  error?: string
}

export function TokenSelector({ value, onChange, error }: TokenSelectorProps) {
  const handleAddressChange = (address: string) => {
    if (isAddress(address)) {
      onChange({
        address,
        symbol: '', // You might want to fetch this from a token list or contract
        decimals: 18, // You might want to fetch this from the contract
        name: '', // You might want to fetch this from a token list or contract
      })
    }
  }

  return (
    <Box>
      <TextField
        fullWidth
        value={value?.address || ''}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleAddressChange(e.target.value)}
        error={!!error}
        helperText={error}
        placeholder="0x..."
      />
      {value && (
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            value={value.symbol}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...value, symbol: e.target.value })}
            placeholder="Token Symbol"
          />
          <TextField
            fullWidth
            sx={{ mt: 1 }}
            value={value.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...value, name: e.target.value })}
            placeholder="Token Name"
          />
        </Box>
      )}
    </Box>
  )
} 