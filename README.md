# VoxelFi — Private Fractal Liquidity

**Privacy-first liquidity provisioning with fractal mathematics and zero-knowledge proofs**

---

## 🎯 The Problem

DeFi liquidity is public by default. On most concentrated liquidity AMMs, every LP reveals:

- ❌ **Center price** — competitors copy your positioning
- ❌ **Range boundaries** — bots exploit your limits  
- ❌ **Liquidity depth** — reveals your capital allocation
- ❌ **Curve shape** — telegraphs your market view

**Result:** Sandwich bots, front-runners, and copycat traders feast on your transparent strategy. You take the risk, they take the profit.

---

## ✨ The Solution: VoxelFi

VoxelFi flips the script with **private fractal liquidity**:

### 🔐 Zero-Knowledge Privacy
- Your parameters stay local, never touch the blockchain
- Only cryptographic commitments stored on-chain
- ZK proofs verify validity without revealing strategy
- Attackers see liquidity exists, not how it's structured

### 📐 Fractal Mathematics  
- Self-similar curves provide infinite price coverage in one transaction
- Dense liquidity where you predict price action
- Smooth decay prevents sudden liquidity cliffs
- Recursive structure = 100x gas savings vs traditional multi-range positions

### 🚀 Privy Embedded Wallets
- No seed phrases, no browser extensions
- Login with email or social accounts
- Embedded wallet created automatically
- Web2 UX with Web3 security

**Capital efficiency without surveillance.**

---

## 🧠 What are Fractal Liquidity Curves?

Traditional AMMs force you to choose ONE price range. Want full coverage? Deploy 100+ positions and pay massive gas.

VoxelFi uses **fractal mathematics** instead:

**Traditional Multi-Range LP:**
```
Position 1:  |████|          (gas: 200K)
Position 2:      |████|      (gas: 200K)
Position 3:          |████|  (gas: 200K)
...
Position 100:            |████| (gas: 200K)

Total: 20M gas = $300 on Ethereum
```

**VoxelFi Fractal LP:**
```
One Position: ░░▒▒▓▓████▓▓▒▒░░
              $1500      $2500
              
Infinite ranges, one transaction
Total: 80K gas = $1.20 on Movement
```

**How it works:**
- Same pattern repeats at every scale (self-similar)
- Store the formula, not individual ranges
- Liquidity computed on-demand from mathematical curve
- 256 bytes stores infinite positions

---

## 🔐 Privacy Architecture

**Traditional AMM:**
```
On-chain: "Alice provides 1000 USDC at price $1850-$1950"
Result: Everyone copies Alice's strategy
```

**VoxelFi:**
```
On-chain: "Commitment hash: 0x7a3f9e..."
Local only: Alice's actual parameters (center, spread, depth)
Result: Competitors see liquidity but can't reverse-engineer strategy
```

**Privacy Flow:**
1. **Local Setup** — Define parameters in browser (never sent anywhere)
2. **ZK Proof** — Generate cryptographic proof "my parameters are valid" (2 seconds)
3. **On-Chain Commit** — Submit hash + proof to smart contract
4. **Verification** — Contract verifies proof without seeing parameters
5. **Private LP Active** — Earning fees, strategy hidden forever

**What's on-chain:**
- ✅ Commitment hash (meaningless without secret)
- ✅ Total liquidity amount
- ✅ ZK proof (verifiable but reveals nothing)

**What stays private:**
- 🔒 Price center
- 🔒 Spread width
- 🔒 Fractal type
- 🔒 Recursion depth
- 🔒 Your entire strategy

---

## 💡 User Experience

**Step 1: Login (10 seconds)**
- Click "Connect with Privy"
- Enter email or login with Google/Twitter
- Embedded wallet created automatically
- No seed phrases, no extensions, no friction

**Step 2: Design Fractal (30 seconds)**
- Drag slider: Liquidity amount (e.g., 1 ETH + 2000 USDC)
- Adjust center price (where you think market will trade)
- Set spread width (±10% for stable, ±50% for volatile)
- Choose fractal depth (3-10 levels of recursion)
- See real-time preview of your curve

**Step 3: Deploy Private Position (15 seconds)**
- Click "Generate ZK Proof" (happens in browser)
- Click "Deploy Position"
- Sign with embedded wallet (no popup, seamless)
- Position live on Movement in 2 seconds

**Total time: Under 1 minute from zero to earning fees privately.**

---

## 🎨 Fractal Types

VoxelFi offers pre-built fractal strategies optimized for different market conditions:

### 📊 Market Maker (Fibonacci)
- Golden ratio decay (61.8% per level)
- Dense liquidity at current price
- Smooth taper to edges
- **Best for:** Stable pairs, high-volume trading

### 🌊 Volatility Hedge (Cantor Dust)  
- Sparse at center, dense at extremes
- Captures flash crashes and pumps
- Tail-risk protection
- **Best for:** Volatile assets, black swan coverage

### ⚡ High-Frequency (Mandelbrot)
- Chaotic attractor pattern
- Multiple liquidity hotspots
- Adapts to price action
- **Best for:** Algo traders, MEV extractors

