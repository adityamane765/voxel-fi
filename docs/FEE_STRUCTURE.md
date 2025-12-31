# VoxelFi Fee Structure

This document describes the fee mechanism in VoxelFi, including collection, distribution, and claiming processes.

---

## Overview

VoxelFi uses a **proportional fee distribution model** where swap fees are collected and distributed to liquidity providers based on their share of total liquidity.

```
┌─────────────────────────────────────────────────────────────────┐
│                        SWAP EXECUTION                           │
│                                                                 │
│   User swaps 1000 USDC → WETH                                  │
│                                                                 │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
│   │  Input      │────▶│  Fee Split  │────▶│  Output     │     │
│   │  1000 USDC  │     │  3 USDC fee │     │  ~0.32 WETH │     │
│   └─────────────┘     └─────────────┘     └─────────────┘     │
│                              │                                  │
│                              ▼                                  │
│                   ┌─────────────────────┐                      │
│                   │   Fee Distribution   │                      │
│                   ├─────────────────────┤                      │
│                   │ LPs: 2.5 USDC (83%) │                      │
│                   │ Protocol: 0.5 (17%) │                      │
│                   └─────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fee Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `SWAP_FEE_BPS` | 30 | Total swap fee (0.30%) |
| `LP_FEE_BPS` | 25 | LP share (0.25%) |
| `PROTOCOL_FEE_BPS` | 5 | Protocol share (0.05%) |

### Calculation Example

For a swap of **1,000 USDC**:

```
Total Fee    = 1,000 × 0.30% = 3.00 USDC
LP Fee       = 1,000 × 0.25% = 2.50 USDC
Protocol Fee = 1,000 × 0.05% = 0.50 USDC
```

---

## Fee Collection

Fees are collected during swap execution in `vault.move`:

```move
public(friend) fun swap_x_for_y(
    account: &signer,
    amount_x_in: u64,
    min_y_out: u64
): u64 {
    // Calculate fee
    let fee_amount = (amount_x_in * SWAP_FEE_NUMERATOR) / SWAP_FEE_DENOMINATOR;
    let amount_after_fee = amount_x_in - fee_amount;

    // Split fee
    let lp_fee = (fee_amount * LP_FEE_BPS) / TOTAL_FEE_BPS;
    let protocol_fee = fee_amount - lp_fee;

    // Add LP fee to accumulator
    fee_distributor::add_fees(lp_fee, 0);

    // Protocol fee stays in vault
    // ...
}
```

---

## Fee Distribution Model

### Global Accumulator Pattern

VoxelFi uses a **global accumulator pattern** for gas-efficient fee distribution. Instead of updating every position on each swap, we maintain global counters:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GLOBAL FEE ACCUMULATOR                       │
│                                                                 │
│  fees_per_liquidity_x: 0.00000542 WETH per unit               │
│  fees_per_liquidity_y: 0.00234100 USDC per unit               │
│  total_liquidity: 1,450,000 units                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Position A   │   │  Position B   │   │  Position C   │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ liquidity:    │   │ liquidity:    │   │ liquidity:    │
│ 500,000       │   │ 750,000       │   │ 200,000       │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ checkpoint_x: │   │ checkpoint_x: │   │ checkpoint_x: │
│ 0.00000312    │   │ 0.00000412    │   │ 0.00000542    │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ unclaimed:    │   │ unclaimed:    │   │ unclaimed:    │
│ 1.15 WETH     │   │ 0.975 WETH    │   │ 0 WETH        │
└───────────────┘   └───────────────┘   └───────────────┘
```

### How It Works

1. **On Each Swap:**
   ```
   fees_per_liquidity += fee_amount / total_liquidity
   ```

2. **On Fee Claim:**
   ```
   unclaimed = (global_fees_per_liquidity - position_checkpoint) × position_liquidity
   position_checkpoint = global_fees_per_liquidity
   ```

3. **Benefits:**
   - O(1) fee distribution regardless of position count
   - No iteration over positions
   - Positions can claim anytime

---

## Liquidity Calculation

Position liquidity is calculated using the **geometric mean**:

```
liquidity = sqrt(amount_x × amount_y)
```

### Why Geometric Mean?

| Method | Formula | Problem |
|--------|---------|---------|
| Sum | `x + y` | Unfair when token prices differ |
| Product | `x × y` | Units don't make sense |
| **Geometric Mean** | `sqrt(x × y)` | Fair, unit-agnostic |

### Example

Position with 1 WETH ($3,000) + 3,000 USDC ($3,000):

```
Arithmetic: 1 + 3000 = 3001 (USDC dominates)
Geometric:  sqrt(1 × 3000) = 54.77 (balanced)
```

---

## Fee Claiming Process

