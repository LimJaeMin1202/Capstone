# CareFit 운영 점검 및 변경 적용

현재 공개 주소는 `https://daisy.wisoft.dev/carefit/`이고, API는
`/carefit/gateway/api/`를 거쳐 프론트 Nginx에서 백엔드로 전달된다.

## 변경 전

연구실 서버 `~/webs/capstone/Capstone`에서 작업한다. `.env`와 기존 stash는
Git에 포함되지 않으며, `git stash pop`은 하지 않는다.

```bash
cd ~/webs/capstone/Capstone
git status --short
git pull --ff-only origin main
bash deploy/backup-db.sh
```

백업 경로가 출력되면 그 파일을 별도 저장소에도 복사한다. 스키마 이력 도입 전에는
백업을 복원할 수 있는지도 확인한다.

```bash
bash deploy/verify-backup.sh backups/출력된-백업파일.dump
```

복원 검증은 임시 데이터베이스를 만들고 삭제하며 운영 DB는 수정하지 않는다.

## 코드 반영

이번 변경에는 DB 스키마 이력(Flyway)이 처음 도입된다. 기존 DB가 비어 있지
않으면 첫 배포에 한해 `.env`에 `DB_BASELINE_ON_MIGRATE=true`를 지정하여
현재 스키마를 버전 1 기준선으로 등록한다. 새 DB에는
`V1__initial_schema.sql`을 적용한다. 앱 시작 시 Hibernate가 테이블 구조를
검증하며, 구조가 다르면 앱이 시작하지 않는다. 기존 데이터의 시각은 UTC로
저장된 것으로 보고 API에서 `Z`를 붙여 반환한다.

첫 배포 직전 `nano .env`를 열고 다음 줄을 추가하거나 기존 값을 바꾼다.

```env
DB_BASELINE_ON_MIGRATE=true
```

```bash
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d --build --force-recreate
docker compose --env-file .env ps
bash deploy/smoke-test.sh
```

기존 DB에서 Flyway 기준선이 만들어진 후 `.env`의
`DB_BASELINE_ON_MIGRATE=false`로 되돌린다. 다음 재배포부터 기준선을 새로
만들지 않도록 하기 위한 설정이다.

처음 백엔드 배포는 Flyway 기준선 등록과 새 이미지 빌드 때문에 시간이 걸릴 수
있다. `backend`와 `frontend` 상태가 `healthy`가 된 다음 브라우저에서 일반
로그인, 카카오 로그인, 운동 기록 저장, 기록·목표 조회를 확인한다.

백엔드가 `unhealthy`이면 추가 재시작 전에 원인을 확인한다.

```bash
docker compose --env-file .env logs --tail=150 backend
```

`Schema-validation` 오류가 있으면 기존 스키마와 `V1__initial_schema.sql`의
차이를 확인해야 한다. 운영 DB에 임의의 `ALTER`나 `down -v`를 실행하지 않는다.

## 자동 검사와 배포

`.github/workflows/ci.yml`은 `main` push와 pull request에서 백엔드 H2
테스트, 프론트 lint·빌드·운영 의존성 보안 감사, Compose 설정 검사를 수행한다.
서버 배포는 현재 수동이다. CI 성공만으로 서버 컨테이너가 갱신되지는 않는다.

## 정기 백업·장애 감지

아래 명령은 일반 사용자 `jaemin`의 `crontab -e`에 등록할 수 있다.
`date`로 서버의 시간대를 먼저 확인하고 백업 시각을 결정한다.

```cron
15 3 * * * cd /home/jaemin/webs/capstone/Capstone && /usr/bin/bash deploy/backup-db.sh >> /home/jaemin/carefit-backup.log 2>&1
*/5 * * * * cd /home/jaemin/webs/capstone/Capstone && /usr/bin/bash deploy/check-health.sh >> /home/jaemin/carefit-health.log 2>&1
```

백업은 기본적으로 프로젝트의 `backups/`에 쌓인다. Git에서 제외된다.
디스크 사용량을 확인하며 외부 위치에도 복사하고, 매월 `verify-backup.sh`로
복원 검증한다. 오래된 백업 삭제는 보존 기간을 결정한 뒤 수행한다.

장애 알림을 받으려면 Slack 형식의 웹훅 URL을 GitHub 저장소의
`CAREFIT_ALERT_WEBHOOK_URL` secret 또는 모니터 실행 환경에 지정한다.
15분 간격의 GitHub Actions 공개 상태 점검도 포함된다. 웹훅 URL은 Git에
저장하지 않는다. 웹훅이 없어도 실패는 워크플로 상태, 표준 오류, 종료 코드
1로 기록되므로 알림 채널을 설정하기 전에는 상태와 로그를 직접 확인해야 한다.

```bash
tail -n 50 /home/jaemin/carefit-health.log
docker compose --env-file .env ps
```
