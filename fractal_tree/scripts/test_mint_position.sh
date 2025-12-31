#!/usr/bin/env bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

OWNER_ADDR=$MODULE_ADDRESS
COIN_X=${MODULE_ADDRESS}::weth::WETH
COIN_Y=${MODULE_ADDRESS}::usdc::USDC

echo "=============================="
echo " Mint Position Test"
echo " Profile: $PROFILE"
echo " Module:  $MODULE_ADDRESS"
echo "=============================="

echo ""
echo "→ Initial Vault Reserves:"
movement move view \
  --profile "$PROFILE" \
  --function-id "${MODULE_ADDRESS}::vault::get_reserves" \
  --type-args "$COIN_X" "$COIN_Y" \
  --assume-yes

echo ""
echo "→ Minting fractal position with 10 WETH and 30,000 USDC..."

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
  --assume-yes \
  2>&1 | tee "$TMP_OUT"

# Extract transaction hash
TX_HASH=$(grep -oE 'Transaction hash: [A-Za-z0-9]+' "$TMP_OUT" | awk '{print $3}' || true)

rm -f "$TMP_OUT"

echo ""
echo "→ Final Vault Reserves:"
movement move view \
  --profile "$PROFILE" \
  --function-id "${MODULE_ADDRESS}::vault::get_reserves" \
  --type-args "$COIN_X" "$COIN_Y" \
  --assume-yes

if [ -n "$TX_HASH" ]; then
  echo ""
  echo "→ Transaction hash: $TX_HASH"
  echo "→ Waiting for transaction to be processed..."
  sleep 3

  TX_DETAILS=$(movement view transaction-by-hash "$TX_HASH" --profile "$PROFILE" 2>/dev/null || echo "{}")

  NFT_ADDRESS=$(echo "$TX_DETAILS" | jq -r '.events[] | select(.type | contains("PositionMinted")) | .data.token_addr' 2>/dev/null || echo "")

  if [ -n "$NFT_ADDRESS" ] && [ "$NFT_ADDRESS" != "null" ]; then
    echo ""
    echo "✨ New Position NFT minted at address: $NFT_ADDRESS"
    echo ""
    echo "→ You can now use this address with:"
    echo "  ./test_liquidity_view.sh $NFT_ADDRESS"
    echo "  ./test_zk_flow.sh $NFT_ADDRESS"
    echo "  ./test_burn_position.sh $NFT_ADDRESS"
  else
    echo ""
    echo "⚠️  Could not extract NFT address automatically."
    echo "   Please check the transaction events manually."
  fi
else
  echo ""
  echo "⚠️  Could not extract transaction hash."
  echo "   Position minted successfully, please obtain the NFT address from "https://explorer.movementnetwork.xyz/txn/${TX_HASH}/events?network=bardock+testnet""
fi

echo ""
echo "✅ Mint test completed successfully"
echo "=============================="