```
┌─────────────────────────────────────────────────────────────────┐
│                     FEE CLAIM FLOW                              │
│                                                                 │
│  1. User calls claim_fees(token_address, market_price)         │
│                         │                                       │
│                         ▼                                       │
│  2. Calculate unclaimed fees                                    │
│     ┌─────────────────────────────────────────┐                │
│     │ fees_x = (global_x - checkpoint_x) × L  │                │
│     │ fees_y = (global_y - checkpoint_y) × L  │                │
│     └─────────────────────────────────────────┘                │
│                         │                                       │
│                         ▼                                       │
│  3. Update checkpoint to current global                         │
│     ┌─────────────────────────────────────────┐                │
│     │ checkpoint_x = global_fees_per_liq_x    │                │
│     │ checkpoint_y = global_fees_per_liq_y    │                │
│     └─────────────────────────────────────────┘                │
│                         │                                       │
│                         ▼                                       │
│  4. Transfer fees to user                                       │
│     ┌─────────────────────────────────────────┐                │
│     │ vault::withdraw(fees_x, fees_y, user)   │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Code Reference

```move
public entry fun claim_fees(
    account: &signer,
    token_address: address,
    current_market_price: u64
) acquires PositionDataStore {
    let user = signer::address_of(account);

    // Verify ownership
    assert!(object::is_owner(object::address_to_object<AptosToken>(token_address), user), E_NOT_OWNER);

    // Get position data
    let position = borrow_global_mut<PositionDataStore>(token_address);

    // Calculate unclaimed fees
    let (global_x, global_y) = fee_distributor::get_fees_per_liquidity();
    let fees_x = ((global_x - position.fees_checkpoint_x) * position.total_liquidity) / PRECISION;
    let fees_y = ((global_y - position.fees_checkpoint_y) * position.total_liquidity) / PRECISION;

    // Update checkpoint
    position.fees_checkpoint_x = global_x;
    position.fees_checkpoint_y = global_y;

    // Update totals
    position.total_fees_earned_x = position.total_fees_earned_x + fees_x;
    position.total_fees_earned_y = position.total_fees_earned_y + fees_y;

    // Withdraw from vault
    vault::withdraw(user, fees_x, fees_y);
}
```

---

## Fee Distribution Timeline

```
Time ──────────────────────────────────────────────────────────────▶

T0: Position Created
    │ liquidity = 1000
    │ checkpoint = 0
    │
T1: Swap occurs (10 USDC fee)
    │ global += 10/10000 = 0.001 per unit
    │ Position unclaimed = (0.001 - 0) × 1000 = 1 USDC
    │
T2: Another swap (20 USDC fee)
    │ global += 20/10000 = 0.003 per unit
    │ Position unclaimed = (0.003 - 0) × 1000 = 3 USDC
    │
T3: User claims fees
    │ User receives 3 USDC
    │ checkpoint = 0.003
    │ Position unclaimed = 0
    │
T4: More swaps (15 USDC fee)
    │ global = 0.0045
    │ Position unclaimed = (0.0045 - 0.003) × 1000 = 1.5 USDC
```

---

## Protocol Fee Usage

Protocol fees (0.05% of swaps) are retained in the vault and used for:

1. **Development Fund** — Ongoing protocol development
2. **Security Audits** — Regular security reviews
3. **Insurance Pool** — Coverage for potential exploits
4. **DAO Treasury** — Future governance allocation

---

## Fee Comparison

| Protocol | Swap Fee | LP Share | Protocol Share |
|----------|----------|----------|----------------|
| Uniswap V2 | 0.30% | 0.30% | 0% |
| Uniswap V3 | 0.05-1% | Variable | 0-25% |
| Curve | 0.04% | 0.02% | 0.02% |
| **VoxelFi** | **0.30%** | **0.25%** | **0.05%** |

---

## Precision & Rounding

All fee calculations use 128-bit precision to prevent rounding errors:

```move
const PRECISION: u128 = 1_000_000_000_000_000_000; // 10^18

// Fee per liquidity calculation
let fee_per_liq = ((fee_amount as u128) * PRECISION) / (total_liquidity as u128);

// Unclaimed fee calculation
let unclaimed = ((delta as u128) * (position_liquidity as u128)) / PRECISION;
```

Rounding is always done **in favor of the protocol** to prevent dust attacks.

---

## Edge Cases

### Empty Pool
When `total_liquidity = 0`, no fee distribution occurs. Fees remain in the vault until liquidity is added.

### Single Position
A single position receives 100% of LP fees.

### Position Burned
When burning a position:
1. Unclaimed fees are automatically claimed
2. Position liquidity removed from total
3. Checkpoint data deleted

### Precision Loss
With 10^18 precision, meaningful precision loss only occurs at extremely small liquidity levels (<1e-12), which are economically irrelevant.

---

## Smart Contract Constants

```move
// In fractal_position.move
const SWAP_FEE_BPS: u64 = 30;        // 0.30%
const LP_FEE_BPS: u64 = 25;          // 0.25%
const PROTOCOL_FEE_BPS: u64 = 5;     // 0.05%

// In vault.move
const SWAP_FEE_NUMERATOR: u64 = 3;
const SWAP_FEE_DENOMINATOR: u64 = 1000;

// In fee_distributor.move
const PRECISION: u128 = 1_000_000_000_000_000_000;
```

---

