import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { SUPPORTED_NETWORKS } from '../../constants/networks'
import { useWallet } from '../../hooks/useWallet'
import { toast } from 'react-toastify'

const Container = styled.div`
  position: relative;
`

const Select = styled.select`
  appearance: none;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 14px;
  cursor: pointer;
  outline: none;
  min-width: 120px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent1};
  }
`

const NetworkOption = styled.option`
  padding: 8px;
`

interface NetworkSelectorProps {
  className?: string;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ className }) => {
  const { chainId, switchNetwork, isConnected } = useWallet()
  const [selectedNetwork, setSelectedNetwork] = useState<number>(chainId || SUPPORTED_NETWORKS[0].id)
  const [isChangingNetwork, setIsChangingNetwork] = useState(false)

  // Update the selected network when chainId changes
  useEffect(() => {
    if (chainId) {
      setSelectedNetwork(chainId)
    }
  }, [chainId])

  const handleNetworkChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const networkId = Number(e.target.value)
    
    if (!isConnected) {
      toast.warning('Please connect your wallet first')
      return
    }
    
    if (networkId === chainId) {
      return // Already on this network
    }

    setIsChangingNetwork(true)
    
    try {
      console.log('Switching to network:', networkId)
      await switchNetwork(networkId)
      toast.success(`Switched to ${SUPPORTED_NETWORKS.find(n => n.id === networkId)?.name}`)
    } catch (error) {
      console.error('Failed to switch network:', error)
      toast.error('Failed to switch network. Please try again.')
      // Reset to current chainId if switch failed
      if (chainId) {
        setSelectedNetwork(chainId)
      }
    } finally {
      setIsChangingNetwork(false)
    }
  }

  // Filter to only show supported networks
  const availableNetworks = SUPPORTED_NETWORKS.filter(network => 
    Object.keys(network).length > 0 && network.id
  )

  return (
    <Container className={className}>
      <Select
        value={selectedNetwork}
        onChange={handleNetworkChange}
        disabled={isChangingNetwork || !isConnected}
      >
        {availableNetworks.map((network) => (
          <NetworkOption key={network.id} value={network.id}>
            {network.name}
          </NetworkOption>
        ))}
      </Select>
    </Container>
  )
}