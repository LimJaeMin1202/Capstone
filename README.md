# AI 재활 운동 자세 피드백 시스템

웹캠 하나로 가정에서 재활 운동을 할 수 있도록, AI가 자세를 실시간 분석하고 피드백을 제공하는 웹 시스템입니다.

> 2026학년도 1학기 캡스톤디자인 I 프로젝트

## 📌 소개

거동이 불편한 고령자·장애인은 병원 방문 자체가 어려워 재활 치료를 지속하기 힘듭니다.
본 프로젝트는 **별도 장비 없이 웹캠만으로** 가정에서 재활 운동을 수행하고,
AI가 관절 각도를 분석해 실시간으로 자세를 교정해주는 시스템을 목표로 합니다.

## ✨ 주요 기능

- 웹캠 기반 실시간 골격 인식 (MoveNet Lightning)
- 관절 각도 계산 후 정자세 / 교정 필요 자세 판별
- 초록 / 빨강 색상 + 안내 문구로 즉시 피드백
- 정확한 자세 횟수 · 운동 시간 · 정확도 실시간 표시
- 운동 기록 자동 저장 + 날짜별 정확도 그래프

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| AI 모델 | TensorFlow.js, MoveNet Lightning |
| 프론트엔드 | HTML, CSS, JavaScript, Canvas, Chart.js (React + Vite 마이그레이션 예정) |
| 백엔드 | Java 17, Spring Boot 4.0.6, Spring Data JPA, Lombok |
| 데이터베이스 | PostgreSQL |
| 빌드 도구 | Gradle |
| 인증 | Spring Security + JWT (예정) |

## 📁 폴더 구조

```
capstone/
├── backend/                              # Spring Boot 백엔드
│   ├── src/main/java/com/capstone/backend/
│   │   ├── BackendApplication.java       # Spring Boot 진입점
│   │   ├── config/
│   │   │   └── DataSeeder.java           # 초기 운동 데이터 자동 삽입
│   │   ├── controller/
│   │   │   ├── ExerciseController.java   # /api/exercises
│   │   │   └── ExerciseRecordController.java   # /api/records
│   │   ├── service/                      # 비즈니스 로직
│   │   ├── repository/                   # JPA 리포지토리
│   │   └── entity/
│   │       ├── Exercise.java             # 운동 엔티티
│   │       ├── Joint.java                # 관절 (1:N)
│   │       ├── Feedback.java             # 피드백 메시지 (Embedded)
│   │       └── ExerciseRecord.java       # 운동 기록 엔티티
│   ├── src/main/resources/
│   │   ├── application.yml               # ⚠️ git 미포함 (직접 생성)
│   │   └── application.yml.example       # 설정 템플릿
│   ├── api-test.http                     # IntelliJ HTTP Client 테스트
│   ├── build.gradle
│   └── settings.gradle
└── frontend/                             # 현재 단일 HTML
    └── index.html
```

## 🚀 실행 방법

### 1. 사전 준비

- **Java 17** 이상 (Eclipse Temurin / Adoptium 권장)
- **PostgreSQL 13** 이상
- **IntelliJ IDEA** (Community 가능, Ultimate면 HTTP Client 사용 가능)
- **DBeaver** (선택, DB GUI 관리용)
- 웹캠이 있는 PC 또는 노트북

### 2. 클론 및 PostgreSQL 설정

```bash
git clone https://github.com/LimJaeMin1202/Capstone.git
cd Capstone
```

PostgreSQL에서 DB와 전용 사용자 생성 (DBeaver 또는 psql):

```sql
CREATE DATABASE capstone;
CREATE USER capstone_user WITH PASSWORD '본인비밀번호';
ALTER DATABASE capstone OWNER TO capstone_user;
\c capstone
GRANT ALL ON SCHEMA public TO capstone_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO capstone_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO capstone_user;
```

### 3. application.yml 작성

`backend/src/main/resources/application.yml.example` 파일을 복사해서
`application.yml` 생성 후 비밀번호 등 본인 환경에 맞게 수정.

### 4. 백엔드 실행

IntelliJ에서 `backend` 폴더를 Gradle 프로젝트로 열고,
`BackendApplication.java`를 실행하거나 터미널에서:

```bash
cd backend
./gradlew bootRun        # Mac/Linux
gradlew.bat bootRun      # Windows
```

서버는 `http://localhost:8080` 에서 동작합니다.
첫 실행 시 운동 3개가 자동으로 DB에 삽입됩니다.

### 5. 프론트엔드 실행 (임시)

현재는 정적 HTML 파일이라 그냥 `frontend/index.html`을 브라우저에서 열면 됩니다.
HTTPS가 필요하면:

```bash
npm install -g local-ssl-proxy
local-ssl-proxy --source 3001 --target 8080
```

> 추후 React + Vite로 마이그레이션 예정.

## 🔌 API 엔드포인트

| 메소드 | URL | 설명 |
|--------|-----|------|
| GET | `/api/exercises` | 운동 전체 목록 |
| GET | `/api/exercises/{id}` | 특정 운동 상세 |
| POST | `/api/exercises` | 운동 추가 |
| DELETE | `/api/exercises/{id}` | 운동 삭제 |
| GET | `/api/records` | 운동 기록 전체 |
| GET | `/api/records?exerciseId=arm-raise` | 특정 운동의 기록만 |
| POST | `/api/records` | 운동 기록 저장 |
| DELETE | `/api/records` | 모든 기록 삭제 |

IntelliJ Ultimate 사용자는 `backend/api-test.http` 파일로 바로 테스트 가능합니다.

## 👥 팀원

| 이름 | 역할 |
|------|------|
| 임재민 | 팀장 / 전체 개발 총괄 / AI 모델 연동 / 백엔드 구축 |
| 유성희 | 재활 운동 데이터 조사 / 운동 기록 관리 |
| 정서연 | 프론트엔드 UI / 환경 테스트 / 발표 자료 |

## 📅 진행 일정

- **2026.03.16** 계획 발표
- **2026.04.17** 중간 발표
- **2026.06.01** 최종 발표
