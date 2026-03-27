#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:?Usage: smoke-public.sh <base-url>}"
BASE_URL="${BASE_URL%/}"

echo "Checking frontend root..."
curl --fail --silent --show-error "$BASE_URL/" >/dev/null

echo "Checking backend health..."
HEALTH_RESPONSE="$(curl --fail --silent --show-error "$BASE_URL/actuator/health")"
echo "$HEALTH_RESPONSE" | grep '"status":"UP"' >/dev/null

echo "Checking public catalog..."
CATALOG_RESPONSE="$(curl --fail --silent --show-error "$BASE_URL/api/products?cat=all")"
echo "$CATALOG_RESPONSE" | grep -E '^[[:space:]]*\[' >/dev/null

echo "Checking auth/me protection..."
AUTH_ME_OUTPUT="$(mktemp)"
AUTH_ME_STATUS="$(curl --silent --show-error -o "$AUTH_ME_OUTPUT" -w '%{http_code}' "$BASE_URL/api/auth/me")"
if [[ "$AUTH_ME_STATUS" != "401" && "$AUTH_ME_STATUS" != "200" ]]; then
  cat "$AUTH_ME_OUTPUT" >&2
  rm -f "$AUTH_ME_OUTPUT"
  echo "Unexpected /api/auth/me status: $AUTH_ME_STATUS" >&2
  exit 1
fi
rm -f "$AUTH_ME_OUTPUT"

echo "Public smoke checks passed for $BASE_URL"
