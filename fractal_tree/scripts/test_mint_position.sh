#!/usr/bin/env bash
set -e

PROFILE=fractal-testnet
MODULE_ADDR=0x43f0581028053bb1b1a738c34637203ff015fac6683592ef781722d8e40449e3
OWNER_ADDR=$MODULE_ADDR
POSITION_ID=0
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
  --args address:$OWNER_ADDR

echo ""
echo "→ Checking position #$POSITION_ID..."
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDR}::fractal_position::get_position \
  --args \
    address:$OWNER_ADDR \
    u64:$POSITION_ID

echo ""
echo "→ Checking octree bucket..."
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDR}::spatial_octree::query \
  --args \
    address:$OWNER_ADDR \
    u16:100 \
    u8:3 \
    u8:3

echo ""
echo "✅ Mint test completed successfully"
echo "=============================="
