import { useEffect, useState } from "react";
import type { Exercise } from "./types/exercise";
import type { SessionStats } from "./components/PoseDetector";
import ExerciseSelect from "./components/ExerciseSelect";
import ExerciseScreen from "./components/ExerciseScreen";
import RecordsScreen from "./components/RecordsScreen";
import ResultScreen from "./components/ResultScreen";
import AuthPage from "./components/AuthPage";
import BirthYearModal from "./components/BirthYearModal";
import { saveRecord } from "./api/records";
import { useAuth } from "./auth/AuthContext";
import "./App.css";

type View = "select" | "exercise" | "result" | "records";

interface LastResult {
  exercise: Exercise;
  stats: SessionStats;
}

// 어르신 친화 글씨 크기 설정
const FONT_SIZES = { small: "16px", normal: "18px", large: "22px" } as const;
type FontSize = keyof typeof FONT_SIZES;

function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<View>("select");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  // 글씨 크기 (localStorage에 저장, 로그인 전후 모두 적용)
  const [fontSize, setFontSize] = useState<FontSize>(
    () => (localStorage.getItem("font-size") as FontSize) || "normal"
  );

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontSize];
    localStorage.setItem("font-size", fontSize);
  }, [fontSize]);

  async function handleComplete(stats: SessionStats) {
    if (selected) {
      try {
        await saveRecord({ exerciseId: selected.id, ...stats });
      } catch (err) {
        alert("기록 저장 실패: " + (err as Error).message);
      }
      setLastResult({ exercise: selected, stats });
    }
    setSelected(null);
    setView("result");
  }

  function goSelect() {
    setSelected(null);
    setLastResult(null);
    setView("select");
  }

  function goRecords() {
    setSelected(null);
    setLastResult(null);
    setView("records");
  }

  // 로그아웃 시 화면 상태도 홈으로 초기화 (다음 로그인 시 홈에서 시작)
  function handleLogout() {
    setView("select");
    setSelected(null);
    setLastResult(null);
    logout();
  }

  if (loading) {
    return (
      <div className="app">
        <p className="state-msg" style={{ padding: 40 }}>
          불러오는 중...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // 카카오 가입자가 아직 출생연도 입력 안 했으면 강제 모달
  const needBirthYear = user.birthYear === null;

  return (
    <div className="app">
      {needBirthYear && <BirthYearModal />}
      <header className="navbar">
        <div className="navbar-inner">
          <button
            type="button"
            className="navbar-brand"
            onClick={goSelect}
            aria-label="홈으로"
          >
            <img src="/icon.png" alt="CareFit" className="brand-logo" />
          </button>
          <nav className="navbar-nav">
            <button
              className={
                view === "select" || view === "exercise" || view === "result"
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={goSelect}
            >
              운동하기
            </button>
            <button
              className={view === "records" ? "nav-link active" : "nav-link"}
              onClick={goRecords}
            >
              기록 보기
            </button>

            <div className="font-toggle" title="글씨 크기">
              <button
                className={fontSize === "small" ? "fs-btn active" : "fs-btn"}
                onClick={() => setFontSize("small")}
              >
                작게
              </button>
              <button
                className={fontSize === "normal" ? "fs-btn active" : "fs-btn"}
                onClick={() => setFontSize("normal")}
              >
                보통
              </button>
              <button
                className={fontSize === "large" ? "fs-btn active" : "fs-btn"}
                onClick={() => setFontSize("large")}
              >
                크게
              </button>
            </div>

            <span className="navbar-user">{user.name}님</span>
            <button className="logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {view === "select" && (
          <>
            <h1 className="page-title">오늘은 어떤 운동을 해볼까요?</h1>
            <p className="page-sub">
              운동을 고르면 카메라가 자세를 보고 실시간으로 알려드려요.
            </p>
            <ExerciseSelect
              onSelect={(ex) => {
                setSelected(ex);
                setView("exercise");
              }}
            />
          </>
        )}

        {view === "exercise" && selected && (
          <ExerciseScreen
            exercise={selected}
            onBack={goSelect}
            onComplete={handleComplete}
          />
        )}

        {view === "result" && lastResult && (
          <ResultScreen
            exercise={lastResult.exercise}
            stats={lastResult.stats}
            onAnother={goSelect}
            onRecords={goRecords}
          />
        )}

        {view === "records" && (
          <>
            <h1 className="page-title">나의 운동 기록</h1>
            <p className="page-sub">그동안 해온 운동을 한눈에 확인해요.</p>
            <RecordsScreen />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
