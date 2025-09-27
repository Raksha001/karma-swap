import React, { useState } from 'react'
import styled from 'styled-components'
import { Pool } from '../../hooks/useV4Swap'
import { ArrowDown } from '../shared/icons'

const PoolSelectorContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const PoolButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  border-radius: 16px;
  cursor: pointer;
  width: 100%;
  
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundModule};
  }
`

const PoolInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`

const PoolTitle = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral1};
`

const PoolDetails = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
`

const PoolPlaceholder = styled.span`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.neutral3};
`

const ArrowContainer = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.neutral3};
`

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 20px;
  width: 90%;
  max-width: 420px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
`

const ModalTitle = styled.h2`
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.colors.neutral1};
`

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.neutral3};
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  
  &:hover {
    color: ${({ theme }) => theme.colors.neutral2};
  }
`

const PoolsList = styled.div`
  overflow-y: auto;
  max-height: 60vh;
  padding: 8px 0;
`

const PoolItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundInteractive};
  }
  
  &:last-child {
    border-bottom: none;
  }
`

const PoolItemTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral1};
  margin-bottom: 4px;
`

const PoolItemDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const PoolItemDetail = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
  display: flex;
  align-items: center;
  gap: 4px;
`

const DetailLabel = styled.span`
  color: ${({ theme }) => theme.colors.neutral3};
`

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.accentFailure};
  font-size: 14px;
  margin-top: 4px;
`

const LoadingMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: ${({ theme }) => theme.colors.neutral2};
`

interface PoolSelectorProps {
  selectedPool: Pool | null
  availablePools: Pool[]
  onSelectPool: (pool: Pool) => void
  isLoading: boolean
  error?: string
}

export function PoolSelector({ 
  selectedPool, 
  availablePools, 
  onSelectPool, 
  isLoading, 
  error 
}: PoolSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const formatFee = (fee: number) => {
    return `${(fee / 10000).toFixed(2)}%`
  }
  
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }
  
  const handleSelectPool = (pool: Pool) => {
    onSelectPool(pool)
    setIsModalOpen(false)
  }
  
  return (
    <PoolSelectorContainer>
      <PoolButton onClick={() => setIsModalOpen(true)}>
        {selectedPool ? (
          <PoolInfo>
            <PoolTitle>
              {selectedPool.token0.symbol}/{selectedPool.token1.symbol} Pool
            </PoolTitle>
            <PoolDetails>
              Fee: {formatFee(selectedPool.fee)} • 
              {selectedPool.hookAddress !== '0x0000000000000000000000000000000000000000' && 
                ` Hooked • `}
              {formatAddress(selectedPool.address)}
            </PoolDetails>
          </PoolInfo>
        ) : (
          <PoolPlaceholder>Select a pool</PoolPlaceholder>
        )}
        <ArrowContainer>
          <ArrowDown size={16} />
        </ArrowContainer>
      </PoolButton>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {isModalOpen && (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Select a pool</ModalTitle>
              <CloseButton onClick={() => setIsModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            
            <PoolsList>
              {isLoading ? (
                <LoadingMessage>Loading pools...</LoadingMessage>
              ) : availablePools.length > 0 ? (
                availablePools.map((pool, index) => (
                  <PoolItem key={index} onClick={() => handleSelectPool(pool)}>
                    <PoolItemTitle>
                      {pool.token0.symbol}/{pool.token1.symbol} Pool
                    </PoolItemTitle>
                    <PoolItemDetails>
                      <PoolItemDetail>
                        <DetailLabel>Fee:</DetailLabel> {formatFee(pool.fee)}
                      </PoolItemDetail>
                      <PoolItemDetail>
                        <DetailLabel>Address:</DetailLabel> {formatAddress(pool.address)}
                      </PoolItemDetail>
                      {pool.hookAddress !== '0x0000000000000000000000000000000000000000' && (
                        <PoolItemDetail>
                          <DetailLabel>Hook:</DetailLabel> {formatAddress(pool.hookAddress)}
                        </PoolItemDetail>
                      )}
                    </PoolItemDetails>
                  </PoolItem>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                  No pools found for these tokens
                </div>
              )}
            </PoolsList>
          </ModalContent>
        </ModalOverlay>
      )}
    </PoolSelectorContainer>
  )
} 