# VoxelFi Architecture

This document provides a comprehensive overview of VoxelFi's system architecture, including component interactions, data flows, and design decisions for the ZK-Powered Spatial Liquidity Protocol.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Concepts](#core-concepts)
3. [Position NFT Architecture](#position-nft-architecture)
4. [Fractal NFT System](#fractal-nft-system)
5. [3D Liquidity Universe](#3d-liquidity-universe)
6. [Smart Contract Architecture](#smart-contract-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [ZK Architecture](#zk-architecture)
9. [Spatial Indexing](#spatial-indexing)
10. [Data Flow Diagrams](#data-flow-diagrams)
11. [Security Architecture](#security-architecture)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VOXELFI: ZK-POWERED SPATIAL LIQUIDITY                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         THE LIQUIDITY UNIVERSE                              │
│                                                                             │
│           ◆                              ◇                                  │
│              ◆     ●                         ◇                              │
│         ◆              ●    Your Position        ◇                          │
│                   ●  ══════════▶  ◈  ◀══════════                            │
│              ◆         ●              ◇        ◇                            │
│                  ◆          ●    ◇                                          │
│        ◆                            ◇                                       │
│                                                                             │
│    ◆ = High          ● = Medium        ◇ = Low            ◈ = Your NFT      │
│        Volatility        Volatility        Volatility                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────┐   │
│   │             │     │    PRIVY    │     │     MOVEMENT NETWORK        │   │
│   │    USER     │────▶│    Auth     │────▶│                             │   │
│   │  (Browser)  │     │    Layer    │     │  ┌───────────────────────┐  │   │
│   └─────────────┘     └─────────────┘     │  │   Smart Contracts     │  │   │
│         │                                 │  │                       │  │   │
│         │                                 │  │  fractal_position     │  │   │
│         ▼                                 │  │  vault                │  │   │
│   ┌─────────────┐                         │  │  spatial_octree       │  │   │
│   │             │                         │  │  zk_verifier          │  │   │
│   │             │─────────────────────────│  │  fee_distributor      │  │   │
│   |  FRONTEND   │     Transactions        │  │                       │  │   │
│   │             │◀────────────────────────│  └───────────────────────┘  │   │
│   │             │     Events/Data         │                             │   │
│   └─────────────┘                         └─────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────┐                                               │
│   │  ZK Verification Layer  │                                               │
│   └─────────────────────────┘                                               │
└───────────────────────────────────────────────────────────────────────────--┘
```

---

## Core Concepts

### What Makes VoxelFi Different

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TRADITIONAL AMM vs VOXELFI                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   TRADITIONAL AMM                         VOXELFI                           │
│   ───────────────                         ───────                           │
│                                                                             │
│   Position = Numbers in DB                Position = NFT in 3D Space        │
│   ┌────────────────────┐                  ┌────────────────────────────┐    │
│   │ LP #1234           │                  │    ◈ (Glowing Voxel)       │    │
│   │ Value: $10,000     │                  │    │                       │    │
│   │ Share: 2.5%        │                  │    ├── X: Price bucket     │    │
│   └────────────────────┘                  │    ├── Y: Volatility       │    │
│                                           │    └── Z: Fractal depth    │    │
│                                           └────────────────────────────┘    │
│                                                                             │
│   Management = All or Nothing             Management = Fracture & Trade     │
│   ┌────────────────────┐                  ┌────────────────────────────┐    │
│   │ [Withdraw All]     │                  │ Parent  NFT ($10,000)      │    │
│   │                    │                  │          ╱    │    ╲       │    │
│   │ No partial exit    │                  │ Child   A     B     C      │    │
│   └────────────────────┘                  │      $4000  $3500  $2500   │    │
│                                           └────────────────────────────┘    │
│                                                                             │
│   Privacy = Fully Public                  Privacy = ZK Proofs               │
│   ┌────────────────────┐                  ┌────────────────────────────┐    │
│   │ Address: 0x7f3a... │                  │ Commitment: 0x8c4f...      │    │
│   │ Strategy: VISIBLE  │                  │ Strategy: ENCRYPTED        │    │
│   │ Amount: $50,000    │                  │ Amount: ">$10,000" (ZK)    │    │
│   └────────────────────┘                  └────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Position NFT Architecture

### Position as a Spatial Entity

Every liquidity position in VoxelFi is minted as an NFT that exists in a 3D coordinate space (Octree):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      POSITION NFT STRUCTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────-──┐  │
│   │                         POSITION NFT                                 │  │
│   │                    (AptosToken in Collection)                        │  │
│   ├────────────────────────────────────────────────────────────────────-─┤  │
│   │                                                                      │  │
│   │   Token Address: 0x1a2b3c...                                         │  │
│   │   Collection: "Voxel Positions"                                      │  │
│   │   Owner: 0x7f3a...                                                   │  │
│   │                                                                      │  │
│   │   ┌─────────────────────────────────────────────────────────────-──┐ │  │
│   │   │                  PositionDataStore                             │ │  │
│   │   │                  (Resource at token address)                   │ │  │
│   │   ├────────────────────────────────────────────────────────────-───┤ │  │
│   │   │                                                                │ │  │
│   │   │   SPATIAL COORDINATES                                          │ │  │
│   │   │   ├── price_center: u64      (X-axis: $2,500 - $3,500)         │ │  │
│   │   │   ├── volatility: u8         (Y-axis: stable/medium/volatile)  │ │  │
│   │   │   └── depth: u8              (Z-axis: fractal recursion 1-4)   │ │  │
│   │   │                                                                │ │  │
│   │   │   LIQUIDITY DATA                                               │ │  │
│   │   │   ├── amount_x: u64          (WETH deposited)                  │ │  │
│   │   │   ├── amount_y: u64          (USDC deposited)                  │ │  │
│   │   │   ├── total_liquidity: u128  (sqrt(x * y))                     │ │  │
│   │   │   └── spread: u64            (price range coverage)            │ │  │
│   │   │                                                                │ │  │
│   │   │   FRACTAL PARAMETERS                                           │ │  │
│   │   │   ├── fractal_type: u8       (Binary/Fibonacci/Cantor/etc)     │ │  │
│   │   │   ├── parent_token: Option   (null if root, addr if child)     │ │  │
│   │   │   └── children: vector       (addresses of child NFTs)         │ │  │
│   │   │                                                                │ │  │
│   │   │   FEE TRACKING                                                 │ │  │
│   │   │   ├── fees_checkpoint_x: u128                                  │ │  │
│   │   │   ├── fees_checkpoint_y: u128                                  │ │  │
│   │   │   ├── total_fees_earned_x: u64                                 │ │  │
│   │   │   └── total_fees_earned_y: u64                                 │ │  │
│   │   │                                                                │ │  │
│   │   │   PRIVACY (ZK)                                                 │ │  │
│   │   │   ├── commitment: u256       (Poseidon hash of secret)         │ │  │
│   │   │   └── nullifier_hash: u256   (prevents double-spend)           │ │  │
│   │   │                                                                │ │  │
│   │   └────────────────────────────────────────────────────────────-───┘ │  │
│   │                                                                      │  │
│   └────────────────────────────────────────────────────────────────-─────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Position Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      POSITION NFT LIFECYCLE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. MINT                     2. EARN                    3. MANAGE          │
│   ─────                       ────                       ──────             │
│   ┌──────────────┐           ┌──────────────┐           ┌──────────────┐    │
│   │  User adds   │           │ Swaps occur  │           │ Options:     │    │
│   │  WETH + USDC │           │ through pool │           │              │    │
│   │              │           │              │           │ • Claim fees │    │
│   │  ┌────────┐  │           │  ┌────────┐  │           │ • Fracture   │    │
│   │  │ Tokens │  │  ──────▶  │  │ Fees   │  │  ──────▶  │ • Trade NFT  │    │
│   │  └───┬────┘  │           │  │ accrue │  │           │ • Burn       │    │
│   │      │       │           │  └────────┘  │           │              │    │
│   │      ▼       │           │              │           └──────────────┘    │
│   │  ┌────────┐  │           │  0.25% of    │                  │            │
│   │  │ NFT ◈  │  │           │  each swap   │                  │            │
│   │  └────────┘  │           │              │                  ▼            │
│   └──────────────┘           └──────────────┘           ┌──────────────┐    │
│                                                         │              │    │
│   4. FRACTURE (Not implemented yet)                     │ 5. BURN      │    │
│   ──────────────────────                                │ ─────        │    │
│   ┌─────────────────────────────────────────┐           │ Withdraw all │    │
│   │                                         │           │ liquidity    │    │
│   │         Parent NFT ($10,000)            │           │              │    │
│   │                │                        │           │ NFT deleted  │    │
│   │                │ fracture               │           │ Tokens       │    │
│   │                │ (ratio: 40:35:25)      │           │ returned     │    │
│   │   ┌────-───-─┬─┴────────-──┐            │           │              │    │
│   │   │          │             │            │           └──────────────┘    │
│   │   ▼          ▼             ▼            │                               │
│   │ Child A    Child B       Child C        │                               │
│   │ $4,000     $3,500        $2,500         │                               │
│   │                                         │                               │
│   │ Each child is independent:              │                               │
│   │ • Own fee accumulation                  │                               │
│   │ • Can be traded separately              │                               │
│   │ • Can be fractured further              │                               │
│   │                                         │                               │
│   └─────────────────────────────────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fractal NFT System

### Fractal Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRACTAL TYPES                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   BINARY (type: 0)              FIBONACCI (type: 1)                         │
│   ────────────────              ────────────────────                        │
│   Even 50/50 splits             Golden ratio (61.8%)                        │
│                                                                             │
│        $10,000                          $10,000                             │
│          │                                 │                                │
│       ┌──┴──┐                          ┌───┴────┐                           │
│       │     │                          │        │                           │
│      $5k   $5k                       $6,180   $3,820                        │
│       │     │                          │        │                           │
│      ┌┴┐   ┌┴┐                      ┌──┴──┐  ┌──┴──┐                        │
│   2.5k 2.5k 2.5k 2.5k             3.8k  2.4k 2.4k 1.4k                      │
│                                                                             │
│   Best for: Simple,               Best for: Market making,                  │
│   predictable splits              optimal liquidity curves                  │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│   LINEAR (type: 2)              EXPONENTIAL (type: 3)                       │
│   ────────────────              ─────────────────────                       │
│   Uniform distribution               Center-heavy                           │
│                                                                             │
│       $10,000                       $10,000                                 │
│          │                             │                                    │
│   ┌───┬──┼──┬──┐                   ┌───┴───┐                                │
│   │   │  │  │  │                   │       │                                │
│   2k 2k 2k 2k 2k                $7,000  $3,000                              │
│                                    │       │                                │
│                                 ┌──┴──┐  ┌─┴─┐                              │
│                                5.5k 1.5k 2k  1k                             │
│                                                                             │
│   Best for: Wide price          Best for: High conviction                   │
│   range coverage                on specific price                           │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                             │
│   CANTOR (type: 4)                                                          │
│   ────────────────                                                          │
│   Edge-heavy with gaps (Cantor set pattern)                                 │
│                                                                             │
│       $10,000                                                               │
│          │                                                                  │
│   ┌──────┴─────────┐                                                        │
│   │        ∅       │    (middle third removed)                              │
│  $5k              $5k                                                       │
│   │                │                                                        │
│  ┌┴─────┐       ┌──┴───┐                                                    │
│ 2.5k ∅ 2.5k    2.5k ∅ 2.5k                                                  │
│                                                                             │
│   Best for: Volatility hedging, capturing tail events                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3D Liquidity Universe

### Visualization Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    3D LIQUIDITY UNIVERSE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   COORDINATE SYSTEM                                                         │
│   ─────────────────                                                         │
│                                                                             │
│                 Y-axis: Volatility                                          │
│                    │                                                        │
│                    │    ◆ Volatile                                          │
│                    │                                                        │
│                    │    ● Medium                                            │
│                    │                                                        │
│                    │    ◇ Stable                                            │
│                    │                                                        │
│                    └────────────────────── X-axis: Price                    │
│                   ╱                        $1000 → $5000                    │
│                  ╱                                                          │
│                 ╱  Z-axis: Depth                                            │
│                    (fractal recursion)                                      │
│                    1 → 4 levels                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
## Smart Contract Architecture

### Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SMART CONTRACT MODULES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │                     │                              │
│                        │  fractal_position   │  ◀── Main entry point        │
│                        │                     │                              │
│                        │  • mint_position    │                              │
│                        │  • burn_position    │                              │
│                        │  • claim_fees       │                              │
│                        │  • get_position     │                              │
│                        │                     │                              │
│                        └──────────┬──────────┘                              │
│                                   │                                         │
│              ┌────────────────────┼────────────────────┐                    │
│              │                    │                    │                    │
│              ▼                    ▼                    ▼                    │
│   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│   │                  │ │                  │ │                  │            │
│   │      vault       │ │  spatial_octree  │ │  fee_distributor │            │
│   │                  │ │                  │ │                  │            │
│   │  • deposit       │ │  • insert        │ │  • add_fees      │            │
│   │  • withdraw      │ │  • remove        │ │  • get_fees      │            │
│   │  • swap_x_for_y  │ │  • lookup        │ │  • distribute    │            │
│   │  • swap_y_for_x  │ │  • morton_encode │ │                  │            │
│   │  • get_reserves  │ │  • range_query   │ │                  │            │
│   │                  │ │                  │ │                  │            │
│   └────────┬─────────┘ └──────────────────┘ └──────────────────┘            │
│            │                                                                │
│            │                                                                │
│            ▼                                                                │
│   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│   │                  │ │                  │ │                  │            │
│   │   weth / usdc    │ │   zk_verifier    │ │ volatility_oracle│            │
│   │                  │ │                  │ │                  │            │
│   │  Test tokens     │ │  • store_commit  │ │  • update_price  │            │
│   │  (Coin<T>)       │ │  • use_nullifier │ │  • get_volatility│            │
│   │                  │ │  • verify        │ │  • get_bucket    │            │
│   └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                             │
│                        ┌──────────────────┐                                 │
│                        │                  │                                 │
│                        │ dashboard_stats  │                                 │
│                        │                  │                                 │
│                        │ • TVL tracking   │                                 │
│                        │ • Volume metrics │                                 │
│                        │ • Position count │                                 │
│                        │                  │                                 │
│                        └──────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```
---

## Frontend Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT HIERARCHY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                            RootLayout                                       │
│                                │                                            │
│                         WalletProvider                                      │
│                         (PrivyProvider)                                     │
│                                │                                            │
│               ┌────────────────┼────────────────┐                           │
│               │                │                │                           │
│               ▼                ▼                ▼                           │
│          ┌─────────┐     ┌──────────┐    ┌───────────┐                      │
│          │ Navbar  │     │   Page   │    │  Footer   │                      │
│          │         │     │ Content  │    │           │                      │
│          └────┬────┘     └────┬─────┘    └───────────┘                      │
│               │               │                                             │
│               ▼               │                                             │
│        WalletConnect          │                                             │
│        (Social Login)         │                                             │
│               │    ┌──────────┴──────────┬──────────────┬──────────┐        │
│               │    │                     │              │          │        │
│               │    ▼                     ▼              ▼          ▼        │
│               │ HomePage            CreatePage     SwapPage   DashboardPage │
│               │    │                     │              │          │        │
│               │    ▼                     ▼              ▼          ▼        │
│               │ ┌────────────┐    ┌────────────┐ ┌─────────┐ ┌──────────┐   │
│               │ │Onboarding  │    │Liquidity   │ │SwapForm │ │Liquidity │   │
│               │ │Flow        │    │Chart       │ │         │ │Universe  │   │
│               │ │            │    │            │ │QuoteCard│ │(3D)      │   │ 
│               │ │VoxelScene  │    │FractalType │ │         │ │          │   │  
│               │ │(3D Preview)│    │Selector    │ └─────────┘ │Position  │   │
│               │ └────────────┘    │            │             │Cards     │   │
│               │                   │DepthSlider │             │          │   │
│               │                   └────────────┘             │FeePanel  │   │
│               │                                              └──────────┘   │
│               │                                                             │
│               └───────────────────────────────────────────────────────▶     │
│                              Uses hooks: useVoxelFi, useMovementWallet      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### State Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STATE MANAGEMENT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌────────────────────────────────────────────────────────────────-─────┐  │
│   │                          PRIVY CONTEXT                               │  │
│   │                                                                      │  │
│   │   authenticated: boolean                                             │  │
│   │   user: { email, google, twitter, discord }                          │  │
│   │   wallets: ConnectedWallet[]                                         │  │
│   │   login(): void                                                      │  │
│   │   logout(): Promise<void>                                            │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────-────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌────────────────────────────────────────────────────────────-─────────┐  │
│   │                      useMovementWallet Hook                          │  │
│   │                                                                      │  │
│   │   address: string | null                                             │  │
│   │   isConnected: boolean                                               │  │
│   │   signAndSubmitTransaction(payload): Promise<Result>                 │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────-────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌──────────────────────────────────────────────────────────────-───────┐  │
│   │                        useVoxelFi Hook                               │  │
│   │                                                                      │  │
│   │   Combines: Auth + Wallet + Contract Operations                      │  │
│   │                                                                      │  │
│   │   mintPosition(params): Promise<Result>                              │  │
│   │   burnPosition(tokenAddr): Promise<Result>                           │  │
│   │   fracturePosition(tokenAddr, ratios): Promise<Result>  ◀── NEW      │  │
│   │   claimFees(tokenAddr): Promise<Result>                              │  │
│   │   swap(amount, min, dir): Promise<Result>                            │  │
│   │   getPosition(tokenAddr): Promise<PositionData>                      │  │
│   │   storedPositions: StoredPosition[]                                  │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────-────────────────┘  │
│                                    │                                        │
│                   ┌────────────────┼────────────────┐                       │
│                   ▼                ▼                ▼                       │
│             useSessionKeys   useTransactionBatch   useZKProof.              │
│                                                                             │
│   ┌────────────────────────────────────────────────────────────-─────────┐  │
│   │                    usePositionStorage Hook                           │  │
│   │                                                                      │  │
│   │   Client-side position tracking in localStorage                      │  │
│   │   Stores: tokenAddress, secret, parameters, proofs                   │  │
│   │                                                                      │  │
│   └───────────────────────────────────────────────────────────────-──────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ZK Architecture

### Zero-Knowledge Proof Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ZK PROOF FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   USER'S BROWSER (Private)              │   BLOCKCHAIN (Public)             │
│   ────────────────────────────          │   ─────────────────────           │
│                                         │                                   │
│   1. User creates position              │                                   │
│      ┌────────────────────┐             │                                   │
│      │ price_center: 3000 │             │                                   │
│      │ spread: 500        │             │                                   │
│      │ fractal_type: 1    │             │                                   │
│      │ depth: 3           │             │                                   │
│      │ secret: 7f3a...    │             │                                   │
│      └─────────┬──────────┘             │                                   │
│                │                        │                                   │
│                ▼                        │                                   │
│   2. Generate Poseidon Hash             │                                   │
│      ┌────────────────────┐             │                                   │
│      │ commitment =       │             │                                   │
│      │   Poseidon(        │             │                                   │
│      │     secret,        │             │                                   │
│      │     price_center,  │             │                                   │
│      │     spread,        │             │                                   │
│      │     fractal_type   │  ──────────────▶  ┌─────────────────────┐       │
│      │   )                │             │     │ commitment stored   │       │
│      └─────────┬──────────┘             │     │ in zk_verifier      │       │
│                │                        │     │                     │       │
│                │                        │     │ 0x8c4f2a...         │       │
│                ▼                        │     └─────────────────────┘       │
│   3. Store secret locally               │                                   │
│      ┌────────────────────┐             │                                   │
│      │ localStorage:      │             │                                   │
│      │   secret           │             │                                   │
│      │   parameters       │             │                                   │
│      │   tokenAddress     │             │                                   │
│      └────────────────────┘             │                                   │
│                                         │                                   │
│   ─────────────────────────────────────────────────────────────────────     │
│                                         │                                   │
│   WITHDRAWAL (Later)                    │                                   │
│   ──────────────────                    │                                   │
│                                         │                                   │
│   4. Generate ownership proof           │                                   │
│      ┌────────────────────┐             │                                   │
│      │ proof = Groth16(   │             │                                   │
│      │   circuit,         │             │                                   │
│      │   secret,          │  ──────────────▶  ┌─────────────────────┐       │
│      │   commitment       │             │     │ zk_verifier checks: │       │
│      │ )                  │             │     │ - commitment exists │       │
│      └────────────────────┘             │     │ - nullifier unused  │       │
│                                         │     │ - proof valid       │       │
│                                         │     └──────────┬──────────┘       │
│                                         │                │                  │
│                                         │                ▼                  │
│                                         │     ┌─────────────────────┐       │
│                                         │     │ Withdrawal approved │       │
│                                         │     │ Nullifier marked    │       │
│                                         │     │ Tokens transferred  │       │
│                                         │     └─────────────────────┘       │
│                                         │                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Spatial Indexing

### Morton Encoding (Z-Order Curve)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         SPATIAL INDEXING                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   3D Position Space                    Morton Key (64-bit)                 │
│   ─────────────────                    ───────────────────                 │
│                                                                            │
│   ┌─────────────────────────┐                                              │
│   │                         │          price_bucket (12 bits): 0-4095      │
│   │  Y (volatility)         │          volatility_bucket (2 bits): 0-3     │
│   │       │                 │          depth_bucket (2 bits): 0-3          │
│   │       │    ╱ Z(depth)   │                                              │
│   │       │   ╱             │          Morton interleaving:                │
│   │       │  ╱              │          ┌─────────────────────────────────┐ │
│   │       │ ╱               │          │ For each bit position i:        │ │
│   │       │╱                │          │   key[3i]   = price[i]          │ │
│   │       └───────────────  │          │   key[3i+1] = volatility[i]     │ │
│   │                X        │          │   key[3i+2] = depth[i]          │ │
│   │            (price)      │          └─────────────────────────────────┘ │
│   │                         │                                              │
│   └─────────────────────────┘          Example:                            │
│                                        price=5, vol=2, depth=1             │
│   Position → Morton Key                binary: 101, 10, 01                 │
│   ─────────────────────                                                    │
│   Ex:                                  interleaved: 100 110 011            │
│   price_center: $3000                  morton_key = 0b100110011 = 307      │
│   volatility: medium (2)                                                   │
│   depth: 3                                                                 │
│                                                                            │
│   → bucket(3000) = 1500                                                    │
│   → morton(1500, 2, 3) = 7A3F...                                           │
│                                                                            │
│                                                                            │
│   OCTREE STRUCTURE                                                         │
│   ────────────────                                                         │
│                                                                            │
│                    root                                                    │
│                     │                                                      │
│         ┌───────────┼───────────┐                                          │
│         │           │           │                                          │
│       node0       node1       node2       ...  (8 children per node)       │
│         │                                                                  │
│    ┌────┼────┐                                                             │
│    │    │    │                                                             │
│   pos  pos  pos    (positions stored at leaves)                            │
│                                                                            │
│   Lookup: O(1) via morton key                                              │
│   Insert: O(log n)                                                         │
│   Range query: O(k) where k = results                                      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Position Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      POSITION CREATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User                Frontend              Blockchain                      │
│    │                     │                      │                           │
│    │  1. Configure       │                      │                           │
│    │     position        │                      │                           │
│    │ ─────────────────▶  │                      │                           │
│    │                     │                      │                           │
│    │                     │  2. Generate ZK      │                           │
│    │                     │     commitment       │                           │
│    │                     │     (in browser)     │                           │
│    │                     │                      │                           │
│    │  3. Confirm         │                      │                           │
│    │ ─────────────────▶  │                      │                           │
│    │                     │                      │                           │
│    │                     │  4. Build tx:        │                           │
│    │                     │     mint_position    │                           │
│    │                     │                      │                           │
│    │                     │  5. Sign with        │                           │
│    │                     │     Privy wallet     │                           │
│    │                     │                      │                           │
│    │                     │  6. Submit tx        │                           │
│    │                     │ ──────────────────▶  │                           │
│    │                     │                      │                           │
│    │                     │                      │  7. Validate inputs       │
│    │                     │                      │                           │
│    │                     │                      │  8. Transfer tokens       │
│    │                     │                      │     to vault              │
│    │                     │                      │                           │
│    │                     │                      │  9. Calculate liquidity   │
│    │                     │                      │     sqrt(x * y)           │
│    │                     │                      │                           │
│    │                     │                      │  10. Insert into octree   │
│    │                     │                      │      (Morton encoding)    │
│    │                     │                      │                           │
│    │                     │                      │  11. Mint Position NFT    │
│    │                     │                      │                           │
│    │                     │                      │  12. Emit PositionMinted  │
│    │                     │  ◀────────────────── │                           │
│    │                     │     tx_hash + NFT    │                           │
│    │                     │                      │                           │
│    │                     │  13. Store position  │                           │
│    │                     │      in localStorage │                           │
│    │                     │      (with secret)   │                           │
│    │                     │                      │                           │
│    │  ◀───────────────── │                      │                           │
│    │     Success!        │                      │                           │
│    │ View in liquidity   │                      │                           │
│    │ universe            │                      │                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Swap Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SWAP EXECUTION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User Request                      Vault Contract                          │
│        │                                  │                                 │
│        │  swap_x_for_y(1000, 950)         │                                 │
│        │ ──────────────────────────────▶  │                                 │
│        │                                  │                                 │
│        │                                  │  1. Calculate fee               │
│        │                                  │     fee = 1000 * 0.3% = 3       │
│        │                                  │                                 │
│        │                                  │  2. Split fee                   │
│        │                                  │     LP: 2.5, Protocol: 0.5      │
│        │                                  │                                 │
│        │                                  │  3. Update fee accumulator      │
│        │                                  │     ┌─────────────────────────┐ │
│        │                                  │     │ fee_distributor::       │ │
│        │                                  │     │   add_fees(2.5, 0)      │ │
│        │                                  │     └─────────────────────────┘ │
│        │                                  │                                 │
│        │                                  │  4. Calculate output            │
│        │                                  │     output = 997 * Ry / Rx      │
│        │                                  │                                 │
│        │                                  │  5. Check slippage              │
│        │                                  │     assert!(output >= 950)      │
│        │                                  │                                 │
│        │                                  │  6. Update reserves             │
│        │                                  │     Rx += 997                   │
│        │                                  │     Ry -= output                │
│        │                                  │                                 │
│        │                                  │  7. Transfer tokens             │
│        │                                  │     user ─▶ vault: 1000 X       │
│        │                                  │     vault ─▶ user: output Y     │
│        │                                  │                                 │
│        │  ◀────────────────────────────── │                                 │
│        │         output amount            │                                 │
│        │                                  │                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Access Control Matrix

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        ACCESS CONTROL MATRIX                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   Function                  │ Visibility      │ Caller Restriction         │
│   ─────────────────────────────────────────────────────────────────────    │
│   mint_position             │ public entry    │ Any user                   │
│   burn_position             │ public entry    │ NFT owner only             │
│   fracture_position         │ public entry    │ NFT owner only             │
│   claim_fees                │ public entry    │ NFT owner only             │
│   swap_x_for_y              │ public entry    │ Any user                   │
│   ─────────────────────────────────────────────────────────────────────    │
│   vault::deposit            │ public(friend)  │ fractal_position only      │
│   vault::withdraw           │ public(friend)  │ fractal_position only      │
│   octree::insert            │ public(friend)  │ fractal_position only      │
│   octree::remove            │ public(friend)  │ fractal_position only      │
│   oracle::update_price      │ public(friend)  │ Authorized modules only    │
│   ─────────────────────────────────────────────────────────────────────    │
│   get_position_data         │ public view     │ Anyone (read-only)         │
│   get_reserves              │ public view     │ Anyone (read-only)         │
│   get_unclaimed_fees        │ public view     │ Anyone (read-only)         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Related Documentation

- [README](../README.md)
- [Fee Structure](FEE_STRUCTURE.md)