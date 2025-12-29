#!/usr/bin/env bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

echo "=============================="
echo " Swap Test"
echo " Profile: $PROFILE"
echo " Module:  $MODULE_ADDRESS"
echo "=============================="

echo "→ Initial Vault Reserves:"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y \
  --assume-yes

echo ""
echo "→ Swapping 0.1 WETH ($((10**7))) for USDC (min_amount_out: 0)..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::swap \
  --type-args $COIN_X $COIN_Y \
  --args \
    u64:$((10**7)) \
    u64:0 \
  --assume-yes

echo ""
echo "→ Final Vault Reserves:"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y \
  --assume-yes

echo ""
echo "✅ Swap test completed"
echo "=============================="
