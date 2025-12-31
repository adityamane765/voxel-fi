#!/usr/bin/env bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

SWAP_DIRECTION=${1:-"X_TO_Y"}
AMOUNT=${2:-10000000}
MIN_OUT=${3:-0}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  VOXEL FINANCE - TRADER SWAP INTERFACE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$SWAP_DIRECTION" != "X_TO_Y" ] && [ "$SWAP_DIRECTION" != "Y_TO_X" ]; then
    echo "Usage: $0 [X_TO_Y|Y_TO_X] [AMOUNT] [MIN_AMOUNT_OUT]"
    echo ""
    echo "Examples:"
    echo "  $0 X_TO_Y 10000000 0          # Swap 0.1 WETH for USDC"
    echo "  $0 Y_TO_X 300000000 0         # Swap 300 USDC for WETH"
    echo ""
    echo "Defaults:"
    echo "  Direction: X_TO_Y (WETH → USDC)"
    echo "  Amount: 10000000 (0.1 WETH with 8 decimals)"
    echo "  Min Out: 0 (no slippage protection)"
    exit 1
fi

echo ""
echo "📊 Swap Configuration:"
if [ "$SWAP_DIRECTION" == "X_TO_Y" ]; then
    AMOUNT_DISPLAY=$(echo "scale=8; $AMOUNT / 100000000" | bc)
    echo "  Direction: WETH → USDC"
    echo "  Amount In: $AMOUNT_DISPLAY WETH"
else
    AMOUNT_DISPLAY=$(echo "scale=6; $AMOUNT / 1000000" | bc)
    echo "  Direction: USDC → WETH"
    echo "  Amount In: $AMOUNT_DISPLAY USDC"
fi
echo "  Min Amount Out: $MIN_OUT"
echo "  Profile: $PROFILE"
echo ""

# Step 1: Check wallet balance
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 1: VERIFY BALANCES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "→ Your current balances:"

WETH_BALANCE=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::balance \
  --args address:${MODULE_ADDRESS} 2>/dev/null | jq -r '.Result[0]' || echo "0")

USDC_BALANCE=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::usdc::balance \
  --args address:${MODULE_ADDRESS} 2>/dev/null | jq -r '.Result[0]' || echo "0")

WETH_DISPLAY=$(echo "scale=8; $WETH_BALANCE / 100000000" | bc)
USDC_DISPLAY=$(echo "scale=6; $USDC_BALANCE / 1000000" | bc)

echo "  WETH: $WETH_DISPLAY"
echo "  USDC: $USDC_DISPLAY"

# Check if user has enough balance
if [ "$SWAP_DIRECTION" == "X_TO_Y" ]; then
    if [ "$WETH_BALANCE" -lt "$AMOUNT" ]; then
        echo ""
        echo "❌ ERROR: Insufficient WETH balance"
        echo "   Required: $(echo "scale=8; $AMOUNT / 100000000" | bc) WETH"
        echo "   Available: $WETH_DISPLAY WETH"
        exit 1
    fi
else
    if [ "$USDC_BALANCE" -lt "$AMOUNT" ]; then
        echo ""
        echo "❌ ERROR: Insufficient USDC balance"
        echo "   Required: $(echo "scale=6; $AMOUNT / 1000000" | bc) USDC"
        echo "   Available: $USDC_DISPLAY USDC"
        exit 1
    fi
fi

echo "  ✓ Balance sufficient"

# Step 2: Check vault reserves
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 2: QUERY VAULT RESERVES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
RESERVES=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y)

echo "Current vault reserves:"
echo "$RESERVES"

RESERVE_X=$(echo "$RESERVES" | jq -r '.Result[0]' || echo "0")
RESERVE_Y=$(echo "$RESERVES" | jq -r '.Result[1]' || echo "0")

if [ "$RESERVE_X" == "0" ] || [ "$RESERVE_Y" == "0" ]; then
    echo ""
    echo "⚠️  WARNING: Vault has no liquidity!"
    echo "   Please run test_mint_position.sh first to add liquidity."
    exit 1
