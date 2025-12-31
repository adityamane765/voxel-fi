#!/usr/bin/env bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  VOXEL FINANCE - VOLATILITY DASHBOARD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  CURRENT VOLATILITY METRICS              │"
echo "└─────────────────────────────────────────┘"
VOL_METRICS=$(movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::volatility_oracle::get_volatility_metrics \
  --type-args $COIN_X $COIN_Y)

echo "$VOL_METRICS"

# Parse volatility bucket from output
VOL_BUCKET=$(echo "$VOL_METRICS" | jq -r '.volatility_bucket' 2>/dev/null || echo "N/A")

echo ""
echo "→ Volatility Classification:"
if [ "$VOL_BUCKET" == "0" ]; then
    echo "   Bucket 0: LOW VOLATILITY (0-1% daily)"
    echo "   📊 Market Conditions: Stable, tight spreads recommended"
elif [ "$VOL_BUCKET" == "1" ]; then
    echo "   Bucket 1: MEDIUM VOLATILITY (1-3% daily)"
    echo "   📊 Market Conditions: Normal, standard spreads"
elif [ "$VOL_BUCKET" == "2" ]; then
    echo "   Bucket 2: HIGH VOLATILITY (3-5% daily)"
    echo "   ⚠️  Market Conditions: Elevated, wider spreads needed"
elif [ "$VOL_BUCKET" == "3" ]; then
    echo "   Bucket 3: VERY HIGH VOLATILITY (>5% daily)"
    echo "   🚨 Market Conditions: Extreme, maximum spreads advised"
else
    echo "   Status: Insufficient data (need more swaps)"
fi

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  PRICE HISTORY (Last 10 samples)        │"
echo "└─────────────────────────────────────────┘"
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::volatility_oracle::get_price_history \
  --type-args $COIN_X $COIN_Y \
  --args u64:10

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  SPREAD RECOMMENDATIONS                  │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "→ For base spread of 100:"
RECOMMENDED_SPREAD=$(movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::volatility_oracle::calculate_recommended_spread \
  --type-args $COIN_X $COIN_Y \
  --args u64:100)

echo "   Recommended spread: $RECOMMENDED_SPREAD"

echo ""
echo "→ Spread adjustments by volatility bucket:"
echo "   Bucket 0 (Low):  1.0x base = 100"
echo "   Bucket 1 (Med):  1.5x base = 150"
echo "   Bucket 2 (High): 2.0x base = 200"
echo "   Bucket 3 (Extreme): 3.0x base = 300"

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  VAULT RESERVES                          │"
echo "└─────────────────────────────────────────┘"
RESERVES=$(movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y)

echo "$RESERVES"

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  SPATIAL OCTREE QUERIES                  │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "→ Liquidity at different volatility levels:"

for vol in 0 1 2 3; do
    LIQUIDITY=$(movement move view \
      --assume-yes \
      --profile $PROFILE \
      --function-id ${MODULE_ADDRESS}::spatial_octree::query \
      --args u16:300 u8:$vol u8:3 2>/dev/null || echo "0")
    
    case $vol in
        0) echo "   Bucket 0 (Low Vol):  $LIQUIDITY" ;;
        1) echo "   Bucket 1 (Med Vol):  $LIQUIDITY" ;;
        2) echo "   Bucket 2 (High Vol): $LIQUIDITY" ;;
        3) echo "   Bucket 3 (Extreme):  $LIQUIDITY" ;;
    esac
done

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  MARKET INSIGHTS                         │"
echo "└─────────────────────────────────────────┘"

# Check if we have enough data
if [ "$VOL_BUCKET" != "N/A" ]; then
    echo ""
    echo "📈 Market Analysis:"
    
    if [ "$VOL_BUCKET" == "0" ]; then
        echo "   • Price action is stable"
        echo "   • Tight liquidity provision is safe"
        echo "   • Lower IL risk for LPs"
        echo "   • Consider narrower spreads"
    elif [ "$VOL_BUCKET" == "1" ]; then
        echo "   • Normal market volatility"
        echo "   • Standard risk management applies"
        echo "   • Balanced spread-fee tradeoff"
    elif [ "$VOL_BUCKET" == "2" ]; then
        echo "   • Elevated price swings"
        echo "   • Widen spreads to manage risk"
        echo "   • Higher IL risk for narrow ranges"
        echo "   • Monitor positions closely"
    else
        echo "   • Extreme volatility detected"
        echo "   • Maximum spread recommended"
        echo "   • High IL risk - consider waiting"
        echo "   • Only deep positions advised"
    fi
    
    echo ""
    echo "💡 LP Strategy Recommendations:"
    if [ "$VOL_BUCKET" == "0" ] || [ "$VOL_BUCKET" == "1" ]; then
        echo "   ✓ Good conditions for providing liquidity"
        echo "   ✓ Narrow spreads can capture more fees"
        echo "   ✓ Active management less critical"
    else
        echo "   ⚠️  Challenging conditions for LPs"
        echo "   ⚠️  Use wider spreads for protection"
        echo "   ⚠️  Active monitoring recommended"
        echo "   ⚠️  Consider deeper fractal positions"
    fi
else
    echo ""
    echo "⏳ Insufficient data for analysis"
    echo "   • Perform more swaps to build price history"
    echo "   • Minimum 2 price samples needed"
    echo "   • 24-hour history provides best insights"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Volatility analytics complete"
echo ""
echo "  Note: Volatility calculations improve with:"
echo "  • More trading activity (swaps)"
echo "  • Longer time periods (24h ideal)"
echo "  • Regular price samples (5-min intervals)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"