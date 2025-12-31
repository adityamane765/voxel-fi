# VoxelFi — ZK-Powered Spatial Liquidity Protocol

**Trade, visualize, and fracture liquidity positions as NFTs in a 3D spatial universe**

[![Built on Movement](https://img.shields.io/badge/Built%20on-Movement-blue)](https://movementlabs.xyz)
[![Privy Wallets](https://img.shields.io/badge/Wallets-Privy-purple)](https://privy.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## What is VoxelFi?

VoxelFi reimagines DeFi liquidity as a **3D spatial experience**. Instead of abstract numbers in a table, your liquidity positions become **glowing voxels** in an interactive universe that you can explore, trade, and fracture.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    THE LIQUIDITY UNIVERSE                           │
│                                                                     │
│           ◆                              ◇                          │
│              ◆     ●                         ◇                      │
│         ◆              ●    Your Position        ◇                  │
│                   ●  ══════════▶  ◈  ◀══════════                   │
│              ◆         ●              ◇        ◇                    │
│                  ◆          ●    ◇                                  │
│        ◆                            ◇                               │
│                                                                     │
│    ◆ = High Liquidity    ● = Medium    ◇ = Low    ◈ = Your NFT    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Innovation: Fractal Liquidity

VoxelFi introduces **fractal liquidity curves**—self-similar mathematical patterns that provide infinite price coverage with capital efficiency. Unlike traditional concentrated liquidity:
- **Fractal curves** recursively subdivide price ranges, ensuring liquidity at every scale
- **Private parameters** are proven valid via ZK-SNARKs without revealing your strategy
- **Spatial indexing** enables O(1) liquidity lookups during swaps
- **Position NFTs** represent ownership of your unique fractal configuration

---

## Key Features

### 1. Spatial Position NFTs
Your liquidity isn't just numbers—it's a **location in 3D space**. Each position is indexed by:
- **X-axis:** Price bucket (where your liquidity is centered)
- **Y-axis:** Volatility classification (stable, medium, volatile)
- **Z-axis:** Fractal depth (recursion level)

### 2. Fractal NFT System
Split your positions into smaller, independently tradable pieces:
```
       Parent NFT ($10,000)
              │
    ┌─────────┼─────────┐
    │         │         │
Child A    Child B    Child C
 $4,000     $3,500     $2,500
```
Each child NFT:
- Inherits proportional liquidity
- Earns its own fees
- Can be traded or fractured further

### 3. Zero-Knowledge Privacy
Prove things about your position without revealing details:
- **Private Ownership:** Prove you own a position without revealing your address
- **Private Value:** Prove your position is worth ">$10,000" without showing the exact amount
- **Private Strategy:** Your fractal parameters stay encrypted

### 4. 3D Liquidity Universe
An immersive dashboard where:
- Positions appear as **glowing voxels**
- Size = liquidity depth
- Color = health score / APR
- Click to interact, claim fees, or fracture

### 5. Seamless Privy Onboarding
- Sign in with **Google, Twitter, Discord, or Email**
- Embedded wallet created automatically
- No seed phrases, no extensions
- **60 seconds** from zero to trading

---

## How It Works

### For Liquidity Providers

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LIQUIDITY PROVIDER FLOW                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. SIGN IN                                                         │
│     └── Social login via Privy (Google/Twitter/Email)              │
│                                                                     │
│  2. DEPOSIT                                                         │
│     └── Add WETH + USDC to the protocol                            │
│                                                                     │
│  3. CONFIGURE                                                       │
│     ├── Set price center (where you expect trading)                │
│     ├── Set spread (price range coverage)                          │
│     ├── Choose fractal type (Fibonacci, Cantor, etc.)             │
│     └── Select depth (1-4 levels of recursion)                     │
│                                                                     │
│  4. MINT NFT                                                        │
│     └── Your position becomes a tradable NFT in the spatial index  │
│                                                                     │
│  5. EARN FEES                                                       │
│     └── Every swap through your range pays you 0.25%               │
│                                                                     │
│  6. MANAGE                                                          │
│     ├── Claim accumulated fees anytime                             │
│     ├── Fracture into smaller NFTs                                 │
│     ├── Trade your position NFT                                    │
│     └── Burn to withdraw liquidity                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### For Traders

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TRADER FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Connect wallet (Privy social login)                            │
│                                                                     │
│  2. Enter swap amount (e.g., 100 USDC → WETH)                      │
│                                                                     │
│  3. See quote with:                                                 │
│     ├── Expected output                                             │
│     ├── Price impact                                                │
│     ├── Minimum received (after slippage)                          │
│     └── Fee breakdown                                               │
│                                                                     │
│  4. Execute swap (signed with embedded wallet)                     │
│                                                                     │
│  5. Receive tokens in ~2 seconds                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fee Structure

| Fee Type | Rate | Recipient |
|----------|------|-----------|
| **Swap Fee** | 0.30% | Split below |
| → LP Share | 0.25% | Position NFT holders |
| → Protocol | 0.05% | Treasury |

### Fee Distribution
Fees are distributed based on **geometric mean liquidity**:
```
your_share = sqrt(your_x × your_y) / total_liquidity × fees
```

This ensures fair distribution regardless of token price ratios.

---

## Fractal Types

| Type | Pattern | Best Use Case |
|------|---------|---------------|
| **Binary** | Even 50/50 splits | Simple, predictable |
| **Fibonacci** | Golden ratio (61.8%) | Market making |
| **Linear** | Uniform distribution | Wide coverage |
| **Exponential** | Center-heavy | High conviction |
| **Cantor** | Edge-heavy gaps | Volatility hedging |

---

## Technical Architecture

### Smart Contracts (Movement/Aptos)

```
fractal_position.move    ─── Position lifecycle, NFT minting/burning
        │
        ├──▶ vault.move           ─── Token custody, swap execution
        │
        ├──▶ spatial_octree.move  ─── 3D Morton-encoded spatial index
        │
        ├──▶ fee_distributor.move ─── Global accumulator fee system
        │
        └──▶ zk_verifier.move     ─── Commitment & nullifier storage
```

### Frontend (Next.js + React Three Fiber)

```
src/
├── app/                    # Pages (create, swap, dashboard)
├── components/
│   ├── LiquidityUniverse   # 3D visualization
│   ├── OnboardingFlow      # 60-second demo
│   └── WalletConnect       # Privy integration
├── hooks/
│   ├── useVoxelFi          # Main protocol hook
│   ├── useMovementWallet   # Privy + Movement
│   └── useZKProof          # Client-side proofs
└── services/
    └── aptos.ts            # Contract bindings
```

### ZK Circuits (Circom/Groth16)

```
zk/
├── circuits/
│   ├── ownership.circom    # Prove NFT ownership privately
│   └── range_proof.circom  # Prove value in range
└── handler/
    ├── poseidon.ts         # Hash commitments
    └── ownership.ts        # Generate proofs
```

---

## Quick Start for Local Setup

### Prerequisites
- Node.js 18+
- Movement CLI (for contract deployment)

### Run Frontend
```bash
npm install
npm run dev
```

### Deploy Contracts
```bash
cd fractal_tree
movement init --profile <profile_name>
movement move publish --profile <profile_name>
```
Update address in Move.toml and config.sh ( also the profile in config.sh )
Then run the testing scripts

### Environment
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

---

## Hackathon Tracks

### Best New Defi App or Defi built on top of existing Movement Protocols
### Best App on Movement Using Privy Wallets
### The People's Choice
---
## PRIVY implementation

| Feature               | Implementation                  |
|-----------------------|---------------------------------|
| Social Login          | Google, Twitter, Discord, Email |
| Instant Wallets       | No seed phrases needed          |
| Seamless Signing      | No popup interruptions          |
| 60-Second Demo        | Complete onboarding flow        |
| Session Keys          | Pre-approved trading sessions   |
| Transaction Batching  | Multi-step operations           |

---

## Deployment

### Current Testnet

| Component | Value |
|-----------|-------|
| Network | Movement Testnet |
| RPC | `https://testnet.movementnetwork.xyz/v1` |
| Chain ID | 250 |
| Module | `0x1bb2b78e8e8d931a01789f0ab59e2a75f1eaa9838eeabb184a75a653f1c129da` |

---

## What Makes VoxelFi Different?

| Feature | Traditional AMM | VoxelFi |
|---------|----------------|---------|
| Position representation | Abstract numbers | **3D spatial voxels** |
| Position ownership | Wallet-locked | **Tradable NFTs** |
| Position management | All or nothing | **Fracture into pieces** |
| Privacy | Fully public | **ZK proofs** |
| Onboarding | Wallet extension | **Social login** |
| Visualization | Tables & charts | **Interactive 3D universe** |

---

## Roadmap

- [x] Core smart contracts
- [x] Spatial octree indexing
- [x] Position NFT system
- [x] Fee distribution mechanism
- [x] ZK circuits (ownership, range proofs)
- [x] Privy integration
- [x] 3D visualization dashboard
- [x] 60-second onboarding flow
- [ ] NFT fracturing UI
- [ ] Position NFT marketplace
- [ ] Mainnet deployment

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Complete design overview
- [Fee Structure](docs/FEE_STRUCTURE.md) - Detailed fee documentation
- [ZK Docs](zk/README.md) - ZK documentation

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## **VoxelFi** — *Fractal Liquidity Protocol*
*Built on Movement Network. Powered by Privy Wallets*
