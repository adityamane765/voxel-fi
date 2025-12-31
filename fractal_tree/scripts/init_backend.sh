#!/usr/bin/env bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

echo "=============================="
echo " Initializing Voxel Finance"
echo " with Fee System"
echo " Profile: $PROFILE"
echo " Address: $MODULE_ADDRESS"
echo "=============================="

echo ""
echo "→ Step 1: Initialize Test Coins (WETH & USDC)"
movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::init \
  || echo "✓ WETH already initialized"

movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::usdc::init \
  || echo "✓ USDC already initialized"

echo ""
echo "→ Step 2: Register Coins on Account"
movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::register \
  || echo "✓ WETH already registered"

movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::usdc::register \
  || echo "✓ USDC already registered"

echo ""
echo "→ Step 3: Mint Initial Test Balances"
echo "  Minting 1,000,000 WETH (8 decimals)"
movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::mint \
  --args address:${MODULE_ADDRESS} u64:1000000000000000

echo "  Minting 3,000,000 USDC (6 decimals)"
movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::usdc::mint \
  --args address:${MODULE_ADDRESS} u64:3000000000000000

echo ""
echo "→ Step 4: Initialize Vault (X=WETH, Y=USDC)"
movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::init \
  --type-args $COIN_X $COIN_Y \
  || echo "✓ Vault already initialized"

echo ""
echo "→ Step 5: Initialize Spatial Octree"
movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::spatial_octree::init \
  || echo "✓ Octree already initialized"

echo ""
echo "→ Step 6: Initialize Position System"
movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::init_counter \
  || echo "✓ Position counter already initialized"

movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::init_data_store \
  || echo "✓ Position data store already initialized"

movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::init_registry \
  || echo "✓ Position registry already initialized"

echo ""
echo "→ Step 7: Initialize Fee System"
movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::init_fee_accumulator \
  || echo "✓ Fee accumulator already initialized"

echo ""
echo "→ Step 8: Initialize Volatility Oracle"
movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::volatility_oracle::init \
  --type-args $COIN_X $COIN_Y \
  || echo "✓ Volatility oracle already initialized"

echo ""
echo "→ Step 9: Initialize NFT Collection"
movement move run --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::init_collection \
  || echo "✓ NFT Collection already initialized"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " VERIFICATION CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "→ Vault Reserves (should start at 0, 0):"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y

echo ""
echo "→ Octree Query (should return 0 - no positions yet):"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::spatial_octree::query \
  --args u16:0 u8:0 u8:0

echo ""
echo "→ Protocol Fee Statistics (should be all zeros):"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_global_fee_stats

echo ""
echo "→ Volatility Metrics (initial state):"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::volatility_oracle::get_volatility_metrics \
  --type-args $COIN_X $COIN_Y

echo ""
echo "✅ Voxel Finance initialized successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "System Configuration:"
echo "  • Total Swap Fee: 0.30%"
echo "  • LP Fee: 0.25% (distributed to positions)"
echo "  • Protocol Fee: 0.05% (treasury)"
echo "  • Volatility Tracking: ✓ Enabled"
echo "  • Sample Interval: 5 minutes"
echo "  • Price History: Up to 288 samples (24h)"
echo ""
echo "Next steps:"
echo "  1. Run test_mint_position.sh to create LP positions"
echo "  2. Run test_swap.sh multiple times to:"
echo "     - Generate trading fees"
echo "     - Build price history"
echo "     - Calculate volatility metrics"
echo "  3. Run test_volatility_dashboard.sh to view analytics"
echo "  4. Run test_claim_fees.sh to claim earned fees"
echo "=============================="