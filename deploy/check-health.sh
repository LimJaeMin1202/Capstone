#!/usr/bin/env bash
set -euo pipefail

base_url="${CAREFIT_PUBLIC_URL:-https://daisy.wisoft.dev/carefit}"
base_url="${base_url%/}"
webhook_url="${CAREFIT_ALERT_WEBHOOK_URL:-}"

report_failure() {
  local message="$1"
  printf '%s\n' "CareFit health check failed: $message" >&2
  if [[ -n "$webhook_url" ]]; then
    curl --fail --silent --show-error --max-time 10 \
      -H 'Content-Type: application/json' \
      --data "$(printf '{\"text\":\"CareFit health check failed: %s\"}' "$message")" \
      "$webhook_url" >/dev/null || true
  fi
  exit 1
}

curl --fail --silent --show-error --max-time 10 \
  -o /dev/null "$base_url/" || report_failure "frontend unavailable"

exercise="$(curl --fail --silent --show-error --max-time 10 \
  "$base_url/gateway/api/exercises/seated-front-raise")" || report_failure "exercise API or database unavailable"
printf '%s' "$exercise" | grep -Eq '"id"[[:space:]]*:[[:space:]]*"seated-front-raise"' \
  || report_failure "unexpected exercise API response"

printf '%s\n' "CareFit public frontend and exercise data: UP"
