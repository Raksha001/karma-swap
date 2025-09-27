import requests
import datetime
import sys

# --- Configuration:  ---
THE_GRAPH_API_KEY = "" 
ETHERSCAN_API_KEY = "" 

# --- Configuration: The Graph API Endpoints ---
# These are the new, stable endpoints that require an API key.
# We query the Arbitrum gateway, which serves data for multiple chains including Ethereum Mainnet.
AAVE_V2_SUBGRAPH_URL = f"https://gateway-arbitrum.network.thegraph.com/api/{THE_GRAPH_API_KEY}/subgraphs/id/5tUNTMY2323yV22u9mKGAo5p75bNgkFqw4BwAMb2fB8Y"
UNISWAP_V3_SUBGRAPH_URL = f"https://gateway.thegraph.com/api/{THE_GRAPH_API_KEY}/subgraphs/id/7SP2t3PQd7LX19riCfwX5znhFdULjwRofQZtRZMJ8iW8" #uniswap v4
SNAPSHOT_SUBGRAPH_URL = f"https://gateway-arbitrum.network.thegraph.com/api/{THE_GRAPH_API_KEY}/subgraphs/id/4D7k1v2hda55Q2jWrr8vGscBw332nZc5P2n32M291J2C"
ETHERSCAN_API_URL = "https://api.etherscan.io/api"

# A known Tornado Cash router address for our negative check.
TORNADO_CASH_ROUTER = "0x722122df12d4e14e13ac3b6895a86e84145b6967"

# --- GraphQL Queries ---

