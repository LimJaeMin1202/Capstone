# CareFit · AI 재활 운동 자세 피드백 시스템

웹캠 하나로 가정에서 재활 운동을 할 수 있도록, AI가 자세를 실시간 분석하고 피드백을 제공하는 웹 시스템입니다.

> 2026학년도 1학기 캡스톤디자인 I 프로젝트

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

- **회원가입 / 로그인** (JWT 인증) — 사용자별 운동 기록 분리, 비밀번호 BCrypt 해시 저장
- **AI 자세 분석** — 웹캠 영상에서 MoveNet Lightning이 관절 17개 실시간 인식
- **재활 운동 29종** — 의자 착석 12 / 벽·의자 지지 9 / 바닥·매트 8, 사회적 약자 맞춤 가동범위로 재조정
- **운동 분류·필터** — 자세별 / 부위별(어깨·팔·하체 등) / 난이도별(초·중·고급)
- **운동별 일러스트 가이드** — 어떤 동작인지 직관적으로 보여주는 AI 생성 이미지
- **시작 버튼 + 3-2-1 카운트다운** — AI 로딩 후 사용자가 직접 시작 시점 결정, 자세 잡을 시간 제공
- **단계별 색상 피드백** — 미달(빨강·격려) / 허용 도달(연두·성공) / 정상 도달(초록·완벽)
- **자동 카운트** — 정자세 0.8초 유지 + 1.5초 쿨다운으로 떨림 오카운트 방지
- **운동 완료 결과 요약** — 정확도별 축하 메시지(🎉 완벽 / 👍 잘함 / 💪 수고 / 🌱 시작) + 횟수·시간·정확도
- **기록 추적** — 운동별 실시 횟수·누적 자세 횟수·평균 정확도 표시
- **어르신 친화 UI** — 큰 글씨 기본, **글씨 크기 직접 조절(작게/보통/크게)**, 차분한 세이지 그린 색감, 색상 기반 피드백(글 못 읽어도 인지)

## 🛠 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|------|
| AI 모델 | **TensorFlow.js + MoveNet Lightning** | 브라우저 자체 실행 → 별도 서버·설치 X. 0.54 GFLOPs 경량으로 저사양 기기에서도 30~50fps |
| 프론트엔드 | **React + TypeScript + Vite** | 컴포넌트 기반으로 화면 모듈화, TS로 백엔드 타입과 동기화 |
| 백엔드 | **Spring Boot 4.0.6 + Spring Data JPA** | 한국 취업 시장 표준, JPA로 SQL 최소화 |
| 인증 | **Spring Security + JWT (jjwt)** | Stateless, 클라이언트·서버 분리 환경에 적합 |
| 데이터베이스 | **PostgreSQL** | 오픈소스 RDBMS 표준 |
| 빌드 도구 | Gradle (backend), npm (frontend) | |

## 🏗 시스템 구조

```
┌─────────────────────────┐       ┌──────────────────────────┐
│  브라우저 (사용자)        │       │  Spring Boot 백엔드 (8080)│
│  ┌──────────────────┐   │ HTTPS │  ┌────────────────────┐  │
│  │ React UI          │◀──┼───────┼──┤ /api/auth          │  │
│  │ (운동 선택·결과   │   │       │  │ /api/exercises     │  │
│  │  ·기록 화면)      │   │       │  │ /api/records       │  │
│  └────────┬─────────┘   │       │  └─────────┬──────────┘  │
│           │             │       │            │             │
│  ┌────────▼─────────┐   │       │  ┌─────────▼──────────┐  │
│  │ TensorFlow.js     │   │       │  │  Spring Security   │  │
│  │ + MoveNet         │   │       │  │  (JWT 인증 필터)   │  │
│  │ (브라우저 내장 AI) │   │       │  └─────────┬──────────┘  │
│  └────────┬─────────┘   │       │            │             │
│           │             │       │  ┌─────────▼──────────┐  │
│  ┌────────▼─────────┐   │       │  │  JPA Repository    │  │
│  │ Canvas (골격선)   │   │       │  └─────────┬──────────┘  │
│  └──────────────────┘   │       └────────────┼─────────────┘
└─────────────────────────┘                    │
                                               ▼
                                       ┌──────────────┐
                                       │ PostgreSQL   │
                                       │ (사용자·운동 │
                                       │  ·기록)      │
                                       └──────────────┘
```

