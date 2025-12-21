#!/bin/bash
set -e

PROFILE=fractal-testnet
MODULE=0x43f0581028053bb1b1a738c34637203ff015fac6683592ef781722d8e40449e3
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
