import requests
import datetime
import sys
import time
import os
import json

# --- Configuration:  ---
THE_GRAPH_API_KEY = "" 
ETHERSCAN_API_KEY = "" 

# --- Caching Configuration ---
CACHE_DIR = "cache"
CACHE_DURATION_SECONDS = 4 * 60 * 60 # Cache data for 4 hours

# --- Configuration: The Graph API Endpoints ---
# We query the Arbitrum gateway, which serves data for multiple chains including Ethereum Mainnet.
AAVE_V2_SUBGRAPH_URL = f"https://gateway-arbitrum.network.thegraph.com/api/{THE_GRAPH_API_KEY}/subgraphs/id/5tUNTMY2323yV22u9mKGAo5p75bNgkFqw4BwAMb2fB8Y"
UNISWAP_V3_SUBGRAPH_URL = f"https://gateway.thegraph.com/api/{THE_GRAPH_API_KEY}/subgraphs/id/7SP2t3PQd7LX19riCfwX5znhFdULjwRofQZtRZMJ8iW8" #uniswap v4 - 0x47eD604d48914fB4bf99c4f629aC34be10Da2cb1
SNAPSHOT_SUBGRAPH_URL = f"https://hub.snapshot.org/graphql" #0xc65e884ac8aba83936499d327299bb9313b9f005
ETHERSCAN_API_URL = "https://api.etherscan.io/api"

# A known Tornado Cash router address for our negative check.
TORNADO_CASH_ROUTER = "0x722122df12d4e14e13ac3b6895a86e84145b6967" #0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

# --- GraphQL Queries ---

AAVE_LIQUIDATIONS_QUERY = """
query ($user_address: String!) {
  liquidationCallHistoryEntities(where: {user: $user_address}) { id }
}
"""

# Query to get user's transaction (swap) history on Uniswap.
UNISWAP_SWAPS_QUERY = """
query ($user_address: String!) {
  swaps(where: {origin: $user_address}, first: 1000) {
    id
    timestamp
  }
}
"""

# New Query: To get governance votes from Snapshot

SNAPSHOT_VOTES_QUERY = """
query ($user_address: String!) {
  votes(where: {voter: $user_address}, first: 500) { id }
}
"""

def query_the_graph(endpoint, query, variables):
    """
    A helper function to send a POST request to a The Graph subgraph.
    """
    try:
        response = requests.post(endpoint, json={'query': query, 'variables': variables})
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error querying The Graph API at {endpoint}: {e}")
        return None

def _handle_cache_read(cache_path):
    """Helper to read from a cache file if it's valid."""
    if os.path.exists(cache_path):
        file_mod_time = os.path.getmtime(cache_path)
        if (time.time() - file_mod_time) < CACHE_DURATION_SECONDS:
            with open(cache_path, 'r') as f:
                print(f"CACHE HIT: Loading data from {os.path.basename(cache_path)}.")
                return json.load(f)
    print(f"CACHE MISS: Will fetch fresh data for {os.path.basename(cache_path)}.")
    return None

def _handle_cache_write(cache_path, data):
    """Helper to write data to a cache file."""
    with open(cache_path, 'w') as f:
        json.dump(data, f)

def get_all_etherscan_transactions(wallet_address):
    """Fetches all normal transactions for a wallet from Etherscan, with caching."""
    cache_path = os.path.join(CACHE_DIR, f"{wallet_address.lower()}_etherscan_txs.json")
    
    cached_data = _handle_cache_read(cache_path)
    if cached_data is not None:
        return cached_data

    print("Fetching full transaction history from Etherscan (this may take a moment)...")
    all_transactions = []
    page = 1
    while True:
        params = {
            "module": "account", "action": "txlist", "address": wallet_address,
            "startblock": 0, "endblock": 99999999, "page": page, "offset": 1000,
            "sort": "asc", "apikey": ETHERSCAN_API_KEY
        }
        try:
            response = requests.get(ETHERSCAN_API_URL, params=params)
            response.raise_for_status()
            data = response.json()
            if data['status'] == '1' and data['result']:
                all_transactions.extend(data['result'])
                if len(data['result']) < 1000:
                    break # Last page
                page += 1
                time.sleep(0.2) # Respect Etherscan rate limits
            else:
                break
        except requests.exceptions.RequestException as e:
            print(f"Error fetching wallet transactions from Etherscan: {e}")
            return None

    if all_transactions:
        _handle_cache_write(cache_path, all_transactions)
    
    return all_transactions

