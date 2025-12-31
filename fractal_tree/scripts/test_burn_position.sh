#!/usr/bin/env bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

TOKEN_OBJECT_ADDRESS=$1 # Expecting the NFT object address as the first argument

if [ -z "$TOKEN_OBJECT_ADDRESS" ]; then
  echo "Usage: $0 <NFT_OBJECT_ADDRESS>"
  exit 1
fi

echo "=============================="
echo " Burn Position Test"
echo " Profile: $PROFILE"
echo " Module:  $MODULE_ADDRESS"
echo " NFT to burn: $TOKEN_OBJECT_ADDRESS"
echo "=============================="

echo "→ Step 1: Check Initial Vault Reserves"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y

echo ""
echo "→ Step 2: Check Owner Balance Before Burn"
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
echo "→ Step 3: Burning Position NFT $TOKEN_OBJECT_ADDRESS..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::burn_position \
  --type-args $COIN_X $COIN_Y \
  --args address:$TOKEN_OBJECT_ADDRESS u64:3000 \
  --assume-yes

echo ""
echo "→ Step 4: Check Final Vault Reserves"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y

echo ""
echo "→ Step 5: Check Owner Balance After Burn"
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
echo "→ Step 6: Verify Position is Deleted (This should fail)"
if movement move view --profile $PROFILE --function-id ${MODULE_ADDRESS}::fractal_position::get_position_data --args address:$TOKEN_OBJECT_ADDRESS > /dev/null 2>&1; then
  echo "❌ ERROR: Position data still exists after burn!"
  exit 1
else
  echo "  ✓ Position data successfully deleted."
fi


echo ""
echo "✅ Burn test completed successfully"
echo "=============================="
