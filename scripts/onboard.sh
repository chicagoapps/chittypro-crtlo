#!/bin/bash
set -euo pipefail
echo "=== chittypro-crtlo Onboarding ==="
curl -s -X POST "${GETCHITTY_ENDPOINT:-https://get.chitty.cc/api/onboard}" \
  -H "Content-Type: application/json" \
  -d '{"service_name":"chittypro-crtlo","organization":"CHICAGOAPPS","type":"service","tier":4,"domains":["crtlo.chitty.cc"]}' | jq .
