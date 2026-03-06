#!/bin/bash
# Test Creem webhook — generates correct HMAC signature and sends curl request
# Usage: ./test-webhook.sh lifetime|monthly

SECRET="whsec_5adobKxLvyS6Fsul4MTwwh"
USER_ID="gZ0hUWX81uLZZLKwRYr4RKyqDNFN6ahc"
URL="https://groar.app/api/webhooks/creem"

if [ "$1" = "lifetime" ]; then
  PAYLOAD='{"id":"evt_test_lifetime_001","eventType":"checkout.completed","object":{"id":"chk_test_lifetime_001","product":{"id":"prod_1zTENe0ILO6VtdY84q2Lc5"},"customer":{"id":"cus_test_001","email":"yannick@groar.app"},"order":{"id":"ord_test_lifetime_001","amount":900},"metadata":{"userId":"gZ0hUWX81uLZZLKwRYr4RKyqDNFN6ahc","plan":"pro","billingPeriod":"lifetime"}}}'
elif [ "$1" = "monthly" ]; then
  PAYLOAD='{"id":"evt_test_monthly_001","eventType":"checkout.completed","object":{"id":"chk_test_monthly_001","product":{"id":"prod_RdFmKNhPZZh5IW0GSr19c"},"customer":{"id":"cus_test_002","email":"yannick@groar.app"},"subscription":{"id":"sub_test_monthly_001","currentPeriodStartDate":"2026-03-06T19:00:00.000Z","currentPeriodEndDate":"2026-04-06T19:00:00.000Z"},"order":{"id":"ord_test_monthly_001","amount":500},"metadata":{"userId":"gZ0hUWX81uLZZLKwRYr4RKyqDNFN6ahc","plan":"pro","billingPeriod":"monthly"}}}'
else
  echo "Usage: ./test-webhook.sh lifetime|monthly"
  exit 1
fi

# Compute HMAC-SHA256 signature from exact payload bytes
SIGNATURE=$(printf '%s' "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')

echo "Testing: $1"
echo "Signature: $SIGNATURE"
echo ""

curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "creem-signature: $SIGNATURE" \
  -d "$PAYLOAD"

echo ""
