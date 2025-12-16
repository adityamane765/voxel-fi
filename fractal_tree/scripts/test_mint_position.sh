#!/usr/bin/env bash
set -e

PROFILE=fractal8
MODULE_ADDR=0x4e2e65c099323ccc865047636f9b418554ef9e5443db68571910b3f9567cb3c0
COIN=0x1::aptos_coin::AptosCoin

echo "=============================="
echo " Mint Position Test"
echo " Profile: $PROFILE"
echo " Module:  $MODULE_ADDR"
echo "=============================="

echo "→ Minting fractal position..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDR}::fractal_position::mint_position \
  --type-args $COIN $COIN \
  --args \
    u64:1000000 \
    u64:0 \
    u64:1000 \
    u64:100 \
    u8:0 \
    u8:4

echo ""
echo "→ Checking vault reserves..."
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDR}::vault::get_reserves \
  --type-args $COIN $COIN \
  --args address:$MODULE_ADDR

echo ""
echo "→ Checking position #0..."
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDR}::fractal_position::get_position \
  --args \
    address:$MODULE_ADDR \
    u64:0

echo ""
echo "→ Checking octree bucket..."
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDR}::spatial_octree::query \
  --args \
    address:$MODULE_ADDR \
    u16:100 \
    u8:3 \
    u8:3

echo ""
echo "✅ Mint test completed successfully"
echo "=============================="
