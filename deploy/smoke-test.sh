#!/usr/bin/env bash
set -euo pipefail

base_url="${CAREFIT_PUBLIC_URL:-https://daisy.wisoft.dev/carefit}"
base_url="${base_url%/}"
origin="$(printf '%s' "$base_url" | sed -E 's#^(https?://[^/]+).*$#\1#')"

bash "$(dirname "$0")/check-health.sh"

status="$(curl --silent --show-error --max-time 10 -o /dev/null \
  -w '%{http_code}' -X POST \
  -H "Origin: $origin" \
  -H 'Content-Type: application/json' \
  --data '{}' "$base_url/gateway/api/auth/login")"
[[ "$status" == 400 ]] || {
  printf 'Login API expected 400 for empty credentials, got %s\n' "$status" >&2
  exit 1
}

printf '%s\n' "CareFit public routing and login API: OK"
