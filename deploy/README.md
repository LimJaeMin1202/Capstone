# CareFit 배포 가이드

Docker Compose를 사용한 단일 호스트 배포 구성. 연구실 서버나 일반 Linux 환경에서 동작.

## 구성

```
┌────────────────────────────────────────┐
│  frontend (nginx, port 80)             │
│  ├─ React 정적 파일                     │
│  └─ /api/* → backend:8080 프록시        │
├────────────────────────────────────────┤
│  backend  (Spring Boot, port 8080)     │
│  └─ PostgreSQL 연결                     │
├────────────────────────────────────────┤
│  postgres (PostgreSQL 16)              │
│  └─ 영구 볼륨 pgdata                    │
└────────────────────────────────────────┘
```

## 사전 준비

서버에 설치돼 있어야 할 것:
- **Docker** (24+ 권장)
- **Docker Compose v2** (`docker compose` 명령. v1의 `docker-compose`는 deprecated)

설치 확인:
```bash
docker --version
docker compose version
```

## 배포 절차

### 1. 코드 가져오기

```bash
git clone https://github.com/LimJaeMin1202/Capstone.git carefit
cd carefit
```

### 2. 환경변수 설정

```bash
cp .env.example .env
nano .env   # 또는 vi
```

채워야 할 값:

| 변수 | 설명 | 예시 |
|---|---|---|
| `DB_USERNAME` | DB 사용자명 | `carefit_user` |
| `DB_PASSWORD` | DB 비밀번호 (강하게) | `랜덤 16자 이상` |
| `JWT_SECRET` | JWT 서명 키 (강하게) | `openssl rand -base64 48` |
| `KAKAO_REST_API_KEY` | 카카오 REST API 키 | 카카오 디벨로퍼스에서 발급 |
| `KAKAO_CLIENT_SECRET` | 카카오 Client Secret | 카카오 디벨로퍼스에서 발급 |
| `VITE_KAKAO_REST_API_KEY` | 카카오 REST API 키 (프론트) | 위와 동일 |
| `VITE_KAKAO_REDIRECT_URI` | 카카오 콘솔에 등록한 Redirect URI | `http://서버주소/` |
| `WEB_PORT` | 외부 포트 | `80` (기본) |

JWT_SECRET 생성 예:
```bash
openssl rand -base64 48
```

### 3. 카카오 콘솔 설정

카카오 디벨로퍼스 → 내 앱 → **카카오 로그인 > Redirect URI**에
배포 도메인을 등록해야 함:
```
http://서버주소/
또는
https://carefit.example.com/
```

`VITE_KAKAO_REDIRECT_URI`의 값과 정확히 일치해야 함.

### 4. 빌드 및 실행

```bash
docker compose up -d --build
```

- 처음엔 빌드에 5~10분 소요 (Gradle/npm 의존성 다운로드)
- 두 번째부터는 캐시 활용해서 빠름

### 5. 동작 확인

```bash
docker compose ps
docker compose logs -f backend     # 백엔드 부팅 로그
docker compose logs -f frontend    # nginx 로그
```

브라우저에서 `http://서버주소/` 접속 → 로그인 화면 보이면 성공.

## 운영 명령

| 명령 | 설명 |
|---|---|
| `docker compose up -d --build` | 빌드하고 백그라운드 실행 |
| `docker compose down` | 컨테이너 중지·삭제 (볼륨은 유지) |
| `docker compose down -v` | 컨테이너+DB 볼륨까지 삭제 (⚠️ 운영 데이터 손실) |
| `docker compose logs -f` | 전체 로그 실시간 |
| `docker compose restart backend` | 백엔드만 재시작 |
| `docker compose pull && docker compose up -d --build` | 최신 코드로 업데이트 (`git pull` 후) |

## 데이터 백업

PostgreSQL 볼륨(`pgdata`)이 데이터 저장소. 백업:

```bash
docker compose exec postgres pg_dump -U $DB_USERNAME capstone > backup_$(date +%Y%m%d).sql
```

복원:
```bash
cat backup_20260101.sql | docker compose exec -T postgres psql -U $DB_USERNAME -d capstone
```

## HTTPS 적용 (선택)

운영 도메인이면 HTTPS 필수. 두 가지 옵션:

**A. nginx 컨테이너 위에 reverse proxy (Caddy / Traefik / 별도 nginx)**
- 가장 간단. 위쪽에서 HTTPS 종료하고 80 → frontend 컨테이너로 프록시
- Caddy 추천 (Let's Encrypt 자동)

**B. frontend nginx에 직접 TLS 설정**
- `frontend/nginx.conf`에 `listen 443 ssl`, `ssl_certificate ...` 추가
- 인증서 볼륨 마운트 필요

> 카메라 권한은 HTTPS가 있어야 모바일 브라우저에서 작동.

## 자주 묻는 문제

**Q. 백엔드가 `Failed to start` 로 죽음**
- PostgreSQL이 준비되기 전에 시작했을 가능성. `depends_on health` 조건이 적용돼 있어서 보통 자동 해결. 한 번 재시작:
  `docker compose restart backend`

**Q. 카카오 로그인 시 `KOE006 Redirect URI`**
- `VITE_KAKAO_REDIRECT_URI`와 카카오 콘솔에 등록한 Redirect URI가 정확히 일치하지 않음 (`/` 슬래시 / 프로토콜 / 포트 다 확인)

**Q. 빌드가 너무 느림**
- 첫 빌드는 의존성 다운로드 때문에 오래 걸림. 두 번째부터는 Docker layer cache로 빠름
- BuildKit 활용: `DOCKER_BUILDKIT=1 docker compose build`

**Q. DB 데이터 잃지 않고 백엔드만 새로 배포**
```bash
git pull
docker compose up -d --build backend
```

## 디렉토리 구조 (배포 관련)

```
carefit/
├── docker-compose.yml          # 전체 구성
├── .env.example                # 환경변수 템플릿
├── .env                        # 실제 값 (gitignored)
├── backend/
│   ├── Dockerfile              # Spring Boot 빌드+실행
│   └── src/main/resources/
│       └── application-docker.yml   # 배포용 프로필 (env 참조)
├── frontend/
│   ├── Dockerfile              # Vite 빌드 + nginx
│   └── nginx.conf              # SPA fallback + /api 프록시
└── deploy/
    └── README.md               # 이 문서
```
