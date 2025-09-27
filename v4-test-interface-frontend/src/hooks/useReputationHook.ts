// useReputation.ts - Standalone hook for managing wallet reputation

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet'; // Your existing wallet hook
import { calculateReputationScore } from '../reputationEngine';


interface ReputationData {
  score: number;
  lastCalculated: number;
  isStale: boolean;
}

interface UseReputationReturn {
  // Current state
  reputationScore: number | null;
  isCalculating: boolean;
  lastUpdated: Date | null;
  error: string | null;
  isStale: boolean;
  
  // Actions
  refreshReputation: () => Promise<void>;
  clearError: () => void;
  
  // Utility
  getReputationLabel: (score?: number) => string;
  getReputationColor: (score?: number) => string;
}

// Cache duration: 1 hour (reputation doesn't change super frequently)
const REPUTATION_CACHE_DURATION = 60 * 60 * 1000;

// In-memory cache for reputation scores
const reputationCache = new Map<string, ReputationData>();

export function useReputation(): UseReputationReturn {
  const { address, isConnected } = useWallet();
  
  const [reputationScore, setReputationScore] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Check if cached reputation is stale
  const checkIfStale = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp > REPUTATION_CACHE_DURATION;
  }, []);

  // Load reputation from cache if available
  const loadFromCache = useCallback((walletAddress: string) => {
    const cached = reputationCache.get(walletAddress.toLowerCase());
    if (cached) {
      setReputationScore(cached.score);
      setLastUpdated(new Date(cached.lastCalculated));
      setIsStale(checkIfStale(cached.lastCalculated));
      return cached;
    }
    return null;
  }, [checkIfStale]);

  // Save reputation to cache
  const saveToCache = useCallback((walletAddress: string, score: number) => {
    const now = Date.now();
    reputationCache.set(walletAddress.toLowerCase(), {
      score,
      lastCalculated: now,
      isStale: false
    });
    setLastUpdated(new Date(now));
    setIsStale(false);
  }, []);

  // Calculate reputation score
  const calculateReputation = useCallback(async (walletAddress: string, force = false): Promise<void> => {
    // Check cache first if not forcing refresh
    if (!force) {
      const cached = loadFromCache(walletAddress);
      if (cached && !checkIfStale(cached.lastCalculated)) {
        console.log('📋 Using cached reputation score:', cached.score);
        return;
      }
    }

    setIsCalculating(true);
    setError(null);

    try {
      console.log('🔍 Calculating reputation score for:', walletAddress);
      const score = await calculateReputationScore(walletAddress);
      
      setReputationScore(score);
      saveToCache(walletAddress, score);
      
      console.log('✅ Reputation score calculated:', score);
    } catch (err: any) {
      console.error('❌ Failed to calculate reputation:', err);
      setError(err.message || 'Failed to calculate reputation score');
      
      // If we have cached data, use it even if stale
      const cached = reputationCache.get(walletAddress.toLowerCase());
      if (cached) {
        setReputationScore(cached.score);
        setLastUpdated(new Date(cached.lastCalculated));
        setIsStale(true);
        console.log('🔄 Using stale cached reputation due to error:', cached.score);
      }
    } finally {
      setIsCalculating(false);
    }
  }, [loadFromCache, saveToCache, checkIfStale]);

  // Refresh reputation (force recalculation)
  const refreshReputation = useCallback(async (): Promise<void> => {
    if (!address) return;
    await calculateReputation(address, true);
  }, [address, calculateReputation]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-calculate when wallet connects or changes
  useEffect(() => {
    if (isConnected && address) {
      // Load from cache immediately for instant display
      const cached = loadFromCache(address);
      
      // Calculate if no cache or cache is stale
      if (!cached || checkIfStale(cached.lastCalculated)) {
        calculateReputation(address);
      }
    } else {
      // Reset state when wallet disconnects
      setReputationScore(null);
      setLastUpdated(null);
      setError(null);
      setIsStale(false);
    }
  }, [isConnected, address, loadFromCache, calculateReputation, checkIfStale]);

  // Utility function to get reputation label
  const getReputationLabel = useCallback((score?: number): string => {
    const currentScore = score ?? reputationScore;
    if (currentScore === null) return 'Unknown';
    
    if (currentScore >= 90) return 'Excellent';
    if (currentScore >= 80) return 'Very Good';
    if (currentScore >= 70) return 'Good';
    if (currentScore >= 60) return 'Fair';
    if (currentScore >= 50) return 'Average';
    if (currentScore >= 40) return 'Below Average';
    if (currentScore >= 30) return 'Poor';
    return 'Very Poor';
  }, [reputationScore]);

  // Utility function to get reputation color
  const getReputationColor = useCallback((score?: number): string => {
    const currentScore = score ?? reputationScore;
    if (currentScore === null) return 'gray';
    
    if (currentScore >= 80) return 'green';
    if (currentScore >= 60) return 'yellow';
    if (currentScore >= 40) return 'orange';
    return 'red';
  }, [reputationScore]);

  return {
    // Current state
    reputationScore,
    isCalculating,
    lastUpdated,
    error,
    isStale,
    
    // Actions
    refreshReputation,
    clearError,
    
    // Utility
    getReputationLabel,
    getReputationColor,
  };
}