#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! -f "$1" ]]; then
  printf 'Usage: bash deploy/verify-backup.sh /path/to/carefit-backup.dump\n' >&2
  exit 2
fi

backup_file="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
restore_db="carefit_restore_$(date -u +%Y%m%d%H%M%S)_$$"
cd "$project_dir"

cleanup() {
  docker compose --env-file .env exec -T -e CAREFIT_RESTORE_DB="$restore_db" \
    postgres sh -c 'dropdb -U "$POSTGRES_USER" --if-exists "$CAREFIT_RESTORE_DB"' \
    >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker compose --env-file .env exec -T -e CAREFIT_RESTORE_DB="$restore_db" \
  postgres sh -c 'createdb -U "$POSTGRES_USER" "$CAREFIT_RESTORE_DB"'
docker compose --env-file .env exec -T -e CAREFIT_RESTORE_DB="$restore_db" \
  postgres sh -c 'pg_restore --exit-on-error -U "$POSTGRES_USER" -d "$CAREFIT_RESTORE_DB"' \
  < "$backup_file"
docker compose --env-file .env exec -T -e CAREFIT_RESTORE_DB="$restore_db" \
  postgres sh -c 'psql -U "$POSTGRES_USER" -d "$CAREFIT_RESTORE_DB" -Atc "SELECT count(*) FROM exercises"' \
  >/dev/null

printf '%s\n' "Backup restore verification succeeded: $backup_file"
