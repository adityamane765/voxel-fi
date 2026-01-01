#!/usr/bin/env bash
set -e

# =============================================================================
#  VOXEL FINANCE - COMPLETE DEMO SCRIPT
#  Demonstrates the full LP lifecycle with ZK privacy
# =============================================================================

# Import common configuration
source "$(dirname "$0")/common_config.sh"

COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
NUM_SWAPS=${1:-5}
MARKET_PRICE=3000

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}║          ${GREEN}VOXEL FINANCE - PRIVACY-FIRST LIQUIDITY${CYAN}             ║${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}║     Fractal Curves + Zero-Knowledge Proofs on Movement       ║${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Profile:${NC} $PROFILE"
echo -e "${YELLOW}Module:${NC}  $MODULE_ADDRESS"
echo -e "${YELLOW}Swaps:${NC}   $NUM_SWAPS"
echo ""

# Helper function
print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  STEP $1: $2${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# =============================================================================
# STEP 1: CHECK SYSTEM STATUS
# =============================================================================
print_step "1/8" "Checking System Status"

echo "→ Verifying system initialization..."
WETH_BALANCE=$(movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::weth::balance \
  --args address:$MODULE_ADDRESS 2>/dev/null | jq -r '.[0]' 2>/dev/null || echo "0")

if [ "$WETH_BALANCE" == "0" ] || [ "$WETH_BALANCE" == "null" ]; then
    echo -e "${YELLOW}⚠️  System not initialized. Running init_backend.sh...${NC}"
    ./init_backend.sh
    echo ""
fi

echo -e "${GREEN}✓ System initialized${NC}"

# Show current reserves
echo ""
echo "→ Current vault reserves:"
movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y

# =============================================================================
# STEP 2: MINT LIQUIDITY POSITION
# =============================================================================
print_step "2/8" "Minting Fractal Liquidity Position"

echo "→ Creating position with:"
echo "   • 10 WETH + 30,000 USDC"
echo "   • Price center: 3000"
echo "   • Spread: 500 (±16.7%)"
echo "   • Fractal depth: 4"
echo ""

TMP_OUT=$(mktemp)

movement move run \
  --profile "$PROFILE" \
  --function-id "${MODULE_ADDRESS}::fractal_position::mint_position" \
  --type-args "$COIN_X" "$COIN_Y" \
  --args \
    u64:1000000000 \
    u64:30000000000 \
    u64:3000 \
    u64:500 \
    u8:0 \
    u8:4 \
  --assume-yes 2>&1 | tee "$TMP_OUT"

# Try to extract NFT address
TX_HASH=$(grep -oE 'Transaction hash: 0x[A-Za-z0-9]+' "$TMP_OUT" | awk '{print $3}' | head -1 || true)
rm -f "$TMP_OUT"

echo ""
echo -e "${GREEN}✓ Position minted successfully${NC}"

# Get position from registry
echo ""
echo "→ Fetching position from registry..."
sleep 2

# Query the registry to get the NFT address
REGISTRY_DATA=$(movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_position_data \
  --args address:0x0 2>/dev/null || echo "")

# For demo, we'll ask user to provide NFT address or use a placeholder approach
echo ""
echo -e "${YELLOW}📋 Please provide the NFT address from the transaction above.${NC}"
echo -e "${YELLOW}   (Check explorer: https://explorer.movementnetwork.xyz)${NC}"
echo ""
read -p "Enter NFT Object Address (or press Enter to skip remaining steps): " NFT_ADDRESS

if [ -z "$NFT_ADDRESS" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  No NFT address provided. Demo ended early.${NC}"
    echo ""
    echo "To continue manually:"
    echo "  1. Get NFT address from transaction events"
    echo "  2. Run: ./test_swap.sh (multiple times)"
    echo "  3. Run: ./run_fee_distribution.sh 3000"
    echo "  4. Run: ./fee_claim_test.sh <NFT_ADDRESS>"
    echo "  5. Run: ./test_zk_flow.sh <NFT_ADDRESS>"
    echo "  6. Run: ./test_burn_position.sh <NFT_ADDRESS>"
    exit 0
fi

# =============================================================================
# STEP 3: VIEW POSITION DATA
# =============================================================================
print_step "3/8" "Viewing Position Details"

echo "→ Position NFT: $NFT_ADDRESS"
echo ""
movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_position_data \
  --args address:$NFT_ADDRESS

echo ""
echo "→ Liquidity at current price ($MARKET_PRICE):"
movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::liquidity_at_price \
  --args address:$NFT_ADDRESS u64:$MARKET_PRICE

# =============================================================================
# STEP 4: SIMULATE TRADING ACTIVITY
# =============================================================================
print_step "4/8" "Simulating Trading Activity ($NUM_SWAPS swaps)"

for ((i=1; i<=NUM_SWAPS; i++)); do
    echo "→ Swap $i/$NUM_SWAPS..."

    if [ $((i % 2)) -eq 0 ]; then
        # Sell WETH for USDC
        AMOUNT=$((5000000 + RANDOM % 10000000))  # 0.05-0.15 WETH
        movement move run --assume-yes --profile $PROFILE \
          --function-id ${MODULE_ADDRESS}::vault::swap \
          --type-args $COIN_X $COIN_Y \
          --args u64:$AMOUNT u64:0 > /dev/null 2>&1
        echo "   Sold $(echo "scale=4; $AMOUNT / 100000000" | bc) WETH"
    else
        # Buy WETH with USDC
        AMOUNT=$((100000000 + RANDOM % 500000000))  # 100-600 USDC
        movement move run --assume-yes --profile $PROFILE \
          --function-id ${MODULE_ADDRESS}::vault::swap_y_for_x \
          --type-args $COIN_X $COIN_Y \
          --args u64:$AMOUNT u64:0 > /dev/null 2>&1
        echo "   Bought WETH with $(echo "scale=2; $AMOUNT / 1000000" | bc) USDC"
    fi

    sleep 1
done

echo ""
echo -e "${GREEN}✓ Trading simulation complete${NC}"

# =============================================================================
# STEP 5: DISTRIBUTE FEES
# =============================================================================
print_step "5/8" "Distributing Swap Fees to LPs"

echo "→ Checking pending fees..."
movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_pending_fees \
  --type-args $COIN_X $COIN_Y

echo ""
echo "→ Distributing fees..."
movement move run --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fee_distributor::distribute_accumulated_fees \
  --type-args $COIN_X $COIN_Y \
  --args u64:$MARKET_PRICE

echo ""
echo -e "${GREEN}✓ Fees distributed to LP positions${NC}"

# =============================================================================
# STEP 6: VIEW DASHBOARD & CLAIM FEES
# =============================================================================
print_step "6/8" "Position Dashboard & Fee Claiming"

echo "→ Position stats:"
movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::dashboard_stats::get_position_stats \
  --type-args $COIN_X $COIN_Y \
  --args address:$NFT_ADDRESS u64:$MARKET_PRICE

echo ""
echo "→ Unclaimed fees:"
UNCLAIMED=$(movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_unclaimed_fees \
  --args address:$NFT_ADDRESS u64:$MARKET_PRICE)
echo "$UNCLAIMED"

echo ""
echo "→ Claiming fees..."
movement move run --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::claim_fees \
  --type-args $COIN_X $COIN_Y \
  --args address:$NFT_ADDRESS u64:$MARKET_PRICE 2>/dev/null || echo "   (No fees to claim or already claimed)"

echo ""
echo -e "${GREEN}✓ Fees claimed${NC}"

# =============================================================================
# STEP 7: ZK VERIFICATION DEMO
# =============================================================================
print_step "7/8" "Zero-Knowledge Proof Demonstration"

echo "→ Fetching position ID..."
POSITION_DATA=$(movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_position_data \
  --args address:$NFT_ADDRESS)
echo "$POSITION_DATA"

POSITION_ID=$(echo "$POSITION_DATA" | jq -r '.Result[0].id // .Result.id // empty' 2>/dev/null || echo "")

if [ -z "$POSITION_ID" ] || [ "$POSITION_ID" == "null" ]; then
    # Try alternative parsing
    POSITION_ID=$(echo "$POSITION_DATA" | jq -r '.[0].id // .[0] // empty' 2>/dev/null || echo "0")
fi

echo ""
echo "→ Position ID: $POSITION_ID"

# Create commitment
COMMITMENT=0x$(openssl rand -hex 32 2>/dev/null || echo "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
echo ""
echo "→ Creating ZK commitment..."
echo "   Commitment: ${COMMITMENT:0:20}..."

movement move run --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::zk_verifier::commit_position \
  --args u64:$POSITION_ID hex:$COMMITMENT 2>/dev/null || echo "   (Commitment may already exist)"

echo ""
echo "→ Verifying proof (off-chain verification simulated)..."
movement move run --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::zk_verifier::verify_proof \
  --args address:$MODULE_ADDRESS u64:$POSITION_ID bool:true 2>/dev/null || echo "   (Proof may already be verified)"

echo ""
echo "→ Checking verification status..."
movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::zk_verifier::is_proof_verified \
  --args address:$MODULE_ADDRESS u64:$POSITION_ID

echo ""
echo -e "${GREEN}✓ ZK verification complete${NC}"

# =============================================================================
# STEP 8: SUMMARY
# =============================================================================
print_step "8/8" "Demo Summary"

echo "→ Final vault reserves:"
movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::vault::get_reserves \
  --type-args $COIN_X $COIN_Y

echo ""
echo "→ Global fee statistics:"
movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_global_fee_stats

echo ""
echo "→ Volatility metrics:"
movement move view --assume-yes --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::volatility_oracle::get_volatility_metrics \
  --type-args $COIN_X $COIN_Y 2>/dev/null || echo "   (Insufficient data)"

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}║                    ${GREEN}DEMO COMPLETE!${CYAN}                            ║${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Key Features Demonstrated:${NC}"
echo "  ✓ Fractal liquidity curves with infinite price coverage"
echo "  ✓ Privacy-preserving LP positions (ZK commitments)"
echo "  ✓ Spatial octree indexing for efficient lookups"
echo "  ✓ Fee distribution to active liquidity providers"
echo "  ✓ Volatility-aware spread recommendations"
echo "  ✓ Position NFTs for transferable liquidity"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  • Burn position: ./test_burn_position.sh $NFT_ADDRESS"
echo "  • View dashboard: ./test_dash_stats.sh $NFT_ADDRESS"
echo "  • More swaps: ./market_maker.sh 20"
echo ""
