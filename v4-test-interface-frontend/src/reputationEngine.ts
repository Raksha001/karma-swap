// reputation-engine.ts - TypeScript version of the Python reputation scoring system

const THE_GRAPH_API_KEY = ""; // Add your API key here
const ETHERSCAN_API_KEY = ""; // Add your API key here
const BSCSCAN_API_KEY = ""; // Add your API key here

// Cache configuration
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

// API Endpoints
const AAVE_V3_SUBGRAPH_URL = `https://gateway.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF`;
const UNISWAP_V3_SUBGRAPH_URL = `https://gateway.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`;
const SNAPSHOT_SUBGRAPH_URL = `https://hub.snapshot.org/graphql`;
const ENS_SUBGRAPH_URL = `https://gateway.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH`;
const ETHERSCAN_API_URL = "https://api.etherscan.io/api";
const BSCSCAN_API_URL = "https://api.etherscan.io/v2/api?chainid=56";

// Known addresses
const TORNADO_CASH_ROUTER = "0x722122df12d4e14e13ac3b6895a86e84145b6967";
const KNOWN_SCAM_ADDRESSES = new Set([
  "0x0000462df2438f205a26563a3952a81f3c31275f",
  "0x6a2562c5a5934c855a72b3a16828527a23b3a2a1", 
  "0xb38e75e8c13689139f75b8e1a14a29a6e1331776",
]);

// GraphQL Queries
const AAVE_LIQUIDATIONS_QUERY = `
  query ($user_address: String!) {
    liquidationCalls(where: {user: $user_address}) {
      id
    }
  }
`;

const UNISWAP_SWAPS_QUERY = `
  query ($user_address: String!) {
    swaps(where: {origin: $user_address}, first: 1000, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      pool {
        createdAtTimestamp
      }
      token0 { id }
      token1 { id }
    }
  }
`;

const UNISWAP_LP_QUERY = `
  query ($user_address: String!) {
    mints(where: {origin: $user_address}, first: 500) { id }
  }
`;

const SNAPSHOT_VOTES_QUERY = `
  query ($user_address: String!) {
    votes(where: {voter: $user_address}, first: 500) { id }
  }
`;

const ENS_OWNERSHIP_QUERY = `
  query ($user_address: String!) {
    domains(where: {owner: $user_address}) { id }
  }
`;

// TypeScript Interfaces
interface Transaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  isError: string;
  contractAddress?: string;
}

interface TokenTransaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
}

interface GraphQLResponse {
  data?: any;
  errors?: any[];
}

interface FailedTxData {
  count: number;
  rate: number;
}

// In-memory cache (since we can't use localStorage in artifacts)
const reputationCache = new Map<string, CachedData<any>>();

// Utility functions
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const getCacheKey = (address: string, type: string): string => `${address.toLowerCase()}_${type}`;

const getCachedData = <T>(cacheKey: string): T | null => {
  const cached = reputationCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
    console.log(`CACHE HIT: Loading data for ${cacheKey}`);
    return cached.data;
  }
  console.log(`CACHE MISS: Will fetch fresh data for ${cacheKey}`);
  return null;
};

const setCachedData = <T>(cacheKey: string, data: T): void => {
  reputationCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

// API query functions
const queryTheGraph = async (endpoint: string, query: string, variables: Record<string, any>): Promise<GraphQLResponse | null> => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error querying The Graph API at ${endpoint}:`, error);
    return null;
  }
};

const fetchAllTransactions = async (walletAddress: string, apiUrl: string, apiKey: string, chainType: 'eth' | 'bsc' = 'eth'): Promise<Transaction[] | null> => {
  const cacheKey = getCacheKey(walletAddress, `${chainType}_txs`);
  const cachedData = getCachedData<Transaction[]>(cacheKey);
  if (cachedData) return cachedData;

  console.log(`Fetching ${chainType.toUpperCase()} transaction history...`);
  const allTransactions: Transaction[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      module: 'account',
      action: 'txlist',
      address: walletAddress,
      startblock: '0',
      endblock: '99999999',
      page: page.toString(),
      offset: '1000',
      sort: 'asc',
      apikey: apiKey
    });

    try {
      const response = await fetch(`${apiUrl}?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === '1' && data.result && data.result.length > 0) {
        allTransactions.push(...data.result);
        if (data.result.length < 1000) break;
        page++;
        await sleep(200); // Rate limiting
      } else {
        break;
      }
    } catch (error) {
      console.error(`Error fetching ${chainType} transactions:`, error);
      return null;
    }
  }

  if (allTransactions.length > 0) {
    setCachedData(cacheKey, allTransactions);
  }

  return allTransactions;
};

