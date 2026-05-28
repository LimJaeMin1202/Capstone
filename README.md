# AI 재활 운동 자세 피드백 시스템

웹캠 하나로 가정에서 재활 운동을 할 수 있도록, AI가 자세를 실시간 분석하고 피드백을 제공하는 웹 시스템입니다.

> 2026학년도 1학기 캡스톤디자인 I 프로젝트

## 📌 소개

거동이 불편한 고령자·장애인은 병원 방문 자체가 어려워 재활 치료를 지속하기 힘듭니다.
본 프로젝트는 **별도 장비 없이 웹캠만으로** 가정에서 재활 운동을 수행하고,
AI가 관절 각도를 분석해 실시간으로 자세를 교정해주는 시스템입니다.

## ✨ 주요 기능

- 회원가입 / 로그인 (JWT 인증), 사용자별 운동 기록 분리
- 웹캠 기반 실시간 골격 인식 (MoveNet Lightning)
- 사회적 약자 맞춤 재활 운동 29종 (정상/허용 각도 기준)
- 관절 각도 계산 → 단계별 피드백 (조금만 더 / 좋아요 / 완벽해요)
- 정확한 자세 횟수 · 운동 시간 · 정확도 실시간 표시
- 운동 완료 시 기록 저장, 운동별 요약(실시 횟수·평균 정확도)
- 자세별 / 부위별 / 난이도별 운동 정렬
- 어르신 친화 UI (큰 글씨, 차분한 색, 색상 기반 피드백)

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| AI 모델 | TensorFlow.js, MoveNet Lightning |
| 프론트엔드 | React, TypeScript, Vite |
| 백엔드 | Java 17, Spring Boot 4.0.6, Spring Data JPA, Lombok |
| 인증 | Spring Security, JWT (jjwt) |
| 데이터베이스 | PostgreSQL |
| 빌드 도구 | Gradle (backend), npm (frontend) |

## 📁 폴더 구조

```
capstone/
├── backend/                              # Spring Boot 백엔드
│   ├── src/main/java/com/capstone/backend/
│   │   ├── BackendApplication.java
│   │   ├── config/                       # DataSeeder, 예외 핸들러
│   │   ├── controller/                   # Exercise / Record / Auth API
│   │   ├── service/                      # 비즈니스 로직
│   │   ├── repository/                   # JPA 리포지토리
│   │   ├── entity/                       # Exercise, ExerciseRecord, User
│   │   ├── dto/                          # 요청/응답 DTO
│   │   └── security/                     # JWT, SecurityConfig, 필터
│   ├── src/main/resources/
│   │   ├── exercises.json                # 운동 29종 시드 데이터
│   │   ├── application.yml               # ⚠️ git 미포함 (직접 생성)
│   │   └── application.yml.example        # 설정 템플릿
│   └── build.gradle
└── frontend/                             # React + Vite + TypeScript
    ├── src/
    │   ├── api/                          # 백엔드 API 호출
    │   ├── auth/                         # 로그인 상태 Context
    │   ├── components/                   # 화면 컴포넌트
    │   ├── types/ · utils/               # 타입, 각도 판정 로직
    │   └── App.tsx
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
