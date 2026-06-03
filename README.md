# CareFit · AI 재활 운동 자세 피드백 시스템

웹캠 하나로 가정에서 재활 운동을 할 수 있도록, AI가 자세를 실시간 분석하고 피드백을 제공하는 웹 시스템입니다.

> 2026학년도 1·2학기 캡스톤디자인 I·II 프로젝트

## 📌 프로젝트 배경

거동이 불편한 고령자·장애인은 병원 방문 자체가 어려워 재활 치료를 지속하기 힘듭니다.

- 장애인 병원 미방문 이유 1위: **이동 불편 (36.5%)**
- 재활 치료 1회 평균 **6만 4천 원**, 반복 치료의 경제적 부담
- 기존 원격 재활 솔루션은 **고가 장비·웨어러블** 필요 → 진입 장벽 높음
- 고령자·장애인은 **복잡한 기기 조작**도 어려움

본 프로젝트는 **별도 장비 없이 웹캠만으로** 가정에서 재활 운동을 수행하고, AI가 관절 각도를 분석해 실시간으로 자세를 교정해주는 시스템입니다.

## 🎯 차별점

| 기존 헬스/필라테스 앱 | 본 시스템 |
|------|------|
| 일반인 기준의 동작·강도 | 고령자·장애인 맞춤 ROM(가동범위) 보수적 재조정 |
| 정확한 자세 강요 → 부상·좌절 | 정상/허용 두 단계로 동기 부여 + 안전 |
| 헬스장·웨어러블 등 외부 의존 | 웹캠만 있으면 가정에서 즉시 |
| 단순 운동 가이드 | AI가 매 프레임 관절 각도 측정·피드백 |

## ✨ 주요 기능

### 인증·사용자
- **회원가입 / 로그인** (JWT) — 비밀번호 BCrypt 해시, 사용자별 기록 격리
- **카카오 OAuth 로그인** — 어르신 친화 (이미 사용 중인 계정으로 원클릭 가입·로그인)
- **출생연도 입력** — 10년대 단위 큰 버튼으로 선택, 향후 연령대별 운동 기준에 활용
- **통합 설정 모달** — 이름·연령대·**주간 운동 목표** 변경, 로그아웃도 여기서

### 운동 콘텐츠
- **재활 운동 29종** — 의자 착석 12 / 벽·의자 지지 9 / 바닥·매트 8
- **운동 분류·필터** — 자세별 / 부위별(어깨·팔·하체 등) / 난이도별(초·중·고급)
- **운동별 일러스트 가이드** — 어떤 동작인지 직관적으로 보여주는 AI 생성 이미지
- **어르신 친화 4섹션 가이드** — 준비 자세 / 단계별 따라하기(①②③) / 주의사항(노란 박스) / 효과 — 의학용어 없이 일상어로
- **운동별 카메라 위치 안내** — 정면 / 측면 자동 표시 (영상 안 시작 오버레이에 통합)

### AI 자세 분석
- **MoveNet Lightning 실시간 인식** — 관절 17개, 브라우저 자체 실행
- **단계별 색상 피드백** — 미달(빨강·격려) / 허용 도달(연두·성공) / 정상 도달(초록·완벽)
- **자세 사이클 기반 횟수 카운트** — rest → holding → satisfied → 풀면 1회 카운트
- **rep / hold 두 가지 모드** — 일반 운동(반복) / 플랭크 같은 유지 동작(누적 시간)
- **시작 버튼 + 3-2-1 카운트다운** — AI 로딩 후 사용자가 직접 시작
- **자세 유지 카운트다운 뱃지** — 영상 우상단에 남은 초 표시

### 기록·통계
- **운동 완료 결과 요약** — 정확도별 축하 메시지 + 횟수·시간·정확도 (hold 운동은 총 유지 시간)
- **이번 주 목표 진행바** — 주간 횟수·시간 목표 달성률 시각화, 달성 시 강조
- **주차별 기록 보기** — 이번 주뿐 아니라 **이전 주들도 모두 조회 가능** (`?week=-N`)
- **주간 통계 4카드** — 운동 횟수 / 시간 / 평균 정확도 / 연속 운동일(강조)
- **주간 추세 막대그래프** — 월~일 7일 일별 운동 횟수, 오늘 강조
- **운동별 카드** — 어떤 운동을 얼마나 했는지 한눈에

### UX
- **글씨 크기 직접 조절** (작게/보통/크게) — PC/모바일 px 매핑 분리
- **모바일 반응형** — 네비바 점진적 축소, 카드 그리드 자동 조정
- **한국어 어절 단위 줄바꿈** — 단어 중간 끊기지 않음
- **차분한 세이지 그린** 색감
- **색상 기반 피드백** — 글을 못 읽어도 색으로 인지
- **로그아웃을 설정 모달 안으로** — 잘못 누름 방지

