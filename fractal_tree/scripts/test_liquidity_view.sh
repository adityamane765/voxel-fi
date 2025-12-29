#!/bin/bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

TOKEN_OBJECT_ADDRESS=$1

if [ -z "$TOKEN_OBJECT_ADDRESS" ]; then
  echo "Usage: $0 <NFT_OBJECT_ADDRESS>"
  exit 1
fi

echo "=============================="
echo " Liquidity View Test"
echo " Profile: $PROFILE"
echo " Module:  $MODULE_ADDRESS"
echo " NFT Address: $TOKEN_OBJECT_ADDRESS"
echo "=============================="

echo "→ Price at center (e.g., 3000):"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::liquidity_at_price \
  --args \
    address:$TOKEN_OBJECT_ADDRESS \
    u64:3000 \
  --assume-yes

echo
echo "→ Price slightly off-center (e.g., 3050):"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::liquidity_at_price \
  --args \
    address:$TOKEN_OBJECT_ADDRESS \
    u64:3050 \
  --assume-yes

echo
echo "→ Price outside spread (e.g., 3500):"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::liquidity_at_price \
  --args \
    address:$TOKEN_OBJECT_ADDRESS \
    u64:3500 \
  --assume-yes

echo
echo "✅ Liquidity view test completed"
echo "=============================="