def get_all_token_transfers(wallet_address):
    """Fetches all ERC-20 token transactions for a wallet from Etherscan, with caching."""
    cache_path = os.path.join(CACHE_DIR, f"{wallet_address.lower()}_tokentx.json")
    
    cached_data = _handle_cache_read(cache_path)
    if cached_data is not None:
        return cached_data

    print("Fetching full ERC-20 token transfer history from Etherscan...")
    all_transfers = []
    page = 1
    while True:
        params = {
            "module": "account", "action": "tokentx", "address": wallet_address,
            "startblock": 0, "endblock": 99999999, "page": page, "offset": 1000,
            "sort": "asc", "apikey": ETHERSCAN_API_KEY
        }
        try:
            response = requests.get(ETHERSCAN_API_URL, params=params)
            response.raise_for_status()
            data = response.json()
            if data['status'] == '1' and data['result']:
                all_transfers.extend(data['result'])
                if len(data['result']) < 1000: break
                page += 1
                time.sleep(0.2)
            else:
                break
        except requests.exceptions.RequestException as e:
            print(f"Error fetching token transfers from Etherscan: {e}")
            return None
            
    if all_transfers:
        _handle_cache_write(cache_path, all_transfers)
        
    return all_transfers


# --- Data Analysis Functions ---

def get_wallet_age_from_tx_list(transactions):
    if not transactions: return 0
    first_tx_timestamp = int(transactions[0]['timeStamp'])
    first_tx_date = datetime.datetime.fromtimestamp(first_tx_timestamp)
    return (datetime.datetime.now() - first_tx_date).days

def check_tornado_interaction_from_tx_list(transactions):
    if not transactions: return False
    for tx in transactions:
        if tx.get('to', '').lower() == TORNADO_CASH_ROUTER:
            return True
    return False

def get_failed_tx_rate_from_tx_list(transactions):
    if not transactions: return 0, 0.0
    total_tx = len(transactions)
    failed_tx = sum(1 for tx in transactions if tx.get('isError') == '1')
    return failed_tx, (failed_tx / total_tx * 100) if total_tx > 0 else 0.0

def detect_rug_pulls(wallet_address, normal_txs, token_txs):
    """Analyzes transactions to find 'deploy and dump' rug pull behavior."""
    if not normal_txs or not token_txs:
        return 0
        
    wallet_address_lower = wallet_address.lower()
    deployed_contracts = set(tx['contractAddress'].lower() for tx in normal_txs if tx.get('contractAddress') and not tx.get('to'))
    
    if not deployed_contracts:
        return 0

    rug_pull_count = 0
    for contract in deployed_contracts:
        total_in = 0
        total_out = 0
        for tx in token_txs:
            if tx['contractAddress'].lower() == contract:
                value = int(tx['value'])
                if tx['to'].lower() == wallet_address_lower:
                    total_in += value
                if tx['from'].lower() == wallet_address_lower:
                    total_out += value
        
        # If the wallet sent out more than 90% of the tokens it ever received/minted, flag it.
        if total_in > 0 and (total_out / total_in) > 0.90:
            rug_pull_count += 1
            
    return rug_pull_count

def get_aave_liquidations(wallet_address):
    variables = {'user_address': wallet_address.lower()}
    data = query_the_graph(AAVE_V2_SUBGRAPH_URL, AAVE_LIQUIDATIONS_QUERY, variables)
    return len(data['data']['liquidationCallHistoryEntities']) if data and 'data' in data else 0

def analyze_uniswap_swaps(wallet_address):
    variables = {'user_address': wallet_address.lower()}
    data = query_the_graph(UNISWAP_V3_SUBGRAPH_URL, UNISWAP_SWAPS_QUERY, variables)
    if not (data and 'data' in data and 'swaps' in data['data']):
        return 0, 0
    
    swaps = data['data']['swaps']
    return len(swaps)

# def get_uniswap_lp_count(wallet_address):
#     variables = {'user_address': wallet_address.lower()}
#     data = query_the_graph(UNISWAP_V3_SUBGRAPH_URL, UNISWAP_LP_QUERY, variables)
#     return len(data['data']['mints']) if data and 'data' in data else 0

def get_snapshot_votes_count(wallet_address):
    variables = {'user_address': wallet_address.lower()}
    data = query_the_graph(SNAPSHOT_SUBGRAPH_URL, SNAPSHOT_VOTES_QUERY, variables)
    return len(data['data']['votes']) if data and 'data' in data else 0