**핵심 설계**:
- AI 추론은 **브라우저(클라이언트)에서 직접 수행** → 영상이 서버로 전송되지 않음 (프라이버시 + 서버 부하 0)
- 백엔드는 **사용자·운동 데이터·기록만** 다루는 가벼운 REST API
- **JWT 토큰 기반**으로 stateless 인증

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

운동마다 정해진 **기준점 3개(A-B-C)**의 좌표로 B에서의 내각을 계산합니다.

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

### 4. 떨림·오카운트 방지

```
정자세 0.8초 유지 → 카운트 +1 → 1.5초 쿨다운(추가 카운트 막음)
```
MoveNet의 미세한 좌표 흔들림으로 인한 과카운트를 차단합니다.

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
| `notes` | 주의사항·메모 | `오십견 고려, 눈높이 아래까지만 올려도 정답` |

## 🖼 화면 구성

| 화면 | 역할 |
|------|------|
| **로그인 / 회원가입** | JWT 인증, 탭으로 모드 전환, 비밀번호 확인 입력 |
| **운동 선택 (홈)** | 29종 운동을 카테고리·부위·난이도로 정렬, 카드별 일러스트 |
| **운동 화면** | 가이드 이미지 + 안내 / 웹캠 영상 + 골격선 / 실시간 피드백 패널 / ▶ 시작 버튼 → 3-2-1 카운트다운 → 운동 시작 |
| **운동 완료 결과** | 정확도별 축하 메시지 + 횟수·시간·정확도 + "다른 운동 하기" / "기록 보기" 액션 |
| **기록 보기** | 운동별 실시 횟수·누적 자세 횟수·평균 정확도 요약 카드 |

상단 네비바: CareFit 로고(클릭 시 홈) / 운동하기 / 기록 보기 / 글씨 크기 토글 / 사용자명 / 로그아웃

## 🔒 보안

- **비밀번호** → BCrypt 해시 저장 (평문 X)
- **JWT 토큰** → 클라이언트 `localStorage` 저장, 모든 요청 `Authorization: Bearer ...` 헤더
- **사용자별 기록 격리** → DB 레벨에서 `ExerciseRecord.user`로 분리, 본인 기록만 조회 가능
- **CORS** → `localhost:5173` (React dev 서버)만 허용
- **민감 정보** → `application.yml`(DB 비번·JWT 비밀키)은 `.gitignore`로 git 미포함

## 📁 폴더 구조

```
capstone/
├── backend/                              # Spring Boot 백엔드
│   ├── src/main/java/com/capstone/backend/
│   │   ├── BackendApplication.java
│   │   ├── config/                       # DataSeeder, GlobalExceptionHandler
│   │   ├── controller/                   # Exercise / Record / Auth API
│   │   ├── service/                      # 비즈니스 로직
│   │   ├── repository/                   # JPA 리포지토리
│   │   ├── entity/                       # Exercise, ExerciseRecord, User
│   │   ├── dto/                          # 요청/응답 DTO
│   │   └── security/                     # JWT, SecurityConfig, 필터
│   ├── src/main/resources/
│   │   ├── exercises.json                # 운동 29종 시드 데이터
│   │   ├── application.yml               # ⚠️ git 미포함 (직접 생성)
│   │   └── application.yml.example       # 설정 템플릿
│   ├── api-test.http                     # IntelliJ HTTP Client 테스트
│   └── build.gradle
└── frontend/                             # React + Vite + TypeScript
    ├── public/
    │   ├── exercises/                    # 운동 가이드 일러스트 29개
    │   ├── icon.png                      # CareFit 로고 (네비바 합본)
    │   └── logo-icon.png                 # CareFit 아이콘 (favicon)
    ├── src/
    │   ├── api/                          # 백엔드 API 호출 (auth, exercises, records, client)
    │   ├── auth/                         # AuthContext (로그인 상태 전역 관리)
    │   ├── components/                   # AuthPage, ExerciseSelect, ExerciseScreen,
    │   │                                 # PoseDetector, ResultScreen, RecordsScreen,
    │   │                                 # ExerciseImage
    │   ├── types/                        # Exercise 타입 정의
    │   ├── utils/pose.ts                 # 각도 계산·판정 로직
    │   └── App.tsx                       # 화면 라우팅 (state 기반) + 글씨 크기 설정
    └── package.json
```

