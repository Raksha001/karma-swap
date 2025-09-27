import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

const DeployedPoolsContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundModule};
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  height: fit-content;
`

const DeployedPoolsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const DeployedPoolsTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.colors.neutral1};
`

const ClearButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.neutral3};
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  
  &:hover {
    color: ${({ theme }) => theme.colors.neutral2};
    text-decoration: underline;
  }
`

const EmptyState = styled.div`
  color: ${({ theme }) => theme.colors.neutral3};
  font-size: 14px;
  text-align: center;
  padding: 16px 0;
`

const PoolsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
`

const PoolItem = styled.div`
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.backgroundOutline};
  
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSurface};
  }
`

const PoolKeyText = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  word-break: break-all;
  position: relative;
`

const CopyButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.backgroundInteractive};
  border: none;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral2};
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${PoolItem}:hover & {
    opacity: 1;
  }
  
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundOutline};
    color: ${({ theme }) => theme.colors.neutral1};
  }
`

const CopyFeedback = styled.div`
  position: absolute;
  top: -20px;
  right: 0;
  background: ${({ theme }) => theme.colors.backgroundSurface};
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral1};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`

interface DeployedPoolsListProps {
  onSelectPool: (poolKey: string) => void;
}

// LocalStorage key for deployed pools
const DEPLOYED_POOLS_KEY = 'uniswap_v4_deployed_pools';

export function DeployedPoolsList({ onSelectPool }: DeployedPoolsListProps) {
  const [deployedPools, setDeployedPools] = useState<string[]>([]);
  const [copiedPoolKey, setCopiedPoolKey] = useState<string | null>(null);
  
  // Load deployed pools from localStorage on component mount
  useEffect(() => {
    const storedPools = localStorage.getItem(DEPLOYED_POOLS_KEY);
    if (storedPools) {
      try {
        const parsedPools = JSON.parse(storedPools);
        setDeployedPools(parsedPools);
      } catch (error) {
        console.error('Failed to parse stored pools:', error);
      }
    }
  }, []);
  
  const handleClearPools = () => {
    localStorage.removeItem(DEPLOYED_POOLS_KEY);
    setDeployedPools([]);
  };
  
  const handleCopyPoolKey = (e: React.MouseEvent, poolKey: string) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    navigator.clipboard.writeText(poolKey)
      .then(() => {
        setCopiedPoolKey(poolKey);
        setTimeout(() => setCopiedPoolKey(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy pool key:', err);
      });
  };
  
  return (
    <DeployedPoolsContainer>
      <DeployedPoolsHeader>
        <DeployedPoolsTitle>Deployed Pools</DeployedPoolsTitle>
        {deployedPools.length > 0 && (
          <ClearButton onClick={handleClearPools}>Clear All</ClearButton>
        )}
      </DeployedPoolsHeader>
      
      {deployedPools.length === 0 ? (
        <EmptyState>No pools deployed yet</EmptyState>
      ) : (
        <PoolsList>
          {deployedPools.map((poolKey, index) => (
            <PoolItem key={index} onClick={() => onSelectPool(poolKey)}>
              <PoolKeyText>
                {poolKey}
                <CopyButton onClick={(e) => handleCopyPoolKey(e, poolKey)}>
                  Copy
                </CopyButton>
                {copiedPoolKey === poolKey && (
                  <CopyFeedback>Copied!</CopyFeedback>
                )}
              </PoolKeyText>
            </PoolItem>
          ))}
        </PoolsList>
      )}
    </DeployedPoolsContainer>
  );
}

// Helper functions to manage deployed pools in localStorage
export const addDeployedPool = (poolKey: string) => {
  const storedPools = localStorage.getItem(DEPLOYED_POOLS_KEY);
  let pools: string[] = [];
  
  if (storedPools) {
    try {
      pools = JSON.parse(storedPools);
    } catch (error) {
      console.error('Failed to parse stored pools:', error);
    }
  }
  
  // Check if pool already exists
  const poolExists = pools.includes(poolKey);
  if (!poolExists) {
    // Add new pool at the beginning of the array (most recent first)
    pools = [poolKey, ...pools];
    localStorage.setItem(DEPLOYED_POOLS_KEY, JSON.stringify(pools));
  }
  
  return pools;
};

export const getDeployedPools = (): string[] => {
  const storedPools = localStorage.getItem(DEPLOYED_POOLS_KEY);
  if (storedPools) {
    try {
      return JSON.parse(storedPools);
    } catch (error) {
      console.error('Failed to parse stored pools:', error);
    }
  }
  return [];
};