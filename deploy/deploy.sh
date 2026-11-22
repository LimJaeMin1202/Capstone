#!/usr/bin/env bash
set -euo pipefail

target_sha="${1:-}"
deploy_dir="${CAREFIT_DEPLOY_DIR:-/home/jaemin/webs/capstone/Capstone}"

if [[ ! "$target_sha" =~ ^[0-9a-fA-F]{40}$ ]]; then
  printf 'Expected a 40-character commit SHA.\n' >&2
  exit 2
fi
if [[ ! -d "$deploy_dir/.git" || ! -f "$deploy_dir/.env" ]]; then
  printf 'Deployment checkout or .env is missing: %s\n' "$deploy_dir" >&2
  exit 1
fi

cd "$deploy_dir"
if [[ "$(git branch --show-current)" != main ]]; then
  printf 'Deployment checkout must be on main.\n' >&2
  exit 1
fi
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  printf 'Deployment checkout has tracked local changes; resolve them before deploying.\n' >&2
  exit 1
fi

git fetch --no-tags origin main
git cat-file -e "${target_sha}^{commit}"
if ! git merge-base --is-ancestor "$target_sha" origin/main; then
  printf 'Tested commit is not on origin/main.\n' >&2
  exit 1
fi
if ! git merge-base --is-ancestor HEAD "$target_sha"; then
  printf 'Deployment checkout is already ahead of the tested commit.\n' >&2
  exit 1
fi

docker compose --env-file .env config --quiet
bash deploy/backup-db.sh
git merge --ff-only "$target_sha"
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d --build

for attempt in {1..36}; do
  postgres_health="$(docker inspect --format '{{.State.Health.Status}}' carefit-postgres 2>/dev/null || true)"
  backend_health="$(docker inspect --format '{{.State.Health.Status}}' carefit-backend 2>/dev/null || true)"
  frontend_health="$(docker inspect --format '{{.State.Health.Status}}' carefit-frontend 2>/dev/null || true)"
  if [[ "$postgres_health" == healthy && "$backend_health" == healthy && "$frontend_health" == healthy ]]; then
    break
  fi
  if (( attempt == 36 )); then
    docker compose --env-file .env ps
    docker compose --env-file .env logs --tail=100 backend frontend
    printf 'Containers did not become healthy.\n' >&2
    exit 1
  fi
  sleep 5
done

bash deploy/smoke-test.sh
printf 'Deployed tested commit %s successfully.\n' "$target_sha"