## 🚀 실행 방법

### 1. 사전 준비

- **Java 17** 이상 (Eclipse Temurin / Adoptium 권장)
- **Node.js 18** 이상
- **PostgreSQL 13** 이상
- 웹캠이 있는 PC 또는 노트북

### 2. 클론 및 PostgreSQL 설정

```bash
git clone https://github.com/LimJaeMin1202/Capstone.git
cd Capstone
```

PostgreSQL에서 DB와 전용 사용자 생성:

```sql
CREATE DATABASE capstone;
CREATE USER capstone_user WITH PASSWORD '본인비밀번호';
ALTER DATABASE capstone OWNER TO capstone_user;
\c capstone
GRANT ALL ON SCHEMA public TO capstone_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO capstone_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO capstone_user;
```

### 3. 백엔드 설정 및 실행

`backend/src/main/resources/application.yml.example`을 복사해
`application.yml`을 만들고 DB 비밀번호·JWT 비밀키를 입력합니다.

```bash
cd backend
gradlew.bat bootRun      # Windows
./gradlew bootRun        # Mac/Linux
```

서버는 `http://localhost:8080`. 첫 실행 시 운동 29종이 DB에 자동 삽입됩니다.

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.
> ⚠️ 카메라는 `localhost`에서 정상 동작합니다 (보안 컨텍스트 예외).

## 🔌 API 엔드포인트

| 메소드 | URL | 설명 | 인증 |
|--------|-----|------|------|
| POST | `/api/auth/signup` | 회원가입 | - |
| POST | `/api/auth/login` | 로그인 (JWT 발급) | - |
| GET | `/api/auth/me` | 내 정보 | ✅ |
| GET | `/api/exercises` | 운동 전체 목록 | - |
| GET | `/api/exercises/{id}` | 특정 운동 상세 | - |
| GET | `/api/records` | 내 운동 기록 | ✅ |
| POST | `/api/records` | 운동 기록 저장 | ✅ |
| DELETE | `/api/records` | 내 기록 전체 삭제 | ✅ |

인증 필요 API는 헤더에 `Authorization: Bearer <토큰>` 필요.

## 🗺 향후 계획

- **카카오·구글 소셜 로그인** — 어르신 친화 (카카오톡 이용 광범위)
- **모바일 반응형 대응** — 스마트폰에서도 사용 가능하게
- **특수 운동 판정 보완** — 발목 까딱·종아리 들기·플랭크 등 일반 각도 판정으론 부정확한 동작 별도 처리
- **클라우드 배포** — Render(백엔드) + Vercel(프론트) + 클라우드 PostgreSQL

## 👥 팀원

| 이름 | 역할 |
|------|------|
| 임재민 | 팀장 / 전체 개발 총괄 / AI 모델 연동 / 백엔드·프론트 구축 |
| 유성희 | 재활 운동 데이터 조사 / 운동 기록 관리 |
| 정서연 | 프론트엔드 UI / 환경 테스트 / 발표 자료 |

## 📅 진행 일정

- **2026.03.16** 계획 발표
- **2026.04.17** 중간 발표
- **2026.06.01** 최종 발표
