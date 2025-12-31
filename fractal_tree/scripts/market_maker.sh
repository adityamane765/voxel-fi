#!/usr/bin/env bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

NUM_SWAPS=${1:-20}
DELAY_SECONDS=${2:-2}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  VOXEL FINANCE - MARKET MAKER SIMULATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Configuration:"
echo "  Number of swaps: $NUM_SWAPS"
echo "  Delay between swaps: ${DELAY_SECONDS}s"
echo "  Profile: $PROFILE"
echo ""
echo "Purpose:"
echo "  • Generate trading volume"
echo "  • Create fees for LPs"
echo "  • Build price history"
echo "  • Calculate volatility metrics"
echo ""
read -p "Press Enter to start market making... " -r

# Get initial state
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  INITIAL STATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INITIAL_RESERVES=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y)

echo ""
echo "Initial vault reserves:"
echo "$INITIAL_RESERVES"

INITIAL_RESERVE_X=$(echo "$INITIAL_RESERVES" | jq -r '.Result[0]')
INITIAL_RESERVE_Y=$(echo "$INITIAL_RESERVES" | jq -r '.Result[1]')

if [ "$INITIAL_RESERVE_X" == "0" ] || [ "$INITIAL_RESERVE_Y" == "0" ]; then
    echo ""
    echo "❌ ERROR: No liquidity in vault!"
    echo "   Run test_mint_position.sh first"
    exit 1
fi

# Calculate initial price
INITIAL_PRICE=$(echo "scale=6; $INITIAL_RESERVE_Y / $INITIAL_RESERVE_X" | bc)
echo "Initial price: $INITIAL_PRICE USDC per WETH"

# Track statistics
TOTAL_VOLUME_X=0
TOTAL_VOLUME_Y=0
TOTAL_FEES=0

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  EXECUTING SWAPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for ((i=1; i<=NUM_SWAPS; i++)); do
    echo "─────────────────────────────────────────────"
    echo "Swap $i of $NUM_SWAPS"
    echo "─────────────────────────────────────────────"
    
    # Alternate between buy and sell
    if [ $((i % 2)) -eq 0 ]; then
        DIRECTION="X_TO_Y"
        # Random amount: 0.01 to 0.5 WETH
        BASE_AMOUNT=$((1000000 + RANDOM % 50000000))
        AMOUNT=$BASE_AMOUNT
        AMOUNT_DISPLAY=$(echo "scale=8; $AMOUNT / 100000000" | bc)
        echo "→ Selling $AMOUNT_DISPLAY WETH for USDC"
        TOTAL_VOLUME_X=$((TOTAL_VOLUME_X + AMOUNT))
    else
        DIRECTION="Y_TO_X"
        # Random amount: 10 to 1500 USDC
        BASE_AMOUNT=$((10000000 + RANDOM % 1500000000))
        AMOUNT=$BASE_AMOUNT
        AMOUNT_DISPLAY=$(echo "scale=6; $AMOUNT / 1000000" | bc)
        echo "→ Buying WETH with $AMOUNT_DISPLAY USDC"
        TOTAL_VOLUME_Y=$((TOTAL_VOLUME_Y + AMOUNT))
    fi
    
    # Execute swap
    if [ "$DIRECTION" == "X_TO_Y" ]; then
        movement move run \
          --assume-yes \
          --profile $PROFILE \
          --function-id ${MODULE_ADDRESS}::vault::swap \
          --type-args $COIN_X $COIN_Y \
          --args u64:$AMOUNT u64:0
    else
        movement move run \
          --profile $PROFILE \
          --function-id ${MODULE_ADDRESS}::vault::swap_y_for_x \
          --type-args $COIN_X $COIN_Y \
          --args u64:$AMOUNT u64:0 \
          --assume-yes
    fi
    
    # Calculate fee (0.3% of amount)
    FEE=$((AMOUNT * 3 / 1000))
    TOTAL_FEES=$((TOTAL_FEES + FEE))
    
    echo "  ✓ Swap executed (fee: ~$((FEE / 1000000)))"
    
    # Show current price every 5 swaps
    if [ $((i % 5)) -eq 0 ]; then
        CURRENT_RESERVES=$(movement move view \
          --profile $PROFILE \
          --function-id ${MODULE_ADDRESS}::vault::get_reserves \
          --type-args $COIN_X $COIN_Y 2>/dev/null)
        
        CURRENT_RESERVE_X=$(echo "$CURRENT_RESERVES" | jq -r '.Result[0]')
        CURRENT_RESERVE_Y=$(echo "$CURRENT_RESERVES" | jq -r '.Result[1]')
        CURRENT_PRICE=$(echo "scale=6; $CURRENT_RESERVE_Y / $CURRENT_RESERVE_X" | bc)
        
        PRICE_CHANGE=$(echo "scale=2; (($CURRENT_PRICE - $INITIAL_PRICE) / $INITIAL_PRICE) * 100" | bc)
        echo "  💹 Current price: $CURRENT_PRICE USDC/WETH (${PRICE_CHANGE}%)"
    fi
    
    # Delay between swaps
    if [ $i -lt $NUM_SWAPS ]; then
        sleep $DELAY_SECONDS
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MARKET MAKING COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get final state
FINAL_RESERVES=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y)