def calculate_reputation_score(wallet_address):
    print("\n" + "="*50)
    print(f"🔍 Analyzing Wallet: {wallet_address}")
    print("="*50)

    # --- 1. Data Collection ---
    print("Fetching data from on-chain sources")
    all_tx = get_all_etherscan_transactions(wallet_address)
    all_token_tx = get_all_token_transfers(wallet_address)
    
    # Analyze data from Etherscan calls
    wallet_age_days = get_wallet_age_from_tx_list(all_tx)
    tornado_interaction = check_tornado_interaction_from_tx_list(all_tx)
    failed_tx_count, failed_tx_rate = get_failed_tx_rate_from_tx_list(all_tx)
    rug_pull_events = detect_rug_pulls(wallet_address, all_tx, all_token_tx)

    # Fetch data from The Graph
    uniswap_tx_count = analyze_uniswap_swaps(wallet_address)
    liquidation_count = get_aave_liquidations(wallet_address)
    # lp_count = get_uniswap_lp_count(wallet_address)
    vote_count = get_snapshot_votes_count(wallet_address)
    print("✅ Data collection complete.")

    # --- 2. Scoring Logic ---
    base_score = 50
    score_log = []

    # --- Positive Factors ---
    age_score = min(20, wallet_age_days // 30)
    base_score += age_score
    score_log.append(f"[+] Wallet Age ({wallet_age_days} days): +{age_score} points")

    uniswap_score = min(20, uniswap_tx_count // 10)
    base_score += uniswap_score
    score_log.append(f"[+] Uniswap Swaps ({uniswap_tx_count} swaps): +{uniswap_score} points")
    
    # lp_score = min(15, lp_count * 3)
    # base_score += lp_score
    # score_log.append(f"[+] Uniswap LP Actions ({lp_count}): +{lp_score} points")

    vote_score = min(15, vote_count * 2)
    base_score += vote_score
    score_log.append(f"[+] Snapshot Gov Votes ({vote_count}): +{vote_score} points")

    # --- Negative Factors ---
    liquidation_penalty = liquidation_count * 20
    base_score -= liquidation_penalty
    score_log.append(f"[-] Aave Liquidations ({liquidation_count}): -{liquidation_penalty} points")

    if tornado_interaction:
        tornado_penalty = 40
        base_score -= tornado_penalty
        score_log.append(f"[-] Tornado Cash Interaction: -{tornado_penalty} points (Major Penalty)")
    
    failed_tx_penalty = 0
    if failed_tx_rate > 20: # Penalize if more than 20% of txns failed
        failed_tx_penalty = int(failed_tx_rate / 10) * 5
        base_score -= failed_tx_penalty
    score_log.append(f"[-] Failed TX Rate ({failed_tx_count} failed / {failed_tx_rate:.2f}%): -{failed_tx_penalty} points")
    
    # --- New Negative Factor ---
    rug_pull_penalty = rug_pull_events * 50 # Massive penalty for each rug pull
    base_score -= rug_pull_penalty
    score_log.append(f"[-] Detected Rug Pulls ({rug_pull_events}): -{rug_pull_penalty} points (CRITICAL)")

    final_score = max(0, min(100, int(base_score)))

    # --- 3. Output ---
    print("\n--- Score Calculation Breakdown ---")
    for log_item in score_log:
        print(log_item)
    print("-----------------------------------")
    print(f"📊 Final Score: {final_score}")
    print("="*50)

    return final_score


if __name__ == "__main__":
    if not THE_GRAPH_API_KEY or not ETHERSCAN_API_KEY:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("!!! ERROR: API keys are missing in the script.")
        print("!!! Please open reputation_engine.py and add your API keys.")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        sys.exit(1)

    os.makedirs(CACHE_DIR, exist_ok=True)

    example_wallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" # vitalik.eth
    print("Welcome to the Reputation Scoring Engine!")
    print(f"You can try an example address like: {example_wallet}")

    target_wallet = input("Enter the Ethereum wallet address to analyze: ").strip()

    if not target_wallet:
        print("No wallet address entered. Exiting.")
    elif not (target_wallet.startswith("0x") and len(target_wallet) == 42):
        print("Invalid Ethereum address format. Please check and try again.")
    else:
        reputation_score = calculate_reputation_score(target_wallet)
        print(f"\nFINAL OUTPUT => {target_wallet}:{reputation_score}\n")