## 🛠 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|------|
| AI 모델 | **TensorFlow.js + MoveNet Lightning** | 브라우저 자체 실행 → 별도 서버·설치 X. 0.54 GFLOPs 경량으로 저사양 기기에서도 30~50fps |
| 프론트엔드 | **React + TypeScript + Vite + React Router** | 컴포넌트 모듈화, 타입 안전, URL 기반 라우팅 |
| 백엔드 | **Spring Boot 4.0.6 + Spring Data JPA** | 한국 표준, JPA로 SQL 최소화 |
| 인증 | **Spring Security + JWT (jjwt 0.12.6)** | Stateless, 클라이언트·서버 분리 환경 |
| 소셜 로그인 | **카카오 OAuth 2.0 (authorization_code)** | 어르신 친화 (이미 쓰는 계정) |
| 데이터베이스 | **PostgreSQL 16** | 오픈소스 RDBMS 표준 |
| 배포 | **Docker Compose + nginx** | 한 줄로 어디서든 동일 환경 재현 |
| 빌드 도구 | Gradle (backend), npm (frontend) | |

## 🏗 시스템 구조

```
[ 사용자 브라우저 ]
        │
        ▼
┌──────────────────────────────────────────────┐
│  서버 (Docker Compose)                        │
│  ┌────────────────────────────────────────┐  │
│  │  nginx 컨테이너 (port 80)               │  │
│  │  · React 정적 파일 (Vite 빌드)          │  │
│  │  · /api/* → backend 프록시              │  │
│  │  · SPA fallback (React Router)         │  │
│  └─────────────────┬──────────────────────┘  │
│                    │                          │
│  ┌─────────────────▼──────────────────────┐  │
│  │  Spring Boot 컨테이너 (port 8080)       │  │
│  │  · /api/auth, /api/exercises,           │  │
│  │    /api/records, /api/goals             │  │
│  │  · Spring Security + JWT 필터           │  │
│  │  · 카카오 OAuth (인가코드 → 토큰 교환)   │  │
│  └─────────────────┬──────────────────────┘  │
│                    │                          │
│  ┌─────────────────▼──────────────────────┐  │
│  │  PostgreSQL 컨테이너 (port 5432)        │  │
│  │  · users, exercises, exercise_records   │  │
│  │  · user_goals                           │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

브라우저 안:
```
[ React + React Router ]
  │
  ├ TensorFlow.js + MoveNet (브라우저 내장 AI)
  └ Canvas (골격선 실시간 렌더)
```

**핵심 설계**:
- AI 추론은 **브라우저(클라이언트)에서 직접 수행** → 영상이 서버로 전송되지 않음 (프라이버시 + 서버 부하 0)
- 백엔드는 **사용자·운동 데이터·기록·목표만** 다루는 가벼운 REST API
- **JWT 토큰 기반** stateless 인증
- **nginx**가 SPA fallback과 API 프록시를 동시에 처리

## 🧠 AI 동작 원리

### 1. 관절 인식 (MoveNet Lightning)

웹캠의 매 프레임을 분석해 신체 17개 키포인트를 추출:

| 부위 | 키포인트 인덱스 |
|------|------|
| 얼굴 | 코(0), 왼·오 눈(1,2), 왼·오 귀(3,4) |
| 상체 | 왼·오 어깨(5,6), 왼·오 팔꿈치(7,8), 왼·오 손목(9,10) |
| 하체 | 왼·오 골반(11,12), 왼·오 무릎(13,14), 왼·오 발목(15,16) |

본 시스템은 얼굴 관절을 제외한 **상·하체 12개**만 자세 판정에 사용합니다.

### 2. 각도 계산

운동마다 정해진 **기준점 3개(A-B-C)** 의 좌표로 B에서의 내각을 계산합니다.

```
       cos⁻¹( (BA · BC) / (|BA|·|BC|) )
```

예: "앉아서 앞으로 나란히" → 고관절-어깨-팔꿈치 각도

### 3. 단계별 판정 (정상 vs 허용)

```
restAngle (시작)  →  allowedTarget (허용 통과선)  →  normalTarget (정상 목표)

