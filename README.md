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

## 🏗️ Project Structure

```
voxel-fi/
├── src/                    # Frontend (React + TypeScript + Vite)
│   ├── components/         # UI components
│   ├── services/           # API & blockchain services
│   ├── context/            # Wallet context
│   ├── hooks/              # Custom React hooks
│   └── config/             # Configuration
├── api/                    # Express.js Backend
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── aptos/          # Movement Network client
│   │   └── zk/             # ZK proof generation
│   └── package.json
├── fractal_tree/           # Move Smart Contracts
│   ├── sources/
│   │   ├── fractal_position.move
│   │   ├── vault.move
│   │   └── zk_verifier.move
│   └── Move.toml
├── zk/                     # Zero-Knowledge Circuits
│   ├── circuits/           # Circom circuits
│   ├── handler/            # Proof generation handlers
│   └── build_*/            # Compiled circuits
└── docs/                   # Documentation
```

---

## 🚀 Quick Start

### Frontend (Development)
```bash
npm install
npm run dev
```

### Backend API
```bash
cd api
npm install
npm run dev
```

### Environment Variables
```
# Frontend
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_MOVEMENT_RPC_URL=https://testnet.movementnetwork.xyz/v1
VITE_MOVEMENT_CHAIN_ID=250
VITE_MODULE_ADDRESS=your_module_address
VITE_API_URL=http://localhost:8080

# Backend
MOVEMENT_RPC=https://testnet.movementnetwork.xyz/v1
MODULE_ADDRESS=your_module_address
```

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

### 📊 Market Maker (Fibonacci)
- Golden ratio decay (61.8% per level)
- Dense liquidity at current price
- **Best for:** Stable pairs, high-volume trading

### 🌊 Volatility Hedge (Cantor Dust)  
- Sparse at center, dense at extremes
- Captures flash crashes and pumps
- **Best for:** Volatile assets, black swan coverage

### ⚡ High-Frequency (Mandelbrot)
- Chaotic attractor pattern
- Multiple liquidity hotspots
- **Best for:** Algo traders, MEV extractors

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

**Frontend (React + Vite + Privy)**
- Embedded wallet integration
- Real-time fractal visualization
- ZK proof generation in browser
- Position management dashboard

**Backend API (Express.js)**
- Position queries and management
- Liquidity calculations
- ZK proof coordination

---

## 🌟 Why Movement + Privy?

### Movement Network
- **Move Language** — Formal verification prevents exploits
- **Sub-$0.001 Fees** — Makes complex fractal math economical  
- **2-Second Finality** — Fast enough for active trading

### Privy Integration
- **No Seed Phrases** — 80% of users lose/forget them
- **Social Login** — Email, Google, Twitter, GitHub
- **Embedded Wallets** — Sign transactions without popups

---

## 📊 Competitive Advantage

| Feature | Uniswap V3 | Ambient | **VoxelFi** |
|---------|------------|---------|-------------|
| Multi-range positions | ❌ Manual | ✅ Automated | ✅ **Fractal** |
| Privacy | ❌ None | ❌ None | ✅ **ZK Proofs** |
| Gas per position | 200K | 150K | **80K** |
| Onboarding UX | Metamask | Metamask | **Email login** |
| Capital efficiency | Medium | High | **Extreme** |

---

## VoxelFi

*Where mathematics meets privacy.*  
*Built on Movement. Powered by Privy.*