echo "Final vault reserves:"
echo "$FINAL_RESERVES"

FINAL_RESERVE_X=$(echo "$FINAL_RESERVES" | jq -r '.Result[0]')
FINAL_RESERVE_Y=$(echo "$FINAL_RESERVES" | jq -r '.Result[1]')
FINAL_PRICE=$(echo "scale=6; $FINAL_RESERVE_Y / $FINAL_RESERVE_X" | bc)

# Calculate statistics
PRICE_CHANGE=$(echo "scale=2; (($FINAL_PRICE - $INITIAL_PRICE) / $INITIAL_PRICE) * 100" | bc)
VOLUME_X_DISPLAY=$(echo "scale=8; $TOTAL_VOLUME_X / 100000000" | bc)
VOLUME_Y_DISPLAY=$(echo "scale=6; $TOTAL_VOLUME_Y / 1000000" | bc)

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  TRADING STATISTICS                     │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "→ Volume Generated:"
echo "  WETH sold: $VOLUME_X_DISPLAY"
echo "  USDC sold: $VOLUME_Y_DISPLAY"
echo ""
echo "→ Price Movement:"
echo "  Initial: $INITIAL_PRICE USDC/WETH"
echo "  Final: $FINAL_PRICE USDC/WETH"
echo "  Change: ${PRICE_CHANGE}%"
echo ""
echo "→ Reserve Changes:"
echo "  WETH: $INITIAL_RESERVE_X → $FINAL_RESERVE_X"
echo "  USDC: $INITIAL_RESERVE_Y → $FINAL_RESERVE_Y"

# Get fee statistics
echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  FEE GENERATION                         │"
echo "└─────────────────────────────────────────┘"
echo ""

FEE_STATS=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_global_fee_stats)

echo "Global fee statistics:"
echo "$FEE_STATS"

TOTAL_FEES_X=$(echo "$FEE_STATS" | jq -r '.Result[0]')
TOTAL_FEES_Y=$(echo "$FEE_STATS" | jq -r '.Result[1]')
PROTOCOL_FEES_X=$(echo "$FEE_STATS" | jq -r '.Result[2]')
PROTOCOL_FEES_Y=$(echo "$FEE_STATS" | jq -r '.Result[3]')

TOTAL_FEES_X_DISPLAY=$(echo "scale=8; $TOTAL_FEES_X / 100000000" | bc)
TOTAL_FEES_Y_DISPLAY=$(echo "scale=6; $TOTAL_FEES_Y / 1000000" | bc)
LP_FEES_X=$((TOTAL_FEES_X - PROTOCOL_FEES_X))
LP_FEES_Y=$((TOTAL_FEES_Y - PROTOCOL_FEES_Y))
LP_FEES_X_DISPLAY=$(echo "scale=8; $LP_FEES_X / 100000000" | bc)
LP_FEES_Y_DISPLAY=$(echo "scale=6; $LP_FEES_Y / 1000000" | bc)

echo ""
echo "→ Fees Breakdown:"
echo "  Total WETH fees: $TOTAL_FEES_X_DISPLAY"
echo "  Total USDC fees: $TOTAL_FEES_Y_DISPLAY"
echo ""
echo "  LP share (83.3%):"
echo "    WETH: $LP_FEES_X_DISPLAY"
echo "    USDC: $LP_FEES_Y_DISPLAY"
echo ""
echo "  Protocol share (16.7%):"
echo "    WETH: $(echo "scale=8; $PROTOCOL_FEES_X / 100000000" | bc)"
echo "    USDC: $(echo "scale=6; $PROTOCOL_FEES_Y / 1000000" | bc)"

# Get volatility metrics
echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  VOLATILITY METRICS                     │"
echo "└─────────────────────────────────────────┘"
echo ""

VOL_METRICS=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::volatility_oracle::get_volatility_metrics \
  --type-args $COIN_X $COIN_Y 2>/dev/null || echo "N/A")

if [ "$VOL_METRICS" != "N/A" ]; then
    echo "$VOL_METRICS"
    
    VOL_BUCKET=$(echo "$VOL_METRICS" | jq -r '.volatility_bucket' 2>/dev/null || echo "N/A")
    
    if [ "$VOL_BUCKET" != "N/A" ]; then
        echo ""
        echo "→ Volatility Classification:"
        case $VOL_BUCKET in
            0) echo "  Bucket 0: LOW (0-1% daily)" ;;
            1) echo "  Bucket 1: MEDIUM (1-3% daily)" ;;
            2) echo "  Bucket 2: HIGH (3-5% daily)" ;;
            3) echo "  Bucket 3: EXTREME (>5% daily)" ;;
        esac
    fi
else
    echo "Volatility oracle not yet initialized with enough data"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Market making simulation complete! 🎉"
echo ""
echo "  Next steps:"
echo "  • Check LP positions with test_dashboard_stats.sh"
echo "  • Claim fees with test_claim_fees.sh"
echo "  • View volatility with test_volatility_dashboard.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"