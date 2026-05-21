import { useState } from "react";
import type { Exercise } from "./types/exercise";
import type { SessionStats } from "./components/PoseDetector";
import ExerciseSelect from "./components/ExerciseSelect";
import ExerciseScreen from "./components/ExerciseScreen";
import RecordsScreen from "./components/RecordsScreen";
import AuthPage from "./components/AuthPage";
import { saveRecord } from "./api/records";
import { useAuth } from "./auth/AuthContext";
import "./App.css";

type View = "select" | "exercise" | "records";

function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<View>("select");
  const [selected, setSelected] = useState<Exercise | null>(null);

  async function handleComplete(stats: SessionStats) {
    if (selected) {
      try {
        await saveRecord({ exerciseId: selected.id, ...stats });
      } catch (err) {
        alert("기록 저장 실패: " + (err as Error).message);
      }
    }
    setSelected(null);
    setView("records");
  }

  function goSelect() {
    setSelected(null);
    setView("select");
  }

  // 로그인 상태 복원 중
  if (loading) {
    return (
      <div className="app">
        <p className="state-msg" style={{ padding: 40 }}>
          불러오는 중...
        </p>
      </div>
    );
  }

  // 미로그인 → 로그인/회원가입 화면
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <span className="logo">🦵</span>
            건강한 우리 운동
          </div>
          <nav className="navbar-nav">
            <button
              className={view !== "records" ? "nav-link active" : "nav-link"}
              onClick={goSelect}
            >
              운동하기
            </button>
            <button
              className={view === "records" ? "nav-link active" : "nav-link"}
              onClick={() => {
                setSelected(null);
                setView("records");
              }}
            >
              기록 보기
            </button>
            <span className="navbar-user">{user.name}님</span>
            <button className="logout-btn" onClick={logout}>
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
