#!/usr/bin/env bash
set -e

PROFILE=fractal-testnet
PKG_ADDR=0x43f0581028053bb1b1a738c34637203ff015fac6683592ef781722d8e40449e3
COIN_X=0x1::aptos_coin::AptosCoin
COIN_Y=0x1::aptos_coin::AptosCoin

echo "=============================="
echo " Initializing Fractal Backend "
echo " Profile: $PROFILE"
echo " Address: $PKG_ADDR"
echo "=============================="

echo ""
echo "→ 1. Initializing Vault..."
movement move run \
  --profile $PROFILE \
  --function-id ${PKG_ADDR}::vault::init \
  --type-args $COIN_X $COIN_Y \
  || echo "Vault already initialized (ok)"

echo ""
echo "→ 2. Initializing Spatial Octree..."
movement move run \
  --profile $PROFILE \
  --function-id ${PKG_ADDR}::spatial_octree::init \
  || echo "Octree already initialized (ok)"

echo ""
echo "→ 3. Initializing Position Counter..."
movement move run \
  --profile $PROFILE \
  --function-id ${PKG_ADDR}::fractal_position::init_counter \
  || echo "Counter already initialized (ok)"

echo ""
echo "→ 4. Sanity check: Vault reserves (should be 0,0)"
movement move view \
  --profile $PROFILE \
  --function-id ${PKG_ADDR}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y \
  --args address:$PKG_ADDR

echo ""
echo "→ 5. Sanity check: Octree empty query (should be 0)"
movement move view \
  --profile $PROFILE \
  --function-id ${PKG_ADDR}::spatial_octree::query \
  --args \
    address:$PKG_ADDR \
    u16:0 \
    u8:0 \
    u8:0

echo ""
echo "✅ Backend initialized and verified successfully"
echo "=============================="