### 🎯 Custom
- Define your own fractal parameters
- Experiment with novel curves
- Backtest against historical data (post hackathon plan)
- **Best for:** Quant funds, researchers

---

## 🏗️ Technical Architecture

**Smart Contracts (Movement Network)**
- `fractal_position.move` — Core position manager, NFT minting
- `vault.move` — Token custody, fee collection
- `zk_verifier.move` — ZK proof verification on-chain

**ZK Circuits (Circom)**
- Proves fractal parameters are valid
- Proves liquidity amount matches deposit
- Proves user owns position (for withdrawals)
- No trusted setup required

**Frontend (Using Replit AI + Privy)**
- Embedded wallet integration
- Real-time fractal visualization
- ZK proof generation in browser
- Position management dashboard

**All infrastructure runs on Movement M1 testnet.**

---

## 🎯 Use Cases

### 🏦 Institutional Liquidity Providers
**Problem:** Hedge funds can't deploy millions publicly—competitors front-run every move.  
**Solution:** VoxelFi lets institutions provide liquidity privately while proving compliance with ZK proofs.

### 🤖 MEV-Resistant Trading
**Problem:** Public LP positions are sandwich-bot honeypots.  
**Solution:** Bots can't calculate optimal attack because your parameters are hidden.

### 📊 Quantitative Funds  
**Problem:** Proprietary pricing models leak alpha when deployed on-chain.  
**Solution:** Keep your curve secret, earn fees without revealing your edge.

### 🔒 Privacy Advocates
**Problem:** Every DeFi move tracked, analyzed, copied.  
**Solution:** Transact privately while staying fully on-chain and verifiable.

### 🧪 DeFi Researchers
**Problem:** Can't experiment with novel AMM curves—everything public.  
**Solution:** Test experimental fractals without tipping off the market.

---

## 🌟 Why Movement + Privy?

### Movement Network
- **Move Language** — Formal verification prevents exploits
- **Sub-$0.001 Fees** — Makes complex fractal math economical  
- **2-Second Finality** — Fast enough for active trading
- **EVM Compatible**

### Privy Integration
- **No Seed Phrases** — 80% of users lose/forget them
- **Social Login** — Email, Google, Twitter, GitHub
- **Embedded Wallets** — Sign transactions without popups
- **User-Owned** — Full export/recovery capabilities

**Together:** The first DeFi that feels like using Robinhood, but you actually own your assets.**

---

## 📊 Competitive Advantage

| Feature | Uniswap V3 | Ambient | **VoxelFi** |
|---------|------------|---------|-------------|
| Multi-range positions | ❌ Manual | ✅ Automated | ✅ **Fractal** |
| Privacy | ❌ None | ❌ None | ✅ **ZK Proofs** |
| Gas per position | 200K | 150K | **80K** |
| Onboarding UX | Metamask | Metamask | **Email login** |
| Capital efficiency | Medium | High | **Extreme** |
| Strategy protection | ❌ | ❌ | ✅ **Hidden** |

---

## 🗺️ Roadmap

### ✅ Now: Hackathon MVP
- Fractal position manager (binary tree type)
- Basic ZK privacy (commitment scheme)
- Multiple fractal types (Fibonacci, Mandelbrot, etc.)
- Privy wallet integration
- 3D visualization
- 3D octree spatial indexing (price × time × volatility)

### Post hackathon:
- Auto-rebalancing based on market conditions
- Cross-chain aggregation (Movement + Ethereum + Arbitrum)
- Institutional API and trading terminal
- Public SDK for developers
- Integration with major DEXs
- Governance token launch
- Community-designed fractals
- LP strategy marketplace
- DAO treasury management

---

## 💰 Market Opportunity

**Total Addressable Market:**
- $100B locked in AMMs globally
- $20B in concentrated liquidity protocols
- $5B institutional DeFi participation (growing 300% YoY)

**VoxelFi Target:**
- Year 1: $10M TVL (0.01% market share)
- Year 2: $100M TVL (institutional adoption)
- Year 3: $1B TVL (become standard for private liquidity)

**Revenue Model:**
- 0.05% protocol fee on all swaps through fractal positions
- Premium fractal templates (subscription)
- Institutional API access
- White-label licensing

---

## 🏆 Why VoxelFi?

**For LPs:**
- 📈 Higher capital efficiency (earn more fees per dollar)
- 🔒 Strategy protection (no more copycats)
- ⚡ Gas savings (100x cheaper than multi-range)
- 🎯 Better UX (email login, no seed phrases)

**For Traders:**
- 💧 Deeper liquidity (more LPs = tighter spreads)
- 🤖 Less MEV (hidden parameters = less exploitation)
- 🚀 Faster execution (Movement's speed)
- 💰 Lower fees (protocol efficiency)

**For Movement Ecosystem:**
- 🧲 Attracts institutional capital (privacy = requirement)
- 🛠️ Showcases Move's capabilities (complex math on-chain)
- 👥 Grows user base (Privy onboards non-crypto natives)
- 🏗️ Protocol infra (others build on VoxelFi)

---

## VoxelFi

*Where mathematics meets privacy.*  
*Built on Movement. Powered by Privy.*
