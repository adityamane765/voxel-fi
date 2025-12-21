#!/usr/bin/env bash
set -e

PROFILE=fractal-testnet
MODULE_ADDR=0x43f0581028053bb1b1a738c34637203ff015fac6683592ef781722d8e40449e3

echo "=============================="
echo " Burn Position Test"
echo " Profile: $PROFILE"
echo " Module:  $MODULE_ADDR"
echo "=============================="

echo "→ Burning position #0..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDR}::fractal_position::burn_position \
  --type-args 0x1::aptos_coin::AptosCoin 0x1::aptos_coin::AptosCoin \
  --args \
    u64:0

echo ""
echo "→ Checking vault reserves (should be 0,0)..."
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDR}::vault::get_reserves \
  --type-args 0x1::aptos_coin::AptosCoin 0x1::aptos_coin::AptosCoin \
  --args address:${MODULE_ADDR}

echo ""
echo "→ Checking octree bucket (should be 0)..."
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDR}::spatial_octree::query \
  --args \
    address:${MODULE_ADDR} \
    u16:100 \
    u8:3 \
    u8:3

echo ""
echo "→ Checking position #0 (should fail or be empty)..."
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDR}::fractal_position::get_position \
  --args \
    address:${MODULE_ADDR} \
    u64:0 || echo "✓ Position successfully removed"

echo ""
echo "✅ Burn test completed successfully"
echo "=============================="
