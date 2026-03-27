#!/usr/bin/env bash
set -euo pipefail

URL="${1:?Usage: wait-for-url.sh <url> [attempts] [sleep-seconds]}"
ATTEMPTS="${2:-24}"
SLEEP_SECONDS="${3:-5}"

for attempt in $(seq 1 "$ATTEMPTS"); do
  if curl --fail --silent --show-error "$URL" >/dev/null; then
    echo "URL is healthy: $URL"
    exit 0
  fi

  if [[ "$attempt" -lt "$ATTEMPTS" ]]; then
    echo "Waiting for $URL ($attempt/$ATTEMPTS)..."
    sleep "$SLEEP_SECONDS"
  fi
done

echo "Timed out waiting for $URL" >&2
exit 1
