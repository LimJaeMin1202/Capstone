  # AI 재활 운동 자세 피드백 시스템

  웹캠 하나로 가정에서 재활 운동을 할 수 있도록, AI가 자세를 실시간 분석하고 피드백을 제공하는 웹
  시스템입니다.

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
  | 프론트엔드 | HTML, CSS, JavaScript, Canvas, Chart.js |
  | 백엔드 | Node.js, Express |
  | 데이터 | JSON 파일 기반 |

  ## 📁 폴더 구조

  ```
  capstone/
  ├── backend/
  │   ├── data/
  │   │   └── exercises.json    # 운동 데이터
  │   ├── routes/
  │   │   ├── exercises.js      # 운동 API
  │   │   └── records.js        # 기록 API
  │   ├── server.js             # Express 서버
  │   └── package.json
  └── frontend/
      └── index.html            # 메인 화면
  ```

  ## 🚀 실행 방법

  ### 1. 사전 준비
  - Node.js 18 이상
  - 웹캠이 있는 PC 또는 노트북

  ### 2. 설치

  ```bash
  git clone https://github.com/LimJaeMin1202/Capstone.git
  cd Capstone/backend
  npm install
  ```

  ### 3. 서버 실행

  ```bash
  node server.js
  ```

  브라우저에서 `http://localhost:3000` 접속

  ### 4. HTTPS로 카메라 사용 (선택)

  브라우저 보안 정책으로 카메라가 안 켜질 경우:

  ```bash
  npm install -g local-ssl-proxy
  local-ssl-proxy --source 3001 --target 3000
  ```

  `https://localhost:3001` 접속

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