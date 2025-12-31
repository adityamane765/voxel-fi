#!/usr/bin/env bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

# Use the first argument as current price, or default to 3000
CURRENT_PRICE=${1:-3000}

echo "=============================="
echo " Fee Distribution"
echo " Profile: $PROFILE"
echo " Triggering fee distribution with market price: $CURRENT_PRICE"
echo "=============================="

echo ""
echo "→ Checking pending fees before distribution..."
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_pending_fees \
  --type-args $COIN_X $COIN_Y

echo ""
echo "→ Calling distribute_accumulated_fees..."
movement move run \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fee_distributor::distribute_accumulated_fees \
  --type-args $COIN_X $COIN_Y \
  --args u64:$CURRENT_PRICE

echo ""
echo "→ Checking pending fees after distribution (should be 0):"
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_pending_fees \
  --type-args $COIN_X $COIN_Y
  
echo ""
echo "→ Verifying global fee stats..."
movement move view \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_global_fee_stats


echo ""
echo "✅ Fee distribution complete."
echo "=============================="