const fetchTokenTransfers = async (walletAddress: string): Promise<TokenTransaction[] | null> => {
  const cacheKey = getCacheKey(walletAddress, 'token_txs');
  const cachedData = getCachedData<TokenTransaction[]>(cacheKey);
  if (cachedData) return cachedData;

  console.log('Fetching ERC-20 token transfer history...');
  const allTransfers: TokenTransaction[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address: walletAddress,
      startblock: '0',
      endblock: '99999999',
      page: page.toString(),
      offset: '1000',
      sort: 'asc',
      apikey: ETHERSCAN_API_KEY
    });

    try {
      const response = await fetch(`${ETHERSCAN_API_URL}?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === '1' && data.result && data.result.length > 0) {
        allTransfers.push(...data.result);
        if (data.result.length < 1000) break;
        page++;
        await sleep(200);
      } else {
        break;
      }
    } catch (error) {
      console.error('Error fetching token transfers:', error);
      return null;
    }
  }

  if (allTransfers.length > 0) {
    setCachedData(cacheKey, allTransfers);
  }

  return allTransfers;
};

// Analysis functions
const getWalletAgeFromTxLists = (ethTxs: Transaction[] | null, bscTxs: Transaction[] | null): number => {
  const firstEthTs = ethTxs && ethTxs.length > 0 ? parseInt(ethTxs[0].timeStamp) : null;
  const firstBscTs = bscTxs && bscTxs.length > 0 ? parseInt(bscTxs[0].timeStamp) : null;

  if (!firstEthTs && !firstBscTs) return 0;

  const firstTs = Math.min(...[firstEthTs, firstBscTs].filter((ts): ts is number => ts !== null));
  const firstTxDate = new Date(firstTs * 1000);
  const daysDiff = Math.floor((Date.now() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff;
};

const calculateNativeVolume = (transactions: Transaction[] | null, walletAddress: string): number => {
  if (!transactions) return 0;
  
  const totalVolumeWei = transactions
    .filter(tx => tx.from.toLowerCase() === walletAddress.toLowerCase() && parseInt(tx.value || '0') > 0)
    .reduce((sum, tx) => sum + parseInt(tx.value), 0);
    
  return totalVolumeWei / 1e18; // Convert from wei to ETH/BNB
};

const checkTornadoInteraction = (transactions: Transaction[] | null): boolean => {
  if (!transactions) return false;
  return transactions.some(tx => tx.to && tx.to.toLowerCase() === TORNADO_CASH_ROUTER.toLowerCase());
};

const checkScamInteraction = (transactions: Transaction[] | null): boolean => {
  if (!transactions) return false;
  return transactions.some(tx => tx.to && KNOWN_SCAM_ADDRESSES.has(tx.to.toLowerCase()));
};

const getFailedTxRate = (transactions: Transaction[] | null): FailedTxData => {
  if (!transactions || transactions.length === 0) return { count: 0, rate: 0.0 };
  
  const totalTx = transactions.length;
  const failedTx = transactions.filter(tx => tx.isError === '1').length;
  const rate = totalTx > 0 ? (failedTx / totalTx) * 100 : 0.0;
  
  return { count: failedTx, rate };
};

const detectRugPulls = (walletAddress: string, normalTxs: Transaction[] | null, tokenTxs: TokenTransaction[] | null): number => {
  if (!normalTxs || !tokenTxs) return 0;
  
  const walletAddressLower = walletAddress.toLowerCase();
  const deployedContracts = new Set(
    normalTxs
      .filter(tx => tx.contractAddress && !tx.to)
      .map(tx => tx.contractAddress!.toLowerCase())
  );
  
  if (deployedContracts.size === 0) return 0;

  let rugPullCount = 0;
  
  for (const contract of deployedContracts) {
    let totalIn = 0;
    let totalOut = 0;
    
    for (const tx of tokenTxs) {
      if (tx.contractAddress.toLowerCase() === contract) {
        const value = parseInt(tx.value);
        if (tx.to.toLowerCase() === walletAddressLower) {
          totalIn += value;
        }
        if (tx.from.toLowerCase() === walletAddressLower) {
          totalOut += value;
        }
      }
    }
    
    if (totalIn > 0 && (totalOut / totalIn) > 0.90) {
      rugPullCount++;
    }
  }
  
  return rugPullCount;
};

// The Graph query functions
const getAaveLiquidations = async (walletAddress: string): Promise<number> => {
  const variables = { user_address: walletAddress.toLowerCase() };
  const data = await queryTheGraph(AAVE_V3_SUBGRAPH_URL, AAVE_LIQUIDATIONS_QUERY, variables);
  return data?.data?.liquidationCalls?.length || 0;
};

const analyzeUniswapSwaps = async (walletAddress: string): Promise<number> => {
  const variables = { user_address: walletAddress.toLowerCase() };
  const data = await queryTheGraph(UNISWAP_V3_SUBGRAPH_URL, UNISWAP_SWAPS_QUERY, variables);
  return data?.data?.swaps?.length || 0;
};

const getUniswapLpCount = async (walletAddress: string): Promise<number> => {
  const variables = { user_address: walletAddress.toLowerCase() };
  const data = await queryTheGraph(UNISWAP_V3_SUBGRAPH_URL, UNISWAP_LP_QUERY, variables);
  return data?.data?.mints?.length || 0;
};

const getSnapshotVotesCount = async (walletAddress: string): Promise<number> => {
  const variables = { user_address: walletAddress.toLowerCase() };
  const data = await queryTheGraph(SNAPSHOT_SUBGRAPH_URL, SNAPSHOT_VOTES_QUERY, variables);
  return data?.data?.votes?.length || 0;
};

const getEnsDomainCount = async (walletAddress: string): Promise<number> => {
  const variables = { user_address: walletAddress.toLowerCase() };
  const data = await queryTheGraph(ENS_SUBGRAPH_URL, ENS_OWNERSHIP_QUERY, variables);
  return data?.data?.domains?.length || 0;
};

// Main reputation calculation function
export const calculateReputationScore = async (walletAddress: string): Promise<number> => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔍 Analyzing Wallet: ${walletAddress}`);
  console.log('='.repeat(50));

  // Check for API keys
  if (!THE_GRAPH_API_KEY || !ETHERSCAN_API_KEY || !BSCSCAN_API_KEY) {
    console.warn('⚠️ API keys missing - using fallback scoring');
    return 50; // Return neutral score if API keys are missing
  }

  try {
    // Data collection
    console.log('Fetching data from on-chain sources (using cache where possible)...');
    
    const [
      ethTxs,
      bscTxs,
      ethTokenTxs,
      uniswapTxCount,
      liquidationCount,
      lpCount,
      voteCount,
      ensCount
    ] = await Promise.all([
      fetchAllTransactions(walletAddress, ETHERSCAN_API_URL, ETHERSCAN_API_KEY, 'eth'),
      fetchAllTransactions(walletAddress, BSCSCAN_API_URL, BSCSCAN_API_KEY, 'bsc'),
      fetchTokenTransfers(walletAddress),
      analyzeUniswapSwaps(walletAddress),
      getAaveLiquidations(walletAddress),
      getUniswapLpCount(walletAddress),
      getSnapshotVotesCount(walletAddress),
      getEnsDomainCount(walletAddress)
    ]);

    // Analysis
    const walletAgeDays = getWalletAgeFromTxLists(ethTxs, bscTxs);
    const ethVolume = calculateNativeVolume(ethTxs, walletAddress);
    const bnbVolume = calculateNativeVolume(bscTxs, walletAddress);
    const tornadoInteraction = checkTornadoInteraction(ethTxs);
    const scamInteraction = checkScamInteraction(ethTxs);
    const failedTxData = getFailedTxRate(ethTxs);
    const rugPullEvents = detectRugPulls(walletAddress, ethTxs, ethTokenTxs);

    console.log('✅ Data collection complete.');

    // Scoring logic
    let baseScore = 50;
    const scoreLog: string[] = [];

    // Positive factors
    const ageScore = Math.min(20, Math.floor(walletAgeDays / 30));
    baseScore += ageScore;
    scoreLog.push(`[+] Wallet Age (${walletAgeDays} days, cross-chain): +${ageScore} points`);

    const volumeScore = Math.min(15, Math.floor(ethVolume / 10) + Math.floor(bnbVolume / 20));
    baseScore += volumeScore;
    scoreLog.push(`[+] Trading Volume (${ethVolume.toFixed(2)} ETH, ${bnbVolume.toFixed(2)} BNB): +${volumeScore} points`);

    const uniswapScore = Math.min(20, Math.floor(uniswapTxCount / 10));
    baseScore += uniswapScore;
    scoreLog.push(`[+] Uniswap Swaps (${uniswapTxCount} swaps): +${uniswapScore} points`);

    const lpScore = Math.min(15, lpCount * 3);
    baseScore += lpScore;
    scoreLog.push(`[+] Uniswap LP Actions (${lpCount}): +${lpScore} points`);

    const voteScore = Math.min(15, voteCount * 2);
    baseScore += voteScore;
    scoreLog.push(`[+] Snapshot Gov Votes (${voteCount}): +${voteScore} points`);

    if (ensCount > 0) {
      const ensBonus = 15;
      baseScore += ensBonus;
      scoreLog.push(`[+] ENS Domain Ownership (${ensCount}): +${ensBonus} points`);
    }

    // Negative factors
    const liquidationPenalty = liquidationCount * 20;
    baseScore -= liquidationPenalty;
    scoreLog.push(`[-] Aave Liquidations (${liquidationCount}): -${liquidationPenalty} points`);

    if (tornadoInteraction) {
      const tornadoPenalty = 40;
      baseScore -= tornadoPenalty;
      scoreLog.push(`[-] Tornado Cash Interaction: -${tornadoPenalty} points (Major Penalty)`);
    }

    if (scamInteraction) {
      const scamPenalty = 60;
      baseScore -= scamPenalty;
      scoreLog.push(`[-] Interaction with Known Scam Address: -${scamPenalty} points (CRITICAL)`);
    }

    let failedTxPenalty = 0;
    if (failedTxData.rate > 20) {
      failedTxPenalty = Math.floor(failedTxData.rate / 10) * 5;
      baseScore -= failedTxPenalty;
    }
    scoreLog.push(`[-] Failed TX Rate (${failedTxData.count} failed / ${failedTxData.rate.toFixed(2)}%): -${failedTxPenalty} points`);

    const rugPullPenalty = rugPullEvents * 50;
    baseScore -= rugPullPenalty;
    scoreLog.push(`[-] Detected Rug Pulls (${rugPullEvents}): -${rugPullPenalty} points (CRITICAL)`);

    const finalScore = Math.max(0, Math.min(100, Math.floor(baseScore)));

    // Output
    console.log('\n--- Score Calculation Breakdown ---');
    scoreLog.forEach(log => console.log(log));
    console.log('-----------------------------------');
    console.log(`📊 Final Score: ${finalScore}`);
    console.log('='.repeat(50));

    return finalScore;

  } catch (error) {
    console.error('Error calculating reputation score:', error);
    return 50; // Return neutral score on error
  }
};