fi

# Step 3: Calculate expected output
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 3: CALCULATE EXPECTED OUTPUT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$SWAP_DIRECTION" == "X_TO_Y" ]; then
    EXPECTED_OUT=$(movement move view \
      --profile $PROFILE \
      --function-id ${MODULE_ADDRESS}::vault::calculate_swap_output \
      --type-args $COIN_X $COIN_Y \
      --args u64:$AMOUNT | jq -r '.Result[0]')
    
    EXPECTED_DISPLAY=$(echo "scale=6; $EXPECTED_OUT / 1000000" | bc)
    echo "Expected output: $EXPECTED_DISPLAY USDC"
else
    # For Y→X, we'd need a reverse calculation view function
    echo "Expected output: (calculated by vault)"
fi

# Calculate price impact
echo ""
echo "→ Price & Fees:"
echo "  Total Fee: 0.30%"
echo "  - LP Fee: 0.25%"
echo "  - Protocol Fee: 0.05%"

# Step 4: Execute swap
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 4: EXECUTE SWAP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ Executing swap..."

if [ "$SWAP_DIRECTION" == "X_TO_Y" ]; then
    movement move run \
      --profile $PROFILE \
      --function-id ${MODULE_ADDRESS}::vault::swap \
      --type-args $COIN_X $COIN_Y \
      --args u64:$AMOUNT u64:$MIN_OUT \
      --assume-yes
else
    movement move run \
      --profile $PROFILE \
      --function-id ${MODULE_ADDRESS}::vault::swap_y_for_x \
      --type-args $COIN_X $COIN_Y \
      --args u64:$AMOUNT u64:$MIN_OUT \
      --assume-yes
fi

echo ""
echo "✅ Swap executed successfully!"

# Step 5: Show updated balances
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 5: UPDATED BALANCES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

NEW_WETH_BALANCE=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::balance \
  --args address:${MODULE_ADDRESS} | jq -r '.Result[0]')

NEW_USDC_BALANCE=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::usdc::balance \
  --args address:${MODULE_ADDRESS} | jq -r '.Result[0]')

NEW_WETH_DISPLAY=$(echo "scale=8; $NEW_WETH_BALANCE / 100000000" | bc)
NEW_USDC_DISPLAY=$(echo "scale=6; $NEW_USDC_BALANCE / 1000000" | bc)

echo "→ Your new balances:"
echo "  WETH: $NEW_WETH_DISPLAY (was $WETH_DISPLAY)"
echo "  USDC: $NEW_USDC_DISPLAY (was $USDC_DISPLAY)"

# Calculate changes
if [ "$SWAP_DIRECTION" == "X_TO_Y" ]; then
    WETH_CHANGE=$(echo "scale=8; ($WETH_BALANCE - $NEW_WETH_BALANCE) / 100000000" | bc)
    USDC_CHANGE=$(echo "scale=6; ($NEW_USDC_BALANCE - $USDC_BALANCE) / 1000000" | bc)
    echo ""
    echo "  Spent: $WETH_CHANGE WETH"
    echo "  Received: $USDC_CHANGE USDC"
else
    USDC_CHANGE=$(echo "scale=6; ($USDC_BALANCE - $NEW_USDC_BALANCE) / 1000000" | bc)
    WETH_CHANGE=$(echo "scale=8; ($NEW_WETH_BALANCE - $WETH_BALANCE) / 100000000" | bc)
    echo ""
    echo "  Spent: $USDC_CHANGE USDC"
    echo "  Received: $WETH_CHANGE WETH"
fi

# Step 6: Show vault reserves
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 6: UPDATED VAULT RESERVES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
NEW_RESERVES=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y)

echo "$NEW_RESERVES"

# Step 7: Show fee impact
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 7: FEE GENERATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

FEE_STATS=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_global_fee_stats)

echo "→ Protocol fee statistics:"
echo "$FEE_STATS"

echo ""
echo "💡 This swap generated fees for LPs!"
echo "   LPs can now claim their share of fees."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Swap completed successfully! 🎉"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"