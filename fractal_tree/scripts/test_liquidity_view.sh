#!/bin/bash
set -e

PROFILE=fractal8
MODULE=0x4e2e65c099323ccc865047636f9b418554ef9e5443db68571910b3f9567cb3c0
OWNER=$MODULE
POSITION_ID=1

echo "=============================="
echo " Liquidity View Test"
echo " Profile: $PROFILE"
echo " Module:  $MODULE"
echo "=============================="

echo "→ Price at center (should be full liquidity)..."
movement move view \
  --profile $PROFILE \
  --function-id $MODULE::fractal_position::liquidity_at_price \
  --args \
    address:$OWNER \
    u64:$POSITION_ID \
    u64:1000

echo
echo "→ Price slightly off-center..."
movement move view \
  --profile $PROFILE \
  --function-id $MODULE::fractal_position::liquidity_at_price \
  --args \
    address:$OWNER \
    u64:$POSITION_ID \
    u64:1050

echo
echo "→ Price outside spread (should be 0)..."
movement move view \
  --profile $PROFILE \
  --function-id $MODULE::fractal_position::liquidity_at_price \
  --args \
    address:$OWNER \
    u64:$POSITION_ID \
    u64:2000

echo
echo "✅ Liquidity view test completed"
echo "=============================="
