#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"
COMPOSE_FILE="${2:-compose.prod.yaml}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Missing compose file: $COMPOSE_FILE" >&2
  exit 1
fi

while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
  line="${raw_line%$'\r'}"

  if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
    continue
  fi

  line="${line#export }"

  if [[ "$line" != *=* ]]; then
    continue
  fi

  name="${line%%=*}"
  value="${line#*=}"
  name="${name//[[:space:]]/}"

  if [[ ( "$value" == \"*\" && "$value" == *\" ) || ( "$value" == \'*\' && "$value" == *\' ) ]]; then
    value="${value:1:-1}"
  fi

  export "$name=$value"
done < "$ENV_FILE"

required_vars=(
  MYSQL_DATABASE
  MYSQL_ROOT_PASSWORD
  APP_JWT_SECRET
  APP_CORS_ALLOWED_ORIGINS
)

for name in "${required_vars[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env var: $name" >&2
    exit 1
  fi
done

if [[ "${#APP_JWT_SECRET}" -lt 32 ]]; then
  echo "APP_JWT_SECRET must be at least 32 characters" >&2
  exit 1
fi

if [[ -n "${APP_BOOTSTRAP_ADMIN_EMAIL:-}" && -z "${APP_BOOTSTRAP_ADMIN_PASSWORD:-}" ]]; then
  echo "APP_BOOTSTRAP_ADMIN_PASSWORD is required when APP_BOOTSTRAP_ADMIN_EMAIL is set" >&2
  exit 1
fi

if [[ "$APP_CORS_ALLOWED_ORIGINS" == *"localhost"* || "$APP_CORS_ALLOWED_ORIGINS" == *"127.0.0.1"* ]]; then
  echo "APP_CORS_ALLOWED_ORIGINS still points to localhost/127.0.0.1" >&2
  exit 1
fi

if [[ "$COMPOSE_FILE" == *"compose.prod.yaml"* ]]; then
  if [[ -z "${BACKEND_IMAGE:-}" || -z "${FRONTEND_IMAGE:-}" ]]; then
    echo "BACKEND_IMAGE and FRONTEND_IMAGE are required for compose.prod.yaml" >&2
    exit 1
  fi
fi

if command -v docker >/dev/null 2>&1; then
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config -q
else
  echo "docker not found; skipped 'docker compose config -q' validation"
fi

echo "Preflight passed for $COMPOSE_FILE using $ENV_FILE"