# Query to get user's liquidation history on Aave.
AAVE_LIQUIDATIONS_QUERY = """
query ($user_address: String!) {
  liquidationCallHistoryEntities(where: {user: $user_address}) {
    id
  }
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

# New Query: To check for liquidity provider actions (mints)
UNISWAP_LP_QUERY = """
query ($user_address: String!) {
  mints(where: {origin: $user_address}, first: 500) { id }
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
        response.raise_for_status() # Raises an HTTPError for bad responses (4xx or 5xx)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error querying The Graph API at {endpoint}: {e}")
        return None

def get_wallet_age_and_first_tx(wallet_address):
    """
    Gets the timestamp of the very first transaction to determine wallet age.
    Uses Etherscan API as it's the most reliable way to find the first-ever transaction.
    """
    params = {
        "module": "account",
        "action": "txlist",
        "address": wallet_address,
        "startblock": 0,
        "endblock": 99999999,
        "page": 1,
        "offset": 1,
        "sort": "asc",
        "apikey": ETHERSCAN_API_KEY
    }
    try:
        response = requests.get(ETHERSCAN_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        if data['status'] == '1' and data['result']:
            first_tx_timestamp = int(data['result'][0]['timeStamp'])
            first_tx_date = datetime.datetime.fromtimestamp(first_tx_timestamp)
            age_in_days = (datetime.datetime.now() - first_tx_date).days
            return age_in_days
    except requests.exceptions.RequestException as e:
        print(f"Error fetching wallet age from Etherscan: {e}")
    return 0


def get_aave_liquidations(wallet_address):
    """
    Checks for negative history: loan liquidations on Aave.
    """
    variables = {'user_address': wallet_address.lower()}
    data = query_the_graph(AAVE_V2_SUBGRAPH_URL, AAVE_LIQUIDATIONS_QUERY, variables)
    if data and 'data' in data and 'liquidationCallHistoryEntities' in data['data']:
        return len(data['data']['liquidationCallHistoryEntities'])
    return 0

def get_uniswap_swaps_count(wallet_address):
    """
    Checks for positive history: number of swaps on Uniswap.
    """
    variables = {'user_address': wallet_address.lower()}
    data = query_the_graph(UNISWAP_V3_SUBGRAPH_URL, UNISWAP_SWAPS_QUERY, variables)
    if data and 'data' in data and 'swaps' in data['data']:
        return len(data['data']['swaps'])
    return 0

def check_tornado_cash_interaction(wallet_address):
    """
    Checks for negative history: interaction with Tornado Cash.
    This is a simplified check looking for transactions TO the router.
    """
    params = {
        "module": "account",
        "action": "txlist",
        "address": wallet_address,
        "startblock": 0,
        "endblock": 99999999,
        "page": 1,
        "offset": 1000,
        "sort": "asc",
        "apikey": ETHERSCAN_API_KEY
    }
    try:
        response = requests.get(ETHERSCAN_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        if data['status'] == '1' and data['result']:
            for tx in data['result']:
                # Check if the 'to' address in any transaction matches the Tornado router
                if tx.get('to', '').lower() == TORNADO_CASH_ROUTER:
                    return True
    except requests.exceptions.RequestException as e:
        print(f"Error checking Tornado Cash interaction from Etherscan: {e}")
    return False


def calculate_reputation_score(wallet_address):
    """
    The main inference engine function.
    It fetches data for all factors and calculates a score.
    """
    print("\n" + "="*50)
    print(f"🔍 Analyzing Wallet: {wallet_address}")
    print("="*50)

    # --- 1. Data Collection ---
    print("Fetching data from on-chain sources...")
    wallet_age_days = get_wallet_age_and_first_tx(wallet_address)
    uniswap_tx_count = get_uniswap_swaps_count(wallet_address)
    liquidation_count = get_aave_liquidations(wallet_address)
    tornado_interaction = check_tornado_cash_interaction(wallet_address)
    print("✅ Data collection complete.")

    # --- 2. Scoring Logic ---
    # Start with a neutral base score
    base_score = 50
    score_log = [] # To explain the calculation

    # --- Positive Factors ---
    # Factor 1: Wallet Age (Trustworthiness over time)
    age_score = min(25, wallet_age_days // 30) # +1 point per month, max 25
    base_score += age_score
    score_log.append(f"[+] Wallet Age ({wallet_age_days} days): +{age_score} points")

    # Factor 2: Number of Uniswap Transactions (Demonstrates DeFi activity)
    uniswap_score = min(25, uniswap_tx_count // 5) # +1 point per 5 swaps, max 25
    base_score += uniswap_score
    score_log.append(f"[+] Uniswap Swaps ({uniswap_tx_count} swaps): +{uniswap_score} points")

    # --- Negative Factors ---
    # Factor 3: Aave Liquidations (Indicates poor risk management)
    liquidation_penalty = liquidation_count * 20 # -20 points per liquidation
    base_score -= liquidation_penalty
    score_log.append(f"[-] Aave Liquidations ({liquidation_count} events): -{liquidation_penalty} points")

    # Factor 4: Tornado Cash Interaction (Major red flag for privacy mixing)
    tornado_penalty = 0
    if tornado_interaction:
        tornado_penalty = 50 # Heavy penalty
        base_score -= tornado_penalty
        score_log.append(f"[-] Tornado Cash Interaction (Detected): -{tornado_penalty} points")
    else:
        score_log.append(f"[ ] Tornado Cash Interaction (Not Detected): -0 points")


    # Final score must be between 0 and 100
    final_score = max(0, min(100, base_score))

    # --- 3. Output ---
    print("\n--- Score Calculation Breakdown ---")
    for log_item in score_log:
        print(log_item)
    print("-----------------------------------")
    print(f"📊 Final Score: {final_score}")
    print("="*50)

    return final_score


if __name__ == "__main__":
    # Check for API keys first
    if not THE_GRAPH_API_KEY or not ETHERSCAN_API_KEY:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("!!! ERROR: API keys are missing in the script.")
        print("!!! Please open reputation_engine.py and add your API keys")
        print("!!! from The Graph and Etherscan to the designated variables.")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        sys.exit(1) # Exit the script if keys are missing

    # Example wallet: A well-known active address (e.g., vitalik.eth)
    # Note: Using ENS names won't work, you need the actual address.
    # vitalik.eth = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
    # A random active address: 0x26fc261e45511370743b3d414e2d45b2b2b6a95b
    example_wallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    print(f"Welcome to the Reputation Scoring Engine MVP!")
    print(f"You can try an example address like: {example_wallet}")

    target_wallet = input("Enter the Ethereum wallet address to analyze: ").strip()

    # target_wallet = "0x7AF701d87175824b723feFd4080eB2E5bdEaB771"

    if not target_wallet:
        print("No wallet address entered. Exiting.")
    elif not (target_wallet.startswith("0x") and len(target_wallet) == 42):
        print("Invalid Ethereum address format. Please check and try again.")
    else:
        reputation_score = calculate_reputation_score(target_wallet)
        # Final required output format
        print(f"\nFINAL OUTPUT => {target_wallet}:{reputation_score}\n")

