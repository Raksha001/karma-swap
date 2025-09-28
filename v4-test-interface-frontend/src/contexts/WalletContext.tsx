import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '../hooks/useWallet';
import { NetworkConfig } from '../constants/networks';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  network: NetworkConfig | null;
  isMetaMaskInstalled: boolean;
  publicClient: any;
  walletClient: any;
  connectWallet: () => Promise<boolean>;
  switchNetwork: (networkId: number) => Promise<boolean>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();

  // Ensure isMetaMaskInstalled is always a boolean
  const walletContext: WalletContextType = {
    ...wallet,
    isMetaMaskInstalled: wallet.isMetaMaskInstalled ?? false
  };

  return (
    <WalletContext.Provider value={walletContext}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
} 