[조금만 더]  ───→  [👍 좋아요·성공·카운트+]  ───→  [🎉 완벽해요]
```

**왜 정상 범위가 아니라 허용 범위로 판정하는가?**
- 일반인 기준의 정상 ROM은 고령자·장애인에겐 부상 위험 + 잦은 실패 → 동기 저하
- 의학적으로 의미 있는 **최소 가동 범위(허용)** 도달 시 성공으로 인정해 운동을 지속하게 함
- 정상 범위는 **목표**로 화면에 표시 → 가능한 사용자는 더 도전

### 4. 자세 사이클 기반 횟수 카운트 (rep 모드)

운동의 본질(자세 잡기 → 유지 → 풀기)을 반영한 **3단계 state machine**으로 카운트합니다.

```
[rest]   휴식 자세 / 운동 자세 미달
   │ 운동 자세 진입
   ▼
[holding]   유지 중 — 영상에 남은 초 카운트다운 표시
   │ 운동별 권장 시간 충족 (1~12초, 운동마다 다름)
   ▼
[satisfied] "✨ 충분해요! 천천히 내려놓으세요"
   │ 자세 풀고 400ms 이상 유지 확인
   ▼
[rest] + count++   ← 여기서 1회 카운트
```

- **자세를 풀어야 카운트** — 오래 잡고 있어도 1회만. 다음 카운트는 풀었다가 다시 잡아야 함.
- **그레이스 윈도우 300ms** — 한두 프레임 keypoint jitter는 무시
- **풀림 확정 시간 400ms** — satisfied 상태에서 keypoint가 잠시 사라져도 가짜 카운트 안 됨

### 5. 유지 동작 (hold 모드)

플랭크처럼 한 자세를 길게 유지하는 운동(`kneeling-plank`)은 별도 모드:
- 카운트 대신 **누적 유지 시간**(초)을 측정
- 자세 잡고 있는 동안만 시간 적립, 풀면 일시정지
- 결과 화면에 "총 유지 시간" 표시

운동별 모드(`rep` / `hold`)와 유지 시간(`holdSeconds`)은 [`frontend/src/data/exerciseGuides.ts`](frontend/src/data/exerciseGuides.ts)에서 관리합니다.

## 📊 운동 데이터 모델

운동 1개는 다음 필드로 구성됩니다 ([`backend/src/main/resources/exercises.json`](backend/src/main/resources/exercises.json)).

| 필드 | 의미 | 예시 |
|------|------|------|
| `id` | 운동 식별자 | `seated-front-raise` |
| `name` | 한글 이름 | `앉아서 앞으로 나란히` |
| `nameEn` | 영어 이름 | `Seated Front Raise` |
| `category` | 자세 카테고리 | `의자 착석` / `벽·의자 지지` / `바닥·매트` |
| `bodyPart` | 운동 부위 | `전면 어깨(삼각근)` |
| `difficulty` | 난이도 | `초급` / `중급` / `고급` |
| `jointA/B/C` | 각도 기준점 3개 (이름) | `고관절`, `어깨`, `팔꿈치` |
| `restAngle` | 시작 자세 각도 | `0` |
| `normalTarget` | 정상 목표 각도 (화면 표시) | `90` |
| `allowedTarget` | 허용 목표 각도 (성공 판정 기준) | `60` |
| `notes` | 개발자용 메모 (사용자 화면엔 미노출) | `오십견 고려, 눈높이 아래까지만 올려도 정답` |

사용자에게 보여줄 **준비 자세 / 단계별 따라하기 / 주의사항 / 효과 / 카메라 위치 / 자세 유지 시간 / 모드**는 프론트의 [`frontend/src/data/exerciseGuides.ts`](frontend/src/data/exerciseGuides.ts)에서 운동 ID별로 별도 관리합니다 (어르신 언어로 직접 작성).

## 🖼 화면 구성

| URL | 화면 | 역할 |
|------|------|------|
| `/` (로그인 전) | **로그인 / 회원가입** | JWT 인증 / 카카오로 시작하기 / 출생연도 입력 |
| `/` | **운동 선택 (홈)** | 29종 운동을 자세별·부위별·난이도별로 정렬 |
| `/exercise/:id` | **운동 화면** | 카메라 영상 + 골격선 + 자세 카운트다운 뱃지 / 우측 패널(횟수·유지시간·현재각도) / 가이드 4섹션 / 카메라 위치 안내 |
| `/result` | **운동 완료 결과** | 정확도별 축하 메시지 + 통계 + "다른 운동 하기" / "기록 보기" |
| `/records` | **기록 보기** | 주 선택 컨트롤 / 피드백 / 목표 진행바 / 4 요약 카드 / 주간 추세 / 운동별 카드 |
| `/records?week=-N` | **과거 N주 기록** | 같은 화면, 데이터만 해당 주 기준 |

**모달**:
- 설정 (톱니 버튼) — 이름·연령대·목표 변경, 로그아웃
- 연령대 입력 (카카오 가입자 첫 로그인 시 강제)

상단 네비바: CareFit 로고(클릭 시 홈) / 운동하기 / 기록 보기 / 글씨 크기 토글 / 사용자명 / ⚙ 설정

## 🔒 보안

- **비밀번호** → BCrypt 해시 저장 (평문 X)
- **JWT 토큰** → 클라이언트 `localStorage` 저장, 모든 요청 `Authorization: Bearer ...` 헤더
- **사용자별 기록 격리** → DB 레벨에서 `ExerciseRecord.user` / `UserGoal.user`로 분리
- **CORS** → 개발: `localhost:5173` / 배포: 같은 도메인 (nginx)
- **민감 정보** →
  - `application.yml` (개발용, DB 비번·JWT 시크릿·카카오 시크릿) → `.gitignore`
  - 배포는 환경변수만 사용 (`application-docker.yml` + `.env` → gitignored)
- **카카오 client secret** → 백엔드만 보관 (프론트는 REST API 키만)

## 📁 폴더 구조

```
capstone/
├── docker-compose.yml                  # 배포: postgres + backend + frontend
├── .env.example                        # 배포용 환경변수 템플릿
├── backend/                            # Spring Boot 백엔드
│   ├── Dockerfile                      # 멀티스테이지 빌드(JDK→JRE)
│   ├── .dockerignore                   # 시크릿 컨테이너 진입 차단
│   ├── src/main/java/com/capstone/backend/
│   │   ├── BackendApplication.java
│   │   ├── config/                     # DataSeeder, GlobalExceptionHandler
│   │   ├── controller/                 # Auth / Exercise / Record / UserGoal
│   │   ├── service/                    # 비즈니스 로직 (+ KakaoService, UserGoalService)
│   │   ├── repository/                 # JPA 리포지토리
│   │   ├── entity/                     # Exercise, ExerciseRecord, User, UserGoal
│   │   ├── dto/                        # 요청/응답 DTO
│   │   └── security/                   # JWT, SecurityConfig, 필터
│   ├── src/main/resources/
│   │   ├── exercises.json              # 운동 29종 시드 데이터
│   │   ├── application.yml             # ⚠️ git 미포함 (개발용, 직접 생성)
│   │   ├── application.yml.example     # 설정 템플릿
│   │   └── application-docker.yml      # 배포 프로필 (환경변수 참조, commit OK)
│   ├── api-test.http                   # IntelliJ HTTP Client 테스트
│   └── build.gradle
├── frontend/                           # React + Vite + TypeScript
│   ├── Dockerfile                      # Vite 빌드 → nginx
│   ├── nginx.conf                      # SPA fallback + /api 프록시
│   ├── .dockerignore
│   ├── public/
│   │   ├── exercises/                  # 운동 가이드 일러스트 29개
│   │   ├── icon.png                    # CareFit 로고 (네비바)
│   │   └── logo-icon.png               # favicon
│   ├── src/
│   │   ├── api/                        # auth, exercises, records, goals, client
│   │   ├── auth/                       # AuthContext (로그인 상태 + 카카오 콜백)
│   │   ├── components/                 # AuthPage, ExerciseSelect, ExerciseScreen,
│   │   │                               # PoseDetector, ResultScreen, RecordsScreen,
│   │   │                               # BirthYearModal, SettingsModal, ExerciseImage
│   │   ├── data/exerciseGuides.ts      # 29종 가이드 + 모드 + 카메라 위치 + 유지 시간
│   │   ├── utils/                      # pose.ts (각도 계산), birthYearOptions.ts
│   │   ├── types/                      # Exercise 타입 정의
│   │   ├── App.tsx                     # React Router 라우트 설정
│   │   ├── main.tsx                    # BrowserRouter 진입점
│   │   └── index.css                   # 글씨 크기 매핑 (PC/모바일 분리)
│   ├── .env.local                      # ⚠️ git 미포함 (카카오 키, 직접 생성)
│   ├── .env.example                    # 환경변수 템플릿
│   └── package.json
└── deploy/
    └── README.md                       # 배포 상세 가이드 (Docker Compose)
