import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Token } from '../../types'
import { Search, X } from '../shared/icons'
import { TOKENS_LIST } from '../../constants/tokens'
import { useWallet } from '../../hooks/useWallet'

interface TokenModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectToken: (token: Token) => void
  chainId: number
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSurface};
  border-radius: 20px;
  width: 420px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.2);
  background-color: #191B1F;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
`

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral1};
`

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.neutral2};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${({ theme }) => theme.colors.neutral1};
  }
`

const SearchContainer = styled.div`
  padding: 16px 20px 8px;
  position: relative;
`

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 40px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  background: ${({ theme }) => theme.colors.backgroundModule};
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accentAction};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral3};
  }
`

const SearchIcon = styled(Search)`
  position: absolute;
  left: 36px;
  top: 28px;
  color: ${({ theme }) => theme.colors.neutral3};
  width: 20px;
  height: 20px;
`

const SectionHeader = styled.div`
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  background-color: #191B1F;
`

const CommonTokensContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  background-color: #191B1F;
`

const CommonTokenButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.backgroundModule};
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  border-radius: 16px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundInteractive};
  }
`

const CommonTokenLogo = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  margin-right: 8px;
`

const CommonTokenSymbol = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral1};
`

const TokenList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  max-height: 300px;
  background-color: #191B1F;
`

const TokenItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  background-color: #191B1F;
  
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundInteractive};
  }
`

const TokenLogo = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  object-fit: contain;
`

const TokenLogoFallback = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.neutral2};
  font-size: 16px;
`

const TokenDetails = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 12px;
  flex: 1;
`

const TokenSymbol = styled.span`
  color: ${({ theme }) => theme.colors.neutral1};
  font-size: 16px;
  font-weight: 500;
`

const TokenName = styled.span`
  color: ${({ theme }) => theme.colors.neutral2};
  font-size: 14px;
`

export const TokenModal: React.FC<TokenModalProps> = ({ isOpen, onClose, onSelectToken, chainId }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  
  // Common tokens to show at the top
  const commonTokenSymbols = ['ETH', 'USDC']
  
  const [commonTokens, setCommonTokens] = useState<Token[]>([])
  
  useEffect(() => {
    // Filter tokens by current chainId
    const tokens: Token[] = TOKENS_LIST.filter(token => 
      // If chainId is available, filter by it, otherwise show all tokens
      chainId ? token.chainId === chainId : true
    )
    
    // Find common tokens
    const common = tokens.filter(token => commonTokenSymbols.includes(token.symbol))
    // Sort common tokens by their order in commonTokenSymbols
    common.sort((a, b) => {
      return commonTokenSymbols.indexOf(a.symbol) - commonTokenSymbols.indexOf(b.symbol)
    })
    setCommonTokens(common)
    
    // Filter tokens based on search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = tokens.filter(token => 
        token.symbol.toLowerCase().includes(query) || 
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
      )
      setFilteredTokens(filtered)
    } else {
      // For the main list, show all tokens sorted alphabetically
      const allTokens = [...tokens].sort((a, b) => a.symbol.localeCompare(b.symbol))
      setFilteredTokens(allTokens)
    }
  }, [searchQuery, chainId])
  
  if (!isOpen) return null
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Select a token</ModalTitle>
          <CloseButton onClick={onClose}>
            <X width={24} height={24} />
          </CloseButton>
        </ModalHeader>
        
        <SearchContainer>
          <SearchIcon />
          <SearchInput 
            placeholder="Search tokens"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
        </SearchContainer>
        
        {/* Common tokens */}
        <SectionHeader>Common tokens</SectionHeader>
          <CommonTokensContainer>
            {commonTokens.map(token => (
              <CommonTokenButton 
                key={token.address}
                onClick={() => {
                  onSelectToken(token)
                  onClose()
                }}
              >
                {token.logoURI ? (
                  <CommonTokenLogo src={token.logoURI} alt={token.symbol} />
                ) : (
                  <span style={{ width: '24px', height: '24px', marginRight: '8px' }}>{token.symbol[0]}</span>
                )}
                <CommonTokenSymbol>{token.symbol}</CommonTokenSymbol>
              </CommonTokenButton>
            ))}
          </CommonTokensContainer>
        
        {/* List of Tokens in the selected network */}
        <SectionHeader>All Tokens</SectionHeader>
        <TokenList>
          {filteredTokens.length > 0 ? (
            filteredTokens.map(token => (
              <TokenItem 
                key={token.address} 
                onClick={() => {
                  onSelectToken(token)
                  onClose()
                }}
              >
                {token.logoURI ? (
                  <TokenLogo src={token.logoURI} alt={token.symbol} />
                ) : (
                  <TokenLogoFallback>{token.symbol[0]}</TokenLogoFallback>
                )}
                <TokenDetails>
                  <TokenSymbol>{token.symbol}</TokenSymbol>
                  <TokenName>{token.name}</TokenName>
                </TokenDetails>
              </TokenItem>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#8F96AC' }}>
              No tokens found for this network.
            </div>
          )}
        </TokenList>
      </ModalContent>
    </ModalOverlay>
  )
}
