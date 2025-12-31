#!/usr/bin/env bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

TOKEN_OBJECT_ADDRESS=$1
CURRENT_PRICE=${2:-3000}  # Default to 3000 if not provided

if [ -z "$TOKEN_OBJECT_ADDRESS" ]; then
  echo "Usage: $0 <NFT_OBJECT_ADDRESS> [CURRENT_MARKET_PRICE]"
  echo ""
  echo "Example:"
  echo "  $0 0xabc123... 3100"
  echo ""
  echo "  Shows comprehensive dashboard statistics for a position"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  VOXEL FINANCE - POSITION DASHBOARD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NFT: $TOKEN_OBJECT_ADDRESS"
echo "  Market Price: $CURRENT_PRICE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  POSITION OVERVIEW                       │"
echo "└─────────────────────────────────────────┘"
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::dashboard_stats::get_position_stats \
  --type-args $COIN_X $COIN_Y \
  --args address:$TOKEN_OBJECT_ADDRESS

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  FEE EARNINGS                            │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "→ Unclaimed Fees:"
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_unclaimed_fees \
  --type-args $COIN_X $COIN_Y \
  --args address:$TOKEN_OBJECT_ADDRESS u64:$CURRENT_PRICE

echo ""
echo "→ Total Lifetime Earnings:"
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_total_fees_earned \
  --args address:$TOKEN_OBJECT_ADDRESS

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  POSITION PERFORMANCE                    │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "→ Estimated APR (7-day basis):"
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::dashboard_stats::estimate_position_apr \
  --type-args $COIN_X $COIN_Y \
  --args address:$TOKEN_OBJECT_ADDRESS u64:7

echo ""
echo "→ Position Health Score (0-100):"
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::dashboard_stats::calculate_position_health \
  --type-args $COIN_X $COIN_Y \
  --args address:$TOKEN_OBJECT_ADDRESS u64:$CURRENT_PRICE

echo ""
echo "→ Active Liquidity at Current Price ($CURRENT_PRICE):"
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::dashboard_stats::get_liquidity_depth \
  --type-args $COIN_X $COIN_Y \
  --args address:$TOKEN_OBJECT_ADDRESS u64:$CURRENT_PRICE

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  RECOMMENDATIONS                         │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "→ AI Recommendations:"
RECOMMENDATIONS=$(movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::dashboard_stats::get_position_recommendations \
  --type-args $COIN_X $COIN_Y \
  --args address:$TOKEN_OBJECT_ADDRESS u64:$CURRENT_PRICE)

echo "$RECOMMENDATIONS"
echo ""
echo "Legend:"
echo "  0 = All good ✓"
echo "  1 = Claim fees (high unclaimed)"
echo "  2 = Rebalance position (price out of range)"
echo "  3 = Consider closing (very low activity)"

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  PROTOCOL-WIDE STATISTICS                │"
echo "└─────────────────────────────────────────┘"
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::dashboard_stats::get_protocol_stats \
  --type-args $COIN_X $COIN_Y

echo ""
echo "→ Global Fee Statistics:"
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_global_fee_stats

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Dashboard statistics retrieved successfully"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"