```

## 🚀 실행 방법

### A. 개발 환경 (로컬)

#### 1. 사전 준비
- **Java 17** 이상 (Eclipse Temurin / Adoptium 권장)
- **Node.js 18** 이상
- **PostgreSQL 13** 이상
- 웹캠이 있는 PC 또는 노트북

#### 2. 클론 + DB 셋업
```bash
git clone https://github.com/LimJaeMin1202/Capstone.git
cd Capstone
```

PostgreSQL에서:
```sql
CREATE DATABASE capstone;
CREATE USER capstone_user WITH PASSWORD '본인비밀번호';
ALTER DATABASE capstone OWNER TO capstone_user;
\c capstone
GRANT ALL ON SCHEMA public TO capstone_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO capstone_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO capstone_user;
```

#### 3. 백엔드
`backend/src/main/resources/application.yml.example`을 복사해 `application.yml`을 만들고 DB 비번·JWT 시크릿·카카오 키를 입력합니다.

```bash
cd backend
./gradlew bootRun          # macOS/Linux
gradlew.bat bootRun        # Windows
```

서버는 `http://localhost:8080`. 첫 실행 시 운동 29종이 DB에 자동 시드됩니다.

#### 4. 프론트엔드
`frontend/.env.example`을 복사해 `.env.local`을 만들고 카카오 REST API 키를 입력:
```env
VITE_KAKAO_REST_API_KEY=발급받은_REST_API_키
VITE_KAKAO_REDIRECT_URI=http://localhost:5173
```

