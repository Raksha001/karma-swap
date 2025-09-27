import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { SUPPORTED_NETWORKS, NetworkConfig } from '../constants/networks'

interface WalletState {
  address: string | null
  isConnected: boolean
  chainId: number | null
  network: NetworkConfig | null
  isMetaMaskInstalled: boolean
}

// Create a global state for wallet that can be accessed across components
let globalWalletState = {
  address: null as string | null,
  isConnected: false,
  chainId: null as number | null,
  network: null as NetworkConfig | null,
  isMetaMaskInstalled: false,
  publicClient: null as any,
  walletClient: null as any,
}

// Create a list of update listeners
const listeners: (() => void)[] = [];

// Function to update the global state and notify listeners
function updateGlobalWalletState(updates: Partial<typeof globalWalletState>) {
  globalWalletState = { ...globalWalletState, ...updates };
  // Notify all listeners about the state change
  listeners.forEach(listener => listener());
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: globalWalletState.address,
    isConnected: globalWalletState.isConnected,
    chainId: globalWalletState.chainId,
    network: globalWalletState.network,
    isMetaMaskInstalled: globalWalletState.isMetaMaskInstalled
  })

  const [publicClient, setPublicClient] = useState<any>(globalWalletState.publicClient)
  const [walletClient, setWalletClient] = useState<any>(globalWalletState.walletClient)

  // Check if MetaMask is installed
  const checkIfMetaMaskIsInstalled = useCallback(() => {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' && 
           window.ethereum.isMetaMask;
  }, []);

  // Update local state when global state changes
  useEffect(() => {
    const handleStateChange = () => {
      setState({
        address: globalWalletState.address,
        isConnected: globalWalletState.isConnected,
        chainId: globalWalletState.chainId,
        network: globalWalletState.network,
        isMetaMaskInstalled: globalWalletState.isMetaMaskInstalled
      });
      setPublicClient(globalWalletState.publicClient);
      setWalletClient(globalWalletState.walletClient);
    };
    
    // Add listener
    listeners.push(handleStateChange);
    
    // Return cleanup function
    return () => {
      const index = listeners.indexOf(handleStateChange);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  // Initialize wallet connection
  useEffect(() => {
    const isMetaMaskInstalled = checkIfMetaMaskIsInstalled();
    updateGlobalWalletState({ isMetaMaskInstalled });
    
    if (!isMetaMaskInstalled) {
      console.warn('MetaMask is not installed');
      return;
    }

    const initializeWallet = async () => {
      try {
        // Check if already connected
        const accounts = await window.ethereum!.request({ method: 'eth_accounts' });
        const isConnected = accounts && accounts.length > 0;
        
        // Get current chainId
        const chainId = await window.ethereum!.request({ method: 'eth_chainId' });
        const networkId = parseInt(chainId, 16);
        const network = SUPPORTED_NETWORKS.find(n => n.id === networkId);

        // Create public client for reading from the blockchain
        if (network) {
          const public_client = createPublicClient({
            transport: http(network.rpcUrl),
          });
          updateGlobalWalletState({ publicClient: public_client });
        }

        // Create wallet client for sending transactions
        if (isConnected) {
          const wallet_client = createWalletClient({
            transport: custom(window.ethereum!),
          });
          updateGlobalWalletState({ walletClient: wallet_client });
        }

        // Update state
        updateGlobalWalletState({
          address: isConnected ? accounts[0] : null,
          isConnected,
          chainId: networkId,
          network: network || null,
        });
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      }
    };

    initializeWallet();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('connect', handleConnect);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum!.removeListener('chainChanged', handleChainChanged);
        window.ethereum!.removeListener('connect', handleConnect);
        window.ethereum!.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [checkIfMetaMaskIsInstalled]);

  const handleConnect = (connectInfo: { chainId: string }) => {
    console.log('MetaMask connected:', connectInfo);
  };

  const handleDisconnect = (error: { code: number; message: string }) => {
    console.log('MetaMask disconnected:', error);
    updateGlobalWalletState({
      isConnected: false,
      address: null
    });
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      updateGlobalWalletState({
        address: null,
        isConnected: false,
      });
    } else {
      // User switched accounts
      updateGlobalWalletState({
        address: accounts[0],
        isConnected: true,
      });
    }
  };

  const handleChainChanged = (chainId: string) => {
    const networkId = parseInt(chainId, 16);
    const network = SUPPORTED_NETWORKS.find(n => n.id === networkId);
    
    updateGlobalWalletState({
      chainId: networkId,
      network: network || null,
    });

    // Update public client with new RPC URL
    if (network) {
      const public_client = createPublicClient({
        transport: http(network.rpcUrl),
      });
      updateGlobalWalletState({ publicClient: public_client });
    }
    
    // Reload the page to avoid any inconsistent state
    window.location.reload();
  };

  const connectWallet = async () => {
    if (!checkIfMetaMaskIsInstalled()) {
      throw new Error('MetaMask is not installed');
    }
    
    try {
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      });

      // Get current chainId after connection
      const chainId = await window.ethereum!.request({ method: 'eth_chainId' });
      const networkId = parseInt(chainId, 16);
      const network = SUPPORTED_NETWORKS.find(n => n.id === networkId);
      
      // Create wallet client
      const wallet_client = createWalletClient({
        transport: custom(window.ethereum!),
      });
      updateGlobalWalletState({ walletClient: wallet_client });

      updateGlobalWalletState({
        address: accounts[0],
        isConnected: true,
        chainId: networkId,
        network: network || null,
      });

      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const switchNetwork = async (networkId: number) => {
    if (!checkIfMetaMaskIsInstalled()) {
      throw new Error('MetaMask is not installed');
    }
    
    try {
      // First check if the network exists in our supported networks
      const targetNetwork = SUPPORTED_NETWORKS.find(n => n.id === networkId);
      if (!targetNetwork) {
        throw new Error(`Network with ID ${networkId} is not supported`);
      }
      
      console.log(`Attempting to switch to network: ${targetNetwork.name} (${networkId})`);
      
      try {
        // Try to switch to the network
        await window.ethereum!.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${networkId.toString(16)}` }],
        });
        
        // Update state immediately instead of waiting for chainChanged event
        const network = SUPPORTED_NETWORKS.find(n => n.id === networkId);
        if (network) {
          const public_client = createPublicClient({
            transport: http(network.rpcUrl),
          });
          
          updateGlobalWalletState({
            chainId: networkId,
            network,
            publicClient: public_client
          });
        }
        
        return true;
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          console.log('Network not found in wallet, attempting to add it');
          
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${networkId.toString(16)}`,
              chainName: targetNetwork.name,
              nativeCurrency: targetNetwork.nativeCurrency,
              rpcUrls: [targetNetwork.rpcUrl],
              blockExplorerUrls: targetNetwork.blockExplorers ? 
                [targetNetwork.blockExplorers.default.url] : 
                undefined
            }],
          });
          
          // After adding, try switching again
          await window.ethereum!.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${networkId.toString(16)}` }],
          });
          
          // Update state immediately
          if (targetNetwork) {
            const public_client = createPublicClient({
              transport: http(targetNetwork.rpcUrl),
            });
            
            updateGlobalWalletState({
              chainId: networkId,
              network: targetNetwork,
              publicClient: public_client
            });
          }
          
          return true;
        }
        
        // Other errors
        throw switchError;
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    // Note: MetaMask doesn't support programmatic disconnection
    // This just clears the local state
    updateGlobalWalletState({
      address: null,
      isConnected: false,
    });
  };

  return {
    ...state,
    publicClient,
    walletClient,
    connectWallet,
    switchNetwork,
    disconnectWallet,
    isMetaMaskInstalled: checkIfMetaMaskIsInstalled(),
  };
}