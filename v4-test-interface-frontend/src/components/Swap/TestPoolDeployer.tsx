import React from 'react';
import styled from 'styled-components';

// Styled components
const DeployerContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundModule};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  font-size: 16px;
  margin: 0 0 12px;
  color: ${({ theme }) => theme.colors.neutral1};
`;

const DeployButton = styled.button`
  background: ${({ theme }) => theme.colors.accentAction};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  width: 100%;
  
  &:hover {
    background: ${({ theme }) => theme.colors.accentActive};
  }
  
  &:disabled {
    background: ${({ theme }) => theme.colors.backgroundInteractive};
    cursor: not-allowed;
  }
`;

const Description = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral2};
  margin: 0 0 12px 0;
`;

interface TestPoolDeployerProps {
  onPoolDeployed: (pool: {
    address: string;
    token0: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
    };
    token1: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
    };
    fee: number;
    hookAddress: string;
  }) => void;
}

export const TestPoolDeployer: React.FC<TestPoolDeployerProps> = ({ onPoolDeployed }) => {
  // Create a test pool that matches the Foundry script parameters
  const useTestPool = () => {
    // From v4-template/script/01_CreatePoolAndMintLiquidity.s.sol
    // These addresses would be from the local Anvil chain
    const hardcodedPool = {
      // This would be created by the script - using a mock address for now
      address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      // From Config.sol - using local test tokens like in Anvil
      token0: {
        address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Local test token
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18
      },
      token1: {
        address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Local test token
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      },
      // From the script
      fee: 3000, // 0.3%
      // From Constants.sol - this would be the hook address or zero address if no hook
      hookAddress: '0x0000000000000000000000000000000000000000'
    };
    
    onPoolDeployed(hardcodedPool);
  };

  return (
    <DeployerContainer>
      <Title>Test Pool</Title>
      <Description>
        Select a pre-configured WETH/USDC test pool to try out the swap functionality.
      </Description>
      <DeployButton onClick={useTestPool}>
        Use Test Pool
      </DeployButton>
    </DeployerContainer>
  );
};

export default TestPoolDeployer; 