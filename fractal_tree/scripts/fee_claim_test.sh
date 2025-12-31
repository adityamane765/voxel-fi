#!/usr/bin/env bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

TOKEN_OBJECT_ADDRESS=$1

if [ -z "$TOKEN_OBJECT_ADDRESS" ]; then
  echo "Usage: $0 <NFT_OBJECT_ADDRESS>"
  echo ""
  echo "Example:"
  echo "  $0 0xabc123..."
  exit 1
fi

echo "=============================="
echo " Fee Claiming Test"
echo " Profile: $PROFILE"
echo " NFT: $TOKEN_OBJECT_ADDRESS"
echo "=============================="

echo ""
echo "→ Step 1: Check Position Data"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_position_data \
  --args address:$TOKEN_OBJECT_ADDRESS

echo ""
echo "→ Step 2: Check Unclaimed Fees"
UNCLAIMED_FEES=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_unclaimed_fees \
  --args address:$TOKEN_OBJECT_ADDRESS)

echo "Unclaimed fees: $UNCLAIMED_FEES"

echo ""
echo "→ Step 3: Check Total Fees Earned (Lifetime)"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_total_fees_earned \
  --args address:$TOKEN_OBJECT_ADDRESS

echo ""
echo "→ Step 4: Check Owner Balance Before Claim"
echo "WETH balance:"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::balance \
  --args address:${MODULE_ADDRESS}

echo "USDC balance:"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::usdc::balance \
  --args address:${MODULE_ADDRESS}

echo ""
echo "→ Step 5: Claiming Fees..."
movement move run \
  --assume-yes \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::claim_fees \
  --type-args $COIN_X $COIN_Y \
  --args address:$TOKEN_OBJECT_ADDRESS u64:3000 \
  --assume-yes

echo ""
echo "→ Step 6: Verify Fees Claimed"
echo "Unclaimed fees after claim (should be 0, 0):"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_unclaimed_fees \
  --args address:$TOKEN_OBJECT_ADDRESS

echo ""
echo "→ Step 7: Check Owner Balance After Claim"
echo "WETH balance:"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::balance \
  --args address:${MODULE_ADDRESS}

echo "USDC balance:"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::usdc::balance \
  --args address:${MODULE_ADDRESS}

echo ""
echo "→ Step 8: Check Updated Lifetime Earnings"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_total_fees_earned \
  --args address:$TOKEN_OBJECT_ADDRESS

echo ""
echo "✅ Fee claiming test completed!"
echo "=============================="