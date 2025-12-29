#!/usr/bin/env bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

echo "=============================="
echo " Initializing Fractal Backend "
echo " Profile: $PROFILE"
echo " Address: $MODULE_ADDRESS"
echo "=============================="

echo ""
echo "→ 0. Initializing WETH and USDC..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::init \
  --assume-yes \
  || echo "WETH already initialized (ok)" 

movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::usdc::init \
  --assume-yes \
  || echo "USDC already initialized (ok)"

echo ""
echo "→ 0.1. Registering WETH and USDC on account..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::register \
  --assume-yes \
  || echo "WETH already registered (ok)"

movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::usdc::register \
  --assume-yes \
  || echo "USDC already registered (ok)"

echo ""
echo "→ 0.2. Minting initial WETH and USDC to account..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::mint \
  --args address:${MODULE_ADDRESS} u64:1000000000000000 \
  --assume-yes
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::usdc::mint \
  --args address:${MODULE_ADDRESS} u64:3000000000000000 \
  --assume-yes

echo ""
echo "→ 1. Initializing Vault..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::init \
  --type-args $COIN_X $COIN_Y \
  --assume-yes \
  || echo "Vault already initialized (ok)"

echo ""
echo "→ 2. Initializing Spatial Octree..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::spatial_octree::init \
  --assume-yes \
  || echo "Octree already initialized (ok)"

echo ""
echo "→ 3. Initializing Position Counter..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::init_counter \
  --assume-yes \
  || echo "Counter already initialized (ok)"

echo ""
echo "→ 3.1. Initializing Position Data Store..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::init_data_store \
  --assume-yes \
  || echo "Data Store already initialized (ok)"

echo ""
echo "→ 3.2. Initializing NFT Collection..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::init_collection \
  --assume-yes \
  || echo "NFT Collection already initialized (ok)"


echo ""
echo "→ 4. Sanity check: Vault reserves (should be 0,0)"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y \
  --assume-yes

echo ""
echo "→ 5. Sanity check: Octree empty query (should be 0)"
movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::spatial_octree::query \
  --args \
    u16:0 \
    u8:0 \
    u8:0 \
    --assume-yes

echo ""
echo "✅ Backend initialized and verified successfully"
echo "=============================="