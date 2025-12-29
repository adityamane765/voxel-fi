#!/usr/bin/env bash

set +e

PROFILE=f5
MODULE_ADDRESS=0x10b3826d14a19405d67bdee5fbaa6c4b3fcf52910a626f898ef844b94be92b9a
COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

echo "=============================="
echo "  Voxel Status Check"
echo "  Profile:$PROFILE"
echo "  Address:$MODULE_ADDRESS"
echo "=============================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_passed=0
check_failed=0

# helpers to run checks
check_component() {
  local name=$1
  local command=$2
  
  echo -n "→ Checking $name... "
  
  if output=$(eval "$command" 2>&1); then
    echo -e "${GREEN}✓${NC}"
    ((check_passed++))
    return 0
  else
    echo -e "${RED}✗${NC}"
    ((check_failed++))
    echo "  Error: $output" | head -n 1
    return 1
  fi
}

echo "=== Token Status ==="
check_component "WETH initialization" \
  "movement move view --profile $PROFILE --function-id ${MODULE_ADDRESS}::weth::balance --args address:$MODULE_ADDRESS --assume-yes"

check_component "USDC initialization" \
  "movement move view --profile $PROFILE --function-id ${MODULE_ADDRESS}::usdc::balance --args address:$MODULE_ADDRESS --assume-yes"

# Get token balances
WETH_BALANCE=$(movement move view --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::balance \
  --args address:$MODULE_ADDRESS 2>/dev/null | jq -r '.[0]' 2>/dev/null || echo "0") \
  --assume-yes

USDC_BALANCE=$(movement move view --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::usdc::balance \
  --args address:$MODULE_ADDRESS 2>/dev/null | jq -r '.[0]' 2>/dev/null || echo "0") \
  --assume-yes

echo "  WETH Balance: $WETH_BALANCE ($(echo "scale=2; $WETH_BALANCE / 100000000" | bc 2>/dev/null || echo "?") WETH)"
echo "  USDC Balance: $USDC_BALANCE ($(echo "scale=2; $USDC_BALANCE / 1000000" | bc 2>/dev/null || echo "?") USDC)"
echo ""

echo "=== Core Components ==="
check_component "Vault" \
  "movement move view --profile $PROFILE --function-id ${MODULE_ADDRESS}::vault::get_reserves --type-args $COIN_X $COIN_Y --assume-yes"

check_component "Spatial Octree" \
  "movement move view --profile $PROFILE --function-id ${MODULE_ADDRESS}::spatial_octree::query --args u16:0 u8:0 u8:0 --assume-yes"

# Counter and DataStore can't be checked directly, they'll show as failed if not init
echo ""

echo "=== Vault Reserves ==="
RESERVES=$(movement move view --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y 2>/dev/null) \
  --assume-yes

if [ -n "$RESERVES" ]; then
  RESERVE_X=$(echo "$RESERVES" | jq -r '.[0]' 2>/dev/null || echo "0")
  RESERVE_Y=$(echo "$RESERVES" | jq -r '.[1]' 2>/dev/null || echo "0")
  echo "  WETH Reserve: $RESERVE_X ($(echo "scale=2; $RESERVE_X / 100000000" | bc 2>/dev/null || echo "?") WETH)"
  echo "  USDC Reserve: $RESERVE_Y ($(echo "scale=2; $RESERVE_Y / 1000000" | bc 2>/dev/null || echo "?") USDC)"
  
  if [ "$RESERVE_X" = "0" ] && [ "$RESERVE_Y" = "0" ]; then
    echo -e "  Status: ${YELLOW}Empty (no positions minted yet)${NC}"
  else
    echo -e "  Status: ${GREEN}Active with liquidity${NC}"
  fi
else
  echo -e "  ${RED}Could not query reserves${NC}"
fi
echo ""

echo "=== System Summary ==="
echo -e "Passed: ${GREEN}$check_passed${NC}"
echo -e "Failed: ${RED}$check_failed${NC}"
echo ""

if [ $check_failed -eq 0 ]; then
  echo -e "${GREEN}✅ All systems operational!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Mint a position: ./test_mint_position.sh"
  echo "  2. View liquidity: ./test_liquidity_view.sh <NFT_ADDRESS>"
  echo "  3. Test ZK flow: ./test_zk_flow.sh <NFT_ADDRESS>"
  echo "  4. Test swap: ./test_swap.sh"
  exit 0
else
  echo -e "${RED}⚠️  Some components not initialized${NC}"
  echo ""
  echo "Run initialization:"
  echo "  ./init_backend.sh"
  echo ""
  echo "Then run this check again:"
  echo "  ./check_status.sh"
  exit 1
fi

echo "=============================="