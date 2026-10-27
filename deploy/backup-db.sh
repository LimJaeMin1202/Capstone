#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
backup_dir="${CAREFIT_BACKUP_DIR:-$project_dir/backups}"
umask 077
mkdir -p "$backup_dir"
temporary_file="$(mktemp "$backup_dir/.carefit-XXXXXX.dump")"
trap 'rm -f -- "$temporary_file"' EXIT

cd "$project_dir"
docker compose --env-file .env exec -T postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$temporary_file"
docker compose --env-file .env exec -T postgres pg_restore --list \
  < "$temporary_file" > /dev/null

backup_file="$backup_dir/carefit-$(date -u +%Y%m%dT%H%M%SZ).dump"
mv -- "$temporary_file" "$backup_file"
trap - EXIT
printf 'Verified backup: %s\n' "$backup_file"
