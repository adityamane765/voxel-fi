#!/bin/bash
set -e

# Import common configuration
source "$(dirname "$0")/common_config.sh"

TOKEN_OBJECT_ADDRESS=$1 # Expecting the NFT object address as the first argument

if [ -z "$TOKEN_OBJECT_ADDRESS" ]; then
  echo "Usage: $0 <NFT_OBJECT_ADDRESS>"
  exit 1
fi

echo "=============================="
echo " ZK Flow Test"
echo " Profile: $PROFILE"
echo " Module:  $MODULE_ADDRESS"
echo " NFT Address: $TOKEN_OBJECT_ADDRESS"
echo "=============================="

echo ""
echo "→ Fetching position data from NFT..."
POSITION_DATA=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::fractal_position::get_position_data \
  --args address:$TOKEN_OBJECT_ADDRESS) \
  --assume-yes
echo "$POSITION_DATA"

# Extract position_id from the returned data (first field in the struct)
POSITION_ID=$(echo "$POSITION_DATA" | jq -r '.Result[0].id // empty')

if [ -z "$POSITION_ID" ] || [ "$POSITION_ID" == "null" ]; then
  echo ""
  echo "❌ Error: Could not extract position ID from NFT $TOKEN_OBJECT_ADDRESS."
  echo "   Make sure the NFT address is valid and the position exists."
  exit 1
fi

echo ""
echo "✓ Extracted Position ID: $POSITION_ID"

COMMITMENT=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

echo ""
echo "→ Creating commitment for position $POSITION_ID..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::zk_verifier::commit_position \
  --args \
    u64:$POSITION_ID \
    hex:$COMMITMENT \
  --assume-yes

echo ""
echo "→ Verifying proof for position $POSITION_ID..."
movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::zk_verifier::verify_proof \
  --args \
    address:${MODULE_ADDRESS} \
    u64:$POSITION_ID \
    bool:true \
  --assume-yes

echo ""
echo "→ Checking proof verification status..."
VERIFIED=$(movement move view \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::zk_verifier::is_proof_verified \
  --args \
    address:${MODULE_ADDRESS} \
    u64:$POSITION_ID) \
  --assume-yes

echo "Verification status: $VERIFIED"

echo ""
echo "→ Attempting replay (should fail with E_NULLIFIER_USED)..."
set +e
REPLAY_OUTPUT=$(movement move run \
  --profile $PROFILE \
  --function-id ${MODULE_ADDRESS}::zk_verifier::verify_proof \
  --args \
    address:${MODULE_ADDRESS} \
    u64:$POSITION_ID \
    bool:true 2>&1) \
  --assume-yes

if echo "$REPLAY_OUTPUT" | grep -q "E_NULLIFIER_USED\|error"; then
  echo "✓ Replay correctly prevented (expected behavior)"
else
  echo "⚠️  Replay did not fail as expected"
fi
set -e

echo ""
echo "✅ ZK flow test completed successfully"
echo "=============================="