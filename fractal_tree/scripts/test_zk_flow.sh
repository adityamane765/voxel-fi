#!/bin/bash
set -e

PROFILE=fractal8
MODULE=0x4e2e65c099323ccc865047636f9b418554ef9e5443db68571910b3f9567cb3c0
OWNER=$MODULE
POSITION_ID=0
COMMITMENT=0x1234567890abcdef

echo "=============================="
echo " ZK Flow Test"
echo " Profile: $PROFILE"
echo " Module:  $MODULE"
echo "=============================="

echo "→ Creating commitment..."
movement move run \
  --profile $PROFILE \
  --function-id $MODULE::zk_verifier::commit_position \
  --args \
    u64:$POSITION_ID \
    hex:$COMMITMENT

echo
echo "→ Verifying proof..."
movement move run \
  --profile $PROFILE \
  --function-id $MODULE::zk_verifier::verify_proof \
  --args \
    address:$OWNER \
    u64:$POSITION_ID \
    bool:true

echo
echo "→ Checking proof verification status..."
movement move view \
  --profile $PROFILE \
  --function-id $MODULE::zk_verifier::is_proof_verified \
  --args \
    address:$OWNER \
    u64:$POSITION_ID

echo
echo "→ Attempting replay (should fail)..."
set +e
movement move run \
  --profile $PROFILE \
  --function-id $MODULE::zk_verifier::verify_proof \
  --args \
    address:$OWNER \
    u64:$POSITION_ID \
    bool:true
set -e

echo
echo "✅ ZK flow test completed"
echo "=============================="