> Redirect URI는 [카카오 디벨로퍼스](https://developers.kakao.com)의 **카카오 로그인 > Redirect URI**에 동일하게 등록해야 합니다.

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.
> ⚠️ 카메라는 `localhost` 또는 HTTPS에서만 동작합니다 (모바일 브라우저 보안 제약).

### B. 배포 (Docker Compose)

연구실 서버 / 일반 Linux 서버에 한 줄로 배포:

```bash
cp .env.example .env
nano .env                   # 시크릿 채우기
docker compose up -d --build
```

자세한 절차·운영 명령·HTTPS 적용 방법은 [`deploy/README.md`](deploy/README.md) 참고.

## 🔌 API 엔드포인트

| 메소드 | URL | 설명 | 인증 |
|--------|-----|------|------|
| POST | `/api/auth/signup` | 회원가입 (아이디/비번/이름/출생연도) | - |
| POST | `/api/auth/login` | 로그인 (JWT 발급) | - |
| POST | `/api/auth/kakao` | 카카오 인가코드로 가입·로그인 (JWT 발급) | - |
| GET | `/api/auth/me` | 내 정보 | ✅ |
| PATCH | `/api/auth/me/name` | 이름 변경 | ✅ |
| PATCH | `/api/auth/me/birth-year` | 출생연도 입력·변경 | ✅ |
| GET | `/api/exercises` | 운동 전체 목록 | - |
| GET | `/api/exercises/{id}` | 특정 운동 상세 | - |
| GET | `/api/records` | 내 운동 기록 | ✅ |
| POST | `/api/records` | 운동 기록 저장 | ✅ |
| DELETE | `/api/records` | 내 기록 전체 삭제 | ✅ |
| GET | `/api/goals` | 내 주간 목표 (없으면 기본값 3회/30분 자동 생성) | ✅ |
| PUT | `/api/goals` | 주간 목표 변경 (1~50회 / 1~1000분) | ✅ |

인증 필요 API는 헤더에 `Authorization: Bearer <토큰>` 필요.

## 🗺 향후 계획

- **연령대별 자동 ROM 조정** — 출생연도 데이터로 70대·80대에 맞춰 운동 가동 범위 자동 조정
- **공공기관 연계** — 보건소·복지관 B2B 모델, 위치 기반 비상 연락 기능
- **PWA 전환** — 모바일 홈 화면 설치, 오프라인 가이드
- **장기 데이터 분석 리포트** — 사용자별 진척도 그래프, 가족(보호자)에게 공유
- **접근성 강화** — 청각 장애인용 자막·진동 피드백, 시각 장애인용 음성 안내
- **추가 소셜 로그인** — 구글·네이버 (카카오는 완료)

## 👥 팀원

| 이름 | 역할 |
|------|------|
| 임재민 | 팀장 / 전체 개발 총괄 / AI 모델 연동 / 백엔드·프론트 구축 / 배포 |
| 유성희 | 재활 운동 데이터 조사 / 운동 기록 관리 |
| 정서연 | 프론트엔드 UI / 환경 테스트 / 발표 자료 |

## 📅 진행 일정

### 캡스톤 디자인 I (2026-1학기)
- **2026.03.16** 계획 발표
- **2026.04.17** 중간 발표
- **2026.06.01** 최종 발표

### 캡스톤 디자인 II (2026-2학기)
- 추가 기능 구현 (카카오 로그인, 출생연도, 주차별 기록, 운동 목표, 유지 동작 모드, 모바일 반응형, 라우팅, Docker 배포)
- 연구실 서버 배포
- 최종 발표
