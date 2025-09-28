# Karma Swap 🪝
**Rewarding Good Actors in DeFi with a Cross-Chain Reputation Hook for Uniswap v4**

Submission for **ETHGlobal Delhi 2025**

Karma Swap is our submission for the ETHGlobal Delhi 2025 hackathon. We are proudly competing for the **Uniswap Foundation's "Build with Uniswap v4 Hooks"** bounty. Our project directly leverages the power of v4 hooks to introduce a novel mechanism for trust and security in decentralized finance.

---

## The Problem: A Crisis of Trust
Imagine you're lending money to strangers online. Wouldn't you want to know if they've defaulted on loans before? That's exactly what's missing in DeFi today.  

Because of its pseudonymous and siloed nature, there's no way to know if a wallet is trustworthy across different blockchain networks.

**Current problems:**
- Malicious actors hop between chains to erase their tracks after rug pulls, MEV exploits, and governance attacks.
- Protocols treat every wallet as equal — a DeFi veteran vs. a scammer’s fresh wallet.
- Lack of a persistent, cross-chain identity stifles trust and exposes users to risk.

---

## The Solution: Karma Swap 🪝
Karma Swap introduces a **trust layer** to DeFi’s most essential primitive: the Automated Market Maker (AMM).  

We’ve created a **credit score for crypto wallets** that works across all blockchains — rewarding good actors and restricting bad actors.  

Implemented as a **Uniswap v4 hook**, Karma Swap adds:
- **Dynamic fees** based on cross-chain reputation & market volatility.
- **Access control** to restrict malicious wallets.

---

## The Dynamic Fee Advantage
The hook calculates fees dynamically instead of using a static model.

**Fee formula:**
Final Fee = Base Fee * Volatility Multiplier - Karma Discount

- **Volatility Multiplier**: Higher fees during market turbulence → protects LPs.  
- **Karma Discount**: Based on user’s cross-chain reputation.  

### Outcomes:
- **High Karma Score** → Fees as low as **0.01%**.  
- **Neutral Score** → Fair, volatility-adjusted fees.  
- **Low/Negative Score** → Higher fees or blocked entirely.  

**Benefits:**
- Good traders get lower fees → more efficient strategies.  
- New users start fairly → incentives to build reputation.  
- LPs get protection & compensation during volatility.  

---

## Key Features
✅ **Cross-Chain Reputation**: First hook leveraging wallet history across multiple blockchains.  
✅ **Dynamic Fee Structure**: Adapts to reputation + volatility.  
✅ **Enhanced Security**: Restricts malicious wallets in real-time.  
✅ **Positive-Sum Incentives**: Encourages long-term constructive behavior.  
✅ **Capital Efficiency**: Lower fees for good actors.  

---

## How It Works: Technical Flow
The magic happens in **`beforeSwap`** and **`afterSwap`** hooks in Uniswap v4.

<img width="3600" height="2400" alt="image" src="https://github.com/user-attachments/assets/801ae4d8-87ab-47d1-bd2e-08f2783bc595" />

---

## Architecture Deep-Dive

<img width="2450" height="1083" alt="image" src="https://github.com/user-attachments/assets/b50a3e8e-0e13-4b7e-af9e-f92d86e37bed" />

**Step 1: Data Collection Layer (The Detective Work)**  
- **Who**: The Graph + Custom Indexers + Etherscan APIs.  
- **What**: Aggregate wallet behavior from different blockchains.  

**Step 2: Analysis & Scoring Layer**  
- **Who**: Proprietary inference engine.  
- **What**: Real-time Karma Score computed & fed into Reputation Script.  

---

## The Karma Score: Reputation Calculation
A weighted score based on wallet activity across chains.

**Factors:**
- ✅ Trading history (volume, frequency, PnL).  
- ✅ Liquidation events.  
- ✅ Rug pull participation.  
- ✅ Wallet age across chains.  
- ✅ Protocol interactions.  
- ✅ MEV/bot activity.  


---

## Use Cases & Impact
- **DeFi OG** → VIP treatment, ultra-low fees (0.01%).  
- **New User** → Fair fees, incentives to build reputation.  
- **Known Scammer** → Blocked from trading entirely.  

---

## Tech Stack
- **Smart Contracts**: Solidity, Foundry  
- **Hook Framework**: Uniswap v4 Core  
- **Oracle Backend**: Node.js, Ethers.js
- **Cross-Chain Data**: The Graph, Etherscan APIs  
- **Deployment**: Unichain, Sepolia Testnet  

---

## Getting Started
Follow these steps to set up, test, and deploy locally.

### Prerequisites
- Git  
- Foundry  

### Installation & Setup
```bash
git clone https://github.com/your-username/karma-swap.git
cd karma-swap

forge install
cp .env.example .env
Running Tests
forge test -vvv
```

---

## The Road Ahead: Our Vision

### Phase 1 (Q4 2025): Refinement & Security
- Add more data points (Gitcoin grants, cross-chain bridges).  
- Conduct a full security audit.  

### Phase 2 (Q1 2026): Growth & Integration
- Apply for a **Uniswap Foundation Grant**.  
- Get hook whitelisted by governance.  
- Partner with lending & derivative protocols.  

### Phase 3 (Q2 2026): Decentralization
- Decentralize the oracle via a distributed node network.  
- Release a **Reputation SDK** for developers.  

---

## Our Team
- **Raksha V G**  
- **Sharwin Xavier**  

---

Made with ❤️ for **ETHGlobal Delhi 2025**
